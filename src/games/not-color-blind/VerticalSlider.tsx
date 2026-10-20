import { useRef, useCallback, type KeyboardEvent, type PointerEvent } from "react";

interface VerticalSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  gradient: string;
  onChange: (value: number) => void;
  ariaLabel?: string;
}

export function VerticalSlider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  gradient,
  onChange,
  ariaLabel,
}: VerticalSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const KNOB_DIAMETER = 32;
  const knobRadius = KNOB_DIAMETER / 2;

  const updateFromPointer = useCallback(
    (clientY: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.height <= 0) return;

      // Bottom is min (0%), Top is max (100%)
      const usableHeight = rect.height - KNOB_DIAMETER;
      const offsetFromBottom = rect.bottom - clientY - knobRadius;
      const ratio = Math.max(0, Math.min(1, offsetFromBottom / usableHeight));

      const rawVal = min + ratio * (max - min);
      const stepped = Math.round(rawVal / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      onChange(clamped);
    },
    [min, max, step, onChange, knobRadius],
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientY);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updateFromPointer(e.clientY);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore release error if already released
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let delta = 0;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      delta = step;
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      delta = -step;
    } else if (e.key === "PageUp") {
      delta = step * 10;
    } else if (e.key === "PageDown") {
      delta = -step * 10;
    } else if (e.key === "Home") {
      onChange(min);
      e.preventDefault();
      return;
    } else if (e.key === "End") {
      onChange(max);
      e.preventDefault();
      return;
    }

    if (delta !== 0) {
      e.preventDefault();
      const next = Math.max(min, Math.min(max, value + delta));
      onChange(next);
    }
  };

  const ratio = (value - min) / (max - min);
  // Position knob so it stays strictly within the track bounds:
  // bottom ranges from 0px (at min) to (height - KNOB_DIAMETER) px (at max)
  const bottomStyle = `calc(${ratio} * (100% - ${KNOB_DIAMETER}px))`;

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Header with Label and Current Value */}
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
          {label}
        </span>
        <span className="font-mono text-xs sm:text-sm font-bold text-foreground tabular-nums">
          {value}
          {unit}
        </span>
      </div>

      {/* Vertical Slider Track Container */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel || label}
        aria-orientation="vertical"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative w-7 sm:w-8 h-60 sm:h-72 rounded-full cursor-pointer touch-none p-1 bg-neutral-950/50 border border-white/10 shadow-[inset_0_2px_8px_rgba(0,0,0,0.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background group"
      >
        {/* Dynamic Gradient Track Fill */}
        <div
          className="w-full h-full rounded-full transition-all duration-75 overflow-hidden shadow-[inset_0_0_4px_rgba(0,0,0,0.3)]"
          style={{ background: gradient }}
        />

        {/* Custom Circular Glassmorphic Knob */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/85 dark:bg-white/90 backdrop-blur-md border border-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.9)] flex items-center justify-center pointer-events-none transition-transform duration-75 group-hover:scale-110 group-active:scale-95"
          style={{ bottom: bottomStyle }}
        >
          {/* Subtle tactile inner dot indicator */}
          <div className="w-2 h-2 rounded-full bg-neutral-900/80 shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.5)]" />
        </div>
      </div>
    </div>
  );
}
