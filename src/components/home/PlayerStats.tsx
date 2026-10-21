import { useState, useEffect } from "react";
import { loadStatistics } from "@/storage";
import { getNotColorBlindPersonalBest } from "@/lib/notColorBlindApi";

export function PlayerStats() {
  const [metrics, setMetrics] = useState({
    totalGames: 0,
    scaleGuessBest: 0,
    notColorBlindBest: 0,
  });

  useEffect(() => {
    function loadMetrics() {
      const stats = loadStatistics();
      const ncbBest = getNotColorBlindPersonalBest();

      let ncbGamesCount = 0;
      try {
        const raw = localStorage.getItem("not_color_blind_local_scores");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) ncbGamesCount = parsed.length;
        }
      } catch {
        // ignore storage errors
      }

      const total = (stats.gamesPlayed || 0) + ncbGamesCount;
      setMetrics({
        totalGames: total,
        scaleGuessBest: stats.bestScore || 0,
        notColorBlindBest: ncbBest,
      });
    }

    loadMetrics();
    window.addEventListener("storage", loadMetrics);
    return () => window.removeEventListener("storage", loadMetrics);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-xl bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/60 px-4 sm:px-8 py-3.5 flex items-center justify-around divide-x divide-neutral-800/60 text-center">
        <div className="flex-1 px-2 sm:px-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Total Games
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-neutral-100">
            {metrics.totalGames}
          </div>
        </div>

        <div className="flex-1 px-2 sm:px-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            ScaleGuess Best
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-neutral-100">
            {metrics.scaleGuessBest > 0 ? `${metrics.scaleGuessBest} / 500` : "— / 500"}
          </div>
        </div>

        <div className="flex-1 px-2 sm:px-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Color Memory Best
          </div>
          <div className="mt-1 text-base sm:text-lg font-bold font-mono text-neutral-100">
            {metrics.notColorBlindBest > 0 ? `${metrics.notColorBlindBest} / 500` : "— / 500"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerStats;
