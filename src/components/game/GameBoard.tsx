import React, { useRef, useState, useEffect } from "react";
import type { ScaleObject } from "../../types";
import type { Position } from "../../types/game";
import { ReferenceObject } from "./ReferenceObject";
import { TargetObject } from "./TargetObject";
import { ResultOverlay } from "./ResultOverlay";
import { useCamera } from "../../hooks/useCamera";

export const REFERENCE_PX = 130;
export const GROUND_Y = 60;
export const FIXED_CANVAS_HEIGHT = 480;

interface GameBoardProps {
  reference: ScaleObject;
  target: ScaleObject;
  targetPosition: Position;
  targetScale: number;
  phase: "PLAYING" | "RESULT";
  capturedGuessScale?: number | null;
  correctScale?: number;
  guessedDimension?: number;
  correctDimension?: number;
  isDraggingTarget?: boolean;
  isResizingTarget?: boolean;
  targetMoveHandlers?: React.DOMAttributes<HTMLDivElement>;
  targetResizeHandlers?: React.DOMAttributes<HTMLDivElement>;
  onRegisterFitBoth?: (fitFn: () => void) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  reference,
  target,
  targetPosition,
  targetScale,
  phase,
  capturedGuessScale,
  correctScale,
  guessedDimension,
  correctDimension,
  isDraggingTarget = false,
  isResizingTarget = false,
  targetMoveHandlers,
  targetResizeHandlers,
  onRegisterFitBoth,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(880);

  // Monitor fixed container width responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.clientWidth);
      }
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Reference object fixed coordinates
  const refX = 60;
  const refWidth = REFERENCE_PX * reference.aspectRatio;
  const refHeight = REFERENCE_PX;

  // Active target coordinates
  const activeScale = phase === "RESULT" && capturedGuessScale ? capturedGuessScale : targetScale;
  const targetWidth = REFERENCE_PX * activeScale * target.aspectRatio;
  const targetHeight = REFERENCE_PX * activeScale;

  // Result overlay bounds (enclosing both guess and correct)
  const resultMaxWidth =
    phase === "RESULT" && correctScale && capturedGuessScale
      ? Math.max(REFERENCE_PX * correctScale, REFERENCE_PX * capturedGuessScale) * target.aspectRatio
      : targetWidth;
  const resultMaxHeight =
    phase === "RESULT" && correctScale && capturedGuessScale
      ? Math.max(REFERENCE_PX * correctScale, REFERENCE_PX * capturedGuessScale)
      : targetHeight;

  // Camera hook with intelligent zoom limits
  const {
    zoom,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    fitBoth,
    cameraTransform,
  } = useCamera({
    canvasWidth,
    canvasHeight: FIXED_CANVAS_HEIGHT,
    groundY: GROUND_Y,
    referenceBounds: {
      x: refX,
      y: 0,
      width: refWidth,
      height: refHeight,
    },
    targetBounds: {
      x: targetPosition.x,
      y: targetPosition.y,
      width: targetWidth,
      height: targetHeight,
    },
    extraResultBounds:
      phase === "RESULT"
        ? {
            x: targetPosition.x,
            y: 0,
            width: resultMaxWidth,
            height: resultMaxHeight,
          }
        : undefined,
  });

  // Expose fitBoth to parent if needed
  useEffect(() => {
    if (onRegisterFitBoth) {
      onRegisterFitBoth(fitBoth);
    }
  }, [onRegisterFitBoth, fitBoth]);

  return (
    <div
      ref={containerRef}
      className="game-board-viewport"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "880px",
        height: `${FIXED_CANVAS_HEIGHT}px`,
        overflow: "hidden", // STRICT NO-SCROLLBAR FIXED BOUNDARY
        border: "1px solid var(--border, #2a3632)",
        borderRadius: "var(--radius-lg, 14px)",
        background: "var(--surface, #161d1b)",
        userSelect: "none",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
        margin: "0 auto",
      }}
    >
      {/* ── Fixed Canvas Topbar with Zoom Controls & Fit Both ── */}
      <div
        className="canvas-hud"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          background: "linear-gradient(180deg, rgba(22, 29, 27, 0.95) 0%, rgba(22, 29, 27, 0) 100%)",
          zIndex: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              font: "600 10px var(--font-mono, monospace)",
              letterSpacing: "0.14em",
              color: "var(--text-muted, #7a8f87)",
              textTransform: "uppercase",
            }}
          >
            FIXED WORKSPACE
          </span>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono, monospace)",
              color: "var(--text-faint, #4a5c55)",
            }}
          >
            · ZOOM {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Action Controls: Zoom Out (-), Zoom In (+), Fit Both */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Zoom Out Button */}
          <button
            type="button"
            id="zoom-out-btn"
            onClick={zoomOut}
            disabled={!canZoomOut}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--surface-2, #1d2724)",
              border: "1px solid var(--border-2, #374540)",
              borderRadius: "6px",
              color: canZoomOut ? "var(--text, #dde9e2)" : "var(--text-faint, #4a5c55)",
              fontSize: "16px",
              fontWeight: 700,
              cursor: canZoomOut ? "pointer" : "not-allowed",
              opacity: canZoomOut ? 1 : 0.4,
              transition: "background 0.15s, transform 0.1s",
            }}
            title={canZoomOut ? "Zoom Out (-)" : "Minimum zoom limit reached"}
            aria-label="Zoom Out"
          >
            −
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            id="zoom-in-btn"
            onClick={zoomIn}
            disabled={!canZoomIn}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--surface-2, #1d2724)",
              border: "1px solid var(--border-2, #374540)",
              borderRadius: "6px",
              color: canZoomIn ? "var(--text, #dde9e2)" : "var(--text-faint, #4a5c55)",
              fontSize: "16px",
              fontWeight: 700,
              cursor: canZoomIn ? "pointer" : "not-allowed",
              opacity: canZoomIn ? 1 : 0.4,
              transition: "background 0.15s, transform 0.1s",
            }}
            title={canZoomIn ? "Zoom In (+)" : "Maximum zoom limit reached (both objects fill canvas)"}
            aria-label="Zoom In"
          >
            +
          </button>

          {/* "Fit Both" Button (Available after result reveal or on demand) */}
          {phase === "RESULT" && (
            <button
              type="button"
              id="fit-both-btn"
              onClick={fitBoth}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "var(--surface-2, #1d2724)",
                border: "1px solid var(--accent, #e47b5f)",
                borderRadius: "6px",
                color: "var(--accent, #e47b5f)",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-mono, monospace)",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(228, 123, 95, 0.2)",
              }}
              title="Automatically adjust camera to fit both objects inside canvas"
            >
              <span aria-hidden="true">⛶</span> Fit Both
            </button>
          )}
        </div>
      </div>

      {/* ── Fixed Ground Line (Stretches across canvas width) ── */}
      <div
        className="canvas-ground-line"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: `${GROUND_Y}px`,
          height: "2px",
          background: "linear-gradient(90deg, var(--ref-color, #7cb8e8) 0%, var(--target-color, #e47b5f) 100%)",
          opacity: 0.6,
          zIndex: 5,
          pointerEvents: "none",
        }}
      />

      {/* Ground Depth Pedestal */}
      <div
        className="canvas-ground-base"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: `${GROUND_Y}px`,
          background: "linear-gradient(180deg, rgba(29, 39, 36, 0.6) 0%, rgba(22, 29, 27, 0.95) 100%)",
          borderTop: "1px solid var(--border-2, #374540)",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />

      {/* ── Camera Scene (Scales smoothly under intelligent zoom limits) ── */}
      <div
        className="camera-scene"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          ...cameraTransform,
        }}
      >
        {/* Subtle grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `
              radial-gradient(circle, var(--border, #2a3632) 1px, transparent 1px)
            `,
            backgroundSize: "28px 28px",
            opacity: 0.5,
          }}
        />

        {/* ── Fixed Left Reference Object ── */}
        <ReferenceObject
          reference={reference}
          referencePx={REFERENCE_PX}
          groundY={GROUND_Y}
          xPosition={refX}
        />

        {/* ── Phase Conditional: PLAYING (Movable Target) vs RESULT (Overlaid Comparison) ── */}
        {phase === "PLAYING" ? (
          <TargetObject
            target={target}
            referencePx={REFERENCE_PX}
            groundY={GROUND_Y}
            position={targetPosition}
            scale={targetScale}
            locked={false}
            isDragging={isDraggingTarget}
            isResizing={isResizingTarget}
            moveHandlers={targetMoveHandlers}
            resizeHandlers={targetResizeHandlers}
          />
        ) : (
          correctScale !== undefined &&
          capturedGuessScale !== null &&
          capturedGuessScale !== undefined &&
          guessedDimension !== undefined &&
          correctDimension !== undefined && (
            <ResultOverlay
              target={target}
              referencePx={REFERENCE_PX}
              groundY={GROUND_Y}
              position={{ x: targetPosition.x, y: 0 }}
              capturedGuessScale={capturedGuessScale}
              correctScale={correctScale}
              guessedDimension={guessedDimension}
              correctDimension={correctDimension}
            />
          )
        )}
      </div>

      {/* Fixed Canvas Subtle Border Accent */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid var(--border, #2a3632)",
          borderRadius: "var(--radius-lg, 14px)",
          pointerEvents: "none",
          zIndex: 40,
        }}
      />
    </div>
  );
};
