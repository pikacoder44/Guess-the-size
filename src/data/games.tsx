import type { ReactNode } from "react";

export interface GameCardData {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  icon: ReactNode;
  accentColor: string;
  accentGlow: string;
  badge?: string;
  href: string;
  available: boolean;
}

export const GAMES: GameCardData[] = [
  {
    id: "scale-guess",
    title: "ScaleGuess",
    tagline: "Spatial Estimation",
    description:
      "Resize real-world silhouettes to match a reference object. Sharpen your spatial reasoning, metric intuition, and sense of scale.",
    category: "Spatial Estimation",
    accentColor: "oklch(0.82 0.15 75)", // Radiant amber/gold
    accentGlow: "oklch(0.82 0.15 75 / 0.25)",
    badge: "Live",
    href: "/games/scale-guess",
    available: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M21 3L3 21" />
        <path d="M21 8V3h-5" />
        <path d="M3 16v5h5" />
        <path d="M14 3h2" />
        <path d="M3 8v2" />
        <rect x="7" y="7" width="10" height="10" rx="2" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    id: "not-color-blind",
    title: "Not Color Blind",
    tagline: "HSB Memory Recall",
    description:
      "Observe dynamic target color swatches before they decay, then reconstruct the exact hue, saturation, and brightness from visual memory.",
    category: "Visual Memory Recall",
    accentColor: "oklch(0.72 0.18 270)", // Cyber violet / chromatic
    accentGlow: "oklch(0.72 0.18 270 / 0.25)",
    badge: "Live",
    href: "/games/not-color-blind",
    available: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={2.5} />
        <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity={0.2} />
      </svg>
    ),
  },
  {
    id: "human-benchmark",
    title: "Human Benchmark",
    tagline: "Reaction Speed",
    description:
      "Test your visual reflexes across 5 calibrated rounds. Click as fast as you can when the target color appears.",
    category: "Visual Reaction Speed",
    accentColor: "oklch(0.75 0.19 165)", // Mint emerald / reflex green
    accentGlow: "oklch(0.75 0.19 165 / 0.25)",
    badge: "Live",
    href: "/games/human-benchmark",
    available: true,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];
