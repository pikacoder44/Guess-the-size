import { Maximize2, Minus, Plus } from "lucide-react";
import type { GameApi } from "@/game/useGame";

export function CameraControls({ game }: { game: GameApi }) {
  const ready = !!game.state;
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Camera controls">
      <button type="button" className="ctrl-btn" onClick={game.zoomOut} disabled={!ready || !game.canZoomOut} aria-label="Zoom out">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-14 text-center font-mono text-xs text-muted-foreground" aria-live="polite">
        {ready ? `${game.zoomPercent}%` : "—"}
      </span>
      <button type="button" className="ctrl-btn" onClick={game.zoomIn} disabled={!ready || !game.canZoomIn} aria-label="Zoom in">
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" className="ctrl-btn ml-1 gap-2 px-3" onClick={game.fitBoth} disabled={!ready} aria-label="Fit both">
        <Maximize2 className="h-4 w-4" />
        <span className="text-sm">Fit both</span>
      </button>
    </div>
  );
}
