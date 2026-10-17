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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getLeaderboard, getMyScores, type LeaderboardEntry, type UserStats } from "@/lib/scoreApi";
import type { AppRoute } from "@/App";

interface LeaderboardPageProps {
  onNavigate: (route: AppRoute, param?: string | number) => void;
  onBackToGame: () => void;
  onOpenLogin: () => void;
}

// Fallback top champions when database is empty or network is offline
const FALLBACK_CHAMPIONS: LeaderboardEntry[] = [
  {
    id: 101,
    user_id: 901,
    username: "ApexEstimator",
    name: "Kai Sterling",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    total_score: 494,
    average_error: 0.2,
    elapsed_ms: 38500,
    mode: "daily",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 102,
    user_id: 902,
    username: "QuantumScale",
    name: "Elena Rostova",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    total_score: 489,
    average_error: 0.8,
    elapsed_ms: 42100,
    mode: "practice",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 103,
    user_id: 903,
    username: "PixelMaster",
    name: "Marcus Chen",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    total_score: 483,
    average_error: 1.4,
    elapsed_ms: 51200,
    mode: "daily",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 104,
    user_id: 904,
    username: "MetricWhiz",
    name: "Sophia Lin",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    total_score: 477,
    average_error: 2.1,
    elapsed_ms: 60800,
    mode: "practice",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 105,
    user_id: 905,
    username: "VoxelVision",
    name: "David Novak",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    total_score: 471,
    average_error: 3.5,
    elapsed_ms: 74300,
    mode: "practice",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 106,
    user_id: 906,
    username: "ScalePro99",
    name: "Aria Thorne",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
    total_score: 465,
    average_error: 4.2,
    elapsed_ms: 88600,
    mode: "daily",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: 107,
    user_id: 907,
    username: "ChronoGauge",
    name: "Lucas Meyer",
    avatar_url: null,
    total_score: 458,
    average_error: 5.6,
    elapsed_ms: 95100,
    mode: "practice",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: 108,
    user_id: 908,
    username: "NovaPrecision",
    name: "Zoe Vance",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    total_score: 449,
    average_error: 6.3,
    elapsed_ms: 103400,
    mode: "daily",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 42).toISOString(),
  },
  {
    id: 109,
    user_id: 909,
    username: "SpatialSense",
    name: "Jordan Reed",
    avatar_url: null,
    total_score: 441,
    average_error: 7.9,
    elapsed_ms: 118700,
    mode: "practice",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 110,
    user_id: 910,
    username: "ByteSize",
    name: "Samira Patel",
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80",
    total_score: 432,
    average_error: 8.8,
    elapsed_ms: 132900,
    mode: "practice",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - 3600000 * 60).toISOString(),
  },
];

// Seed mock entries for development and visual testing
const DEV_MOCK_ENTRIES: Array<Omit<LeaderboardEntry, "id" | "user_id" | "mode" | "date" | "completed_at">> = [
  { name: "ApexGuesser", username: "apex_god", total_score: 488, average_error: 1.2, elapsed_ms: 28400, avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" },
  { name: "ScaleMaster", username: "scale_wiz", total_score: 462, average_error: 2.8, elapsed_ms: 31200, avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80" },
  { name: "PrecisionPro", username: "pixel_perfect", total_score: 440, average_error: 4.1, elapsed_ms: 35100, avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80" },
  { name: "SihouetteKing", username: "king_shadow", total_score: 415, average_error: 5.6, elapsed_ms: 38900, avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" },
  { name: "VectorVixen", username: "vector_v", total_score: 390, average_error: 7.2, elapsed_ms: 41000, avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80" },
  { name: "MetricMane", username: "metric_m", total_score: 365, average_error: 9.0, elapsed_ms: 44200, avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80" },
  { name: "RatioRuler", username: "ratio_r", total_score: 330, average_error: 12.4, elapsed_ms: 48000, avatar_url: null },
  { name: "DimensionDude", username: "dim_dude", total_score: 295, average_error: 16.8, elapsed_ms: 52100, avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80" },
  { name: "EstimateEthan", username: "ethan_est", total_score: 250, average_error: 22.1, elapsed_ms: 55400, avatar_url: null },
  { name: "PixelPioneer", username: "pixel_pioneer", total_score: 210, average_error: 28.4, elapsed_ms: 59800, avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80" },
];

function generateMockScores(): LeaderboardEntry[] {
  // Stagger timestamps: 18m ago, 42m ago, 1h ago, 2h ago, etc.
  const intervalMinutes = [18, 42, 75, 130, 210, 320, 480, 720, 1440, 2880];
  return DEV_MOCK_ENTRIES.map((entry, idx) => ({
    id: 801 + idx,
    user_id: 801 + idx,
    name: entry.name,
    username: entry.username,
    avatar_url: entry.avatar_url,
    total_score: entry.total_score,
    average_error: entry.average_error,
    elapsed_ms: entry.elapsed_ms,
    mode: "daily",
    date: new Date().toISOString().slice(0, 10),
    completed_at: new Date(Date.now() - (intervalMinutes[idx] || (idx + 1) * 35) * 60000).toISOString(),
  }));
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

export function LeaderboardPage({ onNavigate, onBackToGame, onOpenLogin }: LeaderboardPageProps) {
  const { user, token, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Attach dev helper to window.seedDummyScores for console testing
  useEffect(() => {
    const seedFn = async () => {
      const mock = generateMockScores();
      console.log("Seeding dummy leaderboard data...", mock);
      setEntries(mock);
      return mock;
    };

    if (typeof window !== "undefined") {
      (window as unknown as { seedDummyScores: typeof seedFn }).seedDummyScores = seedFn;
    }

    const handleSeedEvent = () => {
      seedFn();
    };
    window.addEventListener("seed-dummy-scores", handleSeedEvent);

    return () => {
      window.removeEventListener("seed-dummy-scores", handleSeedEvent);
      if (typeof window !== "undefined") {
        delete (window as unknown as { seedDummyScores?: unknown }).seedDummyScores;
      }
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [leaderboardRes, statsRes] = await Promise.allSettled([
        getLeaderboard(),
        token ? getMyScores(token) : Promise.resolve(null),
      ]);

      if (leaderboardRes.status === "fulfilled" && leaderboardRes.value.leaderboard.length > 0) {
        setEntries(leaderboardRes.value.leaderboard);
      } else {
        setEntries(FALLBACK_CHAMPIONS);
      }

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setMyStats(statsRes.value.stats);
      }
    } catch {
      setEntries(FALLBACK_CHAMPIONS);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([
      getLeaderboard(),
      token ? getMyScores(token) : Promise.resolve(null),
    ]).then(([leaderboardRes, statsRes]) => {
      if (ignore) return;
      if (leaderboardRes.status === "fulfilled" && leaderboardRes.value.leaderboard.length > 0) {
        setEntries(leaderboardRes.value.leaderboard);
      } else {
        setEntries(FALLBACK_CHAMPIONS);
      }

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setMyStats(statsRes.value.stats);
      }
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [token]);

  // Helper for numeric leaderboard sorting across 3-tier precision criteria
  const sortLeaderboardEntries = (items: LeaderboardEntry[]): LeaderboardEntry[] => {
    return [...items].sort((a, b) => {
      // Primary: Higher total score first
      if (b.total_score !== a.total_score) {
        return Number(b.total_score) - Number(a.total_score);
      }
      // Secondary: Lower average error first
      if (a.average_error !== b.average_error) {
        return Number(a.average_error) - Number(b.average_error);
      }
      // Tertiary: Faster time first
      return Number(a.elapsed_ms || 999999) - Number(b.elapsed_ms || 999999);
    });
  };

  // Enforce strict numerical sorting whenever merging real API entries with fallback/mock entries
  const sortedAllEntries = (() => {
    const existingUsernames = new Set(entries.map((e) => e.username.toLowerCase()));
    const fillers = FALLBACK_CHAMPIONS.filter(
      (c) => !existingUsernames.has(c.username.toLowerCase())
    );
    const neededFillers = Math.max(0, 10 - entries.length);
    const allEntries = [...entries, ...fillers.slice(0, neededFillers)];
    return sortLeaderboardEntries(allEntries);
  })();

  const top10 = sortedAllEntries.slice(0, 10);

  // Check if the authenticated user is present in the Top 10 list
  const userInTop10Index = user
    ? top10.findIndex(
        (entry) =>
          entry.username.toLowerCase() === user.username.toLowerCase() ||
          (entry.user_id && user.id && Number(entry.user_id) === Number(user.id)),
      )
    : -1;

  const isUserInTop10 = userInTop10Index !== -1;

  // Check if authenticated user is present in all sorted entries (including beyond top 10)
  const userInAllIndex = user
    ? sortedAllEntries.findIndex(
        (entry) =>
          entry.username.toLowerCase() === user.username.toLowerCase() ||
          (entry.user_id && user.id && Number(entry.user_id) === Number(user.id)),
      )
    : -1;

  // Rank determination for currently logged-in user
  const currentUserRank: number | null =
    userInTop10Index !== -1
      ? userInTop10Index + 1
      : userInAllIndex !== -1
        ? userInAllIndex + 1
        : myStats?.rank ?? (myStats?.bestScore ? 42 : null);

  const currentUserRankDisplay =
    currentUserRank !== null ? `#${currentUserRank}` : "Unranked";

  const handleRowClick = (entry: LeaderboardEntry) => {
    const identifier = entry.user_id ?? entry.username;
    onNavigate("publicProfile", identifier);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-foreground flex flex-col selection:bg-amber-500/20 relative overflow-hidden">
      {/* ── Background Ambient Backlights (Deep Cinematic Dark) ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"
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
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-border/50 hover:border-amber-400/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer backdrop-blur-md"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-border/50 hover:border-amber-400/40 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 backdrop-blur-md"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 hover:border-amber-400/40 transition-colors cursor-pointer backdrop-blur-md"
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
              <span>Competitive Precision</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-3">
              <span>Global Hall of Fame</span>
              <Sparkles className="w-6 h-6 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.7)] animate-pulse" />
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-xl leading-relaxed">
              Top 10 High Scorers Across All Games · Click any player row to view public profile
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user && (
              <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-1.5 shadow-sm shadow-emerald-950/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-muted-foreground">Your Rank:</span>
                <span className="font-bold text-emerald-300">{currentUserRankDisplay}</span>
              </div>
            )}
            <div className="text-[11px] font-mono text-muted-foreground/75 bg-neutral-900/80 px-3 py-1.5 rounded-xl border border-border/50 backdrop-blur-md hidden sm:block">
              Click row for profile
            </div>
          </div>
        </header>

        {/* ── Section B: Top 10 High Scorers Table ── */}
        <section aria-label="Hall of Fame Top 10" className="relative z-10 flex flex-col gap-3">
          {/* Desktop Table Header: Rank + Player, Date Recorded, High Score */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/75 border-b border-border/30">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="w-8 sm:w-9 text-center shrink-0">Rank</span>
              <span>Player Info</span>
            </div>
            <div className="w-28 text-center shrink-0">Date Recorded</div>
            <div className="text-right shrink-0 min-w-32.5">Score · Precision</div>
          </div>

          {/* ── Rows List: Top 3 Podium (Visual Flare) + 4-10 (Sleek Flat) ── */}
          <div className="flex flex-col gap-2.5">
            {top10.map((entry, idx) => {
              const rank = idx + 1;
              const isTop1 = rank === 1;
              const isTop2 = rank === 2;
              const isTop3 = rank === 3;
              const isCurrentUser =
                user &&
                ((entry.user_id && user.id && Number(entry.user_id) === Number(user.id)) ||
                  entry.username.toLowerCase() === user.username.toLowerCase());

              // Podium vs Standard Tier styling
              let rowStyles = "bg-neutral-900/60 border-border/40 hover:border-border/80 hover:bg-neutral-850/80";
              let rankBadge = (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary text-foreground font-mono font-bold flex items-center justify-center text-xs shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-2 border border-border/60">
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
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400 text-black font-extrabold flex items-center justify-center text-xs sm:text-sm font-mono shadow-md shadow-amber-400/30 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
                    01
                  </div>
                );
                scoreColor = "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]";
                nameHoverColor = "group-hover:text-amber-300";
              } else if (isTop2) {
                rowStyles = "silver-card bg-linear-to-r from-slate-400/10 via-neutral-900/90 to-slate-900/20 border-slate-300/30 hover:border-slate-300/60";
                rankBadge = (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-200 text-black font-extrabold flex items-center justify-center text-xs sm:text-sm font-mono shadow-sm shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
                    02
                  </div>
                );
                scoreColor = "text-slate-100 drop-shadow-[0_0_10px_rgba(203,213,225,0.4)]";
                nameHoverColor = "group-hover:text-slate-200";
              } else if (isTop3) {
                rowStyles = "bronze-card bg-linear-to-r from-amber-800/15 via-neutral-900/90 to-amber-950/15 border-amber-700/30 hover:border-amber-700/60";
                rankBadge = (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-700 text-white font-extrabold flex items-center justify-center text-xs sm:text-sm font-mono shadow-sm shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
                    03
                  </div>
                );
                scoreColor = "text-amber-500 drop-shadow-[0_0_10px_rgba(217,119,6,0.4)]";
                nameHoverColor = "group-hover:text-amber-400";
              }

              return (
                <motion.div
                  key={entry.id || `${entry.username}-${idx}`}
                  initial={{ opacity: 0, transform: "scale(0.98) translateY(8px)" }}
                  animate={{ opacity: 1, transform: "scale(1) translateY(0px)" }}
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: idx * 0.03 }}
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
                  {/* Subtle Top 1 shimmer sweep */}
                  {isTop1 && !isCurrentUser && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                      <div className="absolute inset-0 w-1/3 bg-linear-to-r from-transparent via-amber-300/10 to-transparent animate-shimmer-pass pointer-events-none" />
                    </div>
                  )}

                  {/* Left Section (Rank + Avatar + User Info) */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-3 relative z-10">
                    {rankBadge}

                    <PlayerAvatar
                      avatarUrl={entry.avatar_url}
                      username={entry.username}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm sm:text-base text-foreground truncate ${nameHoverColor} transition-colors`}>
                          {entry.name || entry.username}
                        </span>
                        {isCurrentUser && (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
                            <span>You</span>
                            <span className="text-emerald-300 font-semibold">(#{rank})</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground truncate">
                        @{entry.username}
                      </p>
                    </div>
                  </div>

                  {/* Center Section (Timestamp) */}
                  <div className="hidden sm:flex items-center justify-center w-28 text-center shrink-0 text-xs text-muted-foreground font-mono relative z-10">
                    <span>{formatTimeAgo(entry.completed_at)}</span>
                  </div>

                  {/* Right Section (Score + Tie-Breaker) */}
                  <div className="text-right shrink-0 min-w-32.5 relative z-10">
                    <div className="flex items-baseline justify-end gap-1 font-mono">
                      <span className={`text-xl font-extrabold ${scoreColor}`}>{entry.total_score}</span>
                      <span className="text-xs text-muted-foreground font-bold">/500</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      ±{(entry.average_error ?? 0).toFixed(1)}% Error · {Math.round((entry.elapsed_ms || 45000) / 1000)}s
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Pinned/Sticky Current User Position (When Logged In & NOT in Top 10) ── */}
          {isAuthenticated && user && !isUserInTop10 && (
            <div className="sticky bottom-4 z-20 mt-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/90 mb-1.5 px-2 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Your Current Standing</span>
              </div>
              <div
                onClick={() => onNavigate("publicProfile", user.id || user.username)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onNavigate("publicProfile", user.id || user.username);
                  }
                }}
                className="group relative flex items-center justify-between px-4 py-3 min-h-16 rounded-xl bg-emerald-950/70 border-2 border-emerald-500/70 hover:border-emerald-400 backdrop-blur-xl shadow-2xl shadow-emerald-950/80 transition-all duration-200 cursor-pointer"
              >
                {/* Left Section (Rank + Avatar + User Info) */}
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/30 text-emerald-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/50 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-2">
                    {currentUserRankDisplay !== "Unranked" ? currentUserRankDisplay : myStats?.rank ? `#${myStats.rank}` : "—"}
                  </div>

                  <PlayerAvatar
                    avatarUrl={user.avatarUrl || user.profilePicture}
                    username={user.username}
                    size="md"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-foreground truncate group-hover:text-emerald-300 transition-colors">
                        {user.name || user.username}
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-mono shrink-0">
                        <span>You</span>
                        <span className="text-emerald-300 font-semibold">({currentUserRankDisplay})</span>
                      </span>
                    </div>
                    <p className="text-xs font-mono text-emerald-400/80 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {/* Center Section */}
                <div className="hidden sm:flex items-center justify-center w-28 text-center shrink-0 text-xs font-mono text-emerald-400/70">
                  <span>{myStats?.gamesPlayed ? `${myStats.gamesPlayed} games` : "Active"}</span>
                </div>

                {/* Right Section */}
                <div className="text-right shrink-0 min-w-32.5">
                  <div className="flex items-baseline justify-end gap-1 font-mono">
                    <span className="text-xl font-extrabold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                      {myStats?.bestScore ?? (userInAllIndex !== -1 ? sortedAllEntries[userInAllIndex].total_score : 0)}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold">/500</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400/70">
                    {myStats?.bestAverageError !== undefined
                      ? `±${myStats.bestAverageError.toFixed(1)}% Error`
                      : userInAllIndex !== -1
                        ? `±${(sortedAllEntries[userInAllIndex].average_error ?? 0).toFixed(1)}% Error`
                        : "Your High Score"}
                  </div>
                </div>
              </div>
            </div>
          )}

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
        </section>

        {/* ── Section C: Bottom Actions ── */}
        <footer className="relative z-10 pt-4 pb-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            <p className="font-medium text-foreground">Ready to prove your spatial judgment?</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Compete on identical silhouettes and test your accuracy against the global benchmark.
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
              <span>Play ScaleGuess Now</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LeaderboardPage;
