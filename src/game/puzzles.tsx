import type { GameObject, Puzzle } from "./types";
import type { PuzzleItem, ItemCategory } from "@/types/puzzle";
import rawPuzzles from "../data/puzzles.json";

/**
 * Exact, zero-padding viewBox specifications calculated from normalized SVG silhouettes.
 */
const SILHOUETTE_VIEWBOXES: Record<string, { x: number; y: number; width: number; height: number }> = {
  "burj-khalifa": { x: 0, y: 0, width: 90, height: 828 },
  "eiffel-tower": { x: 0, y: 0, width: 90, height: 330 },
  "moon": { x: 0, y: 0, width: 100, height: 100 },
  "saturn-v": { x: 0, y: 0, width: 40, height: 435 },
  "blue-whale": { x: 0, y: 0, width: 300, height: 94.58 },
  "human": { x: 0, y: 0, width: 52, height: 185.91 },
  "dog": { x: 0, y: 0, width: 92, height: 74 },
  "car-sedan": { x: 0, y: 0, width: 188, height: 62 },
};

/**
 * Map Wikidata-ingested items to GameObject models for the game engine.
 */
export const GAME_OBJECTS: Record<string, GameObject> = Object.fromEntries(
  (rawPuzzles as PuzzleItem[]).map((item) => {
    const vb = SILHOUETTE_VIEWBOXES[item.id] ?? { x: 0, y: 0, width: 100, height: 100 };
    const obj: GameObject = {
      id: item.id,
      name: item.name,
      actualMeasurement: item.actualMeasurementMeters,
      axis: item.axis,
      category: item.category,
      svgUrl: item.svgUrl,
      source: item.source,
      silhouette: {
        viewBox: vb,
        svgUrl: item.svgUrl,
      },
    };
    return [item.id, obj];
  }),
);

/**
 * Group GameObjects by scale tiers.
 */
export const OBJECTS_BY_CATEGORY: Record<ItemCategory, GameObject[]> = {
  micro: [],
  everyday: [],
  macro: [],
  cosmic: [],
};

for (const obj of Object.values(GAME_OBJECTS)) {
  const cat = obj.category;
  if (cat && cat in OBJECTS_BY_CATEGORY) {
    OBJECTS_BY_CATEGORY[cat].push(obj);
  }
}

export function getObjectsByCategory(category: ItemCategory): GameObject[] {
  return OBJECTS_BY_CATEGORY[category] || [];
}

/**
 * Curated reference-target puzzle pairings across scales.
 */
export const PUZZLES: Puzzle[] = [
  // Everyday Scale Tier
  {
    id: "human-dog",
    reference: GAME_OBJECTS["human"]!,
    target: GAME_OBJECTS["dog"]!,
    category: "everyday",
  },
  {
    id: "dog-car",
    reference: GAME_OBJECTS["dog"]!,
    target: GAME_OBJECTS["car-sedan"]!,
    category: "everyday",
  },
  {
    id: "human-car",
    reference: GAME_OBJECTS["human"]!,
    target: GAME_OBJECTS["car-sedan"]!,
    category: "everyday",
  },

  // Everyday -> Macro Bridge
  {
    id: "car-whale",
    reference: GAME_OBJECTS["car-sedan"]!,
    target: GAME_OBJECTS["blue-whale"]!,
    category: "macro",
  },
  {
    id: "human-whale",
    reference: GAME_OBJECTS["human"]!,
    target: GAME_OBJECTS["blue-whale"]!,
    category: "macro",
  },

  // Macro Scale Tier
  {
    id: "whale-saturn",
    reference: GAME_OBJECTS["blue-whale"]!,
    target: GAME_OBJECTS["saturn-v"]!,
    category: "macro",
  },
  {
    id: "saturn-eiffel",
    reference: GAME_OBJECTS["saturn-v"]!,
    target: GAME_OBJECTS["eiffel-tower"]!,
    category: "macro",
  },
  {
    id: "eiffel-burj",
    reference: GAME_OBJECTS["eiffel-tower"]!,
    target: GAME_OBJECTS["burj-khalifa"]!,
    category: "macro",
  },
  {
    id: "saturn-burj",
    reference: GAME_OBJECTS["saturn-v"]!,
    target: GAME_OBJECTS["burj-khalifa"]!,
    category: "macro",
  },
  {
    id: "whale-eiffel",
    reference: GAME_OBJECTS["blue-whale"]!,
    target: GAME_OBJECTS["eiffel-tower"]!,
    category: "macro",
  },
  {
    id: "car-saturn",
    reference: GAME_OBJECTS["car-sedan"]!,
    target: GAME_OBJECTS["saturn-v"]!,
    category: "macro",
  },

  // Cosmic Scale Tier
  {
    id: "burj-moon",
    reference: GAME_OBJECTS["burj-khalifa"]!,
    target: GAME_OBJECTS["moon"]!,
    category: "cosmic",
  },
  {
    id: "saturn-moon",
    reference: GAME_OBJECTS["saturn-v"]!,
    target: GAME_OBJECTS["moon"]!,
    category: "cosmic",
  },
];

/**
 * Filter puzzles by scale tier.
 */
export function getPuzzlesByCategory(category?: ItemCategory): Puzzle[] {
  if (!category) return PUZZLES;
  return PUZZLES.filter((p) => p.category === category);
}

/**
 * Picks a random puzzle excluding specific puzzle IDs and optional category filter.
 */
export function pickRandomPuzzle(
  excludeIds?: string | string[],
  category?: ItemCategory,
): Puzzle {
  const excludeSet = new Set(
    Array.isArray(excludeIds) ? excludeIds : excludeIds ? [excludeIds] : [],
  );
  const pool = (category ? getPuzzlesByCategory(category) : PUZZLES).filter(
    (p) => !excludeSet.has(p.id),
  );
  const available = pool.length > 0 ? pool : PUZZLES;
  return available[Math.floor(Math.random() * available.length)] ?? PUZZLES[0]!;
}

/**
 * Generates a 5-round game session with unique target items.
 * Ensures no duplicate items appear across the match.
 */
export function generateGameSession(options?: {
  count?: number;
  category?: ItemCategory;
  excludeIds?: string[];
}): Puzzle[] {
  const count = options?.count ?? 5;
  const excludeSet = new Set(options?.excludeIds || []);
  const pool = options?.category
    ? getPuzzlesByCategory(options.category)
    : PUZZLES;

  // Shuffle candidate puzzles
  const shuffled = [...pool]
    .filter((p) => !excludeSet.has(p.id))
    .sort(() => Math.random() - 0.5);

  const session: Puzzle[] = [];
  const usedTargetIds = new Set<string>();

  // 1. First pass: Pick puzzles with completely unique target items
  for (const puzzle of shuffled) {
    if (session.length >= count) break;
    if (!usedTargetIds.has(puzzle.target.id)) {
      usedTargetIds.add(puzzle.target.id);
      session.push(puzzle);
    }
  }

  // 2. Second pass: If still needed, fill remaining slots with unique puzzle pairs
  if (session.length < count) {
    for (const puzzle of shuffled) {
      if (session.length >= count) break;
      if (!session.some((s) => s.id === puzzle.id)) {
        session.push(puzzle);
      }
    }
  }

  // 3. Fallback: if pool is small, take from main PUZZLES
  if (session.length < count) {
    for (const puzzle of PUZZLES) {
      if (session.length >= count) break;
      if (!session.some((s) => s.id === puzzle.id)) {
        session.push(puzzle);
      }
    }
  }

  return session;
}
