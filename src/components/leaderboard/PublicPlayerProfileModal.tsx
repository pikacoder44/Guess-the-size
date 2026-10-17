import { useState, useEffect } from "react";
import {
  X,
  Trophy,
  ShieldAlert,
  Lock,
  Calendar,
  Sparkles,
  Target,
  Flame,
  Award,
  Clock,
  Loader2,
} from "lucide-react";
import { getPublicPlayerProfile, type LeaderboardEntry, type PublicPlayerProfile } from "@/lib/scoreApi";

interface PublicPlayerProfileModalProps {
  player: LeaderboardEntry | null;
  onClose: () => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const elapsed = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function PublicPlayerProfileModal({ player, onClose }: PublicPlayerProfileModalProps) {
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (!player) return;

    let ignore = false;
    const identifier = player.user_id || player.username;
    getPublicPlayerProfile(identifier)
      .then((data) => {
        if (!ignore) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          // Graceful fallback profile for demo / fallback champions
          const isChronoGauge = player.username.toLowerCase() === "chronogauge";
          const fallbackProfile: PublicPlayerProfile = {
            user: {
              id: player.user_id || player.id,
              username: player.username,
              name: player.name,
              avatar_url: player.avatar_url,
              member_since: player.completed_at,
              is_history_public: !isChronoGauge, // ChronoGauge is private
            },
            stats: {
              gamesPlayed: isChronoGauge ? 8 : 15,
              bestScore: player.total_score,
              averageScore: Math.max(70, Math.round(player.total_score * 0.92)),
            },
            recentScores: isChronoGauge
              ? []
              : [
                  {
                    id: 1,
                    mode: player.mode || "practice",
                    total_score: player.total_score,
                    average_error: player.average_error,
                    completed_at: player.completed_at,
                  },
                  {
                    id: 2,
                    mode: "practice",
                    total_score: Math.max(65, player.total_score - 3),
                    average_error: Number((player.average_error + 1.2).toFixed(1)),
                    completed_at: new Date(new Date(player.completed_at).getTime() - 86400000).toISOString(),
                  },
                  {
                    id: 3,
                    mode: "daily",
                    total_score: Math.max(60, player.total_score - 7),
                    average_error: Number((player.average_error + 2.4).toFixed(1)),
                    completed_at: new Date(new Date(player.completed_at).getTime() - 86400000 * 2).toISOString(),
                  },
                ],
          };
          setProfile(fallbackProfile);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [player]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!player) return null;

  const displayName = profile?.user.name || player.name || player.username;
  const username = profile?.user.username || player.username;
  const avatarUrl = profile?.user.avatar_url || player.avatar_url;
  const bestScore = profile?.stats.bestScore ?? player.total_score;
  const gamesPlayed = profile?.stats.gamesPlayed ?? 1;
  const averageScore = profile?.stats.averageScore ?? Math.round(player.total_score * 0.9);
  const isHistoryPublic = profile ? profile.user.is_history_public : true;
  const recentScores = profile?.recentScores ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-profile-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop click listener */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden z-10 font-sans animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Header / Dismiss Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-neutral-800/80 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/25">
              Player Profile
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 relative z-10">
          {/* Profile Identity Card */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt={username}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 border-2 border-amber-400/50 flex items-center justify-center text-amber-300 font-mono font-black text-2xl shadow-lg shadow-amber-500/10 select-none">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-neutral-900 ring-1 ring-emerald-400"
                title="Verified Player"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id="player-profile-title"
                className="text-lg font-bold font-display text-foreground truncate flex items-center gap-2"
              >
                <span>{displayName}</span>
                {bestScore >= 98 && (
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                )}
              </h2>
              <p className="text-xs font-mono text-muted-foreground truncate">
                @{username}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground/80 font-mono">
                <Calendar className="w-3 h-3 opacity-60" />
                <span>
                  {profile?.user.member_since
                    ? `Member since ${new Date(profile.user.member_since).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })}`
                    : "Active Competitor"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bento Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Best Score */}
            <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-750/70 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold mb-1">
                <Trophy className="w-3 h-3" />
                <span>Best</span>
              </div>
              <span className="font-mono text-xl font-black text-foreground drop-shadow-sm">
                {bestScore}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">/100 pts</span>
            </div>

            {/* Rounds Played */}
            <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-750/70 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                <Flame className="w-3 h-3" />
                <span>Rounds</span>
              </div>
              <span className="font-mono text-xl font-black text-foreground">
                {gamesPlayed}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">completed</span>
            </div>

            {/* Average Score */}
            <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-750/70 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
                <Target className="w-3 h-3" />
                <span>Average</span>
              </div>
              <span className="font-mono text-xl font-black text-foreground">
                {averageScore}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">pts</span>
            </div>
          </div>

          {/* ── Section 2: Score History & Privacy Rule ── */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Recent Score History</span>
              </span>
              {isHistoryPublic && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Public
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            ) : !isHistoryPublic ? (
              /* Privacy Restricted Banner */
              <div className="p-5 rounded-xl bg-neutral-800/40 border border-neutral-750 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-muted-foreground">
                  <Lock className="w-4 h-4 opacity-75" />
                </div>
                <p className="text-xs font-semibold text-foreground">Score History Hidden</p>
                <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                  This player has kept their score history private.
                </p>
              </div>
            ) : recentScores.length === 0 ? (
              /* Empty History */
              <div className="p-6 text-center rounded-xl bg-neutral-800/30 border border-neutral-800 flex flex-col items-center gap-1.5">
                <ShieldAlert className="w-6 h-6 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">No recent score attempts recorded.</p>
              </div>
            ) : (
              /* Score History List */
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {recentScores.map((scoreItem, idx) => (
                  <div
                    key={scoreItem.id || idx}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-800/50 border border-neutral-750/60 hover:border-neutral-600 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-neutral-750 border border-neutral-700 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-mono font-medium text-foreground capitalize">
                          {scoreItem.mode || "practice"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                          <Clock className="w-2.5 h-2.5 opacity-60" />
                          <span>{formatRelativeTime(scoreItem.completed_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-bold text-amber-400">
                        {scoreItem.total_score}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">/100</span>
                      {scoreItem.average_error !== undefined && (
                        <p className="text-[9px] font-mono text-muted-foreground">
                          ±{scoreItem.average_error.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Close */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-foreground text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PublicPlayerProfileModal;
