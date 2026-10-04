import React from "react";
import type { ScaleObject } from "../../types";
import { ObjectSilhouette } from "../ObjectSilhouette";
import { formatDimension } from "../../utils/scoring";

interface ReferenceObjectProps {
  reference: ScaleObject;
  referencePx: number;
  groundY: number;
  xPosition?: number;
  color?: string;
}

export const ReferenceObject: React.FC<ReferenceObjectProps> = ({
  reference,
  referencePx,
  groundY,
  xPosition = 140,
  color = "#7cb8e8",
}) => {
  const width = referencePx * reference.aspectRatio;
  const height = referencePx;

  return (
    <div
      className="reference-wrapper"
      style={{
        position: "absolute",
        left: xPosition,
        bottom: groundY,
        width,
        height,
        userSelect: "none",
        pointerEvents: "none",
      }}
      aria-label={`Reference: ${reference.name} (${formatDimension(reference.dimension, reference.unit)})`}
    >
      {/* Silhouette */}
      <div style={{ width: "100%", height: "100%" }}>
        <ObjectSilhouette
          silhouette={reference.silhouette}
          label={reference.name}
          color={color}
          aspectRatio={reference.aspectRatio}
        />
      </div>

      {/* Reference Anchor Label */}
      <div
        className="reference-anchor-label"
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
          REFERENCE
        </span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text, #dde9e2)" }}>
          {reference.name}
        </span>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "var(--font-mono, monospace)",
            color: "var(--text-muted, #7a8f87)",
          }}
        >
          {formatDimension(reference.dimension, reference.unit)}
        </span>
      </div>
    </div>
  );
};
