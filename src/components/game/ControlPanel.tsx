import React from "react";
import type { ScaleObject } from "../../types";

interface ControlPanelProps {
  reference: ScaleObject;
  target: ScaleObject;
  onLockIn: () => void;
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  reference,
  target,
  onLockIn,
  disabled = false,
}) => {
  return (
    <div
      className="game-control-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        marginTop: "20px",
        width: "100%",
      }}
    >
      {/* Primary Lock In Button */}
      <button
        id="lock-in-btn"
        type="button"
        onClick={onLockIn}
        disabled={disabled}
        className="lock-in-action-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          minHeight: "52px",
          padding: "0 48px",
          background: "var(--accent, #e47b5f)",
          color: "#0e1311",
          borderRadius: "var(--radius, 8px)",
          fontWeight: 800,
          fontSize: "15px",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          boxShadow: "0 4px 0 var(--accent-dim, #c4573d), 0 8px 20px rgba(228, 123, 95, 0.25)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "transform 0.12s, box-shadow 0.12s",
        }}
      >
        <span>Lock In Estimate</span>
        <span aria-hidden="true" style={{ fontSize: "16px" }}>
          ↗
        </span>
      </button>

      {/* Interaction Help Hint */}
      <div
        className="control-help-hint"
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px",
          fontSize: "12px",
          color: "var(--text-muted, #7a8f87)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        <span>
          Compare <strong>{target.name}</strong> against <strong>{reference.name}</strong>
        </span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span>
          Drag <kbd style={{ padding: "1px 5px", background: "var(--surface-2, #1d2724)", border: "1px solid var(--border-2, #374540)", borderRadius: "3px" }}>↗</kbd> handle up/down to scale
        </span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span>
          Keys: <kbd style={{ padding: "1px 5px", background: "var(--surface-2, #1d2724)", border: "1px solid var(--border-2, #374540)", borderRadius: "3px" }}>↑</kbd> <kbd style={{ padding: "1px 5px", background: "var(--surface-2, #1d2724)", border: "1px solid var(--border-2, #374540)", borderRadius: "3px" }}>↓</kbd>
        </span>
      </div>
    </div>
  );
};
