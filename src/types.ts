export type DimensionType = "height" | "length" | "width";

export type ScaleObject = {
  id: string;
  name: string;
  category: string;
  dimension: number;
  unit: "m" | "cm" | "km";
  dimensionType: DimensionType;
  silhouette: string;
  tone?: "reference" | "target";
  source?: string;
};

export type Puzzle = {
  reference: ScaleObject;
  target: ScaleObject;
};

export type RoundResult = {
  puzzle: Puzzle;
  estimate: number;
  actual: number;
  error: number;
  score: number;
};

export type GameResult = {
  mode: "daily" | "practice";
  date?: string;
  totalScore: number;
  averageError: number;
  rounds: RoundResult[];
  completedAt: string;
};

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
};
