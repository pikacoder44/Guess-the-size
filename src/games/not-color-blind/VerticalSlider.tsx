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

  const updateFromPointer = useCallback(
    (clientY: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || rect.height <= 0) return;

      // Bottom is min (0%), Top is max (100%)
      const thumbRadius = 14; // half of thumb height (28px)
      const usableHeight = rect.height - thumbRadius * 2;
      const offsetFromBottom = rect.bottom - clientY - thumbRadius;
      const ratio = Math.max(0, Math.min(1, offsetFromBottom / usableHeight));

      const rawVal = min + ratio * (max - min);
      const stepped = Math.round(rawVal / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      onChange(clamped);
    },
    [min, max, step, onChange],
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
  // Position thumb so it stays strictly within the track bounds:
  // bottom ranges from 0px (at min) to (height - thumbHeight) px (at max)
  const thumbHeight = 28;
  const bottomStyle = `calc(${ratio} * (100% - ${thumbHeight}px))`;

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Header with Label and Current Value */}
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </span>
        <span className="font-mono text-xs font-bold text-foreground">
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
        className="relative w-11 sm:w-12 h-60 sm:h-72 rounded-full cursor-pointer touch-none p-1 bg-card/60 border border-border/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background group"
      >
        {/* Dynamic Gradient Track Fill */}
        <div
          className="w-full h-full rounded-full transition-all duration-75 overflow-hidden"
          style={{ background: gradient }}
        />

        {/* Sleek Tactile Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-14 sm:w-16 h-7 rounded-full bg-white text-neutral-950 border border-white/80 shadow-[0_4px_14px_rgba(0,0,0,0.65)] ring-2 ring-black/40 flex items-center justify-center font-mono text-[11px] font-bold tracking-tight pointer-events-none transition-transform duration-75 group-hover:scale-105 group-active:scale-95"
          style={{ bottom: bottomStyle }}
        >
          {value}
          {unit}
        </div>
      </div>
    </div>
  );
}
