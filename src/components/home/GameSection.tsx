import { useState } from "react";
import { motion } from "motion/react";
import { GameCard } from "./GameCard";
import { Gamepad2, Search, SlidersHorizontal } from "lucide-react";

interface GameSectionProps {
  onNavigate: (href: string) => void;
  searchQuery?: string;
}

type FilterTag = "all" | "spatial" | "perceptual" | "reflex";

interface ArcadeGameItem {
  id: string;
  route: string;
  badge: string;
  title: string;
  categoryTag: string;
  description: string;
  stats: string;
  tags: string[];
  rating: string;
  coverImage: string;
  categories: FilterTag[];
}

const ARCADE_GAMES: ArcadeGameItem[] = [
  {
    id: "scale-guess",
    route: "/games/scale-guess",
    badge: "Spatial Estimation",
    title: "ScaleGuess",
    categoryTag: "MICRO TO COSMIC",
    description: "Drag, pan, and scale zero-padded vector silhouettes to estimate physical dimensions against calibrated reference objects.",
    stats: "5 Rounds • Avg 3.4s",
    tags: ["Spatial", "Silhouettes", "Meters"],
    rating: "4.9",
    coverImage: "/assets/banners/scaleguess-cover.jpg",
    categories: ["all", "spatial"],
  },
  {
    id: "not-color-blind",
    route: "/games/not-color-blind",
    badge: "Color Memory",
    title: "Not Color Blind",
    categoryTag: "HSB MEMORY",
    description: "Memorize dynamic target swatches across hue, saturation, and brightness before decay, then reconstruct the exact color parameters.",
    stats: "5s Memory • HSB Space",
    tags: ["Perceptual", "HSB", "Delta-E"],
    rating: "4.8",
    coverImage: "/assets/banners/not-color-blind-cover.jpg",
    categories: ["all", "perceptual"],
  },
  {
    id: "human-benchmark",
    route: "/games/human-benchmark",
    badge: "Reflex Benchmark",
    title: "Human Benchmark",
    categoryTag: "VISUAL REFLEX",
    description: "Test your visual reflexes across 5 calibrated rounds. Click as fast as you can when the target color appears.",
    stats: "5 Rounds • ms Latency",
    tags: ["Reflex", "Latency", "Speed"],
    rating: "4.9",
    coverImage: "/assets/banners/human-benchmark-cover.jpg",
    categories: ["all", "reflex"],
  },
];

export function GameSection({ onNavigate, searchQuery = "" }: GameSectionProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTag>("all");

  const filterTabs: { id: FilterTag; label: string }[] = [
    { id: "all", label: "All Games" },
    { id: "spatial", label: "Spatial" },
    { id: "perceptual", label: "Perceptual" },
    { id: "reflex", label: "Reflex" },
  ];

  const filteredGames = ARCADE_GAMES.filter((game) => {
    // 1. Tag filter
    const matchesTag =
      activeFilter === "all" ? true : game.categories.includes(activeFilter);

    // 2. Search query filter
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesTag;

    const matchesQuery =
      game.title.toLowerCase().includes(query) ||
      game.description.toLowerCase().includes(query) ||
      game.categoryTag.toLowerCase().includes(query) ||
      game.tags.some((t) => t.toLowerCase().includes(query));

    return matchesTag && matchesQuery;
  });

  return (
    <section id="games-section" className="w-full flex flex-col gap-5">
      {/* ── Section Title & Filter Tabs (Steam Store Showcase Style) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-neutral-100 font-sans uppercase">
              COGNITIVE ARCADE GAMES
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select a calibrated simulation to start your perceptual training run.
          </p>
        </div>

        {/* Filter Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-neutral-950/40 backdrop-blur-md p-1 rounded-xl border border-neutral-800/80">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium active:scale-95 transition-all duration-100 will-change-transform transform-gpu cursor-pointer ${
                    isActive
                      ? "bg-neutral-800 text-neutral-100 font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Game Store Cards Grid ── */}
      {filteredGames.length > 0 ? (
        <motion.div
          key={activeFilter}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.06,
                delayChildren: 0.04,
              },
            },
          }}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 transform-gpu will-change-[transform,opacity]"
        >
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              id={game.id}
              route={game.route}
              badge={game.badge}
              title={game.title}
              categoryTag={game.categoryTag}
              description={game.description}
              stats={game.stats}
              tags={game.tags}
              rating={game.rating}
              coverImage={game.coverImage}
              onNavigate={onNavigate}
            />
          ))}
        </motion.div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800 flex flex-col items-center justify-center">
          <Search className="w-8 h-8 text-neutral-500 mb-3" />
          <div className="text-sm font-bold text-neutral-300">
            No games found matching "{searchQuery}"
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm">
            Try adjusting your search query or reset your category filter to All Games.
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-200 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Reset Category Filter</span>
          </button>
        </div>
      )}
    </section>
  );
}

export default GameSection;
