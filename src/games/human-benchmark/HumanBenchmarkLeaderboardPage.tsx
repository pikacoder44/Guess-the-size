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
  Trophy,
  Medal,
  Crown,
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

function getSpeedRating(ms: number): string {
  if (ms < 170) return "Superhuman Reflex ⚡";
  if (ms < 200) return "Lightning Fast ⚡";
  if (ms < 240) return "Great Reflex 🚀";
  if (ms < 280) return "Rapid Impulse ⏱️";
  return "Standard Speed 👍";
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
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl",
  }[size];

  if (avatarUrl && !hasError) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`${sizeClasses} rounded-full object-cover ring-2 ring-border/60 shrink-0`}
      />
    );
  }

  const initial = (username?.charAt(0) || "P").toUpperCase();
  return (
    <div
      className={`${sizeClasses} rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono shrink-0 select-none shadow-inner`}
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

  const isCurrentUser = (entry: HumanBenchmarkScoreRecord) => {
    if (!user) return false;
    return Boolean(
      (entry.user_id && user.id && String(entry.user_id) === String(user.id)) ||
      entry.player_name.toLowerCase() === user.username.toLowerCase()
    );
  };

  // Top 3 Podium contenders
  const rank1 = entries[0] || null;
  const rank2 = entries[1] || null;
  const rank3 = entries[2] || null;
  const remainingEntries = entries.slice(3);

  return (
    <div className="min-h-screen bg-neutral-950 text-foreground flex flex-col selection:bg-emerald-500/20 relative overflow-hidden">
      {/* ── Background Ambient Backlights (Deep Cinematic Dark with Neon Emerald) ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-emerald-600/5 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 -right-48 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-8 relative z-10">
        {/* ── Top Bar Controls: Back Navigation + Refresh ── */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToGame}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-border/50 hover:border-emerald-400/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer backdrop-blur-md active:scale-[0.98]"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-border/50 hover:border-emerald-400/40 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 backdrop-blur-md active:scale-[0.98]"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-emerald-400/40 transition-colors cursor-pointer backdrop-blur-md active:scale-[0.98]"
            >
              <span>All Games</span>
            </button>
          </div>
        </div>

        {/* ── Header Section with Emerald Emblem ── */}
        <header className="relative z-10 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pb-3 border-b border-border/40">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-medium mb-2.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Zap className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span>Neural Response Speed</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-3">
              <span>Human Benchmark Global Hall of Fame</span>
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

        {loading ? (
          <div className="py-24 text-center text-muted-foreground font-mono text-xs bg-neutral-900/40 rounded-2xl border border-border/40 backdrop-blur-md flex flex-col items-center justify-center gap-3">
            <RotateCw className="w-5 h-5 text-emerald-400 animate-spin" />
            <span>Loading reflex champions...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground font-mono text-xs bg-neutral-900/40 rounded-2xl border border-border/40 backdrop-blur-md">
            No scores recorded yet. Be the first to benchmark your reflexes!
          </div>
        ) : (
          <>
            {/* ── 1. TOP 3 PODIUM HERO SECTION (#1, #2, #3) ── */}
            <section aria-label="Top 3 Podium">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    Podium of Champions
                  </h2>
                </div>
                <span className="text-xs font-mono text-muted-foreground/80">
                  Global Top 3
                </span>
              </div>

              {/* 3-Column Podium Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-stretch">
                {/* 🥈 #2 Runner-Up Card (Desktop: Left column, Mobile: Second) */}
                {rank2 && (
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    onClick={() => handleRowClick(rank2)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(rank2);
                      }
                    }}
                    className="order-2 md:order-1 relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-slate-400/10 via-neutral-900/90 to-neutral-950 border border-slate-400/30 shadow-[0_0_20px_rgba(148,163,184,0.1)] hover:shadow-[0_0_30px_rgba(148,163,184,0.2)] hover:border-slate-300/60 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl group"
                  >
                    {/* Top Badge */}
                    <div className="flex items-center justify-between w-full mb-4 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-400/15 border border-slate-400/30 text-slate-200 text-xs font-mono font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(148,163,184,0.15)]">
                        <Medal className="w-3.5 h-3.5 text-slate-300 fill-slate-300/30" />
                        <span>Rank #02 • Runner-Up</span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-slate-300/15 border border-slate-300/30 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(148,163,184,0.2)] shrink-0">
                        <span role="img" aria-label="2nd Place Silver Medal">🥈</span>
                      </div>
                    </div>

                    {/* Avatar & Player Name */}
                    <div className="flex flex-col items-center text-center my-2 relative z-10">
                      <div className="relative mb-3">
                        <PlayerAvatar username={rank2.player_name} size="lg" />
                      </div>
                      <div className="flex items-center gap-2 max-w-full justify-center">
                        <span className="text-slate-200 font-bold text-base sm:text-lg truncate group-hover:text-white transition-colors">
                          {rank2.player_name}
                        </span>
                        {isCurrentUser(rank2) && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground/75 mt-0.5">
                        {formatTimeAgo(rank2.created_at)}
                      </span>
                    </div>

                    {/* Highlighted Score */}
                    <div className="my-4 text-center relative z-10">
                      <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100 tracking-tight flex items-baseline justify-center gap-1.5 drop-shadow-[0_0_15px_rgba(203,213,225,0.3)]">
                        <span>{rank2.average_reaction_ms}</span>
                        <span className="text-xs font-semibold text-slate-400">ms avg</span>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-300">
                          <Zap className="w-3 h-3 fill-slate-300" />
                          <span>{getSpeedRating(rank2.average_reaction_ms)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Round Latency Pills */}
                    <div className="mt-auto pt-4 border-t border-slate-400/20 flex flex-col gap-1.5 relative z-10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400/60 text-center">
                        Round Latencies
                      </div>
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {rank2.rounds?.slice(0, 5).map((r, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950/80 border border-slate-700/60 text-slate-300"
                          >
                            {r}ms
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 🥇 #1 Champion Card (Desktop: Center column, Mobile: First) */}
                {rank1 && (
                  <motion.div
                    whileHover={{ y: -6, scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    onClick={() => handleRowClick(rank1)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(rank1);
                      }
                    }}
                    className="order-1 md:order-2 md:-translate-y-3 relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-amber-500/10 via-neutral-900/90 to-neutral-950 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] hover:border-amber-400/70 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl group"
                  >
                    {/* Shimmer sweep effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                      <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent animate-shimmer-pass pointer-events-none" />
                    </div>

                    {/* Top Crown Badge */}
                    <div className="flex items-center justify-between w-full mb-4 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                        <span>Rank #01 • Champion</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
                        <span role="img" aria-label="1st Place Gold Trophy">🥇</span>
                      </div>
                    </div>

                    {/* Avatar & Player Name */}
                    <div className="flex flex-col items-center text-center my-2 relative z-10">
                      <div className="relative mb-3">
                        <PlayerAvatar username={rank1.player_name} size="lg" />
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-md">
                          <Crown className="w-3.5 h-3.5 fill-current" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 max-w-full justify-center">
                        <span className="text-amber-400 font-bold text-lg sm:text-xl truncate group-hover:text-amber-300 transition-colors drop-shadow-sm">
                          {rank1.player_name}
                        </span>
                        {isCurrentUser(rank1) && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground/75 mt-0.5">
                        {formatTimeAgo(rank1.created_at)}
                      </span>
                    </div>

                    {/* Highlighted Score: Big Reaction Time */}
                    <div className="my-4 text-center relative z-10">
                      <div className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-300 tracking-tight flex items-baseline justify-center gap-1.5 drop-shadow-[0_0_20px_rgba(245,158,11,0.45)]">
                        <span>{rank1.average_reaction_ms}</span>
                        <span className="text-sm font-semibold text-amber-400/75">ms avg</span>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400/90">
                          <Zap className="w-3 h-3 fill-amber-400" />
                          <span>{getSpeedRating(rank1.average_reaction_ms)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Round Latency Pills */}
                    <div className="mt-auto pt-4 border-t border-amber-500/20 flex flex-col gap-1.5 relative z-10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/60 text-center">
                        Round Latencies
                      </div>
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {rank1.rounds?.slice(0, 5).map((r, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950/80 border border-amber-500/25 text-amber-200/90"
                          >
                            {r}ms
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 🥉 #3 Third Place Card (Desktop: Right column, Mobile: Third) */}
                {rank3 && (
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    onClick={() => handleRowClick(rank3)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowClick(rank3);
                      }
                    }}
                    className="order-3 md:order-3 relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-amber-700/10 via-neutral-900/90 to-neutral-950 border border-amber-700/30 shadow-[0_0_20px_rgba(180,83,9,0.1)] hover:shadow-[0_0_30px_rgba(180,83,9,0.2)] hover:border-amber-600/60 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl group"
                  >
                    {/* Top Badge */}
                    <div className="flex items-center justify-between w-full mb-4 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/15 border border-amber-700/30 text-amber-400 text-xs font-mono font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(180,83,9,0.15)]">
                        <Medal className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
                        <span>Rank #03 • 3rd Place</span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-amber-700/20 border border-amber-700/30 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(180,83,9,0.2)] shrink-0">
                        <span role="img" aria-label="3rd Place Bronze Medal">🥉</span>
                      </div>
                    </div>

                    {/* Avatar & Player Name */}
                    <div className="flex flex-col items-center text-center my-2 relative z-10">
                      <div className="relative mb-3">
                        <PlayerAvatar username={rank3.player_name} size="lg" />
                      </div>
                      <div className="flex items-center gap-2 max-w-full justify-center">
                        <span className="text-amber-500 font-bold text-base sm:text-lg truncate group-hover:text-amber-400 transition-colors">
                          {rank3.player_name}
                        </span>
                        {isCurrentUser(rank3) && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground/75 mt-0.5">
                        {formatTimeAgo(rank3.created_at)}
                      </span>
                    </div>

                    {/* Highlighted Score */}
                    <div className="my-4 text-center relative z-10">
                      <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400/95 tracking-tight flex items-baseline justify-center gap-1.5 drop-shadow-[0_0_15px_rgba(180,83,9,0.3)]">
                        <span>{rank3.average_reaction_ms}</span>
                        <span className="text-xs font-semibold text-amber-600">ms avg</span>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-500">
                          <Zap className="w-3 h-3 fill-amber-500" />
                          <span>{getSpeedRating(rank3.average_reaction_ms)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Round Latency Pills */}
                    <div className="mt-auto pt-4 border-t border-amber-700/20 flex flex-col gap-1.5 relative z-10">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-amber-600/60 text-center">
                        Round Latencies
                      </div>
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {rank3.rounds?.slice(0, 5).map((r, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950/80 border border-amber-800/40 text-amber-200/80"
                          >
                            {r}ms
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </section>

            {/* ── 2. CLEAN COMPACT GLASS TABLE FOR RANKS #4+ ── */}
            <section aria-label="Ranks 4 and Below" className="relative z-10 flex flex-col gap-3">
              <div className="flex items-center justify-between mt-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                    Global Competitors (Ranks #04–#{Math.max(4, entries.length).toString().padStart(2, "0")})
                  </h2>
                </div>
                <span className="text-xs font-mono text-muted-foreground/80">
                  {remainingEntries.length} Players
                </span>
              </div>

              {/* Glass Table Container */}
              <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Table Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground/75 border-b border-neutral-800 bg-neutral-950/40">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="w-10 sm:w-12 text-center shrink-0">RANK</span>
                    <span>PLAYER</span>
                  </div>
                  <div className="text-right">AVG REACTION TIME</div>
                </div>

                {/* Table Body */}
                {remainingEntries.length === 0 ? (
                  <div className="p-8 text-center text-xs font-mono text-muted-foreground/80">
                    All currently ranked competitors are featured on the podium above.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800/50">
                    {remainingEntries.map((entry, idx) => {
                      const rank = idx + 4;
                      const isUser = isCurrentUser(entry);

                      return (
                        <div
                          key={entry.id || `${entry.player_name}-${rank}`}
                          onClick={() => handleRowClick(entry)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRowClick(entry);
                            }
                          }}
                          className={`flex items-center justify-between py-3.5 px-4 sm:px-6 hover:bg-white/[0.03] transition-colors cursor-pointer group ${
                            isUser ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.12] border-l-2 border-l-emerald-400" : ""
                          }`}
                        >
                          {/* Rank & Player Info */}
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-4">
                            {/* Rank Pill: Monospace rank badge (#04, #05, etc.) */}
                            <div className="w-10 sm:w-12 flex items-center justify-center shrink-0">
                              <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-neutral-800/70 border border-neutral-700/60 text-neutral-300 group-hover:border-neutral-600 transition-colors">
                                #{rank.toString().padStart(2, "0")}
                              </span>
                            </div>

                            {/* Avatar & Username with relative time */}
                            <PlayerAvatar username={entry.player_name} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-foreground group-hover:text-emerald-300 transition-colors truncate">
                                  {entry.player_name}
                                </span>
                                {isUser && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-muted-foreground/75 truncate block">
                                {formatTimeAgo(entry.created_at)}
                              </span>
                            </div>
                          </div>

                          {/* Reaction Time: High-contrast green text with speed rating badge */}
                          <div className="text-right shrink-0 flex flex-col items-end justify-center">
                            <div className="flex items-baseline gap-1 font-mono justify-end">
                              <span className="text-base sm:text-lg font-extrabold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                                {entry.average_reaction_ms}
                              </span>
                              <span className="text-xs font-bold text-muted-foreground">ms avg</span>
                            </div>
                            <div className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400/80">
                              <Zap className="w-2.5 h-2.5 fill-emerald-400" />
                              <span>{getSpeedRating(entry.average_reaction_ms)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sticky User Position Bar (if authenticated & ranked) */}
              {isAuthenticated && user && userScoreRecord && (
                <div className="sticky bottom-4 z-20 mt-4 rounded-2xl bg-neutral-900/95 border border-emerald-500/40 p-3 sm:p-4 backdrop-blur-xl shadow-2xl shadow-black/80">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        {currentRankDisplay}
                      </div>
                      <PlayerAvatar username={user.username} size="md" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
                          <span>{user.name || user.username}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
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
          </>
        )}

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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-400 text-neutral-950 text-xs font-semibold hover:bg-emerald-300 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
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
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 text-xs font-semibold text-foreground border border-border/60 hover:border-emerald-400/40 transition-colors cursor-pointer backdrop-blur-md active:scale-[0.98]"
            >
              All Games
            </button>

            <button
              type="button"
              onClick={onBackToGame}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 text-neutral-950 hover:brightness-105"
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

