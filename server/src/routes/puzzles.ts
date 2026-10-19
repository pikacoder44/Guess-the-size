import { Router, Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import pool from '../db.js';

const router = Router();

export interface PuzzleDto {
  id: string;
  category: string;
  puzzleType: string;
  activeDate: string | null;
  reference: {
    id: string;
    name: string;
    category: string;
    actualMeasurement: number;
    axis: string;
    svgUrl: string;
    source: string;
    silhouette: {
      viewBox: { x: number; y: number; width: number; height: number };
      svgUrl: string;
    };
  };
  target: {
    id: string;
    name: string;
    category: string;
    actualMeasurement: number;
    axis: string;
    svgUrl: string;
    source: string;
    silhouette: {
      viewBox: { x: number; y: number; width: number; height: number };
      svgUrl: string;
    };
  };
}

function rowToPuzzleDto(row: any): PuzzleDto {
  const refViewBox = typeof row.ref_view_box === 'string'
    ? JSON.parse(row.ref_view_box)
    : row.ref_view_box || { x: 0, y: 0, width: 100, height: 100 };

  const targetViewBox = typeof row.target_view_box === 'string'
    ? JSON.parse(row.target_view_box)
    : row.target_view_box || { x: 0, y: 0, width: 100, height: 100 };

  return {
    id: row.id,
    category: row.category,
    puzzleType: row.puzzle_type || 'standard',
    activeDate: row.active_date || null,
    reference: {
      id: row.reference_item_id,
      name: row.ref_name || row.reference_item_id,
      category: row.ref_category || row.category,
      actualMeasurement: Number(row.ref_actual_measurement_meters || 1),
      axis: row.ref_axis || 'height',
      svgUrl: row.ref_svg_url || `/silhouettes/${row.reference_item_id.replace(/-/g, '_')}.svg`,
      source: row.ref_source || 'Wikidata',
      silhouette: {
        viewBox: refViewBox,
        svgUrl: row.ref_svg_url || `/silhouettes/${row.reference_item_id.replace(/-/g, '_')}.svg`,
      },
    },
    target: {
      id: row.target_item_id,
      name: row.target_name || row.target_item_id,
      category: row.target_category || row.category,
      actualMeasurement: Number(row.target_actual_measurement_meters || 1),
      axis: row.target_axis || 'height',
      svgUrl: row.target_svg_url || `/silhouettes/${row.target_item_id.replace(/-/g, '_')}.svg`,
      source: row.target_source || 'Wikidata',
      silhouette: {
        viewBox: targetViewBox,
        svgUrl: row.target_svg_url || `/silhouettes/${row.target_item_id.replace(/-/g, '_')}.svg`,
      },
    },
  };
}

/**
 * GET /api/puzzles/items
 * List all puzzle items, with optional ?category= filter.
 */
router.get('/items', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    let query = `
      SELECT id, name, category, actual_measurement_meters, axis, svg_url, view_box, source
      FROM puzzle_items
    `;
    const values: any[] = [];
    if (category) {
      query += ` WHERE category = $1`;
      values.push(category);
    }
    query += ` ORDER BY category, actual_measurement_meters ASC`;

    const { rows } = await pool.query(query, values);

    // Parse view_box if stored as JSON string
    const items = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      actualMeasurementMeters: Number(r.actual_measurement_meters),
      axis: r.axis,
      svgUrl: r.svg_url,
      source: r.source,
      viewBox: typeof r.view_box === 'string' ? JSON.parse(r.view_box) : r.view_box,
    }));

    res.json({ items });
  } catch (err: any) {
    console.error('Error fetching puzzle items:', err);
    res.status(500).json({ error: 'Failed to fetch puzzle items.' });
  }
});

/**
 * GET /api/puzzles/items/:id
 * Retrieve a single puzzle item by ID.
 */
router.get('/items/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, name, category, actual_measurement_meters, axis, svg_url, view_box, source
       FROM puzzle_items WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) {
      res.status(404).json({ error: `Puzzle item "${id}" not found.` });
      return;
    }

    const r = rows[0];
    res.json({
      item: {
        id: r.id,
        name: r.name,
        category: r.category,
        actualMeasurementMeters: Number(r.actual_measurement_meters),
        axis: r.axis,
        svgUrl: r.svg_url,
        source: r.source,
        viewBox: typeof r.view_box === 'string' ? JSON.parse(r.view_box) : r.view_box,
      },
    });
  } catch (err: any) {
    console.error('Error fetching puzzle item:', err);
    res.status(500).json({ error: 'Failed to fetch puzzle item.' });
  }
});

/**
 * GET /api/puzzles
 * Retrieve all puzzle pairings with joined reference and target item metadata.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    let query = `
      SELECT
        p.id, p.category, p.puzzle_type, p.active_date, p.created_at,
        p.reference_item_id, p.target_item_id,
        ref.name as ref_name, ref.category as ref_category,
        ref.actual_measurement_meters as ref_actual_measurement_meters,
        ref.axis as ref_axis, ref.svg_url as ref_svg_url, ref.view_box as ref_view_box, ref.source as ref_source,
        target.name as target_name, target.category as target_category,
        target.actual_measurement_meters as target_actual_measurement_meters,
        target.axis as target_axis, target.svg_url as target_svg_url, target.view_box as target_view_box, target.source as target_source
      FROM puzzles p
      JOIN puzzle_items ref ON ref.id = p.reference_item_id
      JOIN puzzle_items target ON target.id = p.target_item_id
    `;
    const values: any[] = [];
    if (category) {
      query += ` WHERE p.category = $1`;
      values.push(category);
    }
    query += ` ORDER BY p.category, p.id ASC`;

    const { rows } = await pool.query(query, values);
    const puzzles = rows.map(rowToPuzzleDto);

    res.json({ puzzles });
  } catch (err: any) {
    console.error('Error fetching puzzles:', err);
    res.status(500).json({ error: 'Failed to fetch puzzles.' });
  }
});

/**
 * GET /api/puzzles/session
 * Generate a 5-round puzzle session ensuring unique target items.
 */
router.get('/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const count = Math.min(20, Math.max(1, parseInt(req.query.count as string, 10) || 5));
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;

    let query = `
      SELECT
        p.id, p.category, p.puzzle_type, p.active_date, p.created_at,
        p.reference_item_id, p.target_item_id,
        ref.name as ref_name, ref.category as ref_category,
        ref.actual_measurement_meters as ref_actual_measurement_meters,
        ref.axis as ref_axis, ref.svg_url as ref_svg_url, ref.view_box as ref_view_box, ref.source as ref_source,
        target.name as target_name, target.category as target_category,
        target.actual_measurement_meters as target_actual_measurement_meters,
        target.axis as target_axis, target.svg_url as target_svg_url, target.view_box as target_view_box, target.source as target_source
      FROM puzzles p
      JOIN puzzle_items ref ON ref.id = p.reference_item_id
      JOIN puzzle_items target ON target.id = p.target_item_id
    `;
    const values: any[] = [];
    if (category) {
      query += ` WHERE p.category = $1`;
      values.push(category);
    }

    const { rows } = await pool.query(query, values);
    const poolList = rows.map(rowToPuzzleDto);

    if (poolList.length === 0) {
      res.status(404).json({ error: 'No puzzles found for the requested criteria.' });
      return;
    }

    // Shuffle candidates
    const shuffled = [...poolList].sort(() => Math.random() - 0.5);

    const session: PuzzleDto[] = [];
    const usedTargetIds = new Set<string>();

    // Pass 1: Select unique targets
    for (const p of shuffled) {
      if (session.length >= count) break;
      if (!usedTargetIds.has(p.target.id)) {
        usedTargetIds.add(p.target.id);
        session.push(p);
      }
    }

    // Pass 2: Fill remaining slots
    if (session.length < count) {
      for (const p of shuffled) {
        if (session.length >= count) break;
        if (!session.some((s) => s.id === p.id)) {
          session.push(p);
        }
      }
    }

    res.json({ session });
  } catch (err: any) {
    console.error('Error generating puzzle session:', err);
    res.status(500).json({ error: 'Failed to generate puzzle session.' });
  }
});

/**
 * GET /api/puzzles/daily
 * Retrieve the 5-round Daily Challenge for a specific date (or today).
 * Uses deterministic pseudo-random sequence if no explicit date rows exist.
 */
router.get('/daily', async (req: Request, res: Response): Promise<void> => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const date = typeof req.query.date === 'string' ? req.query.date : todayStr;

    // Check for explicit active_date puzzles in DB
    const explicitQuery = `
      SELECT
        p.id, p.category, p.puzzle_type, p.active_date, p.created_at,
        p.reference_item_id, p.target_item_id,
        ref.name as ref_name, ref.category as ref_category,
        ref.actual_measurement_meters as ref_actual_measurement_meters,
        ref.axis as ref_axis, ref.svg_url as ref_svg_url, ref.view_box as ref_view_box, ref.source as ref_source,
        target.name as target_name, target.category as target_category,
        target.actual_measurement_meters as target_actual_measurement_meters,
        target.axis as target_axis, target.svg_url as target_svg_url, target.view_box as target_view_box, target.source as target_source
      FROM puzzles p
      JOIN puzzle_items ref ON ref.id = p.reference_item_id
      JOIN puzzle_items target ON target.id = p.target_item_id
      WHERE p.active_date = $1
    `;
    const { rows: explicitRows } = await pool.query(explicitQuery, [date]);

    if (explicitRows.length >= 5) {
      res.json({
        date,
        puzzles: explicitRows.slice(0, 5).map(rowToPuzzleDto),
        mode: 'scheduled',
      });
      return;
    }

    // Otherwise, deterministically generate 5 daily puzzles for this date
    const allQuery = `
      SELECT
        p.id, p.category, p.puzzle_type, p.active_date, p.created_at,
        p.reference_item_id, p.target_item_id,
        ref.name as ref_name, ref.category as ref_category,
        ref.actual_measurement_meters as ref_actual_measurement_meters,
        ref.axis as ref_axis, ref.svg_url as ref_svg_url, ref.view_box as ref_view_box, ref.source as ref_source,
        target.name as target_name, target.category as target_category,
        target.actual_measurement_meters as target_actual_measurement_meters,
        target.axis as target_axis, target.svg_url as target_svg_url, target.view_box as target_view_box, target.source as target_source
      FROM puzzles p
      JOIN puzzle_items ref ON ref.id = p.reference_item_id
      JOIN puzzle_items target ON target.id = p.target_item_id
    `;
    const { rows: allRows } = await pool.query(allQuery);
    const poolList = allRows.map(rowToPuzzleDto);

    if (poolList.length === 0) {
      res.status(404).json({ error: 'No puzzles available for Daily Challenge.' });
      return;
    }

    // Deterministic date-based seed
    let seed = 0;
    for (let i = 0; i < date.length; i++) {
      seed = (seed * 31 + date.charCodeAt(i)) >>> 0;
    }

    function pseudoRandom() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }

    const shuffled = [...poolList].sort(() => pseudoRandom() - 0.5);

    const session: PuzzleDto[] = [];
    const usedTargetIds = new Set<string>();

    for (const p of shuffled) {
      if (session.length >= 5) break;
      if (!usedTargetIds.has(p.target.id)) {
        usedTargetIds.add(p.target.id);
        session.push(p);
      }
    }

    // Fallback if needed
    if (session.length < 5) {
      for (const p of shuffled) {
        if (session.length >= 5) break;
        if (!session.some((s) => s.id === p.id)) {
          session.push(p);
        }
      }
    }

    res.json({
      date,
      puzzles: session,
      mode: 'deterministic-daily',
    });
  } catch (err: any) {
    console.error('Error fetching daily challenge puzzles:', err);
    res.status(500).json({ error: 'Failed to fetch daily challenge puzzles.' });
  }
});

/**
 * POST /api/puzzles/seed
 * Seed the database with items from puzzles.json and puzzleSets.json.
 */
router.post('/seed', async (_req: Request, res: Response): Promise<void> => {
  try {
    const candidateItemPaths = [
      path.resolve(process.cwd(), 'src/data/puzzles.json'),
      path.resolve(__dirname, '../../../src/data/puzzles.json'),
      path.resolve(__dirname, '../../src/data/puzzles.json'),
    ];
    const itemsPath = candidateItemPaths.find((p) => fs.existsSync(p));

    const candidateSetPaths = [
      path.resolve(process.cwd(), 'src/data/puzzleSets.json'),
      path.resolve(__dirname, '../../../src/data/puzzleSets.json'),
      path.resolve(__dirname, '../../src/data/puzzleSets.json'),
    ];
    const setsPath = candidateSetPaths.find((p) => fs.existsSync(p));

    if (!itemsPath || !setsPath) {
      res.status(400).json({ error: 'Data JSON files not found. Run fetchPuzzles first.' });
      return;
    }

    const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
    const puzzleSets = JSON.parse(fs.readFileSync(setsPath, 'utf-8'));

    let itemsInserted = 0;
    let puzzlesInserted = 0;

    for (const it of items) {
      await pool.query(
        `INSERT INTO puzzle_items (id, name, category, actual_measurement_meters, axis, svg_url, view_box, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           actual_measurement_meters = EXCLUDED.actual_measurement_meters,
           axis = EXCLUDED.axis,
           svg_url = EXCLUDED.svg_url,
           view_box = EXCLUDED.view_box,
           source = EXCLUDED.source,
           updated_at = NOW()`,
        [
          it.id,
          it.name,
          it.category,
          it.actualMeasurementMeters,
          it.axis,
          it.svgUrl,
          JSON.stringify(it.viewBox),
          it.source,
        ],
      );
      itemsInserted++;
    }

    for (const p of puzzleSets) {
      await pool.query(
        `INSERT INTO puzzles (id, reference_item_id, target_item_id, category, puzzle_type, active_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           reference_item_id = EXCLUDED.reference_item_id,
           target_item_id = EXCLUDED.target_item_id,
           category = EXCLUDED.category,
           puzzle_type = EXCLUDED.puzzle_type,
           active_date = EXCLUDED.active_date`,
        [
          p.id,
          p.referenceId,
          p.targetId,
          p.category,
          p.puzzleType || 'standard',
          p.activeDate || null,
        ],
      );
      puzzlesInserted++;
    }

    res.json({
      success: true,
      itemsCount: itemsInserted,
      puzzlesCount: puzzlesInserted,
    });
  } catch (err: any) {
    console.error('Error seeding puzzles to database:', err);
    res.status(500).json({ error: 'Failed to seed puzzles to database.' });
  }
});

export default router;
