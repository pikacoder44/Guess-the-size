import type { GameObject } from "@/game/types";

export type SilhouetteVariant = "reference" | "target" | "actual" | "guess";
export type SilhouetteOutcome = "elite" | "good" | "miss";

export interface SilhouetteProps {
  object?: GameObject;
  puzzle?: { svgUrl?: string; name?: string };
  variant?: SilhouetteVariant;
  outcome?: SilhouetteOutcome;
  isDragging?: boolean;
  isResizing?: boolean;
  className?: string;
  isGhost?: boolean;
}

/**
 * High-aesthetic dark glassmorphic silhouette renderer.
 * Employs CSS masking and multi-stop luminous gradients to replace flat black shadows
 * with glowing, tactile vector silhouettes with deep ambient lighting.
 */
export function SilhouetteSvg({
  object,
  puzzle,
  variant = "target",
  isDragging = false,
  isResizing = false,
  className = "",
  isGhost = false,
}: SilhouetteProps) {
  const item = object || puzzle;
  const svgUrl = item?.svgUrl || object?.silhouette?.svgUrl;
  const name = item?.name || "Silhouette";

  // Unified color scheme & layering opacity:
  // - User's Guess Silhouette: Amber/Gold (#f59e0b / rgba(245, 158, 11, 0.65)) in both guessing and result phase
  // - Actual True Silhouette: Emerald Green (#10b981 / rgba(16, 185, 129, 0.65))
  // - Both rendered with translucent fills (opacity-60) and crisp 2px stroke outlines so overlapping shapes remain distinct
  let fillClass = "bg-amber-400/65 opacity-65";
  let strokeClass = "stroke-amber-400";
  let filterStyle =
    "drop-shadow(2px 0 0 #f59e0b) drop-shadow(-2px 0 0 #f59e0b) drop-shadow(0 2px 0 #f59e0b) drop-shadow(0 -2px 0 #f59e0b) drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))";

  if (variant === "reference") {
    // Reference guide object: cool silver-white translucent glass
    fillClass = "bg-slate-100/75 opacity-75";
    strokeClass = "stroke-slate-300";
    filterStyle =
      "drop-shadow(1px 0 0 rgba(255, 255, 255, 0.75)) drop-shadow(-1px 0 0 rgba(255, 255, 255, 0.75)) drop-shadow(0 1px 0 rgba(255, 255, 255, 0.75)) drop-shadow(0 -1px 0 rgba(255, 255, 255, 0.75)) drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))";
  } else if (variant === "actual") {
    // Actual true comparison benchmark in RESULT mode: translucent emerald green with crisp 2px emerald outline
    fillClass = "bg-emerald-400/60 opacity-60";
    strokeClass = "stroke-emerald-400";
    filterStyle =
      "drop-shadow(2px 0 0 #10b981) drop-shadow(-2px 0 0 #10b981) drop-shadow(0 2px 0 #10b981) drop-shadow(0 -2px 0 #10b981) drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))";
  } else if (variant === "guess") {
    // User's locked guess silhouette in RESULT mode: translucent amber gold with crisp 2px amber outline
    fillClass = "bg-amber-400/60 opacity-60";
    strokeClass = "stroke-amber-400";
    filterStyle =
      "drop-shadow(2px 0 0 #f59e0b) drop-shadow(-2px 0 0 #f59e0b) drop-shadow(0 2px 0 #f59e0b) drop-shadow(0 -2px 0 #f59e0b) drop-shadow(0 0 12px rgba(245, 158, 11, 0.4))";
  } else {
    // Standard target active guessing state: amber gold
    fillClass = "bg-amber-400/65 opacity-65";
    strokeClass = "stroke-amber-400";
    filterStyle =
      "drop-shadow(2px 0 0 #f59e0b) drop-shadow(-2px 0 0 #f59e0b) drop-shadow(0 2px 0 #f59e0b) drop-shadow(0 -2px 0 #f59e0b) drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))";

    if (isDragging || isResizing) {
      filterStyle =
        "drop-shadow(2px 0 0 #fbbf24) drop-shadow(-2px 0 0 #fbbf24) drop-shadow(0 2px 0 #fbbf24) drop-shadow(0 -2px 0 #fbbf24) drop-shadow(0 0 20px rgba(245, 158, 11, 0.85))";
    }
  }

  if (isGhost) {
    fillClass += " opacity-30";
    filterStyle = "drop-shadow(0 0 6px rgba(255,255,255,0.15))";
  }

  if (svgUrl) {
    return (
      <div
        className={`relative w-full h-full overflow-visible flex items-end justify-center select-none pointer-events-none transition-all duration-300 ${strokeClass} ${className}`}
        style={{ overflow: "visible", filter: filterStyle }}
        aria-hidden="true"
      >
        {/* CSS Mask Layer: Fills the SVG path with translucent glowing tint */}
        <div
          className={`w-full h-full overflow-visible transition-all duration-300 ${fillClass}`}
          style={{
            overflow: "visible",
            maskImage: `url("${svgUrl}")`,
            WebkitMaskImage: `url("${svgUrl}")`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center bottom",
            WebkitMaskPosition: "center bottom",
          }}
        />

        {/* Dynamic SVG wrapper element with overflow: visible */}
        <svg
          className="overflow-visible sr-only"
          style={{ overflow: "visible" }}
          viewBox={object?.silhouette?.viewBox ? `${object.silhouette.viewBox.x} ${object.silhouette.viewBox.y} ${object.silhouette.viewBox.width} ${object.silhouette.viewBox.height}` : undefined}
          aria-hidden="true"
        />

        {/* Dynamic img element for accessibility */}
        <img
          src={svgUrl}
          alt={name}
          className="sr-only"
          draggable={false}
        />
      </div>
    );
  }

  if (object?.silhouette?.Shape) {
    const { viewBox, Shape } = object.silhouette;
    let strokeColor = "#f59e0b";
    let svgFill = "rgba(245, 158, 11, 0.60)";
    if (variant === "reference") {
      strokeColor = "#ffffff";
      svgFill = "rgba(241, 245, 249, 0.75)";
    } else if (variant === "actual") {
      strokeColor = "#10b981";
      svgFill = "rgba(16, 185, 129, 0.60)";
    }

    return (
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYBottom meet"
        className={`block h-full w-full overflow-visible transition-all duration-300 ${strokeClass} ${
          isGhost ? "ghost pointer-events-none" : ""
        } ${className}`}
        style={{
          overflow: "visible",
          filter: filterStyle,
          fill: svgFill,
          stroke: strokeColor,
          strokeWidth: 2,
        }}
        aria-hidden="true"
      >
        <Shape />
      </svg>
    );
  }

  return (
    <div className="flex items-center justify-center h-full w-full p-2" aria-label="Loading silhouette">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
