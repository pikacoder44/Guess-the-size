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
];

export type CatalogFilterTab = "popular" | "downloaded" | "rated";

