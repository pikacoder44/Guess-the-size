import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Trophy,
  ArrowLeft,
  Gamepad2,
  Sparkles,
  User as UserIcon,
  LogIn,
  RotateCw,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchNotColorBlindLeaderboard,
  FALLBACK_NOT_COLOR_BLIND_CHAMPIONS,
  type NotColorBlindScoreRecord,
} from "@/lib/notColorBlindApi";
import { hsbToCss, hsbToHex } from "./color";
import type { AppRoute } from "@/App";

export interface NotColorBlindLeaderboardPageProps {
  onNavigate: (route: AppRoute, param?: string | number) => void;
  onBackToGame: () => void;
  onOpenLogin: () => void;
}

function formatTimeAgo(isoString: string): string {
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

function PlayerAvatar({
  avatarUrl,
  username,
  size = "md",
}: {
  avatarUrl?: string | null;
  username: string;
  size?: "sm" | "md" | "lg";
}) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
  }[size];

  if (avatarUrl && !hasError) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`${sizeClasses} rounded-full object-cover ring-1 ring-border/60 shrink-0`}
      />
    );
  }

  const initial = (username?.charAt(0) || "P").toUpperCase();
  return (
    <div
      className={`${sizeClasses} rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold font-mono shrink-0 select-none`}
    >
      {initial}
    </div>
  );
}

export function NotColorBlindLeaderboardPage({
  onNavigate,
  onBackToGame,
  onOpenLogin,
}: NotColorBlindLeaderboardPageProps) {
  const { user, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<NotColorBlindScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchNotColorBlindLeaderboard(50);
      if (res.leaderboard && res.leaderboard.length > 0) {
        setEntries(res.leaderboard);
      } else {
        setEntries(FALLBACK_NOT_COLOR_BLIND_CHAMPIONS);
      }
    } catch {
      setEntries(FALLBACK_NOT_COLOR_BLIND_CHAMPIONS);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    let ignore = false;
    loadData().finally(() => {
      if (!ignore) setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [loadData]);

  // Find user in rankings
  const userIndex = user
    ? entries.findIndex(
        (entry) =>
          (entry.user_id && user.id && String(entry.user_id) === String(user.id)) ||
          entry.player_name.toLowerCase() === user.username.toLowerCase() ||
          (user.name && entry.player_name.toLowerCase() === user.name.toLowerCase())
      )
    : -1;

  const isUserInTop10 = userIndex !== -1 && userIndex < 10;
  const currentUserRank = userIndex !== -1 ? userIndex + 1 : null;
  const currentRankDisplay = currentUserRank !== null ? `#${currentUserRank}` : "Unranked";

  const handleRowClick = (entry: NotColorBlindScoreRecord) => {
    if (entry.user_id) {
      onNavigate("publicProfile", entry.user_id);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-foreground flex flex-col selection:bg-amber-500/20 relative overflow-hidden">
      {/* ── Background Ambient Backlights (Deep Cinematic Dark) ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 -right-48 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-6 relative z-10">
        {/* ── Top Bar Controls: Back Navigation + Refresh ── */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToGame}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-border/50 hover:border-amber-400/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-amber-400/80" />
            <span>Back to Game</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Refresh Leaderboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-border/50 hover:border-amber-400/40 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 backdrop-blur-md"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-amber-400/40 transition-colors cursor-pointer backdrop-blur-md"
            >
              <span>All Games</span>
            </button>
          </div>
        </div>

        {/* ── Section A: Header Section with Gold Emblem ── */}
        <header className="relative z-10 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pb-2 border-b border-border/40">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-mono font-medium mb-2.5 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
              <Trophy className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
              <span>Perceptual Precision</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-3">
              <span>Not Color Blind Global Leaderboard</span>
              <Sparkles className="w-6 h-6 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)] animate-pulse" />
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
              Top color perception champions ranked by total recall score out of 500 and precision timing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user && (
              <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5 shadow-sm shadow-emerald-950/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-muted-foreground">Your Rank:</span>
                <span className="font-bold text-emerald-300">{currentRankDisplay}</span>
              </div>
            )}
            <div className="text-[11px] font-mono text-muted-foreground/75 bg-neutral-900/80 px-3 py-1.5 rounded-xl border border-border/50 backdrop-blur-md hidden sm:block">
              Live Top 50 Rankings
            </div>
          </div>
        </header>

        {/* ── Section B: Leaderboard Table (Top 50 Not Color Blind Scorers) ── */}
        <section aria-label="Not Color Blind Top Scorers" className="relative z-10 flex flex-col gap-3">
          {/* Desktop Table Header */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/75 border-b border-border/30">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="w-8 sm:w-9 text-center shrink-0">Rank</span>
              <span>Player</span>
            </div>
            <div className="w-44 text-center shrink-0">Predicted vs Target</div>
            <div className="text-right shrink-0 min-w-32.5">Score · Recall Time</div>
          </div>

          {/* Not Color Blind Rows */}
          <div className="flex flex-col gap-2.5">
            {entries.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground font-mono text-xs bg-neutral-900/40 rounded-xl border border-border/40">
                {loading ? "Loading champions..." : "No scores recorded yet. Be the first to conquer Not Color Blind!"}
              </div>
            ) : (
              entries.map((entry, idx) => {
                const rank = idx + 1;
                const isTop1 = rank === 1;
                const isTop2 = rank === 2;
                const isTop3 = rank === 3;
                const isCurrentUser =
                  user &&
                  ((entry.user_id && user.id && String(entry.user_id) === String(user.id)) ||
                    entry.player_name.toLowerCase() === user.username.toLowerCase() ||
                    (user.name && entry.player_name.toLowerCase() === user.name.toLowerCase()));

                let rowStyles = "bg-neutral-900/60 border-border/40 hover:border-border/80 hover:bg-neutral-850/80";
                let rankBadge = (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary text-foreground font-mono font-bold flex items-center justify-center text-xs shrink-0 transition-all duration-300 group-hover:scale-110 border border-border/60">
                    #{rank.toString().padStart(2, "0")}
                  </div>
                );
                let scoreColor = "text-amber-400";
                let nameHoverColor = "group-hover:text-amber-300";

                if (isCurrentUser) {
                  rowStyles = "bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400";
                  scoreColor = "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]";
                  nameHoverColor = "group-hover:text-emerald-300";
                } else if (isTop1) {
                  rowStyles = "gold-champion-card bg-linear-to-r from-amber-500/15 via-neutral-900/90 to-amber-950/25 border-amber-400/40 hover:border-amber-400/70";
                  rankBadge = (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 text-black font-extrabold flex items-center justify-center text-sm sm:text-base font-mono shadow-md shadow-amber-400/30 shrink-0 transition-all duration-300 group-hover:scale-110">
                      <span role="img" aria-label="1st Place">🥇</span>
                    </div>
                  );
                  scoreColor = "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]";
                  nameHoverColor = "group-hover:text-amber-300";
                } else if (isTop2) {
                  rowStyles = "silver-card bg-linear-to-r from-slate-400/10 via-neutral-900/90 to-slate-900/20 border-slate-300/30 hover:border-slate-300/60";
                  rankBadge = (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-200 text-black font-extrabold flex items-center justify-center text-sm sm:text-base font-mono shadow-sm shrink-0 transition-all duration-300 group-hover:scale-110">
                      <span role="img" aria-label="2nd Place">🥈</span>
                    </div>
                  );
                  scoreColor = "text-slate-100 drop-shadow-[0_0_10px_rgba(203,213,225,0.4)]";
                  nameHoverColor = "group-hover:text-slate-200";
                } else if (isTop3) {
                  rowStyles = "bronze-card bg-linear-to-r from-amber-800/15 via-neutral-900/90 to-amber-950/15 border-amber-700/30 hover:border-amber-700/60";
                  rankBadge = (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-700 text-white font-extrabold flex items-center justify-center text-sm sm:text-base font-mono shadow-sm shrink-0 transition-all duration-300 group-hover:scale-110">
                      <span role="img" aria-label="3rd Place">🥉</span>
                    </div>
                  );
                  scoreColor = "text-amber-500 drop-shadow-[0_0_10px_rgba(217,119,6,0.4)]";
                  nameHoverColor = "group-hover:text-amber-400";
                }

                const predCss = hsbToCss(entry.predicted_hsb);
                const targetCss = hsbToCss(entry.target_hsb);

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, transform: "scale(0.98) translateY(8px)" }}
                    animate={{ opacity: 1, transform: "scale(1) translateY(0px)" }}
                    transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: Math.min(idx * 0.02, 0.3) }}
                    whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                    onClick={() => handleRowClick(entry)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(entry);
                      }
                    }}
                    className={`group relative flex items-center justify-between px-4 py-3 min-h-16 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden backdrop-blur-xl ${rowStyles}`}
                  >
                    {isTop1 && !isCurrentUser && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                        <div className="absolute inset-0 w-1/3 bg-linear-to-r from-transparent via-amber-300/10 to-transparent animate-shimmer-pass pointer-events-none" />
                      </div>
                    )}

                    {/* Left Section: Rank + Avatar + Player Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3 relative z-10">
                      {rankBadge}

                      <PlayerAvatar
                        username={entry.player_name}
                        size="md"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm sm:text-base text-foreground truncate ${nameHoverColor} transition-colors`}>
                            {entry.player_name}
                          </span>
                          {isCurrentUser && (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
                              <span>You</span>
                              <span className="text-emerald-300 font-semibold">(#{rank})</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground truncate">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 opacity-70" />
                            <span>{entry.time_taken_seconds.toFixed(2)}s recall</span>
                          </span>
                          <span>·</span>
                          <span>{formatTimeAgo(entry.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Section: Dual Swatch Preview */}
                    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-950/60 border border-border/60 shrink-0 relative z-10 shadow-inner">
                      <div
                        className="w-8 h-8 rounded-lg overflow-hidden border border-border/80 shrink-0 flex flex-col shadow-xs"
                        title={`Predicted: ${hsbToHex(entry.predicted_hsb)} (top) vs Original Target: ${hsbToHex(entry.target_hsb)} (bottom)`}
                      >
                        <div
                          className="flex-1 w-full"
                          style={{ backgroundColor: predCss }}
                        />
                        <div
                          className="flex-1 w-full border-t border-black/30"
                          style={{ backgroundColor: targetCss }}
                        />
                      </div>
                      <div className="hidden md:flex flex-col text-[10px] font-mono leading-tight">
                        <span className="text-foreground/90 font-semibold">Pred vs Target</span>
                        <span className="text-muted-foreground/80">{entry.predicted_hsb.h}° vs {entry.target_hsb.h}° Hue</span>
                      </div>
                    </div>

                    {/* Right Section: Score & Recall */}
                    <div className="text-right shrink-0 min-w-28 sm:min-w-32.5 relative z-10">
                      <div className="flex items-baseline justify-end gap-1 font-mono">
                        <span className={`text-xl font-extrabold ${scoreColor}`}>
                          {entry.score}
                        </span>
                        <span className="text-xs text-muted-foreground font-bold">/500</span>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {entry.time_taken_seconds.toFixed(2)}s recall
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pinned user standing if logged in and not in Top 10 */}
          {isAuthenticated && user && !isUserInTop10 && userIndex !== -1 && entries[userIndex] && (
            <div className="sticky bottom-4 z-20 mt-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/90 mb-1.5 px-2 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Your Current Standing</span>
              </div>
              <div className="group relative flex items-center justify-between px-4 py-3 min-h-16 rounded-xl bg-emerald-950/70 border-2 border-emerald-500/70 backdrop-blur-xl shadow-2xl shadow-emerald-950/80 transition-all duration-200">
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/30 text-emerald-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/50 shadow-sm">
                    {currentRankDisplay}
                  </div>

                  <PlayerAvatar
                    avatarUrl={user.avatarUrl || user.profilePicture}
                    username={user.username}
                    size="md"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-foreground truncate">
                        {user.name || user.username}
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
                        <span>You</span>
                        <span className="text-emerald-300 font-semibold">({currentRankDisplay})</span>
                      </span>
                    </div>
                    <p className="text-xs font-mono text-emerald-400/80 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-neutral-950/60 border border-emerald-500/30 shrink-0">
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-border/80 shrink-0 flex flex-col shadow-xs">
                    <div
                      className="flex-1 w-full"
                      style={{ backgroundColor: hsbToCss(entries[userIndex].predicted_hsb) }}
                    />
                    <div
                      className="flex-1 w-full border-t border-black/30"
                      style={{ backgroundColor: hsbToCss(entries[userIndex].target_hsb) }}
                    />
                  </div>
                  <div className="flex flex-col text-[10px] font-mono leading-tight">
                    <span className="text-emerald-300 font-semibold">Your Swatch</span>
                    <span className="text-emerald-400/70">{entries[userIndex].time_taken_seconds.toFixed(2)}s</span>
                  </div>
                </div>

                <div className="text-right shrink-0 min-w-28 sm:min-w-32.5">
                  <div className="flex items-baseline justify-end gap-1 font-mono">
                    <span className="text-xl font-extrabold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                      {entries[userIndex].score}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold">/500</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400/70">
                    {entries[userIndex].time_taken_seconds.toFixed(2)}s recall
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Guest Session Prompt (When Unauthenticated) ── */}
        {!isAuthenticated && (
          <div className="mt-2 p-4 rounded-xl bg-neutral-900/60 border border-border/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <UserIcon className="w-4 h-4 text-primary shrink-0" />
              <span>Browsing as guest. Sign in to record your scores on the Global Hall of Fame.</span>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-105 transition-all cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}

        {/* ── Section C: Bottom Actions ── */}
        <footer className="relative z-10 pt-4 pb-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            <p className="font-medium text-foreground">
              Ready to test your color memory recall?
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Reconstruct calibrated target HSB swatches from pure visual memory.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 text-xs font-semibold text-foreground border border-border/60 hover:border-amber-400/40 transition-colors cursor-pointer backdrop-blur-md"
            >
              All Games
            </button>

            <button
              type="button"
              onClick={onBackToGame}
              className="flex-1 sm:flex-initial lock-btn flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-xs sm:text-sm font-bold bg-linear-to-r from-amber-400 to-amber-500 text-slate-950 hover:brightness-105"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Play Not Color Blind Now</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default NotColorBlindLeaderboardPage;
