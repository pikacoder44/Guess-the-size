import React from "react";
import type { ScaleObject } from "../../types";

interface ResultViewProps {
  reference: ScaleObject;
  target: ScaleObject;
  score: number;
  relativeError: number;
  differenceFormatted: string;
  onFitBoth: () => void;
  onPlayAgain: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  reference,
  target,
  score,
  relativeError,
  differenceFormatted,
  onFitBoth,
  onPlayAgain,
}) => {
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
      className="result-stats-container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        maxWidth: "880px",
        margin: "16px auto 0",
      }}
    >
      {/* ── Result Comparison Title ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <span
            style={{
              font: "600 10px var(--font-mono, monospace)",
              letterSpacing: "0.14em",
              color: "var(--accent, #e47b5f)",
              textTransform: "uppercase",
            }}
          >
            ROUND REVEAL OVERLAY
          </span>
          <h2 style={{ fontSize: "18px", fontWeight: 800, marginTop: "2px", color: "var(--text, #dde9e2)" }}>
            {target.name} vs {reference.name}
          </h2>
        </div>
        <span
          style={{
            font: "500 11px var(--font-mono, monospace)",
            color: "var(--text-muted, #7a8f87)",
          }}
        >
          Direct Overlay Comparison
        </span>
      </div>

      {/* ── Score & Difference Analytics Strip ── */}
      <div
        className="result-score-panel"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
        }}
      >
        {/* Score Card */}
        <div
          style={{
            padding: "18px 20px",
            background: "var(--surface, #161d1b)",
            border: "1px solid var(--border, #2a3632)",
            borderRadius: "var(--radius, 8px)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              font: "600 10px var(--font-mono, monospace)",
              color: "var(--text-muted, #7a8f87)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            ROUND SCORE
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "32px", fontWeight: 800, color: "var(--text, #dde9e2)" }}>
              {score}
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-muted, #7a8f87)", fontFamily: "var(--font-mono, monospace)" }}>
              / 100
            </span>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: score >= 60 ? "#6dc98a" : "var(--accent, #e47b5f)",
              fontWeight: 600,
              marginTop: "2px",
            }}
          >
            {feedback}
          </p>
        </div>

        {/* Error / Accuracy Card */}
        <div
          style={{
            padding: "18px 20px",
            background: "var(--surface, #161d1b)",
            border: "1px solid var(--border, #2a3632)",
            borderRadius: "var(--radius, 8px)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              font: "600 10px var(--font-mono, monospace)",
              color: "var(--text-muted, #7a8f87)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            RELATIVE ERROR
          </span>
          <span style={{ fontSize: "32px", fontWeight: 800, color: "var(--text, #dde9e2)" }}>
            {errorPct}%
          </span>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted, #7a8f87)",
              fontFamily: "var(--font-mono, monospace)",
              marginTop: "2px",
            }}
          >
            {differenceFormatted}
          </p>
        </div>

        {/* Quick Actions Card */}
        <div
          style={{
            padding: "18px 20px",
            background: "var(--surface, #161d1b)",
            border: "1px solid var(--border, #2a3632)",
            borderRadius: "var(--radius, 8px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {/* Fit Both Action Button */}
          <button
            type="button"
            id="fit-both-action-btn"
            onClick={onFitBoth}
            style={{
              width: "100%",
              height: "40px",
              background: "var(--surface-2, #1d2724)",
              border: "1px solid var(--accent, #e47b5f)",
              color: "var(--accent, #e47b5f)",
              borderRadius: "var(--radius, 8px)",
              fontWeight: 700,
              fontSize: "12px",
              fontFamily: "var(--font-mono, monospace)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "background 0.15s, transform 0.1s",
            }}
          >
            <span>⛶ Fit Both Objects in View</span>
          </button>

          {/* Next Test Round Button */}
          <button
            type="button"
            id="play-again-btn"
            onClick={onPlayAgain}
            style={{
              width: "100%",
              height: "44px",
              background: "var(--accent, #e47b5f)",
              color: "#0e1311",
              fontWeight: 800,
              fontSize: "13px",
              letterSpacing: "0.04em",
              borderRadius: "var(--radius, 8px)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(228, 123, 95, 0.25)",
            }}
          >
            <span>Play Next Round</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
