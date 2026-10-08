import { ArrowRight, Play } from "lucide-react";

interface HeroSectionProps {
  onPlayFeatured: () => void;
  onExploreModules: () => void;
}

export function HeroSection({
  onPlayFeatured,
  onExploreModules,
}: HeroSectionProps) {
  return (
    <section className="relative pt-8 sm:pt-14 pb-8 sm:pb-12 flex flex-col items-center text-center">
      {/* Soft background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-56 sm:h-72 pointer-events-none -z-10 blur-3xl opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--primary) 0%, transparent 70%)",
        }}
      />

      {/* Hero Headline */}
      <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-foreground max-w-3xl leading-[1.12]">
        Test your instincts.{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-300 to-amber-500">
          Calibrate your mind.
        </span>
      </h1>

      {/* Description */}
      <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl leading-relaxed">
        Free casual brain games designed to challenge spatial estimation,
        working memory, and visual perception in quick, focused sessions.
      </p>

      {/* Action buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={onPlayFeatured}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Play ScaleGuess</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onExploreModules}
          className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-semibold text-sm tracking-wide bg-secondary/80 hover:bg-secondary border border-border/80 text-foreground hover:text-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Explore Games</span>
        </button>
      </div>
    </section>
  );
}

export default HeroSection;
