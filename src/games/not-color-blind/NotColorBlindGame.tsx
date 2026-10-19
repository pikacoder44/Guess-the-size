import { useState, useEffect, useCallback } from "react";
import { Clock, Check, RotateCcw } from "lucide-react";
import type { ColorHSB, GamePhase, ScoreBreakdown } from "./types";
import {
  randomTargetHsb,
  randomPredictionHsb,
  hsbToCss,
  hsbToHex,
  calculateColorScore,
  getPerceivedLuminance,
} from "./color";
import { VerticalSlider } from "./VerticalSlider";

const MEMORIZE_DURATION_SECONDS = 5;
const RECALL_DURATION_SECONDS = 60;

interface NotColorBlindGameProps {
  onPhaseChange?: (phase: GamePhase) => void;
}

export function NotColorBlindGame({ onPhaseChange }: NotColorBlindGameProps) {
  // Game state
  const [phase, setPhase] = useState<GamePhase>("MEMORIZE");
  const [targetColor, setTargetColor] = useState<ColorHSB>(() => randomTargetHsb());
  const [prediction, setPrediction] = useState<ColorHSB>(() => randomPredictionHsb());
  const [memorizeSeconds, setMemorizeSeconds] = useState(MEMORIZE_DURATION_SECONDS);
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

  // Memorization Stage Countdown
  useEffect(() => {
    if (phase !== "MEMORIZE") return;

    const timer = setInterval(() => {
      setMemorizeSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          startRecallPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
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
    setMemorizeSeconds(MEMORIZE_DURATION_SECONDS);
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

  // Contrast badge styling for result cards
  const upperIsLight = getPerceivedLuminance(prediction) > 140;
  const lowerIsLight = getPerceivedLuminance(targetColor) > 140;

  const upperBadgeClass = upperIsLight
    ? "bg-black/60 text-white border-black/30 shadow-md"
    : "bg-black/40 text-white border-white/20 shadow-md";

  const lowerBadgeClass = lowerIsLight
    ? "bg-black/60 text-white border-black/30 shadow-md"
    : "bg-black/40 text-white border-white/20 shadow-md";

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {/* ─────────────────────────────────────────────────────────────
          PHASE 1: MEMORIZATION STAGE
      ───────────────────────────────────────────────────────────── */}
      {phase === "MEMORIZE" && (
        <div className="w-full max-w-md flex flex-col items-center gap-6 py-4">
          {/* Glassmorphic Color Preview Card */}
          <div
            className="w-full h-80 sm:h-96 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/20 relative overflow-hidden flex flex-col items-center justify-center p-6 transition-all duration-300"
            style={{ backgroundColor: hsbToCss(targetColor) }}
          >
            {/* Minimalist Dynamic Countdown Badge */}
            <div className="px-5 py-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-2xl flex items-center gap-2.5">
              <span
                key={memorizeSeconds}
                className="text-2xl sm:text-3xl font-extrabold font-mono inline-block animate-[pulse_0.35s_ease-out]"
              >
                {memorizeSeconds}
              </span>
              <span className="text-sm sm:text-base font-medium opacity-90">
                seconds to remember
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PHASE 2: RECALL STAGE (1-Minute Timer)
      ───────────────────────────────────────────────────────────── */}
      {phase === "RECALL" && (
        <div className="w-full max-w-lg flex flex-col items-center gap-5 py-2">
          {/* Recall HUD: 60-Second Countdown Timer */}
          <div className="w-full flex items-center justify-between px-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Reconstruct Target Color
            </span>
            <div
              className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1 rounded-full border transition-colors ${
                recallSeconds <= 10
                  ? "bg-destructive/20 text-destructive border-destructive/40 font-bold animate-pulse"
                  : "bg-secondary/80 text-foreground border-border/60"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>00:{recallSeconds.toString().padStart(2, "0")}</span>
            </div>
          </div>

          {/* Live Preview Box */}
          <div
            className="w-full h-40 sm:h-48 rounded-2xl border border-border/70 shadow-2xl overflow-hidden relative flex flex-col justify-between p-4 transition-colors duration-75"
            style={{ backgroundColor: hsbToCss(prediction) }}
          >
            <div className="flex items-center justify-between">
              <div className="px-2.5 py-1 rounded-lg bg-black/45 backdrop-blur-md border border-white/15 text-white">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
                  Live Preview
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-black/45 backdrop-blur-md border border-white/15 text-white">
                <span className="font-mono text-xs font-bold">
                  {hsbToHex(prediction)}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-black/45 backdrop-blur-md border border-white/15 text-white w-fit">
              <span className="font-mono text-xs">
                H: {prediction.h}° &nbsp; S: {prediction.s}% &nbsp; B: {prediction.b}%
              </span>
            </div>
          </div>

          {/* 3 Sleek Vertical Sliders */}
          <div className="flex items-center justify-center gap-7 sm:gap-12 my-2 w-full">
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

          {/* Minimal Lock In Color Submission Button */}
          <div className="w-full flex justify-center pt-1">
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
          PHASE 3: MINIMAL SPLIT RESULT CARD
      ───────────────────────────────────────────────────────────── */}
      {phase === "RESULT" && result && (
        <div className="w-full max-w-md flex flex-col items-center gap-6 py-2">
          {/* Single Clean Card Split Horizontally in Half */}
          <div className="w-full rounded-3xl overflow-hidden border border-border/70 shadow-2xl bg-card">
            {/* Upper Section ("Your Prediction") */}
            <div
              className="relative p-6 sm:p-7 flex flex-col justify-between min-h-[170px] sm:min-h-[190px] transition-colors"
              style={{ backgroundColor: hsbToCss(prediction) }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`px-3 py-1.5 rounded-lg backdrop-blur-md border ${upperBadgeClass}`}>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    Your Prediction
                  </span>
                </div>
                <div className={`px-3.5 py-1.5 rounded-xl backdrop-blur-md border ${upperBadgeClass} text-right`}>
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight leading-none">
                    {result.score}
                  </span>
                  <span className="text-xs sm:text-sm font-medium opacity-80 ml-1">/ 100</span>
                </div>
              </div>

              <div className={`mt-auto pt-4 inline-flex items-center px-3 py-1.5 rounded-lg backdrop-blur-md border ${upperBadgeClass} w-fit`}>
                <span className="font-mono text-xs sm:text-sm font-medium">
                  H: {prediction.h}° &nbsp; S: {prediction.s}% &nbsp; B: {prediction.b}%
                </span>
              </div>
            </div>

            {/* Thin, Subtle Horizontal Dividing Line */}
            <div className="h-px w-full bg-border/80" />

            {/* Lower Section ("Original") */}
            <div
              className="relative p-6 sm:p-7 flex flex-col justify-between min-h-[170px] sm:min-h-[190px] transition-colors"
              style={{ backgroundColor: hsbToCss(targetColor) }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`px-3 py-1.5 rounded-lg backdrop-blur-md border ${lowerBadgeClass}`}>
                  <span className="text-xs sm:text-sm font-semibold tracking-wide">
                    Original
                  </span>
                </div>
              </div>

              <div className={`mt-auto pt-4 inline-flex items-center px-3 py-1.5 rounded-lg backdrop-blur-md border ${lowerBadgeClass} w-fit`}>
                <span className="font-mono text-xs sm:text-sm font-medium">
                  H: {targetColor.h}° &nbsp; S: {targetColor.s}% &nbsp; B: {targetColor.b}%
                </span>
              </div>
            </div>
          </div>

          {/* Minimal Play Again Button */}
          <button
            type="button"
            onClick={handlePlayAgain}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-primary/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        </div>
      )}
    </div>
  );
}
