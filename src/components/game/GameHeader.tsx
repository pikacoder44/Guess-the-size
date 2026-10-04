import React from "react";
import type { ScaleObject } from "../../types";
import { formatDimension } from "../../utils/scoring";

interface GameHeaderProps {
  reference: ScaleObject;
  target: ScaleObject;
  phase: "PLAYING" | "RESULT";
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  reference,
  target,
  phase,
}) => {
  return (
    <div
      className="round-header-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        marginBottom: "16px",
        width: "100%",
      }}
    >
      {/* Top Meta Strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: phase === "PLAYING" ? "var(--accent, #e47b5f)" : "#6dc98a",
              boxShadow: phase === "PLAYING" ? "0 0 8px rgba(228, 123, 95, 0.6)" : "none",
            }}
          />
          <span
            style={{
              font: "600 11px var(--font-mono, monospace)",
              letterSpacing: "0.14em",
              color: "var(--text-muted, #7a8f87)",
              textTransform: "uppercase",
            }}
          >
            {phase === "PLAYING" ? "TEST ROUND · PLAYING" : "ROUND COMPLETE · REVEAL"}
          </span>
        </div>

        <span
          style={{
            font: "500 11px var(--font-mono, monospace)",
            color: "var(--text-faint, #4a5c55)",
          }}
        >
          Magnitudle Inspired Mechanics
        </span>
      </div>

      {/* Target & Reference Comparison Columns Header */}
      <div
        className="board-columns-header"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          border: "1px solid var(--border, #2a3632)",
          borderRadius: "var(--radius, 8px)",
          background: "var(--surface, #161d1b)",
          overflow: "hidden",
        }}
      >
        {/* Reference Column */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            borderRight: "1px solid var(--border, #2a3632)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                font: "600 9px var(--font-mono, monospace)",
                letterSpacing: "0.14em",
                color: "var(--ref-color, #7cb8e8)",
                textTransform: "uppercase",
              }}
            >
              REFERENCE (FIXED)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text, #dde9e2)" }}>
              {reference.name}
            </span>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono, monospace)", color: "var(--ref-color, #7cb8e8)" }}>
              {formatDimension(reference.dimension, reference.unit)}
            </span>
          </div>
        </div>

        {/* Target Column */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                font: "600 9px var(--font-mono, monospace)",
                letterSpacing: "0.14em",
                color: "var(--target-color, #e47b5f)",
                textTransform: "uppercase",
              }}
            >
              TARGET (YOUR GUESS)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text, #dde9e2)" }}>
              {target.name}
            </span>
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono, monospace)", color: "var(--text-muted, #7a8f87)" }}>
              {phase === "PLAYING" ? "??? (Size hidden)" : formatDimension(target.dimension, target.unit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
