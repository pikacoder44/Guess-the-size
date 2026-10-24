import type { GameObject, Puzzle } from "./types";
import type { PuzzleItem, StoredPuzzle, ItemCategory } from "@/types/puzzle";
import rawPuzzles from "../data/puzzles.json";
import rawPuzzleSets from "../data/puzzleSets.json";

/**
 * Fallback viewBox cache in case an item doesn't specify an explicit viewBox.
 */
const SILHOUETTE_VIEWBOXES: Record<string, { x: number; y: number; width: number; height: number }> = {
  "burj-khalifa": { x: -9, y: -82.8, width: 108, height: 993.6 },
  "eiffel-tower": { x: -9, y: -33, width: 108, height: 396 },
  "moon": { x: -10, y: -10, width: 120, height: 120 },
  "saturn-v": { x: -4, y: -43.5, width: 48, height: 522 },
  "blue-whale": { x: -30, y: -9.46, width: 360, height: 113.5 },
  "human": { x: -5.2, y: -18.59, width: 62.4, height: 223.09 },
  "dog": { x: -9.2, y: -7.4, width: 110.4, height: 88.8 },
  "car-sedan": { x: -18.8, y: -6.2, width: 225.6, height: 74.4 },
};

/**
 * Map Wikidata-ingested items to GameObject models for the game engine.
 * Reads exact zero-empty-space viewBox directly from normalized item records.
 */
export const GAME_OBJECTS: Record<string, GameObject> = Object.fromEntries(
  (rawPuzzles as PuzzleItem[]).map((item) => {
    const vb = item.viewBox ?? SILHOUETTE_VIEWBOXES[item.id] ?? { x: 0, y: 0, width: 100, height: 100 };
    const obj: GameObject = {
      id: item.id,
      name: item.name,
      actualMeasurement: item.actualMeasurementMeters,
      valueInMeters: item.actualMeasurementMeters,
      axis: item.axis,
      primaryDimension: item.axis,
      description: item.description,
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

import { isCompatiblePair, generateSmartSession } from "@/games/scale-guess/data/items";

/**
 * Dynamic reference-target puzzle pairings loaded from database/JSON,
 * strictly filtered to enforce category bounds and scale tier compatibility.
 */
export const PUZZLES: Puzzle[] = (rawPuzzleSets as StoredPuzzle[])
  .map((p): Puzzle | null => {
    const ref = GAME_OBJECTS[p.referenceId];
    const target = GAME_OBJECTS[p.targetId];
    if (!ref || !target) return null;
    if (
      !isCompatiblePair(
        ref.actualMeasurement,
        ref.category,
        target.actualMeasurement,
        target.category,
      )
    ) {
      return null;
    }
    return {
      id: p.id,
      reference: ref,
      target: target,
      category: p.category,
    };
  })
  .filter((p): p is Puzzle => p !== null);


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
 * Generates a game session with unique target items across the match,
 * adhering to strict scale tier compatibility and category bounds.
 */
export function generateGameSession(options?: {
  count?: number;
  category?: ItemCategory;
  excludeIds?: string[];
}): Puzzle[] {
  return generateSmartSession(options);
}

