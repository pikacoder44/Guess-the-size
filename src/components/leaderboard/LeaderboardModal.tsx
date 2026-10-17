import { useEffect, useState } from "react";
import { X, Trophy, Loader2, Medal } from "lucide-react";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/scoreApi";

interface LeaderboardModalProps {
  onClose: () => void;
}

function Avatar({ entry }: { entry: LeaderboardEntry }) {
  const [err, setErr] = useState(false);
  if (entry.avatar_url && !err) {
    return (
      <img
        src={entry.avatar_url}
        alt={entry.username}
        referrerPolicy="no-referrer"
        className="w-8 h-8 rounded-full object-cover border border-border/50"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary text-sm font-bold font-mono">
      {entry.username.charAt(0).toUpperCase()}
    </div>
  );
}

const MEDAL_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-600"];

export function LeaderboardModal({ onClose }: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLeaderboard()
      .then((d) => setEntries(d.leaderboard))
      .catch(() => setError("Failed to load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-card/95 border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-10 font-sans">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 id="leaderboard-title" className="text-lg font-bold text-foreground">Global Leaderboard</h2>
              <p className="text-xs text-muted-foreground">Top scores — ScaleGuess</p>
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

        {/* Body */}
        <div className="px-4 py-4 max-h-[60vh] overflow-y-auto space-y-1.5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
          {error && (
            <p className="text-center text-sm text-destructive py-8">{error}</p>
          )}
          {!loading && !error && entries.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No scores yet. Be the first!</p>
          )}
          {entries.map((entry, i) => (
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

              <Avatar entry={entry} />

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {entry.name || entry.username}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground truncate">@{entry.username}</p>
              </div>

              {/* Score */}
              <div className="shrink-0 text-right">
                <p className="text-base font-extrabold font-mono text-primary">{entry.total_score}</p>
                <p className="text-[10px] text-muted-foreground">/100</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground text-center">Ranked by highest single-round score</p>
        </div>
      </div>
    </div>
  );
}
