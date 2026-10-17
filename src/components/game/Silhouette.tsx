import type { GameObject } from "@/game/types";

export interface SilhouetteProps {
  object: GameObject;
  className?: string;
  isGhost?: boolean;
}

/** Renders an object's silhouette filling its box without distortion (box matches aspect). */
export function SilhouetteSvg({ object, className = "", isGhost = false }: SilhouetteProps) {
  if (!object?.silhouette?.Shape) {
    return (
      <div className="flex items-center justify-center h-full w-full p-2" aria-label="Loading silhouette">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
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
