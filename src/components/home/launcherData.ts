export interface LauncherGame {
  id: string;
  route: string;
  leaderboardRoute: string;
  title: string;
  subtitle: string;
  categoryTag: string;
  tagBadge: string;
  description: string;
  avgPlayTime: string;
  accuracyScore: string;
  rating: string;
  ratingNum: number;
  downloads: string;
  downloadsNum: number;
  popularityRank: number;
  coverImage: string;
  thumbnail: string;
  stats: string;
  tags: string[];
}

export const LAUNCHER_GAMES: LauncherGame[] = [
  {
    id: "scale-guess",
    route: "/games/scale-guess",
    leaderboardRoute: "/games/scale-guess/leaderboard",
    title: "SCALEGUESS",
    subtitle: "SPATIAL ESTIMATION",
    categoryTag: "MICRO TO COSMIC",
    tagBadge: "Most Played This Week",
    description:
      "Drag, pan, and scale zero-padded vector silhouettes to estimate physical dimensions against calibrated reference objects.",
    avgPlayTime: "16hs",
    accuracyScore: "88%",
    rating: "4.9",
    ratingNum: 4.9,
    downloads: "42.8k",
    downloadsNum: 42800,
    popularityRank: 1,
    coverImage: "/assets/banners/scaleguess-cover.jpg",
    thumbnail: "/assets/banners/scaleguess-cover.jpg",
    stats: "5 Rounds • Metric Scales",
    tags: ["Spatial", "Silhouettes", "Meters"],
  },
  {
    id: "not-color-blind",
    route: "/games/not-color-blind",
    leaderboardRoute: "/games/not-color-blind/leaderboard",
    title: "NOT COLOR BLIND",
    subtitle: "HSB COLOR RECALL",
    categoryTag: "HSB MEMORY",
    tagBadge: "Trending Perceptual Game",
    description:
      "Memorize dynamic target swatches across hue, saturation, and brightness before decay, then reconstruct the exact parameters from memory.",
    avgPlayTime: "12hs",
    accuracyScore: "94%",
    rating: "4.8",
    ratingNum: 4.8,
    downloads: "31.4k",
    downloadsNum: 31400,
    popularityRank: 2,
    coverImage: "/assets/banners/not-color-blind-cover.jpg",
    thumbnail: "/assets/banners/not-color-blind-cover.jpg",
    stats: "5s Memory • HSB Space",
    tags: ["Perceptual", "HSB", "Delta-E"],
  },
  {
    id: "daily-challenge",
    route: "/games/scale-guess",
    leaderboardRoute: "/games/scale-guess/leaderboard",
    title: "DAILY CHALLENGE",
    subtitle: "GLOBAL TOURNAMENT",
    categoryTag: "SYNCHRONIZED SEED",
    tagBadge: "Daily Tournament Active",
    description:
      "Today's official synchronized tournament match. 5 calibrated puzzle pairs with real-time global leaderboard tie-breaking.",
    avgPlayTime: "24m",
    accuracyScore: "91%",
    rating: "5.0",
    ratingNum: 5.0,
    downloads: "58.2k",
    downloadsNum: 58200,
    popularityRank: 3,
    coverImage: "/assets/banners/daily-challenge-cover.jpg",
    thumbnail: "/assets/banners/daily-challenge-cover.jpg",
    stats: "Ranked • Resets 00:00 UTC",
    tags: ["Daily", "Ranked", "Spatial"],
  },
  {
    id: "cosmic-scales",
    route: "/games/scale-guess",
    leaderboardRoute: "/games/scale-guess/leaderboard",
    title: "COSMIC SCALES",
    subtitle: "MACRO & CELESTIAL",
    categoryTag: "INFINITE ZOOM",
    tagBadge: "Infinite Zoom Sandbox",
    description:
      "Infinite zoom spatial perception. Compare subatomic particles, planetary diameters, and galactic structures in pure metric scale.",
    avgPlayTime: "8hs",
    accuracyScore: "84%",
    rating: "4.7",
    ratingNum: 4.7,
    downloads: "19.5k",
    downloadsNum: 19500,
    popularityRank: 4,
    coverImage: "/assets/banners/store-bg.jpg",
    thumbnail: "/assets/banners/store-bg.jpg",
    stats: "Sandbox • Macro Zoom",
    tags: ["Sandbox", "Cosmic", "Meters"],
  },
];

export type CatalogFilterTab = "popular" | "downloaded" | "rated";
