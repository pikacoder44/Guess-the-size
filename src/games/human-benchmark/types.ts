export type GamePhase =
  | "IDLE"
  | "WAITING"
  | "READY"
  | "FALSE_START"
  | "ROUND_RESULT"
  | "MATCH_SUMMARY";

export interface TargetColor {
  id: string;
  name: string;
  hex: string;
  oklch: string;
  textColor: string;
  glow: string;
}

export interface RoundResult {
  roundNumber: number;
  targetColor: TargetColor;
  reactionMs: number;
  rating: string;
  ratingEmoji: string;
  ratingColor: string;
  timestamp: number;
}

export interface MatchSummaryData {
  rounds: RoundResult[];
  averageMs: number;
  bestMs: number;
  rating: string;
  ratingEmoji: string;
  ratingDescription: string;
}

export const TARGET_COLORS: TargetColor[] = [
  {
    id: "emerald",
    name: "Emerald Green",
    hex: "#10b981",
    oklch: "oklch(0.75 0.19 165)",
    textColor: "#022c22",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  {
    id: "cyan",
    name: "Neon Cyan",
    hex: "#06b6d4",
    oklch: "oklch(0.78 0.16 210)",
    textColor: "#083344",
    glow: "rgba(6, 182, 212, 0.4)",
  },
  {
    id: "amber",
    name: "Vibrant Amber",
    hex: "#f59e0b",
    oklch: "oklch(0.82 0.15 75)",
    textColor: "#451a03",
    glow: "rgba(245, 158, 11, 0.4)",
  },
  {
    id: "lime",
    name: "Electric Lime",
    hex: "#84cc16",
    oklch: "oklch(0.84 0.20 135)",
    textColor: "#1a2e05",
    glow: "rgba(132, 204, 22, 0.4)",
  },
  {
    id: "violet",
    name: "Cyber Violet",
    hex: "#8b5cf6",
    oklch: "oklch(0.72 0.18 270)",
    textColor: "#2e1065",
    glow: "rgba(139, 92, 246, 0.4)",
  },
];

export function getReflexRating(ms: number): {
  rating: string;
  emoji: string;
  color: string;
  description: string;
} {
  if (ms < 190) {
    return {
      rating: "Godlike Reflexes",
      emoji: "⚡",
      color: "text-amber-300",
      description: "Esports pro tier! Top 1% of human visual reaction speeds.",
    };
  }
  if (ms < 220) {
    return {
      rating: "Lightning Reflexes",
      emoji: "⚡",
      color: "text-emerald-400",
      description: "Incredible response time! Faster than 90% of the population.",
    };
  }
  if (ms < 260) {
    return {
      rating: "Great Reaction Speed",
      emoji: "🚀",
      color: "text-cyan-400",
      description: "Sharp reflexes! Well above the global median average.",
    };
  }
  if (ms < 320) {
    return {
      rating: "Solid Reaction Time",
      emoji: "👍",
      color: "text-blue-400",
      description: "Standard human baseline reflex (median is ~273ms).",
    };
  }
  return {
    rating: "Room for Speed",
    emoji: "⏱️",
    color: "text-amber-400",
    description: "Focus on anticipating the flash to shave down latency.",
  };
}
