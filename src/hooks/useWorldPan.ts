import { useState, useRef, useCallback } from "react";
import type { Position } from "../types/game";

export function useWorldPan(initialPan: Position = { x: 0, y: 0 }) {
  const [pan, setPan] = useState<Position>(initialPan);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; panX: number; panY: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only pan if clicking directly on the canvas background, not on interactive objects/handles
    const target = e.target as HTMLElement;
    if (target.closest(".target-wrapper") || target.closest(".resize-handle") || target.closest("button")) {
      return;
    }

    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsPanning(true);
  }, [pan.x, pan.y]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!panStartRef.current) return;
    e.preventDefault();
    const deltaX = e.clientX - panStartRef.current.pointerX;
    const deltaY = e.clientY - panStartRef.current.pointerY;

    setPan({
      x: panStartRef.current.panX + deltaX,
      y: panStartRef.current.panY + deltaY,
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (panStartRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore if already released
      }
      panStartRef.current = null;
      setIsPanning(false);
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Enable wheel / trackpad 2-finger panning
    e.preventDefault();
    setPan((prev) => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY,
    }));
  }, []);

  const resetPan = useCallback(() => {
    setPan(initialPan);
  }, [initialPan]);

  return {
    pan,
    setPan,
    isPanning,
    panHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onWheel: handleWheel,
    },
    resetPan,
  };
}
