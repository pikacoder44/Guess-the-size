import { useEffect, useState } from "react";
import { X, Trophy, Loader2, Award, Clock } from "lucide-react";
import {
  fetchNotColorBlindLeaderboard,
  type NotColorBlindScoreRecord,
} from "@/lib/notColorBlindApi";
import { hsbToCss } from "./color";

interface NotColorBlindLeaderboardModalProps {
  onClose: () => void;
}

export function NotColorBlindLeaderboardModal({ onClose }: NotColorBlindLeaderboardModalProps) {
  const [entries, setEntries] = useState<NotColorBlindScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchNotColorBlindLeaderboard(50)
      .then((res) => {
        if (isMounted) setEntries(res.leaderboard);
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load leaderboard.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 id="leaderboard-modal-title" className="text-base font-bold text-foreground">
                Leaderboard
              </h2>
              <p className="text-xs text-muted-foreground">Not Color Blind · Memory Recall</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close leaderboard"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-mono">Loading rankings...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-xs text-rose-400 font-mono">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-xs font-mono">
              No scores recorded yet. Be the first!
            </div>
          ) : (
            entries.map((entry, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${
                    rank === 1
                      ? "bg-amber-500/5 border-amber-500/30"
                      : rank === 2
                      ? "bg-slate-400/5 border-slate-400/20"
                      : rank === 3
                      ? "bg-amber-700/5 border-amber-700/20"
                      : "bg-secondary/30 border-border/40 hover:bg-secondary/50"
                  }`}
                >
                  {/* Rank & Player Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 text-center font-mono text-xs font-bold shrink-0 ${
                        rank === 1
                          ? "text-amber-400"
                          : rank === 2
                          ? "text-slate-300"
                          : rank === 3
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isTop3 ? (
                        <Award className="w-4 h-4 inline-block -mt-0.5" />
                      ) : (
                        `#${rank}`
                      )}
                    </span>

                    {/* Color Swatch: Target vs Predicted */}
                    <div
                      className="w-7 h-7 rounded-lg overflow-hidden border border-border/60 shrink-0 flex flex-col shadow-xs"
                      title="Predicted (top) vs Target (bottom)"
                    >
                      <div
                        className="flex-1 w-full"
                        style={{ backgroundColor: hsbToCss(entry.predicted_hsb) }}
                      />
                      <div
                        className="flex-1 w-full"
                        style={{ backgroundColor: hsbToCss(entry.target_hsb) }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {entry.player_name || "Anonymous"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                        <Clock className="w-2.5 h-2.5 opacity-70" />
                        <span>{entry.time_taken_seconds}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-black text-foreground">
                      {entry.score}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-1">
                      / 100
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/60 bg-secondary/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Ranked by Score &amp; Time</span>
          <span>Top 50</span>
        </div>
      </div>
    </div>
  );
}
