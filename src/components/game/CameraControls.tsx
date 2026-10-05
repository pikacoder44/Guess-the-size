import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import type { GameApi } from "@/game/useGame";

export function CameraControls({ game }: { game: GameApi }) {
  const ready = !!game.state;
  return (
    <div
      className="flex flex-col items-center gap-1"
      role="group"
      aria-label="Camera controls"
    >
      <button
        type="button"
        className="ctrl-btn p-2"
        onClick={game.zoomIn}
        disabled={!ready || !game.canZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      <button
        type="button"
        className="ctrl-btn p-2"
        onClick={game.zoomOut}
        disabled={!ready || !game.canZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>

      <div className="w-full border-t border-border/60 my-0.5" />

      <button
        type="button"
        className="ctrl-btn p-2"
        onClick={game.fitBoth}
        disabled={!ready}
        aria-label="Fit both"
        title="Fit both"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}