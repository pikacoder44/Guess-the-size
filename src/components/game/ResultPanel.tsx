import { useEffect, useRef, useState } from "react";
import { ArrowRight, Award, Percent, Target } from "lucide-react";
import { calculateScore, formatMeasurement, percentError } from "@/game/scoring";
import type { GameState } from "@/game/useGame";

export interface ResultPanelProps {
  state: GameState;
  onNextRound?: () => void;
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

  return value;
}

export function ResultPanel({ state, onNextRound }: ResultPanelProps) {
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const guess = state.finalGuessScale ?? state.guessScale;
  const correct = state.puzzle.target.actualMeasurement;
  const err = percentError(guess, correct);
  const score = calculateScore(guess, correct);
  const animatedScore = useCountUp(score);
  const axis = state.puzzle.target.axis;

  // Auto-focus the progression button when results appear
  useEffect(() => {
    nextBtnRef.current?.focus();
  }, []);

  const getVerdict = (s: number, error: number) => {
    if (s >= 95) return { title: "Bullseye!", tone: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" };
    if (s >= 80) return { title: "Great Estimate!", tone: "text-primary", border: "border-primary/30", bg: "bg-primary/10" };
    if (s >= 60) return { title: "Close Call", tone: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" };
    return { title: error > 0 ? "Too Big" : "Too Small", tone: "text-destructive", border: "border-destructive/30", bg: "bg-destructive/10" };
  };

  const verdict = getVerdict(score, err);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onNextRound) {
      e.preventDefault();
      onNextRound();
    }
  };

  return (
    <div
      className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <section className="result-panel relative overflow-hidden" aria-live="polite" aria-label="Game Result">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Player Guess */}
        <Stat
          label={`Your guess (${axis})`}
          value={formatMeasurement(guess)}
          tone="text-target"
          icon={<Target className="h-3.5 w-3.5 opacity-70" />}
        />

        {/* 2. Correct Measurement */}
        <Stat
          label="Correct size"
          value={formatMeasurement(correct)}
          tone="text-correct"
          icon={<Award className="h-3.5 w-3.5 opacity-70" />}
        />

        {/* 3. Difference / Error */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Percent className="h-3.5 w-3.5 opacity-70" />
            <span>Difference</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xl text-foreground font-semibold">
              {`${err >= 0 ? "+" : ""}${err.toFixed(1)}%`}
            </span>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${verdict.bg} ${verdict.border} ${verdict.tone}`}
            >
              {verdict.title}
            </span>
          </div>
        </div>

        {/* 4. Score Highlight */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Score</div>
          <div className="font-mono text-3xl font-extrabold text-primary flex items-baseline gap-1 mt-0.5">
            <span>{animatedScore}</span>
            <span className="text-sm font-normal text-muted-foreground">/100</span>
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
            ref={nextBtnRef}
            type="button"
            className="lock-btn flex items-center gap-2 shadow-lg shadow-primary/20"
            onClick={onNextRound}
            aria-label="Advance to next round"
          >
            <span>Next Round</span>
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
  icon,
}: {
  label: string;
  value: string;
  tone?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 flex flex-col justify-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`font-mono text-xl font-semibold mt-1 ${tone ?? "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
