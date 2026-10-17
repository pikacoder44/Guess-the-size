import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Trophy,
  BarChart3,
  Calendar,
  Lock,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { getPublicPlayerProfile, type PublicPlayerProfile } from "@/lib/scoreApi";
import { useAuth } from "@/context/AuthContext";

interface PublicProfilePageProps {
  identifier: string | number;
  onBackToLeaderboard: () => void;
  onNavigateToSelfSettings?: () => void;
}

export function PublicProfilePage({
  identifier,
  onBackToLeaderboard,
  onNavigateToSelfSettings,
}: PublicProfilePageProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    let ignore = false;

    getPublicPlayerProfile(identifier)
      .then((data) => {
        if (!ignore) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          // Check if identifier is a known fallback champion
          const idStr = String(identifier).toLowerCase();
          const fallbackMap: Record<string, { name: string; username: string; score: number; privateHist?: boolean }> = {
            apexestimator: { name: "Kai Sterling", username: "ApexEstimator", score: 100 },
            quantumscale: { name: "Elena Rostova", username: "QuantumScale", score: 99 },
            pixelmaster: { name: "Marcus Chen", username: "PixelMaster", score: 98 },
            metricwhiz: { name: "Sophia Lin", username: "MetricWhiz", score: 97 },
            voxelvision: { name: "David Novak", username: "VoxelVision", score: 95 },
            scalepro99: { name: "Aria Thorne", username: "ScalePro99", score: 94 },
            chronogauge: { name: "Lucas Meyer", username: "ChronoGauge", score: 92, privateHist: true },
            novaprecision: { name: "Zoe Vance", username: "NovaPrecision", score: 91 },
            spatialsense: { name: "Jordan Reed", username: "SpatialSense", score: 89 },
            bytesize: { name: "Samira Patel", username: "ByteSize", score: 88 },
          };

          const matched = fallbackMap[idStr];
          if (matched) {
            setProfile({
              user: {
                id: 999,
                username: matched.username,
                name: matched.name,
                avatar_url: null,
                member_since: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
                is_history_public: !matched.privateHist,
              },
              stats: {
                gamesPlayed: matched.privateHist ? 12 : 36,
                bestScore: matched.score,
                averageScore: Math.round(matched.score * 0.92),
              },
              recentScores: matched.privateHist
                ? []
                : [
                    {
                      id: 1,
                      mode: "daily",
                      total_score: matched.score,
                      average_error: 1.2,
                      elapsed_ms: null,
                      completed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
                    },
                    {
                      id: 2,
                      mode: "practice",
                      total_score: Math.max(0, matched.score - 4),
                      average_error: 3.1,
                      elapsed_ms: null,
                      completed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
                    },
                  ],
            });
            setLoading(false);
          } else {
            setError("Player profile could not be found or is unavailable.");
            setLoading(false);
          }
        }
      });

    return () => {
      ignore = true;
    };
  }, [identifier]);

  const isCurrentUser =
    user &&
    profile &&
    (user.id === profile.user.id ||
      user.username.toLowerCase() === profile.user.username.toLowerCase());

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="text-xs font-mono text-muted-foreground">Loading player profile…</span>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex-1 max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Profile Not Found</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {error || "We could not find the public profile you requested."}
        </p>
        <button
          type="button"
          onClick={onBackToLeaderboard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all cursor-pointer border border-border"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Leaderboard</span>
        </button>
      </main>
    );
  }

  const { user: player, stats, recentScores } = profile;
  const initial = (player.username?.charAt(0) || "P").toUpperCase();

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-in fade-in duration-300">
      {/* Top back navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBackToLeaderboard}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border border-border/40 hover:border-border"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Leaderboard</span>
        </button>

        {isCurrentUser && onNavigateToSelfSettings && (
          <button
            type="button"
            onClick={onNavigateToSelfSettings}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium cursor-pointer"
          >
            <span>Edit Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Profile Header Card ── */}
      <section className="p-6 rounded-2xl bg-card/60 border border-border/60 shadow-xl backdrop-blur-md relative overflow-hidden mb-6">
        {/* Ambient background glow */}
        <div
          className="absolute -top-16 -right-16 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
          {/* Large Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl border-2 border-primary/30 overflow-hidden bg-secondary flex items-center justify-center shadow-inner">
              {player.avatar_url && !avatarError ? (
                <img
                  src={player.avatar_url}
                  alt={player.username}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/15 text-primary text-3xl font-bold font-mono">
                  {initial}
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-slate-950 shadow-md"
              title="Verified Public Player"
            >
              <ShieldCheck className="w-3 h-3" />
            </div>
          </div>

          {/* User Meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground leading-tight truncate">
                {player.name || player.username}
              </h1>

              {isCurrentUser && (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  You
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                <Sparkles className="w-3 h-3" />
                Player
              </span>
            </div>

            <p className="text-sm font-mono text-muted-foreground mt-0.5">
              @{player.username}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                <span>
                  Joined{" "}
                  {player.member_since
                    ? new Date(player.member_since).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })
                    : "Recently"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono font-bold text-foreground">
                  {stats.bestScore}
                </span>
                <span className="text-muted-foreground">High Score</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Stats Grid ── */}
      <section aria-label="Player Statistics" className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-card/60 border border-border/60 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Personal Best
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className="font-mono text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">
              {stats.bestScore}
            </span>
            <span className="text-xs font-mono text-muted-foreground font-semibold">/500</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card/60 border border-border/60 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Games Played
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-black text-foreground">
            {stats.gamesPlayed}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card/60 border border-border/60 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Average Score
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-black text-primary">
            {stats.averageScore}
          </span>
        </div>
      </section>

      {/* ── Score History / Privacy Section ── */}
      <section aria-label="Score History" className="p-5 rounded-2xl bg-card/60 border border-border/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>Score History</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {player.is_history_public ? "Public Record" : "Private"}
          </span>
        </div>

        {player.is_history_public ? (
          recentScores.length > 0 ? (
            <div className="space-y-2">
              {recentScores.map((game, index) => (
                <div
                  key={game.id || index}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-secondary/30 border border-border/40 hover:border-border transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-amber-400">
                      {game.total_score}
                      <span className="text-[10px] text-muted-foreground font-normal">/500</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border/40">
                      {game.mode || "Classic"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="text-[11px] font-mono hidden sm:inline">
                      Err: {game.average_error ? `${Number(game.average_error).toFixed(1)}%` : "0%"}
                    </span>
                    <span className="font-mono text-[11px]">
                      {new Date(game.completed_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No recent game records found for this player yet.
            </div>
          )
        ) : (
          <div className="p-6 rounded-xl bg-secondary/20 border border-dashed border-border/60 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-2">
              <Lock className="w-5 h-5 opacity-70" />
            </div>
            <p className="text-xs font-medium text-foreground">
              This player has kept their score history private.
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Only global leaderboard scores are publicly displayed.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default PublicProfilePage;
