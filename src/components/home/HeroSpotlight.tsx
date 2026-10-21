import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Trophy, ChevronRight, Sparkles, ShieldCheck } from "lucide-react";

interface HeroSpotlightProps {
  onNavigate: (route: string) => void;
}

interface SpotlightSlide {
  id: string;
  category: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  playRoute: string;
  leaderboardRoute: string;
  ctaText: string;
  chips: string[];
  theme: "amber" | "violet" | "gold";
  coverImage: string;
}

const SPOTLIGHT_SLIDES: SpotlightSlide[] = [
  {
    id: "scale-guess",
    category: "SPATIAL REASONING",
    badge: "CALIBRATED METRIC ENGINE",
    title: "ScaleGuess",
    tagline: "Calibrate your spatial intuition across micro, everyday, and cosmic dimensions.",
    description: "Drag, pan, zoom, and resize zero-padded vector silhouettes against real-world references. Evaluated on logarithmic precision curves.",
    playRoute: "/games/scale-guess",
    leaderboardRoute: "/games/scale-guess/leaderboard",
    ctaText: "PLAY SCALEGUESS",
    chips: ["5 Rounds", "Logarithmic Scoring", "Zero-Padding Vectors", "Daily Challenge"],
    theme: "amber",
    coverImage: "/assets/banners/scaleguess-cover.jpg",
  },
  {
    id: "not-color-blind",
    category: "PERCEPTUAL MEMORY",
    badge: "HSB COLOR RECONSTRUCTION",
    title: "Not Color Blind",
    tagline: "Observe dynamic color swatches for 5 seconds before decay, then reconstruct from memory.",
    description: "Challenge your visual cortex. Match precise Hue angle, Saturation purity, and Brightness luminance with zero color hints.",
    playRoute: "/games/not-color-blind",
    leaderboardRoute: "/games/not-color-blind/leaderboard",
    ctaText: "PLAY NOT COLOR BLIND",
    chips: ["5s Observation", "Hue / Sat / Val", "Delta-E Evaluation", "Instant Feedback"],
    theme: "violet",
    coverImage: "/assets/banners/not-color-blind-cover.jpg",
  },
  {
    id: "daily-challenge",
    category: "DAILY TOURNAMENT",
    badge: "GLOBAL RANKED SEED",
    title: "Today's Daily Challenge",
    tagline: "One deterministic 5-puzzle run. Compete for global #1 on today's leaderboard.",
    description: "A synchronized daily puzzle seed released at 00:00 UTC. Same references, same targets, one shot to set your best score.",
    playRoute: "/games/scale-guess",
    leaderboardRoute: "/games/scale-guess/leaderboard",
    ctaText: "LAUNCH DAILY RUN",
    chips: ["Synchronized Seed", "Single Daily Attempt", "Global Ladder", "Resets 00:00 UTC"],
    theme: "gold",
    coverImage: "/assets/banners/daily-challenge-cover.jpg",
  },
];

export function HeroSpotlight({ onNavigate }: HeroSpotlightProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance spotlight carousel every 7 seconds if not hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SPOTLIGHT_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeSlide = SPOTLIGHT_SLIDES[activeIndex];

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-950/40 shadow-2xl backdrop-blur-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Background High-Resolution Cover Artwork Layer ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {SPOTLIGHT_SLIDES.map((slide, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                isActive
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <img
                src={slide.coverImage}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />
              {/* Subtle dark gradient overlay so text remains crisp and highly legible */}
              <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-r from-neutral-950 via-neutral-950/85 to-transparent" />
            </div>
          );
        })}

        {/* Dynamic theme ambient glow */}
        <div
          className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-35 transition-all duration-700 ${
            activeSlide.theme === "amber"
              ? "bg-amber-500/40"
              : activeSlide.theme === "violet"
              ? "bg-violet-600/40"
              : "bg-yellow-500/40"
          }`}
        />
        <div
          className={`absolute -bottom-32 -right-32 w-lg h-128 rounded-full blur-3xl opacity-25 transition-all duration-700 ${
            activeSlide.theme === "amber"
              ? "bg-orange-600/30"
              : activeSlide.theme === "violet"
              ? "bg-cyan-500/30"
              : "bg-amber-600/30"
          }`}
        />
      </div>

      {/* Main Spotlight Content Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-88 lg:min-h-100">
        {/* Left Column: Hero Content & CTAs */}
        <div className="lg:col-span-8 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Top Tag & Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900/90 border border-neutral-700/80 text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-200 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {activeSlide.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {activeSlide.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans drop-shadow-md">
              {activeSlide.title}
            </h1>

            {/* Tagline */}
            <p className="mt-2 text-base sm:text-lg text-neutral-200 font-medium max-w-xl leading-snug drop-shadow-sm">
              {activeSlide.tagline}
            </p>

            {/* Short Subtext */}
            <p className="mt-2 text-xs sm:text-sm text-neutral-300 max-w-lg leading-relaxed hidden sm:block">
              {activeSlide.description}
            </p>

            {/* Feature Chips */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {activeSlide.chips.map((chip) => (
                <span
                  key={chip}
                  className="px-2.5 py-1 rounded-md bg-neutral-950/70 border border-neutral-800 text-[11px] font-mono text-neutral-300 backdrop-blur-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 sm:mt-8 flex items-center gap-3 sm:gap-4 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate(activeSlide.playRoute)}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs sm:text-sm tracking-tight shadow-xl hover:shadow-2xl active:scale-[0.96] transition-all duration-100 will-change-transform transform-gpu cursor-pointer group/btn"
            >
              <Play className="w-4 h-4 fill-current transition-transform group-hover/btn:scale-110" />
              <span>{activeSlide.ctaText}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate(activeSlide.leaderboardRoute)}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/80 hover:border-neutral-600 text-neutral-200 hover:text-white font-semibold text-xs sm:text-sm tracking-tight backdrop-blur-md active:scale-[0.96] transition-all duration-100 will-change-transform transform-gpu cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>VIEW LEADERBOARD</span>
            </button>
          </div>
        </div>

        {/* Right Column (Desktop): Epic Games Store Style Slide Switcher Tabs */}
        <div className="lg:col-span-4 bg-neutral-950/50 border-t lg:border-t-0 lg:border-l border-neutral-800/80 p-4 sm:p-5 flex flex-col justify-center gap-2.5 backdrop-blur-md">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-2 font-medium hidden lg:block">
            FEATURED GAMES
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
            {SPOTLIGHT_SLIDES.map((slide, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`text-left p-2.5 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden flex items-center justify-between group/tab ${
                    isSelected
                      ? "bg-neutral-850/95 border border-neutral-700 shadow-lg text-white"
                      : "bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-800/40 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {/* Active progress indicator line */}
                  {isSelected && (
                    <motion.div
                      layoutId="heroTabIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-r"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mini Cover Thumbnail */}
                    <div
                      className={`w-11 h-8 rounded-lg overflow-hidden shrink-0 border relative transition-all duration-200 ${
                        isSelected
                          ? "border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.3)] scale-105"
                          : "border-neutral-800 opacity-60 group-hover/tab:opacity-90"
                      }`}
                    >
                      <img
                        src={slide.coverImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {slide.title}
                      </div>
                      <div className="text-[10px] font-mono text-neutral-400 truncate hidden sm:block">
                        {slide.category}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected
                        ? "text-neutral-200 translate-x-0.5"
                        : "text-neutral-600 group-hover/tab:text-neutral-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSpotlight;

