import { useState, useEffect, useCallback } from "react";
import { Check, RotateCcw } from "lucide-react";
import type { ColorHSB, GamePhase, ScoreBreakdown } from "./types";
import {
  randomTargetHsb,
  randomPredictionHsb,
  hsbToCss,
  hsbToHex,
  calculateColorScore,
  isLightColor,
} from "./color";
import { VerticalSlider } from "./VerticalSlider";

const MEMORIZE_START_COUNT = 450;
const MEMORIZE_DURATION_MS = 4500; // 450 counts smoothly to 0 over 4.5 seconds
const RECALL_DURATION_SECONDS = 60;

interface NotColorBlindGameProps {
  onPhaseChange?: (phase: GamePhase) => void;
}

export function NotColorBlindGame({ onPhaseChange }: NotColorBlindGameProps) {
  // Game state
  const [phase, setPhase] = useState<GamePhase>("MEMORIZE");
  const [targetColor, setTargetColor] = useState<ColorHSB>(() => randomTargetHsb());
  const [prediction, setPrediction] = useState<ColorHSB>(() => randomPredictionHsb());
  const [memorizeCount, setMemorizeCount] = useState(MEMORIZE_START_COUNT);
  const [recallSeconds, setRecallSeconds] = useState(RECALL_DURATION_SECONDS);
  const [result, setResult] = useState<ScoreBreakdown | null>(null);

  // Notify parent of phase change
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Transition to RECALL phase
  const startRecallPhase = useCallback(() => {
    setPrediction(randomPredictionHsb());
    setRecallSeconds(RECALL_DURATION_SECONDS);
    setPhase("RECALL");
  }, []);

  // Memorization Stage 450-to-0 Countdown
  useEffect(() => {
    if (phase !== "MEMORIZE") return;

    let animId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / MEMORIZE_DURATION_MS);
      const remaining = Math.max(0, Math.round(MEMORIZE_START_COUNT * (1 - progress)));
      setMemorizeCount(remaining);

      if (progress >= 1) {
        startRecallPhase();
      } else {
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [phase, startRecallPhase]);

  // Lock in guess and transition to RESULT phase
  const handleLockIn = useCallback(() => {
    const scoreBreakdown = calculateColorScore(targetColor, prediction);
    setResult(scoreBreakdown);
    setPhase("RESULT");
  }, [targetColor, prediction]);

  // 1-Minute Recall Timer (auto-submits when expired)
  useEffect(() => {
    if (phase !== "RECALL") return;

    const timer = setInterval(() => {
      setRecallSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLockIn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, handleLockIn]);

  // Reset to a new game round
  const handlePlayAgain = () => {
    const newTarget = randomTargetHsb();
    setTargetColor(newTarget);
    setPrediction(randomPredictionHsb());
    setMemorizeCount(MEMORIZE_START_COUNT);
    setRecallSeconds(RECALL_DURATION_SECONDS);
    setResult(null);
    setPhase("MEMORIZE");
  };

  // Keyboard shortcut to Lock In with Enter when in RECALL
  useEffect(() => {
    if (phase !== "RECALL") return;

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter" && !e.repeat) {
        e.preventDefault();
        handleLockIn();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, handleLockIn]);

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
  const lowerIsLight = isLightColor(targetColor);
  const targetIsLight = isLightColor(targetColor);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* ─────────────────────────────────────────────────────────────
          PHASE 1: MEMORIZATION STAGE (450-to-0 Counter in Top Right)
      ───────────────────────────────────────────────────────────── */}
      {phase === "MEMORIZE" && (
        <div className="w-full max-w-xl flex flex-col items-center gap-6 py-4">
          {/* Glassmorphic Color Preview Card */}
          <div
            className="w-full h-80 sm:h-96 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/15 relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 transition-all duration-300"
            style={{ backgroundColor: hsbToCss(targetColor) }}
          >
            {/* Smooth 450-to-0 Countdown Number in Top-Right (No 'seconds' / 's' unit) */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 flex flex-col items-end">
              <span
                className={`font-mono text-5xl sm:text-6xl font-black tabular-nums tracking-tighter select-none ${
                  targetIsLight ? "text-neutral-950" : "text-white"
                }`}
              >
                {memorizeCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PHASE 2: RECALL STAGE (Sliders on Left, Prominent Urgent Timer)
      ───────────────────────────────────────────────────────────── */}
      {phase === "RECALL" && (
        <div className="w-full max-w-2xl flex flex-col items-center gap-6 py-2">
          {/* Top HUD Bar: Subtitle on Left, Big Urgent Timer on Right */}
          <div className="w-full flex items-end justify-between px-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80 font-semibold">
                Perceptual Recall
              </span>
              <span className="text-xs sm:text-sm text-foreground/80 font-medium">
                Reconstruct target color from memory
              </span>
            </div>

            {/* Big Prominent Urgent 60-Second Countdown Timer */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 font-semibold mb-0.5">
                Time Remaining
              </span>
              <div
                className={`font-mono text-4xl sm:text-5xl font-black tabular-nums tracking-tighter leading-none transition-all duration-200 ${
                  recallSeconds <= 5
                    ? "text-rose-500 animate-[pulse_0.6s_ease-in-out_infinite] scale-105"
                    : recallSeconds <= 15
                    ? "text-amber-400 animate-pulse"
                    : "text-foreground"
                }`}
              >
                <span className="opacity-35 text-2xl sm:text-3xl font-semibold mr-0.5">00:</span>
                {recallSeconds.toString().padStart(2, "0")}
              </div>
            </div>
          </div>

          {/* Interactive Recall Stage: Sliders on the LEFT, Color Preview Card on the RIGHT */}
          <div className="flex flex-col sm:flex-row items-center sm:items-stretch justify-center gap-6 sm:gap-8 w-full">
            {/* 3 Vertical Sliders on the LEFT */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 shrink-0">
              <VerticalSlider
                label="Hue"
                value={prediction.h}
                min={0}
                max={360}
                unit="°"
                gradient={hueGradient}
                onChange={(h) => setPrediction((prev) => ({ ...prev, h }))}
                ariaLabel="Hue Picker"
              />
              <VerticalSlider
                label="Saturation"
                value={prediction.s}
                min={0}
                max={100}
                unit="%"
                gradient={satGradient}
                onChange={(s) => setPrediction((prev) => ({ ...prev, s }))}
                ariaLabel="Saturation Slider"
              />
              <VerticalSlider
                label="Brightness"
                value={prediction.b}
                min={0}
                max={100}
                unit="%"
                gradient={briGradient}
                onChange={(b) => setPrediction((prev) => ({ ...prev, b }))}
                ariaLabel="Brightness Slider"
              />
            </div>

            {/* Interactive Color Preview Card on the RIGHT ("Live Preview" label removed) */}
            <div
              className="flex-1 w-full min-h-[260px] sm:min-h-[300px] rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden flex flex-col justify-between p-6 sm:p-7 transition-colors duration-75"
              style={{ backgroundColor: hsbToCss(prediction) }}
            >
              {/* Top-Right: Hex value with dynamic contrast (no pill/shadow) */}
              <div className="flex justify-end w-full">
                <span
                  className={`font-mono text-sm sm:text-base font-bold tracking-wider select-none ${
                    upperIsLight ? "text-neutral-950" : "text-white"
                  }`}
                >
                  {hsbToHex(prediction)}
                </span>
              </div>

              {/* Bottom: HSB readout with dynamic contrast (no pill/shadow) */}
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
          PHASE 3: MINIMAL SPLIT RESULT CARD (No Pills, Adaptive Contrast)
      ───────────────────────────────────────────────────────────── */}
      {phase === "RESULT" && result && (
        <div className="w-full max-w-lg flex flex-col items-center gap-6 py-2">
          {/* Single Clean Card Split Horizontally in Half */}
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

                {/* Big bold score cleanly in the upper right with adaptive contrast */}
                <div
                  className={`text-right flex items-baseline gap-1 select-none ${
                    upperIsLight ? "text-neutral-950" : "text-white"
                  }`}
                >
                  <span className="text-5xl sm:text-6xl font-mono font-black tracking-tighter leading-none">
                    {result.score}
                  </span>
                  <span
                    className={`text-sm sm:text-base font-mono font-bold ${
                      upperIsLight ? "text-neutral-950/70" : "text-white/70"
                    }`}
                  >
                    / 100
                  </span>
                </div>
              </div>

              {/* Bottom: HSB readout with dynamic contrast (no pill/shadow) */}
              <div
                className={`mt-auto pt-4 font-mono text-xs sm:text-sm font-semibold tracking-tight select-none ${
                  upperIsLight ? "text-neutral-950/80" : "text-white/80"
                }`}
              >
                H: {prediction.h}° &nbsp; S: {prediction.s}% &nbsp; B: {prediction.b}%
              </div>
            </div>

            {/* Razor-sharp, minimal horizontal dividing line */}
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

              {/* Bottom: HSB readout with dynamic contrast (no pill/shadow) */}
              <div
                className={`mt-auto pt-4 font-mono text-xs sm:text-sm font-semibold tracking-tight select-none ${
                  lowerIsLight ? "text-neutral-950/80" : "text-white/80"
                }`}
              >
                H: {targetColor.h}° &nbsp; S: {targetColor.s}% &nbsp; B: {targetColor.b}%
              </div>
            </div>
          </div>

          {/* Minimal Play Again Button */}
          <button
            type="button"
            onClick={handlePlayAgain}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      )}
    </div>
  );
}

