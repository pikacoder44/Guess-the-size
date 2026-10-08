export function HeroSection() {
  return (
    <section className="relative pt-8 sm:pt-14 pb-4 sm:pb-8 flex flex-col items-center text-center">
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
    </section>
  );
}

export default HeroSection;
