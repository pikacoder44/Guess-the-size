import type { AppRoute } from "@/App";

interface FooterProps {
  onNavigate?: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps = {}) {
  return (
    <footer className="w-full border-t border-neutral-800/60 py-6 mt-auto">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="text-xs font-mono text-neutral-500">
          Synapse © 2026. Calibrated Cognitive Training Platform.
        </p>
        {onNavigate && (
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => onNavigate("scaleGuess")}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              ScaleGuess
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate("notColorBlind")}
              className="hover:text-violet-400 transition-colors cursor-pointer"
            >
              Not Color Blind
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate("humanBenchmark")}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Human Benchmark
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}

export default Footer;
