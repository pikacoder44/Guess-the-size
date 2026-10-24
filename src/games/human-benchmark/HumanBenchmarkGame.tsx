import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import {
  Zap,
  Play,
  RotateCw,
  Trophy,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Gauge,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import {
  type GamePhase,
  type TargetColor,
  type RoundResult,
  TARGET_COLORS,
  getReflexRating,
} from "./types";
import {
  submitHumanBenchmarkScore,
  getHumanBenchmarkPersonalBest,
} from "@/lib/humanBenchmarkApi";
import { useAuth } from "@/context/AuthContext";

export interface HumanBenchmarkGameProps {
  onViewLeaderboard: () => void;
  onOpenLogin?: () => void;
}

interface PendingBenchmarkMatch {
  averageMs: number;
  rounds: number[];
}

export function HumanBenchmarkGame({
  onViewLeaderboard,
}: HumanBenchmarkGameProps) {
  const { user, token, isAuthenticated, openLogin } = useAuth();

  const [phase, setPhase] = useState<GamePhase>("IDLE");
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [targetColor, setTargetColor] = useState<TargetColor>(TARGET_COLORS[0]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [latestRoundResult, setLatestRoundResult] = useState<RoundResult | null>(null);

  // High-resolution timer refs to prevent React state latency
  const readyStartTimeRef = useRef<number>(0);
  const anticipationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Final match submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isScoreSaved, setIsScoreSaved] = useState<boolean>(false);
  const [isPersonalBest, setIsPersonalBest] = useState<boolean>(false);
  const [personalBest, setPersonalBest] = useState<number>(() => getHumanBenchmarkPersonalBest());
  const [pendingMatchData, setPendingMatchData] = useState<PendingBenchmarkMatch | null>(null);

  // Cleanup pending timer on unmount
  useEffect(() => {
    return () => {
      if (anticipationTimerRef.current) {
        clearTimeout(anticipationTimerRef.current);
      }
    };
  }, []);

  /**
   * Start a specific round (1 to 5).
   * Picks a random target color and sets a 2.0s - 5.0s random delay before flashing.
   */
  const startRound = useCallback((roundNum: number) => {
    if (anticipationTimerRef.current) {
      clearTimeout(anticipationTimerRef.current);
    }

    // Pick a random target color
    const nextColor = TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)];
    setTargetColor(nextColor);
    setCurrentRound(roundNum);
    setPhase("WAITING");

    // Random delay between 2000ms and 5000ms
    const randomDelay = Math.floor(2000 + Math.random() * 3000);

    anticipationTimerRef.current = setTimeout(() => {
      readyStartTimeRef.current = performance.now();
      setPhase("READY");
    }, randomDelay);
  }, []);

  /**
   * Start the complete 5-round match from Round 1.
   */
  const handleStartGame = () => {
    setRoundResults([]);
    setLatestRoundResult(null);
    setIsPersonalBest(false);
    setIsScoreSaved(false);
    setPendingMatchData(null);
    startRound(1);
  };

  /**
   * Handle user action (mouse down / touch start / key press).
   * Minimum input latency via direct pointer events.
   */
  const handleInputTrigger = useCallback(() => {
    if (phase === "WAITING") {
      // False start! Clicked before the trigger flash
      if (anticipationTimerRef.current) {
        clearTimeout(anticipationTimerRef.current);
      }
      setPhase("FALSE_START");
      return;
    }

    if (phase === "READY") {
      // Calculate reaction latency with high-resolution performance.now()
      const now = performance.now();
      const reactionMs = Math.max(1, Math.round(now - readyStartTimeRef.current));
      const ratingInfo = getReflexRating(reactionMs);

      const result: RoundResult = {
        roundNumber: currentRound,
        targetColor,
        reactionMs,
        rating: ratingInfo.rating,
        ratingEmoji: ratingInfo.emoji,
        ratingColor: ratingInfo.color,
        timestamp: Date.now(),
      };

      const updatedResults = [...roundResults, result];
      setRoundResults(updatedResults);
      setLatestRoundResult(result);

      if (currentRound >= 5) {
        // Match completed! Calculate average
        const averageMs = Math.round(
          updatedResults.reduce((acc, r) => acc + r.reactionMs, 0) / updatedResults.length
        );
        const roundsList = updatedResults.map((r) => r.reactionMs);

        setPhase("MATCH_SUMMARY");

        // If user is unauthenticated / guest, skip calling POST score API and cache pending match
        if (!isAuthenticated || !token || !user) {
          setPendingMatchData({ averageMs, rounds: roundsList });
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(true);
        submitHumanBenchmarkScore(
          {
            userId: user?.id ? String(user.id) : null,
            playerName: user?.name || user?.username || "Player",
            averageReactionMs: averageMs,
            rounds: roundsList,
          },
          token
        )
          .then((res) => {
            setIsScoreSaved(true);
            setPendingMatchData(null);
            if (res.isPersonalBest) {
              setIsPersonalBest(true);
              setPersonalBest(averageMs);
            }
          })
          .catch((err) => {
            console.warn("Failed to submit score:", err);
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      } else {
        setPhase("ROUND_RESULT");
      }
    }
  }, [phase, currentRound, targetColor, roundResults, user, token, isAuthenticated]);

  // Auto-submit pending completed match if user signs in while on MATCH_SUMMARY
  useEffect(() => {
    if (isAuthenticated && token && user && pendingMatchData && phase === "MATCH_SUMMARY") {
      setIsSubmitting(true);
      submitHumanBenchmarkScore(
        {
          userId: user?.id ? String(user.id) : null,
          playerName: user?.name || user?.username || "Player",
          averageReactionMs: pendingMatchData.averageMs,
          rounds: pendingMatchData.rounds,
        },
        token
      )
        .then((res) => {
          setIsScoreSaved(true);
          setPendingMatchData(null);
          if (res.isPersonalBest) {
            setIsPersonalBest(true);
            setPersonalBest(pendingMatchData.averageMs);
          }
        })
        .catch((err) => {
          console.warn("Failed to auto-submit score upon login:", err);
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  }, [isAuthenticated, token, user, pendingMatchData, phase]);

  /**
   * Global keyboard Spacebar handler for low-latency testing.
   */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === "Space") {
        if (phase === "WAITING" || phase === "READY") {
          e.preventDefault();
          handleInputTrigger();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, handleInputTrigger]);

  // Derived metrics for match summary
  const averageReactionMs =
    roundResults.length > 0
      ? Math.round(roundResults.reduce((acc, r) => acc + r.reactionMs, 0) / roundResults.length)
      : 0;

  const fastestRoundMs =
    roundResults.length > 0
      ? Math.min(...roundResults.map((r) => r.reactionMs))
      : 0;

  const finalRating = getReflexRating(averageReactionMs);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* ── Active Game Surface ── */}
      <div className="w-full relative min-h-[440px] sm:min-h-[500px] rounded-3xl overflow-hidden border border-neutral-800/80 bg-neutral-950/60 shadow-2xl backdrop-blur-xl flex flex-col justify-between select-none">
        {/* ── Stage 1: IDLE (Pre-Game Modal) ── */}
        {phase === "IDLE" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 p-6 sm:p-12 flex flex-col items-center justify-center text-center relative z-10"
          >
            {/* Ambient Background Glow */}
            <div
              className="absolute w-80 h-80 rounded-full blur-3xl opacity-25 bg-emerald-500 pointer-events-none"
              aria-hidden="true"
            />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              <Zap className="w-8 h-8 fill-current drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-medium mb-3">
              <Gauge className="w-3.5 h-3.5" />
              <span>5-Round Reflex Calibration</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-sans drop-shadow-md">
              Human Benchmark
            </h1>

            <p className="mt-4 text-sm sm:text-base text-neutral-300 max-w-lg leading-relaxed font-sans">
              Test your visual reflexes across 5 rounds. Click as fast as you can when the target color appears.
            </p>

            {personalBest > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900/80 border border-neutral-700/80 text-xs font-mono text-neutral-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Best Average:</span>
                <span className="font-bold text-amber-300">{personalBest}ms</span>
              </div>
            )}

            <div className="mt-8 flex items-center gap-4 flex-wrap justify-center">
              <button
                type="button"
                id="play-human-benchmark-btn"
                onClick={handleStartGame}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-sm tracking-tight shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-100 will-change-transform transform-gpu cursor-pointer group"
              >
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                <span>Play Now</span>
              </button>

              <button
                type="button"
                onClick={onViewLeaderboard}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-700/80 hover:border-neutral-600 text-neutral-200 hover:text-white font-semibold text-sm tracking-tight active:scale-95 transition-all duration-100 will-change-transform transform-gpu cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Leaderboard</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Stage 2: WAITING (Anticipation Phase) ── */}
        {phase === "WAITING" && (
          <div
            onMouseDown={handleInputTrigger}
            onTouchStart={handleInputTrigger}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-neutral-950 hover:bg-neutral-900/80 transition-colors relative overflow-hidden select-none"
          >
            {/* Subtle radar breathing rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-72 h-72 rounded-full border border-neutral-700 animate-ping" />
              <div className="w-96 h-96 rounded-full border border-neutral-800" />
            </div>

            {/* Header info bar */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-xs font-mono text-neutral-500">
              <span>ROUND {currentRound} / 5</span>
              <span className="text-neutral-400">WAIT FOR FLASH</span>
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mb-5">
                <span className="w-4 h-4 rounded-full bg-neutral-700 animate-pulse" />
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Wait for <span style={{ color: targetColor.hex }}>{targetColor.name}</span>...
              </h2>

              <p className="mt-3 text-xs sm:text-sm font-mono text-neutral-400">
                Click or press Space the instant the screen flashes!
              </p>
            </div>

            <div className="absolute bottom-6 text-[11px] font-mono text-neutral-600">
              CLICK TOO EARLY = FALSE START
            </div>
          </div>
        )}

        {/* ── Stage 3: READY (Reaction Trigger Phase) ── */}
        {phase === "READY" && (
          <div
            onMouseDown={handleInputTrigger}
            onTouchStart={handleInputTrigger}
            style={{ backgroundColor: targetColor.hex }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-none select-none relative overflow-hidden animate-pulse"
          >
            <div className="relative z-10 flex flex-col items-center">
              <Zap className="w-16 h-16 sm:w-20 sm:h-20 fill-current mb-3 animate-bounce" style={{ color: targetColor.textColor }} />
              <h1
                className="text-4xl sm:text-7xl font-black tracking-tighter uppercase font-sans drop-shadow-lg"
                style={{ color: targetColor.textColor }}
              >
                CLICK NOW!
              </h1>
              <p
                className="mt-2 text-sm sm:text-base font-mono font-bold uppercase tracking-wider"
                style={{ color: targetColor.textColor, opacity: 0.85 }}
              >
                Round {currentRound} of 5
              </p>
            </div>
          </div>
        )}

        {/* ── Stage 3B: FALSE_START (Clicked Too Early) ── */}
        {phase === "FALSE_START" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-rose-950/40 relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-[0_0_25px_rgba(244,63,94,0.25)]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-400/10 text-rose-300 border border-rose-400/30 text-xs font-mono font-medium mb-3">
              <span>False Start Triggered</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Too early! Wait for the color change.
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-neutral-300 max-w-md font-sans">
              You clicked before the target color flashed. Wait for the screen to turn {targetColor.name} before reacting.
            </p>

            <button
              type="button"
              onClick={() => startRound(currentRound)}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-sm tracking-tight shadow-xl active:scale-95 transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Try Round Again</span>
            </button>
          </motion.div>
        )}

        {/* ── Stage 4: ROUND_RESULT (Round Breakdown) ── */}
        {phase === "ROUND_RESULT" && latestRoundResult && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center relative z-10"
          >
            {/* Header progress */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-xs font-mono text-neutral-500">
              <span>ROUND {latestRoundResult.roundNumber} / 5 COMPLETED</span>
              <span className="text-emerald-400">VALID ATTEMPT</span>
            </div>

            {/* Micro latency icon */}
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
              <Gauge className="w-7 h-7" />
            </div>

            {/* Reaction time display */}
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
                {latestRoundResult.reactionMs}
              </span>
              <span className="text-xl sm:text-2xl font-mono text-neutral-400 font-bold">ms</span>
            </div>

            {/* Feedback Rating */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-lg">{latestRoundResult.ratingEmoji}</span>
              <span className={`text-base font-bold font-sans ${latestRoundResult.ratingColor}`}>
                {latestRoundResult.rating}
              </span>
            </div>

            <p className="mt-1 text-xs text-neutral-400 max-w-sm">
              Color: <span style={{ color: latestRoundResult.targetColor.hex }}>{latestRoundResult.targetColor.name}</span>
            </p>

            <button
              type="button"
              onClick={() => startRound(currentRound + 1)}
              className="mt-8 inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-sm tracking-tight shadow-xl active:scale-95 transition-all cursor-pointer group"
            >
              <span>Next Round ({currentRound + 1}/5)</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {/* ── Stage 5: MATCH_SUMMARY (Final 5-Round Score & Breakdown) ── */}
        {phase === "MATCH_SUMMARY" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 p-6 sm:p-10 flex flex-col justify-between relative z-10"
          >
            <div>
              {/* Header Title & Badges */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 pb-4 border-b border-neutral-800/80">
                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 text-xs font-mono font-medium mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>5-Round Assessment Complete</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Benchmark Results
                  </h2>
                </div>

                {isPersonalBest && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/40 text-xs font-mono text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>NEW PERSONAL BEST!</span>
                  </div>
                )}
              </div>

              {/* Main Latency Highlight Box */}
              <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Average Latency (Main Score) */}
                <div className="sm:col-span-2 p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
                  <div className="text-xs font-mono uppercase text-neutral-400">
                    5-Round Average Reaction Latency
                  </div>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-6xl font-black font-mono text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      {averageReactionMs}
                    </span>
                    <span className="text-xl font-mono text-neutral-400 font-bold">ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{finalRating.emoji}</span>
                    <span className={`text-sm font-bold ${finalRating.color}`}>
                      {finalRating.rating}
                    </span>
                    <span className="text-xs text-neutral-500">•</span>
                    <span className="text-xs text-neutral-400">{finalRating.description}</span>
                  </div>
                </div>

                {/* Fastest Single Round */}
                <div className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between">
                  <div className="text-xs font-mono uppercase text-neutral-400">
                    Fastest Single Round
                  </div>
                  <div className="my-2 flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400">
                      {fastestRoundMs}
                    </span>
                    <span className="text-sm font-mono text-neutral-400 font-bold">ms</span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    Peak Neural Reflex
                  </div>
                </div>
              </div>

              {/* Unauthenticated / Guest Leaderboard Guard Banner */}
              {!isAuthenticated && !isScoreSaved && (
                <div className="my-5 relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 text-center sm:text-left">
                    <div className="p-2.5 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 shrink-0">
                      <Trophy className="w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Sign in to save your score and join the global leaderboard.
                      </p>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5">
                        Your {averageReactionMs}ms benchmark will be submitted automatically once signed in.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openLogin}
                    className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-lg shadow-amber-400/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Submit</span>
                  </button>
                </div>
              )}

              {/* 5-Round Breakdown Table / Bar Chart */}
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3 flex items-center justify-between">
                  <span>Round By Round Breakdown</span>
                  <span>Latency</span>
                </div>

                <div className="flex flex-col gap-2">
                  {roundResults.map((r) => {
                    const isBest = r.reactionMs === fastestRoundMs;
                    // Max scale relative to 400ms for visual bar comparison
                    const barWidth = Math.min(100, Math.max(15, (r.reactionMs / 400) * 100));

                    return (
                      <div
                        key={r.roundNumber}
                        className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/40"
                      >
                        <div className="flex items-center gap-3 w-32 shrink-0">
                          <span className="text-neutral-500 font-bold">#{r.roundNumber}</span>
                          <span className="flex items-center gap-1.5 text-neutral-300 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: r.targetColor.hex }}
                            />
                            {r.targetColor.name}
                          </span>
                        </div>

                        {/* Visual Bar representation */}
                        <div className="flex-1 mx-4 hidden sm:block">
                          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isBest ? "bg-amber-400" : "bg-emerald-500"
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isBest && (
                            <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                              Best
                            </span>
                          )}
                          <span className="font-bold text-neutral-200">{r.reactionMs}ms</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-mono text-neutral-500">
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" /> Recording score to Global Hall of Fame...
                  </span>
                ) : isScoreSaved ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified &amp; recorded to Synapse platform.
                  </span>
                ) : !isAuthenticated ? (
                  <span className="text-amber-400/90 font-medium">
                    Guest attempt · Sign in above to save rank to global leaderboard.
                  </span>
                ) : (
                  <span>Verified &amp; recorded to Synapse platform.</span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-700/80 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>

                <button
                  type="button"
                  onClick={onViewLeaderboard}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs tracking-tight shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>View Leaderboard</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default HumanBenchmarkGame;
