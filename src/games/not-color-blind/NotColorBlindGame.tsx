import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Check, RotateCcw, Sparkles, ArrowRight, Trophy, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { ColorHSB, GamePhase, ScoreBreakdown, NotColorBlindRoundRecord } from "./types";
import {
  randomTargetHsb,
  randomPredictionHsb,
  hsbToCss,
  hsbToHex,
  calculateColorScore,
  isLightColor,
} from "./color";
import { VerticalSlider } from "./VerticalSlider";
import { useAuth } from "@/context/AuthContext";
import {
  submitNotColorBlindScore,
  type NotColorBlindScoreRecord,
} from "@/lib/notColorBlindApi";

const TOTAL_ROUNDS = 5;
const MEMORIZE_DURATION_MS = 5000; // 5.00 seconds precision countdown
const RECALL_DURATION_SECONDS = 60;

export interface ScoreSubmissionState {
  isSubmitting: boolean;
  isSubmitted: boolean;
  isPersonalBest: boolean;
  isOffline: boolean;
  error: string | null;
}

interface NotColorBlindGameProps {
  onPhaseChange?: (phase: GamePhase) => void;
  onScoreSubmitted?: (record: NotColorBlindScoreRecord, isPersonalBest: boolean) => void;
  onOpenLeaderboard?: () => void;
  onBackToHome?: () => void;
}

export function NotColorBlindGame({
  onPhaseChange,
  onScoreSubmitted,
  onOpenLeaderboard,
  onBackToHome,
}: NotColorBlindGameProps) {
  // Auth context for identity and token
  const { user, token } = useAuth();

  // Multi-Round Match State
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [rounds, setRounds] = useState<NotColorBlindRoundRecord[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);

  // Active round state
  const [phase, setPhase] = useState<GamePhase>("IDLE");
  const [targetColor, setTargetColor] = useState<ColorHSB | null>(null);
  const activeTargetColorRef = useRef<ColorHSB | null>(null);
  const [prediction, setPrediction] = useState<ColorHSB>(() => randomPredictionHsb());
  const [memorizeRemainingMs, setMemorizeRemainingMs] = useState(MEMORIZE_DURATION_MS);
  const [recallSeconds, setRecallSeconds] = useState(RECALL_DURATION_SECONDS);
  const [roundResult, setRoundResult] = useState<ScoreBreakdown | null>(null);

  // Time tracking
  const recallStartTimeRef = useRef<number>(0);
  const [timeTakenSeconds, setTimeTakenSeconds] = useState<number>(0);

  // Submission state for final match
  const [submissionState, setSubmissionState] = useState<ScoreSubmissionState>({
    isSubmitting: false,
    isSubmitted: false,
    isPersonalBest: false,
    isOffline: false,
    error: null,
  });

  // Notify parent of phase change
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Start Game: Closes instruction modal, generates first target, begins Phase 1 (MEMORIZE)
  const handleStartGame = useCallback(() => {
    const firstTarget = Object.freeze(randomTargetHsb());
    activeTargetColorRef.current = firstTarget;
    setTargetColor(firstTarget);
    setPrediction(randomPredictionHsb());
    setMemorizeRemainingMs(MEMORIZE_DURATION_MS);
    setRecallSeconds(RECALL_DURATION_SECONDS);
    setRoundResult(null);
    setTimeTakenSeconds(0);
    setPhase("MEMORIZE");
  }, []);

  // Transition to RECALL phase
  const startRecallPhase = useCallback(() => {
    setPrediction(randomPredictionHsb());
    setRecallSeconds(RECALL_DURATION_SECONDS);
    recallStartTimeRef.current = performance.now();
    setPhase("RECALL");
  }, []);

  // Memorization Stage 5.00-to-0.00 Precision Countdown
  useEffect(() => {
    if (phase !== "MEMORIZE" || !targetColor) return;

    let animId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const remaining = Math.max(0, MEMORIZE_DURATION_MS - elapsed);
      setMemorizeRemainingMs(remaining);

      if (remaining <= 0) {
        startRecallPhase();
      } else {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [phase, targetColor, startRecallPhase]);

  // Submit final cumulative match score to API
  const submitFinalMatchScore = useCallback(
    async (completedRounds: NotColorBlindRoundRecord[], matchScore: number) => {
      if (completedRounds.length === 0) return;

      setSubmissionState({
        isSubmitting: true,
        isSubmitted: false,
        isPersonalBest: false,
        isOffline: false,
        error: null,
      });

      const totalTime = completedRounds.reduce((acc, r) => acc + r.timeTakenSeconds, 0);
      const avgRecallTime = Number((totalTime / completedRounds.length).toFixed(2));
      const lastRound = completedRounds[completedRounds.length - 1];

      try {
        const playerName = user?.name || user?.username || "Anonymous";
        const userId = user?.id ? String(user.id) : null;

        const res = await submitNotColorBlindScore(
          {
            userId,
            playerName,
            score: matchScore,
            targetHsb: lastRound.targetHsb,
            predictedHsb: lastRound.predictedHsb,
            timeTakenSeconds: avgRecallTime,
          },
          token
        );

        setSubmissionState({
          isSubmitting: false,
          isSubmitted: true,
          isPersonalBest: Boolean(res.isPersonalBest),
          isOffline: Boolean(res.offlineFallback),
          error: null,
        });

        onScoreSubmitted?.(res.scoreRecord, Boolean(res.isPersonalBest));
      } catch (err: unknown) {
        setSubmissionState({
          isSubmitting: false,
          isSubmitted: false,
          isPersonalBest: false,
          isOffline: false,
          error: err instanceof Error ? err.message : "Failed to record match score",
        });
      }
    },
    [user, token, onScoreSubmitted]
  );

  // Lock in guess and transition to ROUND_RESULT phase
  const handleLockIn = useCallback(() => {
    const activeTarget = activeTargetColorRef.current ?? targetColor;
    if (phase !== "RECALL" || !activeTarget) return;

    // Calculate final timeTakenSeconds used during the recall phase
    const elapsedSec =
      recallStartTimeRef.current > 0
        ? (performance.now() - recallStartTimeRef.current) / 1000
        : Math.max(0.1, RECALL_DURATION_SECONDS - recallSeconds);
    const finalTime = Math.max(0.1, Number(elapsedSec.toFixed(2)));
    setTimeTakenSeconds(finalTime);

    const scoreBreakdown = calculateColorScore(activeTarget, prediction);
    setRoundResult(scoreBreakdown);

    const newRoundRecord: NotColorBlindRoundRecord = {
      round: currentRound,
      targetHsb: activeTarget,
      predictedHsb: prediction,
      score: scoreBreakdown.score,
      scoreBreakdown,
      timeTakenSeconds: finalTime,
    };

    const nextRounds = [...rounds, newRoundRecord];
    const nextScores = [...roundScores, scoreBreakdown.score];
    const nextTotal = totalScore + scoreBreakdown.score;

    setRounds(nextRounds);
    setRoundScores(nextScores);
    setTotalScore(nextTotal);

    setPhase("ROUND_RESULT");
  }, [
    phase,
    recallSeconds,
    targetColor,
    prediction,
    currentRound,
    rounds,
    roundScores,
    totalScore,
  ]);

  // Advance to next round (Rounds 1 -> 4)
  const handleNextRound = useCallback(() => {
    if (currentRound >= TOTAL_ROUNDS) return;

    const nextTarget = Object.freeze(randomTargetHsb());
    activeTargetColorRef.current = nextTarget;
    setCurrentRound((prev) => prev + 1);
    setTargetColor(nextTarget);
    setPrediction(randomPredictionHsb());
    setMemorizeRemainingMs(MEMORIZE_DURATION_MS);
    setRecallSeconds(RECALL_DURATION_SECONDS);
    setRoundResult(null);
    setTimeTakenSeconds(0);
    setPhase("MEMORIZE");
  }, [currentRound]);

  // Transition from Round 5 result to MATCH_SUMMARY & auto-submit
  const handleViewFinalResults = useCallback(() => {
    setPhase("MATCH_SUMMARY");
    submitFinalMatchScore(rounds, totalScore);
  }, [rounds, totalScore, submitFinalMatchScore]);

  // Reset to a brand new 5-round game match
  const handlePlayAgain = useCallback(() => {
    setCurrentRound(1);
    setRoundScores([]);
    setRounds([]);
    setTotalScore(0);
    const newTarget = Object.freeze(randomTargetHsb());
    activeTargetColorRef.current = newTarget;
    setTargetColor(newTarget);
    setPrediction(randomPredictionHsb());
    setMemorizeRemainingMs(MEMORIZE_DURATION_MS);
    setRecallSeconds(RECALL_DURATION_SECONDS);
    setRoundResult(null);
    setTimeTakenSeconds(0);
    setSubmissionState({
      isSubmitting: false,
      isSubmitted: false,
      isPersonalBest: false,
      isOffline: false,
      error: null,
    });
    setPhase("MEMORIZE");
  }, []);

  const handleLockInRef = useRef(handleLockIn);
  useEffect(() => {
    handleLockInRef.current = handleLockIn;
  });

  // 1-Minute Recall Timer (auto-locks in when expired)
  useEffect(() => {
    if (phase !== "RECALL") return;

    const timer = setInterval(() => {
      setRecallSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLockInRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Keyboard shortcuts (Enter to Start / Lock In / Advance / Play Again, Escape to Back)
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter" && !e.repeat) {
        if (phase === "IDLE") {
          e.preventDefault();
          handleStartGame();
        } else if (phase === "RECALL") {
          e.preventDefault();
          handleLockIn();
        } else if (phase === "ROUND_RESULT" || phase === "RESULT") {
          e.preventDefault();
          if (currentRound < TOTAL_ROUNDS) {
            handleNextRound();
          } else {
            handleViewFinalResults();
          }
        } else if (phase === "MATCH_SUMMARY") {
          e.preventDefault();
          handlePlayAgain();
        }
      } else if (e.key === "Escape" && phase === "IDLE" && onBackToHome) {
        e.preventDefault();
        onBackToHome();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    phase,
    currentRound,
    handleStartGame,
    handleLockIn,
    handleNextRound,
    handleViewFinalResults,
    handlePlayAgain,
    onBackToHome,
  ]);

  // Dynamic gradients for the 3 sliders
  const hueGradient =
    "linear-gradient(to top, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)";
  const satGradient = `linear-gradient(to top, ${hsbToCss({
    h: prediction.h,
    s: 0,
    b: prediction.b,
  })}, ${hsbToCss({ h: prediction.h, s: 100, b: prediction.b })})`;
  const briGradient = `linear-gradient(to top, #000000, ${hsbToCss({
    h: prediction.h,
    s: prediction.s,
    b: 100,
  })})`;

  // Adaptive contrast text styling
  const upperIsLight = isLightColor(prediction);
  const lowerIsLight = targetColor ? isLightColor(targetColor) : false;
  const targetIsLight = targetColor ? isLightColor(targetColor) : false;

  // Precision 5.00s countdown format (seconds + 2-digit milliseconds)
  const totalHundredths = Math.max(0, Math.floor(memorizeRemainingMs / 10));
  const sec = Math.floor(totalHundredths / 100);
  const msStr = (totalHundredths % 100).toString().padStart(2, "0");

  // Cumulative metrics calculation
  const averageRecallTime = useMemo(() => {
    if (rounds.length === 0) return 0;
    const total = rounds.reduce((acc, r) => acc + r.timeTakenSeconds, 0);
    return Number((total / rounds.length).toFixed(2));
  }, [rounds]);

  const averageRoundAccuracy = useMemo(() => {
    if (rounds.length === 0) return 0;
    return Number((totalScore / rounds.length).toFixed(1));
  }, [rounds, totalScore]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* ─────────────────────────────────────────────────────────────
          TOP HUD: Subtle Round Indicator Pill & Match Status
      ───────────────────────────────────────────────────────────── */}
      {(phase === "MEMORIZE" || phase === "RECALL" || phase === "ROUND_RESULT" || phase === "RESULT") && (
        <div className="w-full max-w-xl flex items-center justify-between px-2 mb-3 select-none">
          {/* Round Indicator Pill + Visual Progress Pips */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider bg-secondary/80 border border-border/80 text-foreground shadow-xs">
              <span className="text-primary font-black">ROUND {currentRound}</span>
              <span className="text-muted-foreground/60">/</span>
              <span className="text-muted-foreground">{TOTAL_ROUNDS}</span>
            </div>

            {/* 5-Pip Round Progress Indicator */}
            <div className="flex items-center gap-1.5" aria-label="Match round progress">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, idx) => {
                const roundNum = idx + 1;
                const isPast = roundNum < currentRound;
                const isCurrent = roundNum === currentRound;
                return (
                  <div
                    key={roundNum}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isPast
                        ? "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-100"
                        : isCurrent
                        ? "bg-primary ring-2 ring-primary/40 ring-offset-1 ring-offset-background scale-110"
                        : "bg-secondary border border-border/70"
                    }`}
                    title={`Round ${roundNum}`}
                  />
                );
              })}
            </div>

            {/* Running Total Match Score (Shown after round 1) */}
            {roundScores.length > 0 && phase !== "ROUND_RESULT" && phase !== "RESULT" && (
              <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-primary/10 text-primary border border-primary/20">
                <span className="text-muted-foreground text-[10px] uppercase font-semibold">Score:</span>
                <span className="font-extrabold">{totalScore}</span>
              </div>
            )}
          </div>

          {/* Right Section: Urgent Countdown in Recall Phase */}
          {phase === "RECALL" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 font-semibold hidden xs:inline">
                Time:
              </span>
              <div
                className={`font-mono text-2xl sm:text-3xl font-black tabular-nums tracking-tight leading-none transition-all duration-200 ${
                  recallSeconds <= 5
                    ? "text-rose-500 animate-[pulse_0.6s_ease-in-out_infinite] scale-105"
                    : recallSeconds <= 15
                    ? "text-amber-400 animate-pulse"
                    : "text-foreground"
                }`}
              >
                <span className="opacity-35 text-base sm:text-lg font-semibold mr-0.5">00:</span>
                {recallSeconds.toString().padStart(2, "0")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PRE-GAME IDLE STATE (Placeholder Canvas)
      ───────────────────────────────────────────────────────────── */}
      {phase === "IDLE" && (
        <div className="w-full max-w-xl flex flex-col items-center gap-6 py-2 select-none">
          <div className="w-full h-80 sm:h-96 rounded-3xl border border-neutral-800/30 bg-neutral-900/10 backdrop-blur-xs flex flex-col items-center justify-center p-6 sm:p-8" />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PRE-GAME INSTRUCTION MODAL (Ultra-Minimalist)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "IDLE" && (
          <motion.div
            key="not-color-blind-instruction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="not-color-blind-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-sm rounded-2xl bg-neutral-900/90 border border-white/5 p-8 md:p-10 text-center shadow-2xl"
            >
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  aria-label="Back to Games"
                  className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <h2
                id="not-color-blind-modal-title"
                className="text-2xl font-bold tracking-tight text-neutral-100 mb-3"
              >
                Not Color Blind
              </h2>

              <p className="text-sm text-neutral-400 leading-relaxed mb-8">
                Memorize the color in 5 seconds, then recreate it using the Hue, Saturation, and Brightness sliders.
              </p>

              <button
                type="button"
                onClick={handleStartGame}
                autoFocus
                className="w-full py-3.5 rounded-xl font-medium bg-neutral-100 hover:bg-white text-neutral-950 transition-all text-sm tracking-wide active:scale-[0.98] cursor-pointer"
              >
                Play Now
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          PHASE 1: MEMORIZATION STAGE (5.00 to 0.00 Precision Countdown)
      ───────────────────────────────────────────────────────────── */}
      {phase === "MEMORIZE" && targetColor && (
        <div className="w-full max-w-xl flex flex-col items-center gap-6 py-2">
          {/* Glassmorphic Color Preview Card */}
          <div
            className="w-full h-80 sm:h-96 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/15 relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 transition-all duration-300"
            style={{ backgroundColor: hsbToCss(targetColor) }}
          >
            {/* Top-Left: Hex value with dynamic contrast */}
            <div className="flex justify-start">
              <span
                className={`font-mono text-sm sm:text-base font-bold tracking-wider select-none ${
                  targetIsLight ? "text-neutral-950" : "text-white"
                }`}
              >
                {hsbToHex(targetColor)}
              </span>
            </div>

            {/* Top-Right Precision Countdown: Seamless 3-digit Timer */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 flex flex-col items-end select-none">
              <div
                className={`flex items-baseline font-mono tabular-nums tracking-tight leading-none select-none text-5xl sm:text-6xl font-extrabold ${
                  targetIsLight ? "text-neutral-950" : "text-white"
                }`}
              >
                <div className="relative inline-flex items-baseline overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={sec}
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="inline-block font-mono font-extrabold tabular-nums"
                    >
                      {sec}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <span className="font-mono font-extrabold tabular-nums">
                  {msStr}
                </span>
              </div>
              <span
                className={`text-xs sm:text-sm font-medium tracking-wide mt-1.5 ${
                  targetIsLight ? "text-neutral-950/75" : "text-white/75"
                }`}
              >
                seconds to remember
              </span>
            </div>

            {/* Bottom: HSB readout with dynamic contrast */}
            <div
              className={`font-mono text-xs sm:text-sm font-semibold tracking-tight select-none ${
                targetIsLight ? "text-neutral-950/80" : "text-white/80"
              }`}
            >
              H: {targetColor.h}° &nbsp; S: {targetColor.s}% &nbsp; B: {targetColor.b}%
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PHASE 2: RECALL STAGE (Tight 2px Sliders on Left, Color Preview on Right)
      ───────────────────────────────────────────────────────────── */}
      {phase === "RECALL" && (
        <div className="w-full max-w-2xl flex flex-col items-center gap-6 py-1">
          {/* Interactive Recall Stage: Tight 2px Sliders on the LEFT, Color Preview Card on the RIGHT */}
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-center gap-6 sm:gap-8 w-full">
            {/* 3 Vertical Sliders with exact 2px gap (Zero labels, zero percentage text) */}
            <div className="flex items-center justify-center gap-[2px] shrink-0">
              <VerticalSlider
                value={prediction.h}
                min={0}
                max={360}
                gradient={hueGradient}
                onChange={(h) => setPrediction((prev) => ({ ...prev, h }))}
                ariaLabel="Hue Picker"
              />
              <VerticalSlider
                value={prediction.s}
                min={0}
                max={100}
                gradient={satGradient}
                onChange={(s) => setPrediction((prev) => ({ ...prev, s }))}
                ariaLabel="Saturation Slider"
              />
              <VerticalSlider
                value={prediction.b}
                min={0}
                max={100}
                gradient={briGradient}
                onChange={(b) => setPrediction((prev) => ({ ...prev, b }))}
                ariaLabel="Brightness Slider"
              />
            </div>

            {/* Interactive Color Preview Card on the RIGHT */}
            <div
              className="flex-1 w-full min-h-[260px] sm:min-h-[300px] rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 sm:p-7 transition-colors duration-75"
              style={{ backgroundColor: hsbToCss(prediction) }}
            >
              {/* Top-Right: Hex value with dynamic contrast */}
              <div className="flex justify-end w-full">
                <span
                  className={`font-mono text-sm sm:text-base font-bold tracking-wider select-none ${
                    upperIsLight ? "text-neutral-950" : "text-white"
                  }`}
                >
                  {hsbToHex(prediction)}
                </span>
              </div>

              {/* Bottom: HSB readout with dynamic contrast */}
              <div
                className={`font-mono text-xs sm:text-sm font-semibold tracking-tight select-none ${
                  upperIsLight ? "text-neutral-950/80" : "text-white/80"
                }`}
              >
                H: {prediction.h}° &nbsp; S: {prediction.s}% &nbsp; B: {prediction.b}%
              </div>
            </div>
          </div>

          {/* Minimal Lock In Color Submission Button */}
          <div className="w-full flex justify-center pt-2">
            <button
              type="button"
              onClick={handleLockIn}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/25"
            >
              <Check className="w-4 h-4" />
              <span>Lock In Color</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PHASE 3: ROUND RESULT CARD (Current Round Score + Next Round / Final CTA)
      ───────────────────────────────────────────────────────────── */}
      {(phase === "ROUND_RESULT" || phase === "RESULT") && roundResult && targetColor && (
        <div className="w-full max-w-lg flex flex-col items-center gap-5 py-1">
          {/* Running Match Progress Pill */}
          <div className="w-full flex items-center justify-between px-1 text-xs font-mono text-muted-foreground">
            <span>Round {currentRound} of {TOTAL_ROUNDS}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase opacity-75">Running Total:</span>
              <span className="font-bold text-foreground">{totalScore}</span>
              <span className="opacity-60">/ {currentRound * 100}</span>
            </div>
          </div>

          {/* Single Clean Split Card */}
          <div className="w-full rounded-3xl overflow-hidden border border-border/60 shadow-2xl bg-card">
            {/* Upper Section ("Your Prediction") */}
            <div
              className="relative p-6 sm:p-8 flex flex-col justify-between min-h-[180px] sm:min-h-[200px] transition-colors"
              style={{ backgroundColor: hsbToCss(prediction) }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`text-[11px] sm:text-xs font-mono uppercase tracking-widest font-bold select-none ${
                      upperIsLight ? "text-neutral-950/70" : "text-white/70"
                    }`}
                  >
                    Your Prediction
                  </span>
                  <div
                    className={`font-mono text-base sm:text-lg font-bold mt-1 tracking-wider select-none ${
                      upperIsLight ? "text-neutral-950" : "text-white"
                    }`}
                  >
                    {hsbToHex(prediction)}
                  </div>
                </div>

                {/* Big bold round score in the upper right with adaptive contrast */}
                <div className="flex flex-col items-end select-none">
                  <div
                    className={`flex items-baseline gap-1 ${
                      upperIsLight ? "text-neutral-950" : "text-white"
                    }`}
                  >
                    <span className="text-5xl sm:text-6xl font-mono font-black tracking-tighter leading-none">
                      {roundResult.score}
                    </span>
                    <span
                      className={`text-sm sm:text-base font-mono font-bold ${
                        upperIsLight ? "text-neutral-950/70" : "text-white/70"
                      }`}
                    >
                      / 100
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-mono tracking-wider uppercase mt-1 ${
                      upperIsLight ? "text-neutral-950/60" : "text-white/60"
                    }`}
                  >
                    Round {currentRound} Score
                  </span>
                </div>
              </div>

              {/* Bottom: HSB readout with dynamic contrast and recall time */}
              <div
                className={`mt-auto pt-4 flex items-center justify-between font-mono text-xs sm:text-sm font-semibold tracking-tight select-none ${
                  upperIsLight ? "text-neutral-950/80" : "text-white/80"
                }`}
              >
                <span>
                  H: {prediction.h}° &nbsp; S: {prediction.s}% &nbsp; B: {prediction.b}%
                </span>
                <span className="text-[11px] opacity-75 font-mono">
                  {timeTakenSeconds}s recall
                </span>
              </div>
            </div>

            {/* Minimal horizontal dividing line */}
            <div className="h-px w-full bg-black/20 dark:bg-white/20" />

            {/* Lower Section ("Original") */}
            <div
              className="relative p-6 sm:p-8 flex flex-col justify-between min-h-[180px] sm:min-h-[200px] transition-colors"
              style={{ backgroundColor: hsbToCss(targetColor) }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`text-[11px] sm:text-xs font-mono uppercase tracking-widest font-bold select-none ${
                      lowerIsLight ? "text-neutral-950/70" : "text-white/70"
                    }`}
                  >
                    Original
                  </span>
                  <div
                    className={`font-mono text-base sm:text-lg font-bold mt-1 tracking-wider select-none ${
                      lowerIsLight ? "text-neutral-950" : "text-white"
                    }`}
                  >
                    {hsbToHex(targetColor)}
                  </div>
                </div>
              </div>

              {/* Bottom: HSB readout with dynamic contrast */}
              <div
                className={`mt-auto pt-4 font-mono text-xs sm:text-sm font-semibold tracking-tight select-none ${
                  lowerIsLight ? "text-neutral-950/80" : "text-white/80"
                }`}
              >
                H: {targetColor.h}° &nbsp; S: {targetColor.s}% &nbsp; B: {targetColor.b}%
              </div>
            </div>
          </div>

          {/* Action Button: Next Round vs View Final Results */}
          <div className="w-full flex justify-center pt-2">
            {currentRound < TOTAL_ROUNDS ? (
              <button
                type="button"
                onClick={handleNextRound}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20"
              >
                <span>Next Round ({currentRound + 1}/{TOTAL_ROUNDS})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleViewFinalResults}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/25"
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>View Final Results</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PHASE 4: FINAL MATCH SUMMARY (After Round 5)
      ───────────────────────────────────────────────────────────── */}
      {phase === "MATCH_SUMMARY" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-xl flex flex-col items-center gap-6 py-2"
        >
          {/* Header Card with Total Score & Submission Status */}
          <div className="w-full rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
            {/* Subtle radial ambient highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.12),transparent_70%)] pointer-events-none" />

            {/* Submission Status Badge */}
            <div className="mb-4">
              {submissionState.isSubmitting && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-primary/10 text-primary border border-primary/25">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  Saving Match Score...
                </span>
              )}

              {!submissionState.isSubmitting &&
                submissionState.isSubmitted &&
                submissionState.isPersonalBest && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    New Personal Best!
                  </motion.span>
                )}

              {!submissionState.isSubmitting &&
                submissionState.isSubmitted &&
                !submissionState.isPersonalBest && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-secondary/90 text-muted-foreground border border-border/70">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {submissionState.isOffline ? "Saved Locally" : "Score Recorded"}
                  </span>
                )}

              {submissionState.error && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Saved Locally
                </span>
              )}
            </div>

            {/* Title & Subtitle */}
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">
              Match Complete
            </span>

            {/* Cumulative Total Score */}
            <div className="flex items-baseline justify-center gap-2 mt-2 mb-1">
              <span className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-foreground drop-shadow-sm">
                {totalScore}
              </span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-muted-foreground">
                / 500
              </span>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1 max-w-sm">
              5-Round Color Memory Recall Evaluation
            </p>

            {/* 3 Metric Cards Grid */}
            <div className="w-full grid grid-cols-3 gap-2.5 sm:gap-3 mt-6">
              {/* Card 1: Match Score */}
              <div className="rounded-xl bg-secondary/50 border border-border/70 p-3 flex flex-col items-center text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
                  Total Score
                </span>
                <span className="font-mono text-lg sm:text-xl font-bold text-primary mt-1">
                  {totalScore}
                </span>
              </div>

              {/* Card 2: Average Accuracy */}
              <div className="rounded-xl bg-secondary/50 border border-border/70 p-3 flex flex-col items-center text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
                  Avg Accuracy
                </span>
                <span className="font-mono text-lg sm:text-xl font-bold text-emerald-400 mt-1">
                  {averageRoundAccuracy}%
                </span>
              </div>

              {/* Card 3: Average Recall Time */}
              <div className="rounded-xl bg-secondary/50 border border-border/70 p-3 flex flex-col items-center text-center">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
                  Avg Recall
                </span>
                <span className="font-mono text-lg sm:text-xl font-bold text-cyan-400 mt-1">
                  {averageRecallTime}s
                </span>
              </div>
            </div>
          </div>

          {/* 5-Round Breakdown List */}
          <div className="w-full flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-2 text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              <span>Round Breakdown</span>
              <span>5 Rounds</span>
            </div>

            <div className="w-full rounded-2xl border border-border/70 bg-card/70 backdrop-blur-md overflow-hidden divide-y divide-border/40 shadow-lg">
              {rounds.map((r) => {
                const scoreColor =
                  r.score >= 90
                    ? "text-emerald-400"
                    : r.score >= 75
                    ? "text-cyan-400"
                    : r.score >= 60
                    ? "text-amber-400"
                    : "text-muted-foreground";

                return (
                  <div
                    key={r.round}
                    className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors gap-3"
                  >
                    {/* Left: Round Number + Dual Swatch */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-secondary text-muted-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-border/70">
                        {r.round}
                      </div>

                      {/* Split Color Swatch (Top: Predicted, Bottom: Target) */}
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-border/80 shrink-0 flex flex-col shadow-xs">
                        <div
                          className="flex-1 w-full"
                          style={{ backgroundColor: hsbToCss(r.predictedHsb) }}
                          title={`Predicted: ${hsbToHex(r.predictedHsb)}`}
                        />
                        <div
                          className="flex-1 w-full border-t border-black/20"
                          style={{ backgroundColor: hsbToCss(r.targetHsb) }}
                          title={`Target: ${hsbToHex(r.targetHsb)}`}
                        />
                      </div>

                      {/* Hex Comparison */}
                      <div className="flex flex-col text-xs font-mono min-w-0 truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate">
                            {hsbToHex(r.predictedHsb)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">vs</span>
                          <span className="text-muted-foreground/80 truncate">
                            {hsbToHex(r.targetHsb)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 mt-0.5">
                          <Clock className="w-2.5 h-2.5 opacity-70" />
                          <span>{r.timeTakenSeconds.toFixed(2)}s recall</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Round Score */}
                    <div className="text-right shrink-0">
                      <span className={`font-mono text-base font-extrabold ${scoreColor}`}>
                        {r.score}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground ml-1">
                        / 100
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handlePlayAgain}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>

            {onOpenLeaderboard && (
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground font-semibold text-sm border border-border transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Leaderboard</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
