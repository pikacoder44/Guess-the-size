import React from "react";
import type { ScaleObject } from "../../types";
import type { Position } from "../../types/game";
import { ReferenceObject } from "./ReferenceObject";
import { TargetObject } from "./TargetObject";
import { useWorldPan } from "../../hooks/useWorldPan";

export const REFERENCE_PX = 160;
export const GROUND_Y = 70;

interface GameBoardProps {
  reference: ScaleObject;
  target: ScaleObject;
  targetPosition: Position;
  targetScale: number;
  locked?: boolean;
  isDraggingTarget?: boolean;
  isResizingTarget?: boolean;
  targetMoveHandlers?: React.DOMAttributes<HTMLDivElement>;
  targetResizeHandlers?: React.DOMAttributes<HTMLDivElement>;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  reference,
  target,
  targetPosition,
  targetScale,
  locked = false,
  isDraggingTarget = false,
  isResizingTarget = false,
  targetMoveHandlers,
  targetResizeHandlers,
}) => {
  const { pan, isPanning, panHandlers, resetPan } = useWorldPan({ x: 0, y: 0 });

  return (
    <div
      className="game-board-viewport"
      style={{
        position: "relative",
        width: "100%",
        height: "520px",
        overflow: "hidden",
        border: "1px solid var(--border, #2a3632)",
        borderRadius: "var(--radius-lg, 14px)",
        background: "var(--surface, #161d1b)",
        cursor: isPanning ? "grabbing" : "default",
        userSelect: "none",
        touchAction: "none",
      }}
      {...panHandlers}
    >
      {/* ── Fixed Viewport Header Overlay ── */}
      <div
        className="viewport-header-strip"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          background: "linear-gradient(180deg, rgba(22, 29, 27, 0.9) 0%, rgba(22, 29, 27, 0) 100%)",
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span
            style={{
              font: "500 10px var(--font-mono, monospace)",
              letterSpacing: "0.14em",
              color: "var(--text-muted, #7a8f87)",
              textTransform: "uppercase",
            }}
          >
            WORKSPACE · PAN TO EXPLORE
          </span>
        </div>

        {/* Viewport Reset View Button */}
        {(pan.x !== 0 || pan.y !== 0) && (
          <button
            type="button"
            className="reset-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              resetPan();
            }}
            style={{
              pointerEvents: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              background: "var(--surface-2, #1d2724)",
              border: "1px solid var(--border-2, #374540)",
              borderRadius: "6px",
              color: "var(--text, #dde9e2)",
              fontSize: "11px",
              fontFamily: "var(--font-mono, monospace)",
              cursor: "pointer",
            }}
            title="Reset board pan back to center"
          >
            <span>⟲</span> Reset View
          </button>
        )}
      </div>

      {/* ── Interactive World Layer ── */}
      <div
        className="game-world"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {/* Infinite Grid Background (aligned with pan) */}
        <div
          className="world-grid-layer"
          style={{
            position: "absolute",
            left: "-5000px",
            top: "-5000px",
            width: "10000px",
            height: "10000px",
            pointerEvents: "none",
            backgroundImage: `
              radial-gradient(circle, var(--border, #2a3632) 1px, transparent 1px)
            `,
            backgroundSize: "28px 28px",
            opacity: 0.7,
          }}
        />

        {/* Infinite Ground Line */}
        <div
          className="world-ground-line"
          style={{
            position: "absolute",
            left: "-5000px",
            width: "10000px",
            bottom: `${GROUND_Y}px`,
            height: "2px",
            background: "linear-gradient(90deg, var(--ref-color, #7cb8e8) 0%, var(--target-color, #e47b5f) 100%)",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />

        {/* Ground Depth Accent */}
        <div
          className="world-ground-sub"
          style={{
            position: "absolute",
            left: "-5000px",
            width: "10000px",
            bottom: 0,
            height: `${GROUND_Y}px`,
            background: "linear-gradient(180deg, rgba(29, 39, 36, 0.4) 0%, rgba(22, 29, 27, 0.8) 100%)",
            borderTop: "1px solid var(--border-2, #374540)",
            pointerEvents: "none",
          }}
        />

        {/* Fixed Reference Object */}
        <ReferenceObject
          reference={reference}
          referencePx={REFERENCE_PX}
          groundY={GROUND_Y}
          xPosition={120}
        />

        {/* Movable & Resizable Target Object */}
        <TargetObject
          target={target}
          referencePx={REFERENCE_PX}
          groundY={GROUND_Y}
          position={targetPosition}
          scale={targetScale}
          locked={locked}
          isDragging={isDraggingTarget}
          isResizing={isResizingTarget}
          moveHandlers={targetMoveHandlers}
          resizeHandlers={targetResizeHandlers}
        />
      </div>

      {/* Floating Canvas Navigation Hint */}
      <div
        className="canvas-pan-hint"
        style={{
          position: "absolute",
          bottom: "12px",
          right: "16px",
          font: "10px var(--font-mono, monospace)",
          color: "var(--text-faint, #4a5c55)",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        Drag canvas to pan · Drag object to position · ↗ handle to resize
      </div>
    </div>
  );
};
