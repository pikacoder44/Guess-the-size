import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import type { GameCardData } from "@/data/games";

interface GameCardProps {
  card: GameCardData;
  onNavigate?: (href: string) => void;
}

export function GameCard({ card, onNavigate }: GameCardProps) {
  const handlePlay = () => {
    if (!card.available) return;
    if (onNavigate) {
      onNavigate(card.href);
    } else {
      history.pushState(null, "", card.href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <motion.article
      className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden cursor-pointer select-none transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-(--card-accent) hover:shadow-xl hover:shadow-(color:--card-glow) focus-within:ring-2 focus-within:ring-(--card-accent)"
      style={
        {
          "--card-accent": card.accentColor,
          "--card-glow": card.accentGlow,
        } as React.CSSProperties
      }
      whileHover={{
        scaleX: 1.02,
        transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
      }}
      initial={false}
      onClick={card.available ? handlePlay : undefined}
      role={card.available ? "button" : undefined}
      tabIndex={card.available ? 0 : undefined}
      aria-label={`${card.title} - ${card.tagline}`}
      onKeyDown={
        card.available
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePlay();
              }
            }
          : undefined
      }
    >
      {/* Ambient gradient aura */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle 320px at 50% 0%, color-mix(in oklch, ${card.accentColor} 16%, transparent) 0%, transparent 75%)`,
        }}
      />

      {/* Subtle accent border line on top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-20 group-hover:opacity-100 transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${card.accentColor} 50%, transparent 100%)`,
        }}
      />

      {/* Main card body */}
      <div className="relative z-10 flex flex-col flex-1 p-6 sm:p-7 gap-5">
        {/* Header row: Icon and status badge */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl ring-1 ring-border group-hover:ring-[var(--card-accent)] transition-all duration-300 group-hover:scale-105"
            style={{
              background: `color-mix(in oklch, ${card.accentColor} 14%, var(--secondary))`,
              color: card.accentColor,
            }}
          >
            {card.icon}
          </div>

          {card.badge && (
            <span
              className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-colors ${
                card.available
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                  : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {card.available && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {card.badge}
            </span>
          )}
        </div>

        {/* Title, Category & Description */}
        <div className="flex flex-col gap-1.5">
          <span
            className="text-xs font-mono uppercase tracking-widest font-medium"
            style={{ color: card.accentColor }}
          >
            {card.category}
          </span>

          <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground tracking-tight group-hover:text-primary transition-colors">
            {card.title}
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
            {card.description}
          </p>
        </div>

        {/* Action Button: Expands / enlarges prominently on card hover */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            disabled={!card.available}
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className={`w-full h-11 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              card.available
                ? "bg-primary text-primary-foreground group-hover:scale-[1.04] group-hover:brightness-110 group-hover:shadow-lg group-hover:shadow-primary/25 active:scale-95"
                : "bg-secondary/60 text-muted-foreground border border-border/50 cursor-not-allowed opacity-75"
            }`}
            style={
              card.available
                ? {
                    background: card.accentColor,
                    color: "oklch(0.12 0.01 255)",
                  }
                : undefined
            }
          >
            {card.available ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current opacity-90" />
                <span>Play Now</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            ) : (
              <span>Coming Soon</span>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default GameCard;
