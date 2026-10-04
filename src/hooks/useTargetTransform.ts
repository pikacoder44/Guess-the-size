import { useState, useRef, useCallback } from "react";
import type { Position } from "../types/game";

export const MIN_SCALE = 0.05;
export const MAX_SCALE = 25.0;
export const DRAG_SCALE_SENSITIVITY = 0.006;

export interface UseTargetTransformOptions {
  initialPosition?: Position;
  initialScale?: number;
  locked?: boolean;
}

export function useTargetTransform({
  initialPosition = { x: 380, y: 0 },
  initialScale = 1.0,
  locked = false,
}: UseTargetTransformOptions = {}) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [scale, setScale] = useState<number>(initialScale);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Position drag state
  const posDragRef = useRef<{
    pointerX: number;
    pointerY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Resize drag state
  const resizeDragRef = useRef<{
    pointerY: number;
    startScale: number;
  } | null>(null);

  // ── Target Move (pointer drag) ──
  const handleMovePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (locked) return;
    // Don't drag object if pointer is on the resize handle
    if ((e.target as HTMLElement).closest(".resize-handle")) return;

    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    posDragRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    setIsDragging(true);
  }, [locked, position.x, position.y]);

  const handleMovePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!posDragRef.current || locked) return;
    e.preventDefault();

    const deltaX = e.clientX - posDragRef.current.pointerX;
    // Bottom-relative coordinate: mouse moving up (smaller clientY) increases Y
    const deltaY = posDragRef.current.pointerY - e.clientY;

    setPosition({
      x: posDragRef.current.startPosX + deltaX,
      y: posDragRef.current.startPosY + deltaY,
    });
  }, [locked]);

  const handleMovePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (posDragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      posDragRef.current = null;
      setIsDragging(false);
    }
  }, []);

  // ── Target Resize (pointer drag on handle) ──
  const handleResizePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (locked) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    resizeDragRef.current = {
      pointerY: e.clientY,
      startScale: scale,
    };
    setIsResizing(true);
  }, [locked, scale]);

  const handleResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeDragRef.current || locked) return;
    e.preventDefault();

    // Dragging handle upward (smaller clientY) increases scale
    const deltaY = resizeDragRef.current.pointerY - e.clientY;
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, resizeDragRef.current.startScale + deltaY * DRAG_SCALE_SENSITIVITY)
    );

    setScale(newScale);
  }, [locked]);

  const handleResizePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (resizeDragRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      resizeDragRef.current = null;
      setIsResizing(false);
    }
  }, []);

  // ── Target Resize (keyboard) ──
  const handleResizeKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (locked) return;
    const step = e.shiftKey ? 0.2 : 0.05;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setScale((s) => Math.min(MAX_SCALE, s + step));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setScale((s) => Math.max(MIN_SCALE, s - step));
    }
  }, [locked]);

  const resetTransform = useCallback((pos = initialPosition, sc = initialScale) => {
    setPosition(pos);
    setScale(sc);
  }, [initialPosition, initialScale]);

  return {
    position,
    scale,
    setPosition,
    setScale,
    isDragging,
    isResizing,
    moveHandlers: {
      onPointerDown: handleMovePointerDown,
      onPointerMove: handleMovePointerMove,
      onPointerUp: handleMovePointerUp,
      onPointerCancel: handleMovePointerUp,
    },
    resizeHandlers: {
      onPointerDown: handleResizePointerDown,
      onPointerMove: handleResizePointerMove,
      onPointerUp: handleResizePointerUp,
      onPointerCancel: handleResizePointerUp,
      onKeyDown: handleResizeKeyDown,
    },
    resetTransform,
  };
}
