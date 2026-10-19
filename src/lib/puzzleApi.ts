import type { Puzzle } from "@/game/types";
import type { PuzzleItem, ItemCategory } from "@/types/puzzle";
import { generateGameSession, PUZZLES } from "@/game/puzzles";

const API_BASE = import.meta.env.VITE_API_URL || "";

/**
 * Fetch a 5-round puzzle session from the server/database.
 * Seamlessly falls back to local curated puzzle engine if backend is unreachable or offline.
 */
export async function fetchPuzzleSession(options?: {
  category?: ItemCategory;
  count?: number;
}): Promise<Puzzle[]> {
  const count = options?.count ?? 5;
  const categoryParam = options?.category ? `&category=${encodeURIComponent(options.category)}` : "";
  const url = `${API_BASE}/api/puzzles/session?count=${count}${categoryParam}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = (await res.json()) as { session?: Puzzle[] };
      if (Array.isArray(data.session) && data.session.length > 0) {
        return data.session;
      }
    }
  } catch {
    // Graceful offline fallback
  }

  // Fallback to local game engine
  return generateGameSession({ count, category: options?.category });
}

/**
 * Fetch today's (or a specified date's) Daily Challenge puzzle match.
 */
export async function fetchDailyPuzzles(date?: string): Promise<{
  date: string;
  puzzles: Puzzle[];
  mode: string;
}> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const targetDate = date || todayStr;
  const url = `${API_BASE}/api/puzzles/daily?date=${encodeURIComponent(targetDate)}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        date: string;
        puzzles: Puzzle[];
        mode: string;
      };
      if (Array.isArray(data.puzzles) && data.puzzles.length > 0) {
        return data;
      }
    }
  } catch {
    // Graceful offline fallback
  }

  // Fallback: deterministic session from local game engine
  return {
    date: targetDate,
    puzzles: generateGameSession({ count: 5 }),
    mode: "local-fallback",
  };
}

/**
 * Fetch all puzzle items from the database.
 */
export async function fetchPuzzleItems(category?: ItemCategory): Promise<PuzzleItem[]> {
  const categoryParam = category ? `?category=${encodeURIComponent(category)}` : "";
  const url = `${API_BASE}/api/puzzles/items${categoryParam}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = (await res.json()) as { items?: PuzzleItem[] };
      if (Array.isArray(data.items)) {
        return data.items;
      }
    }
  } catch {
    // Offline fallback
  }

  return [];
}

/**
 * Trigger database seeding/sync from the frontend admin/diagnostic console.
 */
export async function seedPuzzlesToDatabase(): Promise<{
  success: boolean;
  itemsCount: number;
  puzzlesCount: number;
}> {
  const res = await fetch(`${API_BASE}/api/puzzles/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as any;
    throw new Error(err.error || "Failed to seed puzzles into database.");
  }

  return res.json() as Promise<{
    success: boolean;
    itemsCount: number;
    puzzlesCount: number;
  }>;
}

export { PUZZLES };
