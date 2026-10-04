import React from "react";
import type { ScaleObject } from "../../types";
import { ObjectSilhouette } from "../ObjectSilhouette";
import { formatDimension } from "../../utils/scoring";

interface ResultOverlayProps {
  target: ScaleObject;
  referencePx: number;
  groundY: number;
  position: { x: number; y: number };
  capturedGuessScale: number;
  correctScale: number;
  guessedDimension: number;
  correctDimension: number;
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({
  target,
  referencePx,
  groundY,
  position,
  capturedGuessScale,
  correctScale,
  guessedDimension,
  correctDimension,
}) => {
  // Dimensions for correct object
  const correctHeight = referencePx * correctScale;
  const correctWidth = correctHeight * target.aspectRatio;

  // Dimensions for player's guess object
  const guessHeight = referencePx * capturedGuessScale;
  const guessWidth = guessHeight * target.aspectRatio;

  const maxContainerWidth = Math.max(correctWidth, guessWidth);
  const maxContainerHeight = Math.max(correctHeight, guessHeight);

  return (
    <div
      className="result-overlay-anchor"
      style={{
        position: "absolute",
        left: position.x,
        bottom: groundY + position.y,
        width: maxContainerWidth,
        height: maxContainerHeight,
        pointerEvents: "none",
        userSelect: "none",
      }}
      aria-label="Result comparison: player guess overlaid on correct size"
    >
      {/* ── 1. CORRECT OBJECT (Normal / Full Opacity 1.0) ── */}
      <div
        className="result-correct-object"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: correctWidth,
          height: correctHeight,
          opacity: 1.0,
          zIndex: 10,
          filter: "drop-shadow(0 0 10px rgba(109, 201, 138, 0.4))",
          transition: "width 0.3s ease, height 0.3s ease",
        }}
        title={`Actual ${target.name}: ${formatDimension(correctDimension, target.unit)}`}
      >
        <ObjectSilhouette
          silhouette={target.silhouette}
          label={`Actual ${target.name}`}
          color="#6dc98a"
          aspectRatio={target.aspectRatio}
        />
      </div>

      {/* ── 2. PLAYER GUESS (Reduced / Light Opacity 0.48 Overlay) ── */}
      <div
        className="result-guess-object"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: guessWidth,
          height: guessHeight,
          opacity: 0.48,
          zIndex: 15,
          filter: "drop-shadow(0 0 8px rgba(228, 123, 95, 0.6))",
          transition: "width 0.3s ease, height 0.3s ease",
        }}
        title={`Your guess: ${formatDimension(guessedDimension, target.unit)}`}
      >
        <ObjectSilhouette
          silhouette={target.silhouette}
          label={`Your guess: ${target.name}`}
          color="#e47b5f"
          aspectRatio={target.aspectRatio}
        />
      </div>

      {/* ── 3. Overlaid Legend Tags ── */}
      <div
        className="result-overlay-tags"
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: "12px",
          display: "flex",
          gap: "14px",
          alignItems: "center",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: "#6dc98a",
              boxShadow: "0 0 6px rgba(109, 201, 138, 0.6)",
            }}
          />
          <span
            style={{
              font: "600 11px var(--font-mono, monospace)",
              color: "#6dc98a",
              letterSpacing: "0.06em",
            }}
          >
            ACTUAL: {formatDimension(correctDimension, target.unit)}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "2px",
              background: "#e47b5f",
              opacity: 0.75,
              boxShadow: "0 0 6px rgba(228, 123, 95, 0.6)",
            }}
          />
          <span
            style={{
              font: "600 11px var(--font-mono, monospace)",
              color: "var(--accent, #e47b5f)",
              letterSpacing: "0.06em",
            }}
          >
            YOUR GUESS: {formatDimension(guessedDimension, target.unit)}
          </span>
        </div>
      </div>
    </div>
  );
};
