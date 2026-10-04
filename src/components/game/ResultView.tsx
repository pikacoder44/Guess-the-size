import React from "react";
import type { ScaleObject } from "../../types";
import { ObjectSilhouette } from "../ObjectSilhouette";
import { formatDimension } from "../../utils/scoring";
import { REFERENCE_PX } from "./GameBoard";

interface ResultViewProps {
  reference: ScaleObject;
  target: ScaleObject;
  capturedGuessScale: number;
  correctScale: number;
  guessedDimension: number;
  correctDimension: number;
  score: number;
  relativeError: number;
  differenceFormatted: string;
  onPlayAgain: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  reference,
  target,
  capturedGuessScale,
  correctScale,
  guessedDimension,
  correctDimension,
  score,
  relativeError,
  differenceFormatted,
  onPlayAgain,
}) => {
  // Calculated pixel heights for guess and correct
  // We cap or scroll within the reveal stage if scale is extreme,
  // but crucially: both use their authentic proportional scales relative to each other!
  const guessHeight = REFERENCE_PX * capturedGuessScale;
  const guessWidth = guessHeight * target.aspectRatio;

  const actualHeight = REFERENCE_PX * correctScale;
  const actualWidth = actualHeight * target.aspectRatio;

  const refHeight = REFERENCE_PX;
  const refWidth = refHeight * reference.aspectRatio;

  const errorPct = (relativeError * 100).toFixed(1);

  const feedback =
    score === 100
      ? "Incredible precision! Spot on!"
      : score >= 85
        ? "Excellent sense of scale!"
        : score >= 60
          ? "Good estimate, close to actual size."
          : score >= 30
            ? "A bit off, but nice try!"
            : "Quite far from the actual dimensions.";

  return (
    <div
      className="result-view-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "100%",
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      {/* ── Comparison Stage ── */}
      <div
        className="result-comparison-stage"
        style={{
          border: "1px solid var(--border, #2a3632)",
          borderRadius: "var(--radius-lg, 14px)",
          background: "var(--surface, #161d1b)",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span
              style={{
                font: "600 10px var(--font-mono, monospace)",
                letterSpacing: "0.14em",
                color: "var(--accent, #e47b5f)",
                textTransform: "uppercase",
              }}
            >
              ROUND RESULT · SCALE REVEAL
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginTop: "4px", color: "var(--text, #dde9e2)" }}>
              {target.name} vs {reference.name}
            </h2>
          </div>
          <div
            style={{
              padding: "6px 14px",
              background: "rgba(228, 123, 95, 0.1)",
              borderRadius: "6px",
              border: "1px solid rgba(228, 123, 95, 0.25)",
              color: "var(--accent, #e47b5f)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "12px",
            }}
          >
            {differenceFormatted}
          </div>
        </div>

        {/* Side-by-side ground aligned visual showcase */}
        <div
          className="result-objects-showcase"
          style={{
            position: "relative",
            minHeight: "340px",
            maxHeight: "560px",
            overflow: "auto",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-around",
            padding: "24px 20px 48px",
            background: `
              repeating-linear-gradient(0deg, transparent, transparent 39px, var(--border, #2a3632) 39px, var(--border, #2a3632) 40px)
            `,
            borderRadius: "8px",
            borderBottom: "2px solid var(--border-2, #374540)",
          }}
        >
          {/* Ground baseline */}
          <div
            style={{
              position: "absolute",
              bottom: "46px",
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, var(--ref-color, #7cb8e8) 0%, var(--actual-color, #6dc98a) 50%, var(--target-color, #e47b5f) 100%)",
              opacity: 0.6,
            }}
          />

          {/* Reference Column */}
          <div
            className="result-col"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: Math.max(20, refWidth),
                height: Math.max(20, refHeight),
                userSelect: "none",
              }}
              title={`Reference: ${reference.name}`}
            >
              <ObjectSilhouette
                silhouette={reference.silhouette}
                label={reference.name}
                color="#7cb8e8"
                aspectRatio={reference.aspectRatio}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "rgba(124, 184, 232, 0.12)",
                  color: "#7cb8e8",
                  font: "600 9px var(--font-mono, monospace)",
                  letterSpacing: "0.12em",
                }}
              >
                REFERENCE
              </span>
              <strong style={{ display: "block", fontSize: "14px", marginTop: "4px" }}>
                {reference.name}
              </strong>
              <small style={{ color: "var(--text-muted, #7a8f87)", fontFamily: "var(--font-mono, monospace)" }}>
                {formatDimension(reference.dimension, reference.unit)}
              </small>
            </div>
          </div>

          {/* Player's Guess Column */}
          <div
            className="result-col"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: Math.max(20, guessWidth),
                height: Math.max(20, guessHeight),
                opacity: 0.85,
                userSelect: "none",
                transition: "transform 0.2s ease",
              }}
              title={`Your guess: ${formatDimension(guessedDimension, target.unit)}`}
            >
              <ObjectSilhouette
                silhouette={target.silhouette}
                label="Your guess"
                color="#e47b5f"
                aspectRatio={target.aspectRatio}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "rgba(228, 123, 95, 0.15)",
                  color: "var(--accent, #e47b5f)",
                  font: "600 9px var(--font-mono, monospace)",
                  letterSpacing: "0.12em",
                }}
              >
                YOUR GUESS
              </span>
              <strong style={{ display: "block", fontSize: "15px", marginTop: "4px", color: "var(--accent, #e47b5f)" }}>
                {formatDimension(guessedDimension, target.unit)}
              </strong>
              <small style={{ color: "var(--text-muted, #7a8f87)", fontFamily: "var(--font-mono, monospace)" }}>
                Estimated scale: {capturedGuessScale.toFixed(2)}x
              </small>
            </div>
          </div>

          {/* Correct Size Column */}
          <div
            className="result-col"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: Math.max(20, actualWidth),
                height: Math.max(20, actualHeight),
                userSelect: "none",
                filter: "drop-shadow(0 0 12px rgba(109, 201, 138, 0.25))",
              }}
              title={`Actual size: ${formatDimension(correctDimension, target.unit)}`}
            >
              <ObjectSilhouette
                silhouette={target.silhouette}
                label="Correct size"
                color="#6dc98a"
                aspectRatio={target.aspectRatio}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "rgba(109, 201, 138, 0.15)",
                  color: "#6dc98a",
                  font: "600 9px var(--font-mono, monospace)",
                  letterSpacing: "0.12em",
                }}
              >
                CORRECT SIZE
              </span>
              <strong style={{ display: "block", fontSize: "15px", marginTop: "4px", color: "#6dc98a" }}>
                {formatDimension(correctDimension, target.unit)}
              </strong>
              <small style={{ color: "var(--text-muted, #7a8f87)", fontFamily: "var(--font-mono, monospace)" }}>
                True scale: {correctScale.toFixed(2)}x
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* ── Score & Stats Panel ── */}
      <div
        className="result-score-panel"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
        }}
      >
        {/* Score Card */}
        <div
          style={{
            padding: "20px",
            background: "var(--surface, #161d1b)",
            border: "1px solid var(--border, #2a3632)",
            borderRadius: "var(--radius, 8px)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span style={{ font: "500 10px var(--font-mono, monospace)", color: "var(--text-muted, #7a8f87)", textTransform: "uppercase" }}>
            ROUND SCORE
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "36px", fontWeight: 800, color: "var(--text, #dde9e2)" }}>
              {score}
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-muted, #7a8f87)", fontFamily: "var(--font-mono, monospace)" }}>
              / 100
            </span>
          </div>
          <p style={{ fontSize: "12px", color: score >= 60 ? "#6dc98a" : "var(--accent, #e47b5f)", marginTop: "4px" }}>
            {feedback}
          </p>
        </div>

        {/* Error Card */}
        <div
          style={{
            padding: "20px",
            background: "var(--surface, #161d1b)",
            border: "1px solid var(--border, #2a3632)",
            borderRadius: "var(--radius, 8px)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span style={{ font: "500 10px var(--font-mono, monospace)", color: "var(--text-muted, #7a8f87)", textTransform: "uppercase" }}>
            RELATIVE ERROR
          </span>
          <span style={{ fontSize: "36px", fontWeight: 800, color: "var(--text, #dde9e2)" }}>
            {errorPct}%
          </span>
          <p style={{ fontSize: "12px", color: "var(--text-muted, #7a8f87)", marginTop: "4px" }}>
            {differenceFormatted}
          </p>
        </div>

        {/* Action / Next Round Card */}
        <div
          style={{
            padding: "20px",
            background: "var(--surface, #161d1b)",
            border: "1px solid var(--border, #2a3632)",
            borderRadius: "var(--radius, 8px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            type="button"
            id="play-again-btn"
            onClick={onPlayAgain}
            style={{
              width: "100%",
              height: "48px",
              background: "var(--accent, #e47b5f)",
              color: "#0e1311",
              fontWeight: 800,
              fontSize: "14px",
              borderRadius: "var(--radius, 8px)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(228, 123, 95, 0.3)",
              transition: "transform 0.15s ease",
            }}
          >
            <span>Play Next Round</span>
            <span>→</span>
          </button>
          <span style={{ fontSize: "11px", color: "var(--text-faint, #4a5c55)", fontFamily: "var(--font-mono, monospace)" }}>
            Single-page test mode
          </span>
        </div>
      </div>
    </div>
  );
};
