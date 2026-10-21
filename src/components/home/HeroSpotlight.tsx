import { useState, useEffect } from "react";
import { Play, Trophy, ChevronRight, Sparkles, Ruler, Eye, Clock, ShieldCheck } from "lucide-react";

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
      className="relative w-full rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-900/90 shadow-2xl backdrop-blur-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Graphic Artwork Layer */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
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
          className={`absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-25 transition-all duration-700 ${
            activeSlide.theme === "amber"
              ? "bg-orange-600/30"
              : activeSlide.theme === "violet"
              ? "bg-cyan-500/30"
              : "bg-amber-600/30"
          }`}
        />

        {/* Blueprint Grid Lines & Vector Silhouette Graphics */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

        {/* Right-side dynamic preview visual */}
        <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-80 lg:w-[26rem] h-64 lg:h-72 items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity duration-500">
          {activeSlide.id === "scale-guess" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Scale ruler metric graphics */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-700">
                <div className="absolute left-0 -top-3 text-[10px] font-mono text-amber-400">0.0m</div>
                <div className="absolute left-1/2 -translate-x-1/2 -top-3 text-[10px] font-mono text-neutral-400">10.0m</div>
                <div className="absolute right-0 -top-3 text-[10px] font-mono text-amber-400">100.0m</div>
              </div>
              <div className="flex items-end gap-6 z-10">
                {/* Human Silhouette */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-neutral-400 mb-1">1.75m</span>
                  <img
                    src="/silhouettes/human.svg"
                    alt="Human Silhouette"
                    className="h-16 w-auto filter invert brightness-90 opacity-80"
                  />
                </div>
                {/* Blue Whale Silhouette */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-amber-400 font-semibold mb-1">33.5m</span>
                  <img
                    src="/silhouettes/blue_whale.svg"
                    alt="Blue Whale Silhouette"
                    className="h-32 w-auto filter invert brightness-90 opacity-90 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  />
                </div>
                {/* Saturn V Rocket Silhouette */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-neutral-300 mb-1">110.6m</span>
                  <img
                    src="/silhouettes/saturn_v.svg"
                    alt="Saturn V Rocket Silhouette"
                    className="h-44 w-auto filter invert brightness-100 opacity-95 drop-shadow-[0_0_16px_rgba(255,255,255,0.2)]"
                  />
                </div>
              </div>
            </div>
          ) : activeSlide.id === "not-color-blind" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Chromatic color wheel & spectrum preview */}
              <div className="relative w-52 h-52 rounded-full border border-neutral-700/60 p-4 flex items-center justify-center animate-[spin_24s_linear_infinite]">
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#ff3b30,#ff9500,#ffcc00,#34c759,#007aff,#5856d6,#af52de,#ff3b30)] opacity-70 blur-xl" />
                <div className="w-36 h-36 rounded-full bg-neutral-950/90 border border-neutral-800 flex items-center justify-center shadow-inner">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-cyan-400 shadow-[0_0_24px_rgba(168,85,247,0.6)]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Daily Challenge Trophy visual */}
              <div className="w-36 h-36 rounded-2xl bg-gradient-to-b from-amber-500/20 to-neutral-950 border border-amber-500/40 flex items-center justify-center shadow-[0_0_32px_rgba(245,158,11,0.25)]">
                <Trophy className="w-16 h-16 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
              </div>
              <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>Today's Tournament Seed</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Spotlight Content Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 min-h-[22rem] lg:min-h-[24rem]">
        {/* Left Column: Hero Content & CTAs */}
        <div className="lg:col-span-8 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Top Tag & Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800/90 border border-neutral-700/80 text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-200">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {activeSlide.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {activeSlide.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-sans">
              {activeSlide.title}
            </h1>

            {/* Tagline */}
            <p className="mt-2 text-base sm:text-lg text-neutral-200 font-medium max-w-xl leading-snug">
              {activeSlide.tagline}
            </p>

            {/* Short Subtext */}
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-lg leading-relaxed hidden sm:block">
              {activeSlide.description}
            </p>

            {/* Feature Chips */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {activeSlide.chips.map((chip) => (
                <span
                  key={chip}
                  className="px-2.5 py-1 rounded-md bg-neutral-950/60 border border-neutral-800 text-[11px] font-mono text-neutral-400"
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
        <div className="lg:col-span-4 bg-neutral-950/70 border-t lg:border-t-0 lg:border-l border-neutral-800/80 p-4 sm:p-5 flex flex-col justify-center gap-2.5 backdrop-blur-md">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-2 font-medium hidden lg:block">
            FEATURED ARCADE
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
            {SPOTLIGHT_SLIDES.map((slide, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`text-left p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer relative overflow-hidden flex items-center justify-between group/tab ${
                    isSelected
                      ? "bg-neutral-800/90 border border-neutral-700 shadow-md text-white"
                      : "bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-800/40 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {/* Active progress indicator line */}
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-r" />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-neutral-700/80 border-neutral-600 text-neutral-100"
                          : "bg-neutral-850 border-neutral-800 text-neutral-500"
                      }`}
                    >
                      {slide.id === "scale-guess" ? (
                        <Ruler className="w-3.5 h-3.5" />
                      ) : slide.id === "not-color-blind" ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <Trophy className="w-3.5 h-3.5" />
                      )}
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
