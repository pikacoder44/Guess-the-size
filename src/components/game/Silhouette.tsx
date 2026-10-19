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
  outcome,
  isDragging = false,
  isResizing = false,
  className = "",
  isGhost = false,
}: SilhouetteProps) {
  const item = object || puzzle;
  const svgUrl = item?.svgUrl || object?.silhouette?.svgUrl;
  const name = item?.name || "Silhouette";

  // Determine color theme based on variant and outcome
  let gradientClass = "bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600";
  let filterGlowClass = "drop-shadow-[0_4px_16px_rgba(245,158,11,0.35)]";

  if (variant === "reference") {
    // High-contrast cool silver-white translucent glass style
    gradientClass = "bg-gradient-to-b from-white via-slate-100 to-slate-300 opacity-75";
    filterGlowClass = "filter saturate-0 brightness-150 drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]";
  } else if (variant === "actual") {
    // Actual comparison benchmark in RESULT mode: translucent emerald guide
    gradientClass = "bg-gradient-to-b from-emerald-200 via-teal-300 to-emerald-500 opacity-60";
    filterGlowClass = "filter brightness-110 drop-shadow-[0_0_14px_rgba(52,211,153,0.45)]";
  } else if (outcome === "elite") {
    // < 5% error: Vibrant emerald celebration glow
    gradientClass = "bg-gradient-to-b from-emerald-300 via-emerald-400 to-emerald-600 opacity-95";
    filterGlowClass = "filter brightness-125 drop-shadow-[0_4px_24px_rgba(16,185,129,0.75)]";
  } else if (outcome === "good") {
    // 5-15% error: Warm amber golden glow
    gradientClass = "bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 opacity-95";
    filterGlowClass = "filter brightness-115 drop-shadow-[0_4px_18px_rgba(245,158,11,0.55)]";
  } else if (outcome === "miss") {
    // > 15% error: Soft crimson warning glow
    gradientClass = "bg-gradient-to-b from-rose-400 via-red-500 to-rose-700 opacity-90";
    filterGlowClass = "filter brightness-110 drop-shadow-[0_4px_18px_rgba(239,68,68,0.6)]";
  } else {
    // Standard target playing state (golden tinted translucent gradient)
    gradientClass = "bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 opacity-90";
    filterGlowClass = "filter brightness-110 drop-shadow-[0_4px_16px_rgba(245,158,11,0.35)]";
  }

  // Active state transitions: golden drop-shadow Pulse
  if (isDragging || isResizing) {
    filterGlowClass = "filter brightness-125 drop-shadow-[0_0_28px_rgba(245,158,11,0.9)] animate-pulse";
  }

  if (isGhost) {
    gradientClass += " opacity-35";
    filterGlowClass = "drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]";
  }

  if (svgUrl) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden flex items-end justify-center select-none pointer-events-none transition-all duration-300 ${filterGlowClass} ${className}`}
        aria-hidden="true"
      >
        {/* CSS Mask Layer: Fills the SVG path with glowing linear gradient */}
        <div
          className={`w-full h-full transition-all duration-300 ${gradientClass}`}
          style={{
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

        {/* Dynamic SVG / img element with filters */}
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
    const textTone = variant === "reference" ? "text-slate-100" : "text-amber-400";
    return (
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className={`block h-full w-full overflow-hidden transition-opacity duration-300 ${filterGlowClass} ${
          isGhost ? "ghost pointer-events-none" : ""
        } ${textTone} ${className}`}
        fill="currentColor"
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
