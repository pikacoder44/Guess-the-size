import { useState, useEffect } from "react";
import {
  Trophy,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  User,
  Medal,
  Award,
} from "lucide-react";
import { loadStatistics } from "@/storage";
import { getNotColorBlindPersonalBest } from "@/lib/notColorBlindApi";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/scoreApi";

interface ActivitySidebarProps {
  onNavigate: (route: string) => void;
}

// Fallback high-scoring champions if database is unseeded
const SEEDED_CHAMPIONS: LeaderboardEntry[] = [
  {
    id: 1,
    username: "QuantumCalibrator",
    name: "Alex Vance",
    total_score: 494,
    average_error: 1.2,
    elapsed_ms: 14200,
    mode: "daily",
    date: null,
    completed_at: new Date().toISOString(),
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Quantum&backgroundColor=b6e3f4",
  },
  {
    id: 2,
    username: "ChromaMaster",
    name: "Elena Rostova",
    total_score: 488,
    average_error: 2.1,
    elapsed_ms: 16800,
    mode: "daily",
    date: null,
    completed_at: new Date().toISOString(),
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Chroma&backgroundColor=d1d4f9",
  },
  {
    id: 3,
    username: "PixelPerceiver",
    name: "David Kim",
    total_score: 479,
    average_error: 3.4,
    elapsed_ms: 18100,
    mode: "practice",
    date: null,
    completed_at: new Date().toISOString(),
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Pixel&backgroundColor=c0aede",
  },
];

export function ActivitySidebar({ onNavigate }: ActivitySidebarProps) {
  // 1. Personal Performance Metrics
  const [metrics, setMetrics] = useState({
    totalGames: 0,
    scaleGuessBest: 0,
    notColorBlindBest: 0,
  });

  // 2. Champions / Leaderboard Feed
  const [champions, setChampions] = useState<LeaderboardEntry[]>(SEEDED_CHAMPIONS);

  // 3. Daily Reset Countdown Timer
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00:00");

  useEffect(() => {
    function calculateTimeRemaining() {
      const now = new Date();
      const nextUtcMidnight = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
      );
      const diffMs = Math.max(0, nextUtcMidnight.getTime() - now.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => String(n).padStart(2, "0");
      setTimeRemaining(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    }

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function loadUserData() {
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
        // storage fallback
      }

      const total = (stats.gamesPlayed || 0) + ncbGamesCount;
      setMetrics({
        totalGames: total,
        scaleGuessBest: stats.bestScore || 0,
        notColorBlindBest: ncbBest,
      });
    }

    loadUserData();
    window.addEventListener("storage", loadUserData);
    return () => window.removeEventListener("storage", loadUserData);
  }, []);

  useEffect(() => {
    let ignore = false;
    getLeaderboard()
      .then((res) => {
        if (ignore) return;
        if (res?.leaderboard && res.leaderboard.length > 0) {
          // Merge or take top entries
          const topList = res.leaderboard.slice(0, 4);
          if (topList.length >= 3) {
            setChampions(topList);
          } else {
            // Combine with seeded to ensure full, aesthetic feed
            const merged = [...topList, ...SEEDED_CHAMPIONS.slice(topList.length)];
            setChampions(merged.slice(0, 3));
          }
        }
      })
      .catch(() => {
        // Maintain seeded champions gracefully
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Compute skill badge
  const highestScore = Math.max(metrics.scaleGuessBest, metrics.notColorBlindBest);
  const playerTier =
    highestScore >= 450
      ? { title: "Grandmaster", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" }
      : highestScore >= 350
      ? { title: "Adept", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" }
      : highestScore > 0
      ? { title: "Calibrator", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" }
      : { title: "Novice", color: "text-neutral-400 bg-neutral-800/60 border-neutral-700/60" };

  return (
    <aside className="w-full flex flex-col gap-5">
      {/* ── 1. Daily Challenge Quick Launcher Card (Steam style) ── */}
      <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800/80 p-5 shadow-xl relative overflow-hidden backdrop-blur-xl group">
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-200">
              Daily Challenge
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-semibold">
            <Flame className="w-3 h-3 fill-current" />
            TODAY
          </span>
        </div>

        <div className="mt-3.5">
          <div className="text-sm font-bold text-neutral-100 font-sans">
            5 Calibrated Spatial Rounds
          </div>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            Synchronized seed for all global players. Evaluated on real-world metric scales.
          </p>
        </div>

        {/* Live Reset Countdown */}
        <div className="mt-4 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Resets in</span>
          </div>
          <span className="font-bold text-neutral-200 text-xs">
            {timeRemaining}
          </span>
        </div>

        {/* Quick Launch CTA */}
        <button
          type="button"
          onClick={() => onNavigate("/games/scale-guess")}
          className="mt-4 w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-neutral-950 font-bold text-xs tracking-tight shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>LAUNCH TODAY'S DAILY</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── 2. Personal Performance Compact Widget ── */}
      <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800/80 p-5 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-200">
              Personal Performance
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase tracking-wider ${playerTier.color}`}
          >
            {playerTier.title}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Total Runs
            </div>
            <div className="mt-1 text-base font-extrabold font-mono text-neutral-100">
              {metrics.totalGames}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Scale Best
            </div>
            <div className="mt-1 text-base font-extrabold font-mono text-amber-400">
              {metrics.scaleGuessBest > 0 ? metrics.scaleGuessBest : "—"}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Color Best
            </div>
            <div className="mt-1 text-base font-extrabold font-mono text-violet-400">
              {metrics.notColorBlindBest > 0 ? metrics.notColorBlindBest : "—"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("/profile")}
          className="mt-3.5 w-full py-2 px-3 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-700/60 text-xs font-mono text-neutral-300 hover:text-neutral-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <User className="w-3.5 h-3.5 text-neutral-400" />
          <span>View Profile & Match History</span>
        </button>
      </div>

      {/* ── 3. Recent Champions / Leaderboard Feed ── */}
      <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800/80 p-5 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-200">
              Recent Champions
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("/games/scale-guess/leaderboard")}
            className="text-[11px] font-mono text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            All Ranks
          </button>
        </div>

        <div className="mt-3.5 divide-y divide-neutral-800/60">
          {champions.map((entry, index) => {
            const rank = index + 1;
            const isTop1 = rank === 1;
            const isTop2 = rank === 2;
            const isTop3 = rank === 3;

            return (
              <div
                key={`${entry.username}-${rank}`}
                className="py-2.5 flex items-center justify-between gap-3 group/row hover:bg-neutral-850/40 px-1 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rank Badge */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                      isTop1
                        ? "bg-amber-400 text-neutral-950 shadow-sm"
                        : isTop2
                        ? "bg-neutral-300 text-neutral-950"
                        : isTop3
                        ? "bg-amber-700 text-white"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {isTop1 ? <Medal className="w-3 h-3" /> : rank}
                  </div>

                  {/* Player Avatar */}
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.username}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-neutral-300">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Player Name */}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-neutral-200 truncate group-hover/row:text-white transition-colors">
                      {entry.name || `@${entry.username}`}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 truncate">
                      {entry.mode === "daily" ? "Daily Challenge" : "Standard Arcade"}
                    </div>
                  </div>
                </div>

                {/* Score & Error */}
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-amber-400">
                    {entry.total_score} pts
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400">
                    {entry.average_error ? `${entry.average_error.toFixed(1)}% err` : "Top tier"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onNavigate("/games/scale-guess/leaderboard")}
          className="mt-3 w-full py-2 px-3 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>View Global Hall of Fame</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
}

export default ActivitySidebar;
