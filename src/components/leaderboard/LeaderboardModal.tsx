import { useEffect, useState } from "react";
import { X, Trophy, Loader2, Medal, Ruler, Palette, Clock } from "lucide-react";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/scoreApi";
import {
  fetchNotColorBlindLeaderboard,
  type NotColorBlindScoreRecord,
} from "@/lib/notColorBlindApi";
import { hsbToCss } from "@/games/not-color-blind/color";

interface LeaderboardModalProps {
  onClose: () => void;
  initialGame?: "scaleGuess" | "notColorBlind";
}

function ScaleAvatar({ entry }: { entry: LeaderboardEntry }) {
  const [err, setErr] = useState(false);
  if (entry.avatar_url && !err) {
    return (
      <img
        src={entry.avatar_url}
        alt={entry.username}
        referrerPolicy="no-referrer"
        className="w-8 h-8 rounded-full object-cover border border-border/50 shrink-0"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary text-xs font-bold font-mono shrink-0">
      {entry.username.charAt(0).toUpperCase()}
    </div>
  );
}

function ColorAvatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 text-xs font-bold font-mono shrink-0">
      {(name.charAt(0) || "P").toUpperCase()}
    </div>
  );
}

const MEDAL_ICONS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["text-amber-400", "text-slate-300", "text-amber-600"];

export function LeaderboardModal({ onClose, initialGame = "scaleGuess" }: LeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<"scaleGuess" | "notColorBlind">(initialGame);
  const [scaleEntries, setScaleEntries] = useState<LeaderboardEntry[]>([]);
  const [colorEntries, setColorEntries] = useState<NotColorBlindScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    if (activeTab === "scaleGuess") {
      getLeaderboard()
        .then((d) => {
          if (!ignore) setScaleEntries(d.leaderboard);
        })
        .catch(() => {
          if (!ignore) setError("Failed to load ScaleGuess leaderboard.");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    } else {
      fetchNotColorBlindLeaderboard(50)
        .then((d) => {
          if (!ignore) setColorEntries(d.leaderboard);
        })
        .catch(() => {
          if (!ignore) setError("Failed to load Not Color Blind leaderboard.");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-card/95 border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-10 font-sans flex flex-col max-h-[85vh]">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 id="leaderboard-title" className="text-base sm:text-lg font-bold text-foreground">
                Central Leaderboard
              </h2>
              <p className="text-xs text-muted-foreground">
                {activeTab === "scaleGuess" ? "Spatial Estimation" : "HSB Visual Memory Recall"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close leaderboard"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Game Selector Tab Pills */}
        <div className="px-5 pt-3.5 pb-2 shrink-0">
          <div className="flex items-center p-1 rounded-xl bg-secondary/40 border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("scaleGuess")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "scaleGuess"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>ScaleGuess</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notColorBlind")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "notColorBlind"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Not Color Blind</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="px-4 py-2 overflow-y-auto flex-1 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}

          {error && (
            <p className="text-center text-xs text-destructive py-10 font-mono">{error}</p>
          )}

          {!loading && !error && activeTab === "scaleGuess" && (
            <>
              {scaleEntries.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-12 font-mono">
                  No scores recorded yet. Be the first!
                </p>
              ) : (
                scaleEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/40 hover:border-border/70 transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-7 shrink-0 text-center">
                      {i < 3 ? (
                        <Medal className={`w-4 h-4 mx-auto ${MEDAL_COLORS[i]}`} />
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                      )}
                    </div>

                    <ScaleAvatar entry={entry} />

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {entry.name || entry.username}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">
                        @{entry.username} · ±{(entry.average_error ?? 0).toFixed(1)}% error
                      </p>
                    </div>

                    {/* Score */}
                    <div className="shrink-0 text-right">
                      <span className="text-sm sm:text-base font-extrabold font-mono text-primary">
                        {entry.total_score}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono ml-1">/ 500</span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {!loading && !error && activeTab === "notColorBlind" && (
            <>
              {colorEntries.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-12 font-mono">
                  No scores recorded yet. Be the first!
                </p>
              ) : (
                colorEntries.map((entry, i) => {
                  const rank = i + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
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
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Podium Rank Styling */}
                        <div className="w-7 shrink-0 text-center text-sm font-mono font-bold">
                          {isTop3 ? (
                            <span role="img" aria-label={`Rank ${rank}`} className="text-base">
                              {MEDAL_ICONS[i]}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">#{rank}</span>
                          )}
                        </div>

                        <ColorAvatar name={entry.player_name} />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {entry.player_name || "Anonymous"}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                            <Clock className="w-2.5 h-2.5 opacity-70 shrink-0" />
                            <span>{entry.time_taken_seconds.toFixed(2)}s recall</span>
                          </div>
                        </div>
                      </div>

                      {/* Compact Dual-Swatch Preview (Predicted top / Target bottom) */}
                      <div
                        className="w-7 h-7 rounded-lg overflow-hidden border border-border/70 shrink-0 flex flex-col shadow-xs"
                        title={`Predicted: ${hsbToCss(entry.predicted_hsb)} (top) | Target: ${hsbToCss(entry.target_hsb)} (bottom)`}
                      >
                        <div
                          className="flex-1 w-full"
                          style={{ backgroundColor: hsbToCss(entry.predicted_hsb) }}
                        />
                        <div
                          className="flex-1 w-full border-t border-black/30"
                          style={{ backgroundColor: hsbToCss(entry.target_hsb) }}
                        />
                      </div>

                      {/* Score */}
                      <div className="shrink-0 text-right min-w-16">
                        <span className="text-sm sm:text-base font-extrabold font-mono text-foreground">
                          {entry.score}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono ml-1">
                          / 100
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border/40 shrink-0 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {activeTab === "scaleGuess"
              ? "Ranked by highest 5-round score (max 500)"
              : "Ranked by Score (max 100) & Recall Time"}
          </span>
          <span className="font-mono">Top 50</span>
        </div>
      </div>
    </div>
  );
}
