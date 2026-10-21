import { useState } from "react";
import { motion } from "motion/react";
import {
  Star,
  Play,
  ArrowUpRight,
  Download,
  Clock,
  Target,
  Search,
  X,
} from "lucide-react";
import type { LauncherGame, CatalogFilterTab } from "./launcherData";

interface LauncherCatalogProps {
  games: LauncherGame[];
  onPlayGame: (route: string) => void;
  onSelectHeroGame: (gameId: string) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  isSearchVisible?: boolean;
  onSearchChange?: (q: string) => void;
}

export function LauncherCatalog({
  games,
  onPlayGame,
  onSelectHeroGame,
  searchQuery = "",
  onClearSearch,
  isSearchVisible = false,
  onSearchChange,
}: LauncherCatalogProps) {
  const [activeTab, setActiveTab] = useState<CatalogFilterTab>("popular");

  // Filter & sort games based on selected tab and search
  const filteredAndSortedGames = [...games]
    .filter((g) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        g.title.toLowerCase().includes(q) ||
        g.subtitle.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.categoryTag.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (activeTab === "downloaded") {
        return b.downloadsNum - a.downloadsNum;
      }
      if (activeTab === "rated") {
        return b.ratingNum - a.ratingNum;
      }
      return a.popularityRank - b.popularityRank;
    });

  return (
    <section
      id="store-catalog"
      aria-label="Arcade Game Catalog"
      className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-10 flex flex-col gap-8"
    >
      {/* ── Optional Inline Search Bar (toggled via Sidebar Search or passed down) ── */}
      {isSearchVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full max-w-md relative flex items-center"
        >
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search arcade catalog by title, tag, or category..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-neutral-900/90 border border-white/10 hover:border-white/20 focus:border-white/40 focus:outline-none text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 font-mono transition-all backdrop-blur-xl"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-3 text-neutral-400 hover:text-white cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* ── Filter Bar matching inspo.jpg 1:1 ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        {/* Left: Section Heading */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Popular
          </h2>
          {searchQuery && (
            <span className="text-xs font-mono text-neutral-400">
              Matching "{searchQuery}" ({filteredAndSortedGames.length})
            </span>
          )}
        </div>

        {/* Right: Sleek Segment Tabs */}
        <div className="flex items-center gap-1 bg-neutral-900/60 backdrop-blur-xl p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("popular")}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "popular"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Popular
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("downloaded")}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "downloaded"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Most Downloaded
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rated")}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "rated"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Top Rated
          </button>
        </div>
      </div>

      {/* ── Game Grid: Catalog Cards ── */}
      {filteredAndSortedGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
          {filteredAndSortedGames.map((game) => (
            <div
              key={game.id}
              className="group relative flex flex-col rounded-2xl bg-neutral-900/60 hover:bg-neutral-900/90 backdrop-blur-xl border border-white/10 hover:border-white/25 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer text-left"
              onClick={() => onPlayGame(game.route)}
            >
              {/* Cover Art Banner (16:9) */}
              <div className="relative aspect-video w-full overflow-hidden bg-neutral-950 border-b border-white/5">
                <img
                  src={game.coverImage}
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />

                {/* Top-Left Category Badge */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-950/80 border border-white/15 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-white shadow-md">
                    {game.categoryTag}
                  </span>
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayGame(game.route);
                    }}
                    className="w-12 h-12 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label={`Play ${game.title}`}
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectHeroGame(game.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-white text-xs font-mono font-medium backdrop-blur-md transition-colors cursor-pointer"
                  >
                    Feature in Hero
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {/* Rating & Downloads */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{game.rating}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <Download className="w-3.5 h-3.5" />
                      <span>{game.downloads} players</span>
                    </div>
                  </div>

                  {/* Title & Arrow */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                      {game.title}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </div>

                  {/* Subtitle */}
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mt-0.5">
                    {game.subtitle}
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-2">
                    {game.description}
                  </p>
                </div>

                {/* Footer Metrics */}
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-neutral-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {game.avgPlayTime}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Target className="w-3 h-3 text-neutral-400" />
                      {game.accuracyScore}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {game.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-neutral-950 border border-white/10 text-[10px] text-neutral-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-dashed border-white/10 flex flex-col items-center justify-center">
          <Search className="w-8 h-8 text-neutral-500 mb-3" />
          <div className="text-base font-bold text-white">
            No games found matching "{searchQuery}"
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm">
            Try adjusting your search query or clear the filter to see all games.
          </p>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono text-white transition-colors cursor-pointer"
            >
              Clear Search Query
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default LauncherCatalog;
