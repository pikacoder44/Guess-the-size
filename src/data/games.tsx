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
    href: "/scaleGuess",
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
    id: "sequence-mind",
    title: "SequenceMind",
    tagline: "Working Memory",
    description:
      "Observe high-speed coordinate flashes across dynamic grids, then reconstruct the sequence from working memory.",
    category: "Working Memory",
    accentColor: "oklch(0.72 0.18 270)", // Cyber violet
    accentGlow: "oklch(0.72 0.18 270 / 0.25)",
    badge: "Coming Soon",
    href: "/sequenceMind",
    available: false,
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
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity={0.2} />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" fillOpacity={0.2} />
        <path d="M10 6.5h4" strokeDasharray="1 1" />
        <path d="M17.5 10v4" strokeDasharray="1 1" />
      </svg>
    ),
  },
  {
    id: "flash-count",
    title: "FlashCount",
    tagline: "Visual Perception",
    description:
      "A cluster of objects flashes for 150 milliseconds before vanishing. Quantify the cluster count using pure sensory instinct.",
    category: "Visual Perception",
    accentColor: "oklch(0.75 0.19 165)", // Mint / Emerald
    accentGlow: "oklch(0.75 0.19 165 / 0.25)",
    badge: "Coming Soon",
    href: "/flashCount",
    available: false,
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
        <circle cx="12" cy="12" r="3" />
        <path d="M2.5 12c2.5-5 5.5-8 9.5-8s7 3 9.5 8c-2.5 5-5.5 8-9.5 8s-7-3-9.5-8z" />
        <circle cx="8" cy="9" r="1" fill="currentColor" />
        <circle cx="16" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
  },
];
