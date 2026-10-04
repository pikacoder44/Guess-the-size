import React from "react";
import type { ScaleObject } from "../../types";
import type { Position } from "../../types/game";
import { ObjectSilhouette } from "../ObjectSilhouette";

interface TargetObjectProps {
  target: ScaleObject;
  referencePx: number;
  groundY: number;
  position: Position;
  scale: number;
  locked?: boolean;
  isDragging?: boolean;
  isResizing?: boolean;
  color?: string;
  moveHandlers?: React.DOMAttributes<HTMLDivElement>;
  resizeHandlers?: React.DOMAttributes<HTMLDivElement>;
}

export const TargetObject: React.FC<TargetObjectProps> = ({
  target,
  referencePx,
  groundY,
  position,
  scale,
  locked = false,
  isDragging = false,
  isResizing = false,
  color = "#e47b5f",
  moveHandlers,
  resizeHandlers,
}) => {
  // Authoritative dimensions based strictly on referencePx * scale * aspectRatio
  const height = referencePx * scale;
  const width = height * target.aspectRatio;

  return (
    <div
      className={`target-wrapper ${isDragging ? "dragging" : ""} ${isResizing ? "resizing" : ""}`}
      style={{
        position: "absolute",
        left: position.x,
        bottom: groundY + position.y,
        width,
        height,
        cursor: locked ? "default" : isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        willChange: "transform, width, height, left, bottom",
      }}
      aria-label={`Target guess: ${target.name}`}
      {...moveHandlers}
    >
      {/* Target SVG Silhouette */}
      <div
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <ObjectSilhouette
          silhouette={target.silhouette}
          label={target.name}
          color={color}
          aspectRatio={target.aspectRatio}
        />
      </div>

      {/* Resize Handle: conceptually and structurally belongs to TargetWrapper top-right */}
      {!locked && (
        <div
          className="resize-handle"
          role="slider"
          aria-label={`Resize ${target.name}. Drag up to enlarge, down to shrink. Arrow keys supported.`}
          aria-valuenow={Math.round(scale * 100)}
          aria-valuemin={5}
          aria-valuemax={2500}
          tabIndex={0}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            transform: "translate(30%, -30%)",
            width: "36px",
            height: "36px",
            background: "var(--surface-2, #1d2724)",
            border: "2px solid var(--accent, #e47b5f)",
            borderRadius: "50%",
            color: "var(--accent, #e47b5f)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "nwse-resize",
            touchAction: "none",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
            zIndex: 20,
          }}
          {...resizeHandlers}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
            <path
              d="M3 13L13 3M7 3h6v6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Target Object Label */}
      <div
        className="target-label"
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            font: "600 10px var(--font-mono, monospace)",
            letterSpacing: "0.14em",
            color: color,
            textTransform: "uppercase",
          }}
        >
          TARGET
        </span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text, #dde9e2)" }}>
          {target.name}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--accent, #e47b5f)",
            opacity: 0.85,
          }}
        >
          (Drag to move · ↗ to resize)
        </span>
      </div>
    </div>
  );
};
