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
  coverImage?: string;
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
  coverImage,
  onNavigate,
}: GameCardProps) {
  const isScaleGuess = id === "scale-guess" || route.includes("scale-guess");
  const isColorBlind = id === "not-color-blind" || route.includes("not-color-blind");
  const [isHovered, setIsHovered] = useState(false);

  const resolvedCoverImage =
    coverImage ||
    (isScaleGuess
      ? "/assets/banners/scaleguess-cover.jpg"
      : isColorBlind
      ? "/assets/banners/not-color-blind-cover.jpg"
      : "/assets/banners/daily-challenge-cover.jpg");

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
      className="group relative flex flex-col rounded-2xl bg-neutral-900/60 hover:bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 hover:border-neutral-700/90 shadow-xl hover:shadow-2xl cursor-pointer select-none overflow-hidden text-left transform-gpu will-change-[transform,opacity]"
    >
      {/* Subtle Steam Ambient Backlight on Hover */}
      <div
        className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none ${
          isScaleGuess ? "bg-amber-500" : isColorBlind ? "bg-violet-600" : "bg-cyan-500"
        }`}
      />

      {/* ── Top Area: 16:9 Cover Art Banner Container (Steam / Epic Games style) ── */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-neutral-950 border-b border-neutral-800/80">
        <img 
          src={resolvedCoverImage} 
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />

        {/* Category / Mode Tag Overlay */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950/85 border border-neutral-700/80 backdrop-blur-md text-[10px] font-mono font-semibold text-neutral-200 shadow-sm">
            {isScaleGuess ? (
              <Ruler className="w-3 h-3 text-amber-400" />
            ) : isColorBlind ? (
              <Eye className="w-3 h-3 text-violet-400" />
            ) : (
              <Trophy className="w-3 h-3 text-amber-400" />
            )}
            {categoryTag}
          </span>
        </div>

        {/* ── Prominent Hover Overlay with Play Button (Steam / Epic Games style) ── */}
        <div
          className={`absolute inset-0 bg-neutral-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300 z-20 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
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
