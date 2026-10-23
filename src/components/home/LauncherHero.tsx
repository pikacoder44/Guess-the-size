import { motion, AnimatePresence } from "motion/react";
import { Clock, Target, Trophy, Play } from "lucide-react";
import type { LauncherGame } from "./launcherData";

interface LauncherHeroProps {
  game: LauncherGame;
  onPlayGame: (route: string) => void;
  onViewLeaderboard: (route: string) => void;
}

export function LauncherHero({
  game,
  onPlayGame,
  onViewLeaderboard,
}: LauncherHeroProps) {
  return (
    <section
      aria-label="Hero Spotlight Stage"
      className="relative w-full h-[70vh] min-h-[520px] max-h-[820px] overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-14 select-none"
    >
      {/* ── 1. Full-Bleed Artwork Backdrop with Cross-Fade ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={game.coverImage}
              alt={game.title}
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* ── Dark bottom radial gradient fade (per prompt spec) ── */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

        {/* ── Additional radial vignette to ground text and cards ── */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 75% 75%, transparent 20%, rgba(10, 10, 10, 0.4) 60%, rgba(10, 10, 10, 0.85) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/70 via-transparent to-neutral-950/30" />
      </div>

      {/* ── 2. Top-Left Brand Header: Synapse ── */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-baseline gap-3.5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white font-sans uppercase drop-shadow-2xl">
            Synapse
          </h1>
        </div>
      </div>

      {/* ── 3. Bottom Row: Stats Widgets (Left) + Game Content & Actions (Right) ── */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 mt-auto">
        {/* ── Bottom-Left: Floating Stats Widgets ── */}
        <motion.div
          key={`stats-${game.id}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="flex items-center gap-3 sm:gap-4 flex-wrap"
        >
          {/* Widget 1: AVG. PLAY TIME */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-36 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-white font-bold text-xl sm:text-2xl tracking-tight">
              <span>{game.avgPlayTime}</span>
              <Clock className="w-4 h-4 text-neutral-300 shrink-0" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mt-2">
              AVG. PLAY TIME
            </span>
          </div>

          {/* Widget 2: ACCURACY SCORE */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-36 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-white font-bold text-xl sm:text-2xl tracking-tight">
              <span>{game.accuracyScore}</span>
              <Target className="w-4 h-4 text-neutral-300 shrink-0" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold mt-2">
              ACCURACY SCORE
            </span>
          </div>
        </motion.div>

        {/* ── Bottom-Right: Game Hero Content & Actions ── */}
        <motion.div
          key={`hero-content-${game.id}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="flex flex-col items-start md:items-end text-left md:text-right max-w-xl"
        >
          {/* Game Title: Bold, Stylized Typography */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase font-sans drop-shadow-2xl">
            {game.title}
          </h2>

          {/* Short Description: 2-line summary */}
          <p className="text-xs sm:text-sm text-neutral-300 max-w-md mt-2.5 mb-6 leading-relaxed line-clamp-2 drop-shadow">
            {game.description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Secondary Action: Add to Favorites / View Leaderboard */}
            <button
              type="button"
              onClick={() => onViewLeaderboard(game.leaderboardRoute)}
              className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-xl px-5 py-3 text-xs sm:text-sm font-semibold backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg hover:border-white/30"
            >
              <span>View Leaderboard</span>
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            </button>

            {/* Primary Action: High-contrast white CTA Play Game */}
            <button
              type="button"
              onClick={() => onPlayGame(game.route)}
              className="inline-flex items-center gap-2.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold rounded-xl px-6 py-3 text-xs sm:text-sm shadow-xl hover:shadow-2xl transition-all active:scale-95 cursor-pointer"
            >
              <span>Play Game</span>
              <Play className="w-4 h-4 fill-current shrink-0 ml-0.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default LauncherHero;
