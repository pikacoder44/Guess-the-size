import type { GameObject } from "@/game/types";

export interface SilhouetteProps {
  object: GameObject;
  className?: string;
  isGhost?: boolean;
}

/** Renders an object's silhouette filling its box without distortion (box matches aspect). */
export function SilhouetteSvg({ object, className = "", isGhost = false }: SilhouetteProps) {
  const { viewBox, Shape } = object.silhouette;
  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      preserveAspectRatio="xMidYMid meet"
      className={`block h-full w-full overflow-visible transition-opacity duration-300 ${
        isGhost ? "ghost pointer-events-none" : ""
      } ${className}`}
      fill="currentColor"
      aria-hidden="true"
    >
      <Shape />
    </svg>
  );
}
