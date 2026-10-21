import { useState } from "react";
import { motion } from "motion/react";
import { Play, ArrowUpRight, Ruler, Eye, Trophy, Star, Sparkles } from "lucide-react";

export interface GameCardProps {
  id: string;
  route: string;
  badge: string;
  title: string;
  categoryTag: string;
  description: string;
  stats: string;
  tags: string[];
  rating: string;
  onNavigate: (route: string) => void;
}

export function GameCard({
  id,
  route,
  badge,
  title,
  categoryTag,
  description,
  stats,
  tags,
  rating,
  onNavigate,
}: GameCardProps) {
  const isScaleGuess = id === "scale-guess" || route.includes("scale-guess");
  const isColorBlind = id === "not-color-blind" || route.includes("not-color-blind");
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 350, damping: 25 },
        },
      }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(route)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(route);
        }
      }}
      className="group relative flex flex-col rounded-2xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/90 shadow-xl hover:shadow-2xl cursor-pointer select-none overflow-hidden text-left transform-gpu will-change-[transform,opacity]"
    >
      {/* Subtle Steam Ambient Backlight on Hover */}
      <div
        className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none ${
          isScaleGuess ? "bg-amber-500" : isColorBlind ? "bg-violet-600" : "bg-cyan-500"
        }`}
      />

      {/* ── Top Area: 16:9 Cover Art / Dynamic Visual Preview Banner ── */}
      <div className="relative aspect-[16/9] w-full bg-neutral-950 overflow-hidden border-b border-neutral-800/80 flex items-center justify-center">
        {/* Dynamic Art Canvas */}
        {isScaleGuess ? (
          <div className="relative w-full h-full bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 p-4 flex flex-col justify-between overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-35" />

            {/* Top Bar with Mode Tag */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-semibold text-amber-300">
                <Ruler className="w-3 h-3" />
                METRIC SCALE
              </span>
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-800">
                1:1 Calibrated
              </span>
            </div>

            {/* Visual Vector Silhouettes in Scale Comparison */}
            <div className="relative z-10 flex items-end justify-center gap-6 my-auto pt-2">
              {/* Human silhouette */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-neutral-400 mb-0.5">1.75m</span>
                <img
                  src="/silhouettes/human.svg"
                  alt="Human reference"
                  className="h-10 w-auto filter invert opacity-75"
                />
              </div>

              {/* Blue Whale silhouette */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-amber-400 font-bold mb-0.5">33.5m</span>
                <img
                  src="/silhouettes/blue_whale.svg"
                  alt="Blue Whale target"
                  className="h-20 w-auto filter invert opacity-90 drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]"
                />
              </div>

              {/* Saturn V Rocket silhouette */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-neutral-300 mb-0.5">110.6m</span>
                <img
                  src="/silhouettes/saturn_v.svg"
                  alt="Saturn V target"
                  className="h-28 w-auto filter invert opacity-95 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                />
              </div>
            </div>

            {/* Laser Caliper Ruler Line */}
            <div className="relative z-10 w-full pt-1 border-t border-dashed border-amber-500/40 flex items-center justify-between text-[9px] font-mono text-amber-400/80">
              <span>0.00m</span>
              <span className="text-[10px] font-bold text-amber-300 tracking-wider">LOGARITHMIC CALIBRATION</span>
              <span>150.0m</span>
            </div>
          </div>
        ) : isColorBlind ? (
          <div className="relative w-full h-full bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 p-4 flex flex-col justify-between overflow-hidden">
            {/* Background Spectrum Flare */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/30 via-neutral-950 to-neutral-950 opacity-60" />

            {/* Top Bar with Mode Tag */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-[10px] font-mono font-semibold text-violet-300">
                <Eye className="w-3 h-3" />
                HSB COLOR SPACE
              </span>
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-800">
                Delta-E Precision
              </span>
            </div>

            {/* Vibrant Chromatic Swatches & Color Dial Visual */}
            <div className="relative z-10 flex items-center justify-center gap-3 my-auto">
              <div className="w-10 h-10 rounded-xl bg-[#ff3b30] shadow-[0_0_14px_rgba(255,59,48,0.5)] transform -rotate-6" />
              <div className="w-12 h-12 rounded-xl bg-[#007aff] shadow-[0_0_18px_rgba(0,122,255,0.6)] transform scale-110 z-10" />
              <div className="w-10 h-10 rounded-xl bg-[#34c759] shadow-[0_0_14px_rgba(52,199,89,0.5)] transform rotate-6" />
              <div className="w-10 h-10 rounded-xl bg-[#af52de] shadow-[0_0_14px_rgba(175,82,222,0.5)] transform rotate-12" />
            </div>

            {/* Hue Gradient Spectrum Bar */}
            <div className="relative z-10 w-full">
              <div className="h-2 rounded-full w-full bg-[linear-gradient(to_right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] opacity-85 shadow-sm" />
              <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 mt-1">
                <span>Hue: 0°</span>
                <span className="text-[10px] font-bold text-violet-300 tracking-wider">HUE • SAT • BRIGHTNESS</span>
                <span>Hue: 360°</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 p-4 flex flex-col justify-between overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-semibold text-amber-300">
                <Trophy className="w-3 h-3" />
                DAILY CHALLENGE
              </span>
            </div>
            <div className="relative z-10 flex items-center justify-center my-auto">
              <Trophy className="w-14 h-14 text-amber-400 drop-shadow-[0_0_16px_rgba(245,158,11,0.5)]" />
            </div>
            <div className="relative z-10 text-center text-[10px] font-mono text-amber-300">
              Today's Deterministic Puzzle Run
            </div>
          </div>
        )}

        {/* ── Prominent Hover Overlay with Play Button (Steam / Epic Games style) ── */}
        <div
          className={`absolute inset-0 bg-neutral-950/65 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300 z-20 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="w-13 h-13 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
          <span className="mt-2 text-xs font-extrabold uppercase tracking-wider text-white">
            PLAY NOW
          </span>
        </div>
      </div>

      {/* ── Card Body: Title, Category Badge, Rating, Description & Bottom HUD ── */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Chip & Rating */}
          <div className="flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/60 text-[10px] font-mono uppercase tracking-wider font-semibold text-neutral-300">
              {categoryTag}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
              <Star className="w-3 h-3 fill-current" />
              <span>{rating}</span>
            </div>
          </div>

          {/* Title with Subtle External Icon */}
          <div className="mt-2.5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-100 group-hover:text-white tracking-tight transition-colors">
              {title}
            </h2>
            <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-200 transition-colors" />
          </div>

          {/* Badge Subhead */}
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mt-0.5">
            {badge}
          </div>

          {/* Description */}
          <p className="mt-2 text-xs text-neutral-400 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>

        {/* Card Footer: Tags & Stats */}
        <div className="mt-4 pt-3.5 border-t border-neutral-800/60 flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-neutral-400" />
            <span className="text-[11px]">{stats}</span>
          </div>

          <div className="flex items-center gap-1">
            {tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800/80 text-[10px] text-neutral-400"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default GameCard;
