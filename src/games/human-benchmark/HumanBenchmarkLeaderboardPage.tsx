import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Sparkles,
  User as UserIcon,
  LogIn,
  RotateCw,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchHumanBenchmarkLeaderboard,
  FALLBACK_HUMAN_BENCHMARK_CHAMPIONS,
  type HumanBenchmarkScoreRecord,
} from "@/lib/humanBenchmarkApi";
import type { AppRoute } from "@/App";

export interface HumanBenchmarkLeaderboardPageProps {
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
      className={`${sizeClasses} rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold font-mono shrink-0 select-none`}
    >
      {initial}
    </div>
  );
}

export function HumanBenchmarkLeaderboardPage({
  onNavigate,
  onBackToGame,
  onOpenLogin,
}: HumanBenchmarkLeaderboardPageProps) {
  const { user, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<HumanBenchmarkScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchHumanBenchmarkLeaderboard(50);
      if (res.leaderboard && res.leaderboard.length > 0) {
        setEntries(res.leaderboard);
      } else {
        setEntries(FALLBACK_HUMAN_BENCHMARK_CHAMPIONS);
      }
    } catch {
      setEntries(FALLBACK_HUMAN_BENCHMARK_CHAMPIONS);
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

  // Find current user's rank in rankings
  const userIndex = user
    ? entries.findIndex(
        (entry) =>
          (entry.user_id && user.id && String(entry.user_id) === String(user.id)) ||
          entry.player_name.toLowerCase() === user.username.toLowerCase() ||
          (user.name && entry.player_name.toLowerCase() === user.name.toLowerCase())
      )
    : -1;

  const currentUserRank = userIndex !== -1 ? userIndex + 1 : null;
  const currentRankDisplay = currentUserRank !== null ? `#${currentUserRank}` : "Unranked";
  const userScoreRecord = userIndex !== -1 ? entries[userIndex] : null;

  const handleRowClick = (entry: HumanBenchmarkScoreRecord) => {
    if (entry.user_id) {
      onNavigate("publicProfile", entry.user_id);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-foreground flex flex-col selection:bg-emerald-500/20 relative overflow-hidden">
      {/* ── Background Ambient Backlights (Deep Cinematic Dark) ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-emerald-500/10 via-emerald-600/5 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 -right-48 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-6 relative z-10">
        {/* ── Top Bar Controls: Back Navigation + Refresh ── */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToGame}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-border/50 hover:border-emerald-400/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-emerald-400/80" />
            <span>Back to Game</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Refresh Leaderboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-border/50 hover:border-emerald-400/40 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 backdrop-blur-md"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-emerald-400/40 transition-colors cursor-pointer backdrop-blur-md"
            >
              <span>All Games</span>
            </button>
          </div>
        </div>

        {/* ── Section A: Header Section with Emerald Emblem ── */}
        <header className="relative z-10 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pb-2 border-b border-border/40">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-medium mb-2.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Zap className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span>Neural Response Speed</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-3">
              <span>Human Benchmark Global Leaderboard</span>
              <Sparkles className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse" />
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
              Fastest human reaction times ranked by lowest 5-round average response latency.
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

        {/* ── Section B: Leaderboard Table (Top 50 Human Benchmark Scorers) ── */}
        <section aria-label="Human Benchmark Top Reflexes" className="relative z-10 flex flex-col gap-3">
          {/* Desktop Table Header */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/75 border-b border-border/30">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="w-8 sm:w-9 text-center shrink-0">Rank</span>
              <span>Player Info</span>
            </div>
            <div className="w-48 text-center shrink-0">Round Latencies</div>
            <div className="text-right shrink-0 min-w-32.5">Reaction Time</div>
          </div>

          {/* Rows */}
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                  delayChildren: 0.02,
                },
              },
            }}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2.5 transform-gpu"
          >
            {entries.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground font-mono text-xs bg-neutral-900/40 rounded-xl border border-border/40">
                {loading ? "Loading reflex champions..." : "No scores recorded yet. Be the first to benchmark your reflexes!"}
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
                    entry.player_name.toLowerCase() === user.username.toLowerCase());

                let rowStyles = "bg-neutral-900/60 border-border/40 hover:border-border/80 hover:bg-neutral-850/80";
                let rankBadge = (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary text-foreground font-mono font-bold flex items-center justify-center text-xs shrink-0 transition-all duration-300 group-hover:scale-110 border border-border/60">
                    #{rank.toString().padStart(2, "0")}
                  </div>
                );
                let scoreColor = "text-emerald-400";
                let nameHoverColor = "group-hover:text-emerald-300";

                if (isCurrentUser) {
                  rowStyles = "bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400";
                  scoreColor = "text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]";
                  nameHoverColor = "group-hover:text-emerald-200";
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

                return (
                  <motion.div
                    key={entry.id || `${entry.player_name}-${idx}`}
                    variants={{
                      hidden: { opacity: 0, y: 12, scale: 0.98 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { type: "spring", stiffness: 350, damping: 25 },
                      },
                    }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    onClick={() => handleRowClick(entry)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(entry);
                      }
                    }}
                    className={`group relative flex items-center justify-between px-4 py-3 min-h-16 rounded-xl border transition-colors duration-200 cursor-pointer overflow-hidden backdrop-blur-xl transform-gpu will-change-[transform,opacity] ${rowStyles}`}
                  >
                    {isTop1 && !isCurrentUser && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                        <div className="absolute inset-0 w-1/3 bg-linear-to-r from-transparent via-amber-300/10 to-transparent animate-shimmer-pass pointer-events-none" />
                      </div>
                    )}

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
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/75 truncate mt-0.5">
                          <span>{formatTimeAgo(entry.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Per-round latency pills */}
                    <div className="hidden sm:flex items-center justify-center gap-1 w-48 shrink-0">
                      {Array.isArray(entry.rounds) && entry.rounds.length > 0 ? (
                        entry.rounds.slice(0, 5).map((r, rIdx) => (
                          <span
                            key={rIdx}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950/80 border border-neutral-800 text-neutral-400"
                          >
                            {r}ms
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-mono text-neutral-500">5 Rounds</span>
                      )}
                    </div>

                    {/* Final Score column: e.g. 188ms avg */}
                    <div className="text-right shrink-0 min-w-32.5 relative z-10">
                      <div className="flex items-baseline justify-end gap-1 font-mono">
                        <span className={`text-xl font-extrabold ${scoreColor}`}>
                          {entry.average_reaction_ms}
                        </span>
                        <span className="text-xs text-muted-foreground font-bold">ms avg</span>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground/70">
                        {entry.average_reaction_ms < 200 ? "Lightning Fast ⚡" : entry.average_reaction_ms < 250 ? "Great Reflex 🚀" : "Standard Speed 👍"}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>

          {/* Sticky User Position Bar (if authenticated & ranked) */}
          {isAuthenticated && user && userScoreRecord && (
            <div className="sticky bottom-4 z-20 mt-4 rounded-2xl bg-neutral-900/95 border border-emerald-500/40 p-3 sm:p-4 backdrop-blur-xl shadow-2xl shadow-black/80">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/30">
                    {currentRankDisplay}
                  </div>
                  <PlayerAvatar username={user.username} size="md" />
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                      <span>{user.name || user.username}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        YOU
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400/80">
                      Your Global Hall of Fame Record
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-baseline justify-end gap-1 font-mono">
                    <span className="text-xl font-extrabold text-emerald-400">
                      {userScoreRecord.average_reaction_ms}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold">ms avg</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400/70">
                    Ranked #{currentUserRank}
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
              <UserIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Browsing as guest. Sign in to record your reaction times on the Global Hall of Fame.</span>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-400 text-neutral-950 text-xs font-semibold hover:brightness-105 transition-all cursor-pointer shrink-0"
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
              Ready to test your visual reflexes?
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Compete on identical flash triggers and rank your reaction speed on the global leaderboard.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 text-xs font-semibold text-foreground border border-border/60 hover:border-emerald-400/40 transition-colors cursor-pointer backdrop-blur-md"
            >
              All Games
            </button>

            <button
              type="button"
              onClick={onBackToGame}
              className="flex-1 sm:flex-initial lock-btn flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-xs sm:text-sm font-bold bg-linear-to-r from-emerald-400 to-emerald-500 text-slate-950 hover:brightness-105"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Test Your Reflexes Now</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default HumanBenchmarkLeaderboardPage;
