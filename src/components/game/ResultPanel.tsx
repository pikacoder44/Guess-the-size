import { calculateScore, formatMeasurement, percentError } from "@/game/scoring";
import type { GameState } from "@/game/useGame";

export function ResultPanel({ state }: { state: GameState }) {
  const guess = state.finalGuessScale!;
  const correct = state.puzzle.target.actualMeasurement;
  const err = percentError(guess, correct);
  const score = calculateScore(guess, correct);
  const axis = state.puzzle.target.axis;

  return (
    <section className="result-panel" aria-live="polite" aria-label="Result">
      <Stat label={`Your guess (${axis})`} value={formatMeasurement(guess)} tone="text-target" />
      <Stat label="Correct size" value={formatMeasurement(correct)} tone="text-correct" />
      <Stat label="Difference" value={`${err >= 0 ? "+" : ""}${err.toFixed(1)}%`} />
      <Stat label="Score" value={`${score}`} suffix="/100" tone="text-target" big />
    </section>
  );
}

function Stat({ label, value, suffix, tone, big }: { label: string; value: string; suffix?: string; tone?: string; big?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono ${big ? "text-3xl" : "text-xl"} ${tone ?? "text-foreground"}`}>
        {value}
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
