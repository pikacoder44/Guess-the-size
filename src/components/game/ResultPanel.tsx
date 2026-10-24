import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Percent,
  CloudCheck,
  Trophy,
  RotateCcw,
  Sparkles,
  LogIn,
} from "lucide-react";
import { formatMeasurement } from "@/game/scoring";
import { useAuth } from "@/context/AuthContext";
import { submitScore } from "@/lib/scoreApi";
import type { GameState } from "@/game/useGame";

export interface ResultPanelProps {
  state: GameState;
  onNextRound?: () => void;
  onPlayAgain?: () => void;
  onNavigateLeaderboard?: () => void;
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    let startTime: number | null = null;
    let rafId: number;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return target === 0 ? 0 : value;
}

function getRatingTier(score: number): { label: string; color: string } {
  if (score >= 450) return { label: "Flawless Precision", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" };
  if (score >= 375) return { label: "Master Estimator", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" };
  if (score >= 275) return { label: "Sharp Spatial Sense", color: "text-primary border-primary/30 bg-primary/10" };
  return { label: "Spatial Trainee", color: "text-muted-foreground border-border bg-secondary" };
}

export function ResultPanel({
  state,
  onNextRound,
  onPlayAgain,
  onNavigateLeaderboard,
}: ResultPanelProps) {
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const { token, isAuthenticated, openLogin } = useAuth();
  const submittedSessionRef = useRef<boolean>(false);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track when each round started so we can compute per-round elapsedMs.
  // We record the timestamp when the phase transitions into a new PLAYING round.
  const roundStartTimeRef = useRef<number | null>(null);
  const lastRoundCountRef = useRef<number>(state.rounds.length);
  const roundElapsedMsRef = useRef<number[]>([]);

  const isFinalRound = state.phase === "FINISHED";
  const currentRoundScore =
    state.roundScores[state.roundScores.length - 1] ?? 0;
  const currentRoundError =
    state.roundErrors[state.roundErrors.length - 1] ?? 0;

  // When a round is completed (rounds array grows), record its elapsed time.
  useEffect(() => {
    if (roundStartTimeRef.current === null) {
      roundStartTimeRef.current = performance.now();
    }
    const prev = lastRoundCountRef.current;
    const curr = state.rounds.length;
    if (curr > prev) {
      const startTime = roundStartTimeRef.current;
      const elapsed = Math.round(performance.now() - startTime);
      roundElapsedMsRef.current = [...roundElapsedMsRef.current, elapsed];
      lastRoundCountRef.current = curr;
      // Reset timer for next round
      roundStartTimeRef.current = performance.now();
    }
  }, [state.rounds.length]);

  const guess = state.finalGuessScale ?? state.guessScale;
  const correct = state.puzzle.target.actualMeasurement;

  const animatedRoundScore = useCountUp(currentRoundScore);
  const animatedFinalScore = useCountUp(state.totalScore, 1000);

  // Submit final cumulative score on completion of Round 5 only if authenticated.
  // If unauthenticated guest logs in afterwards, this effect auto-submits their score.
  useEffect(() => {
    if (!isFinalRound || submittedSessionRef.current) return;
    if (!token || !isAuthenticated) {
      // Unauthenticated guest: skip calling submitScore API
      return;
    }

    submittedSessionRef.current = true;
    setIsSubmitting(true);

    // Build the rounds payload that the server uses to recalculate scores
    const roundsPayload = state.rounds.map((r, i) => ({
      // Required fields for server-side score recalculation
      guess: r.guessScale,
      correct: r.actualMeasurement,
      elapsedMs: roundElapsedMsRef.current[i] ?? 0,
      // Metadata carried through for storage / future analytics
      round: r.round,
      puzzleId: r.puzzle.id,
      referenceName: r.puzzle.reference.name,
      targetName: r.puzzle.target.name,
    }));

    submitScore(token, {
      mode: "classic",
      rounds: roundsPayload,
    })
      .then(() => setSaved(true))
      .catch((err) => {
        submittedSessionRef.current = false;
        console.error("Failed to submit classic game score:", err);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [token, isAuthenticated, isFinalRound, state.rounds]);

  // Focus progression button without scrolling the page
  useEffect(() => {
    primaryBtnRef.current?.focus({ preventScroll: true });
  }, [isFinalRound]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      if (!isFinalRound && onNextRound) {
        e.preventDefault();
        onNextRound();
      } else if (isFinalRound && onPlayAgain) {
        e.preventDefault();
        onPlayAgain();
      }
    }
  };

  if (isFinalRound) {
    const tier = getRatingTier(state.totalScore);
    const overallAccuracy = Math.max(0, 100 - state.averageError);

    return (
      <div
        className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <section
          className="result-panel relative overflow-hidden flex flex-col gap-5 p-5 sm:p-6 bg-card/90 border border-primary/30 rounded-2xl shadow-xl shadow-black/30 backdrop-blur-md"
          aria-live="polite"
          aria-label="Final Game Result"
        >
          {/* Decorative ambient background glows */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
                <Trophy className="w-6 h-6 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-xl text-foreground tracking-tight flex items-center gap-2">
                  <span>5-Round Challenge Complete</span>
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                </h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Classic Mode · 5 Distinct Spatial Estimations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${tier.color}`}>
                {tier.label}
              </span>
              {isSubmitting && (
                <span className="inline-flex items-center gap-1.5 text-primary text-xs font-mono bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </span>
              )}
              {saved && (
                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-mono bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                  <CloudCheck className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
              {!isAuthenticated && !saved && !isSubmitting && (
                <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-mono bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                  <span>Guest Match</span>
                </span>
              )}
            </div>
          </div>

          {/* Top Score Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
            {/* Final Cumulative Score out of 500 */}
            <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 flex flex-col justify-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Final Score
              </span>
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-primary flex items-baseline gap-1 mt-1">
                <span>{animatedFinalScore}</span>
                <span className="text-sm font-normal text-muted-foreground">/ 500</span>
              </div>
            </div>

            {/* Overall Average Error */}
            <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 flex flex-col justify-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Average Error
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-foreground mt-1">
                {`${state.averageError.toFixed(1)}%`}
              </div>
            </div>

            {/* Overall Accuracy */}
            <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 flex flex-col justify-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Overall Accuracy
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">
                {`${overallAccuracy.toFixed(1)}%`}
              </div>
            </div>
          </div>

          {/* Unauthenticated / Guest Leaderboard Guard Banner */}
          {!isAuthenticated && !saved && (
            <div className="relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="p-2.5 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 shrink-0">
                  <Trophy className="w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Sign in to save your score and join the global leaderboard.
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Your 5-round score ({state.totalScore}/500) will be submitted automatically upon sign in.
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

          {/* Round-by-Round Breakdown */}
          <div className="relative z-10 flex flex-col gap-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold px-1">
              Round Breakdown
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-background/50">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/50 text-muted-foreground">
                    <th className="py-2.5 px-3 font-semibold">Round</th>
                    <th className="py-2.5 px-3 font-semibold">Challenge</th>
                    <th className="py-2.5 px-3 font-semibold">
                      <span className="bg-amber-400 w-2.5 h-2.5 rounded-full inline-block mr-2 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]" aria-hidden="true" />
                      Your Guess
                    </th>
                    <th className="py-2.5 px-3 font-semibold">
                      <span className="bg-emerald-400 w-2.5 h-2.5 rounded-full inline-block mr-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" aria-hidden="true" />
                      Actual
                    </th>
                    <th className="py-2.5 px-3 font-semibold">Off By</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {state.rounds.map((r) => (
                    <tr key={r.round} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-foreground">
                        {`Round ${r.round}`}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        <span className="text-foreground font-medium">{r.puzzle.target.name}</span>
                        <span className="text-muted-foreground/60"> vs {r.puzzle.reference.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-amber-400 font-medium">
                        {formatMeasurement(r.guessScale)}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-medium">
                        {formatMeasurement(r.actualMeasurement)}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {`${r.errorPercent.toFixed(1)}%`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-primary">
                        {`${r.score} / 100`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground font-mono">Enter</kbd> to play again
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onNavigateLeaderboard && (
              <button
                type="button"
                onClick={onNavigateLeaderboard}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-xs font-mono font-semibold text-foreground hover:text-amber-300 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Leaderboard</span>
              </button>
            )}
            {onPlayAgain && (
              <button
                ref={primaryBtnRef}
                type="button"
                onClick={() => onPlayAgain?.()}
                className="lock-btn flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer w-full sm:w-auto"
                aria-label="Play another 5-round game"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Play Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Intermediate Round Result (Rounds 1, 2, 3, 4)
  return (
    <div
      className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <section className="result-panel relative overflow-hidden" aria-live="polite" aria-label="Round Result">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Score for this round */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
            <span>Round {state.currentRound} Score</span>
          </div>
          <div className="font-mono text-3xl font-extrabold text-primary flex items-baseline gap-1 mt-0.5">
            <span>{animatedRoundScore}</span>
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground/80 mt-1 whitespace-nowrap">
            Total so far: <strong className="text-foreground">{state.totalScore}</strong> / 500
          </span>
        </div>

        {/* 2. Your Answer */}
        <Stat
          label="Your Answer"
          value={formatMeasurement(guess)}
          tone="text-amber-400"
          swatch={<span className="bg-amber-400 w-2.5 h-2.5 rounded-full inline-block mr-2 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]" aria-hidden="true" />}
        />

        {/* 3. Actual */}
        <Stat
          label="Actual"
          value={formatMeasurement(correct)}
          tone="text-emerald-400"
          swatch={<span className="bg-emerald-400 w-2.5 h-2.5 rounded-full inline-block mr-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" aria-hidden="true" />}
        />

        {/* 4. Off by */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 whitespace-nowrap">
            <Percent className="h-3.5 w-3.5 opacity-70" />
            <span>Off by</span>
          </div>
          <div className="font-mono text-xl text-foreground font-semibold mt-1">
            {`${currentRoundError.toFixed(1)}%`}
          </div>
        </div>
      </section>

      {/* Primary Action Button */}
      {onNextRound && (
        <div className="flex justify-end items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground font-mono">Enter</kbd> to continue
          </span>
          <button
            ref={primaryBtnRef}
            type="button"
            className="lock-btn flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            onClick={() => onNextRound?.()}
            aria-label={`Advance to round ${state.currentRound + 1}`}
          >
            <span>{`Next Round (${state.currentRound + 1}/${state.totalRounds})`}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  swatch,
}: {
  label: string;
  value: string;
  tone?: string;
  swatch?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex flex-col justify-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center whitespace-nowrap">
        {swatch}
        <span>{label}</span>
      </div>
      <div className={`font-mono text-xl font-semibold mt-1 ${tone ?? "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
