import { useState, useRef, useCallback } from "react";
import type { Position } from "../types/game";

export const MIN_SCALE = 0.05;
export const MAX_SCALE = 25.0;
export const DRAG_SCALE_SENSITIVITY = 0.006;

export interface CanvasBounds {
  width: number;
  height: number;
  groundY: number;
  referencePx: number;
  aspectRatio: number;
}

export interface UseTargetTransformOptions {
  initialPosition?: Position;
  initialScale?: number;
  locked?: boolean;
  canvasBounds?: CanvasBounds;
}

export function useTargetTransform({
  initialPosition = { x: 380, y: 0 },
  initialScale = 1.0,
  locked = false,
  canvasBounds,
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
    let nextX = posDragRef.current.startPosX + deltaX;
    let nextY = posDragRef.current.startPosY + deltaY;

    // Strict fixed canvas boundary enforcement:
    // Entire target bounding box must remain inside the canvas
    if (canvasBounds) {
      const targetW = canvasBounds.referencePx * scale * canvasBounds.aspectRatio;
      const targetH = canvasBounds.referencePx * scale;
      const maxX = Math.max(0, canvasBounds.width - targetW);
      const maxY = Math.max(0, canvasBounds.height - canvasBounds.groundY - targetH);
      nextX = Math.min(maxX, Math.max(0, nextX));
      nextY = Math.min(maxY, Math.max(0, nextY));
    }

    // Magnetic baseline snapping:
    // If the object is within 20px of the baseline, lock it cleanly to y = 0
    if (nextY < 20) {
      nextY = 0;
    }

    setPosition({
      x: nextX,
      y: nextY,
    });
  }, [locked, scale, canvasBounds]);

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

    // Bound scale so target cannot exceed the fixed canvas
    let maxScaleAllowed = MAX_SCALE;
    if (canvasBounds) {
      const maxScaleW = (canvasBounds.width - position.x) / (canvasBounds.referencePx * canvasBounds.aspectRatio);
      const maxScaleH = (canvasBounds.height - canvasBounds.groundY - position.y) / canvasBounds.referencePx;
      maxScaleAllowed = Math.max(MIN_SCALE, Math.min(MAX_SCALE, maxScaleW, maxScaleH));
    }

    const newScale = Math.min(
      maxScaleAllowed,
      Math.max(MIN_SCALE, resizeDragRef.current.startScale + deltaY * DRAG_SCALE_SENSITIVITY)
    );

    setScale(newScale);
  }, [locked, position.x, position.y, canvasBounds]);

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

    let maxScaleAllowed = MAX_SCALE;
    if (canvasBounds) {
      const maxScaleW = (canvasBounds.width - position.x) / (canvasBounds.referencePx * canvasBounds.aspectRatio);
      const maxScaleH = (canvasBounds.height - canvasBounds.groundY - position.y) / canvasBounds.referencePx;
      maxScaleAllowed = Math.max(MIN_SCALE, Math.min(MAX_SCALE, maxScaleW, maxScaleH));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setScale((s) => Math.min(maxScaleAllowed, s + step));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setScale((s) => Math.max(MIN_SCALE, s - step));
    }
  }, [locked, position.x, position.y, canvasBounds]);

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
