// ─────────────────────────────── Object Model ────────────────────────────────

export type ObjectCategory =
  | "People"
  | "Animals"
  | "Vehicles"
  | "Buildings"
  | "Everyday Objects"
  | "Nature"
  | "Space";

export type DimensionType = "height" | "length" | "width";

export type ScaleObject = {
  id: string;
  name: string;
  category: ObjectCategory | string;
  /** The real-world measurement in `unit` */
  dimension: number;
  unit: "m" | "cm" | "km";
  dimensionType: DimensionType;
  /** SVG silhouette key – matched by ObjectSilhouette component */
  silhouette: string;
  /** Width-to-height ratio of the silhouette art. Default 1 (square viewBox). */
  aspectRatio: number;
  /** Short description shown in the legend (max ~8 words) */
  description: string;
  source?: string;
};

// ─────────────────────────────── Game Model ──────────────────────────────────

export type GameMode = "daily" | "practice";

export type Puzzle = {
  reference: ScaleObject;
  target: ScaleObject;
};

export type RoundPhase = "playing" | "locked" | "revealed";

export type RoundResult = {
  puzzle: Puzzle;
  /** Player's estimate of target.dimension in target.unit */
  estimate: number;
  /** Actual target.dimension */
  actual: number;
  /** |estimate - actual| / actual */
  error: number;
  score: number;
};

export type GameResult = {
  mode: GameMode;
  date?: string;
  totalScore: number;
  averageError: number;
  rounds: RoundResult[];
  completedAt: string;
};

// ─────────────────────────────── Statistics ──────────────────────────────────

export type Statistics = {
  gamesPlayed: number;
  dailyGamesCompleted: number;
  bestScore: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  totalRounds: number;
  perfectRounds: number;
  lastDailyDate?: string;
  dailyHistory: Record<string, { score: number; completed: boolean }>;
};
