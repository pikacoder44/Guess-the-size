import type { GameObject } from "@/game/types";

/** Renders an object's silhouette filling its box without distortion (box matches aspect). */
export function SilhouetteSvg({ object }: { object: GameObject }) {
  const { viewBox, Shape } = object.silhouette;
  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full overflow-visible"
      fill="currentColor"
      aria-hidden="true"
    >
      <Shape />
    </svg>
  );
}
