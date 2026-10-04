import { useEffect, type ReactNode, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { pickRandomPuzzle } from "@/game/puzzles";
import { rectToScreen, screenToWorld, sizeFor, type Rect, type Vec } from "@/game/geometry";
import { correctRect, guessRect, referenceRect, type GameApi } from "@/game/useGame";
import { formatMeasurement } from "@/game/scoring";
import { SilhouetteSvg } from "./Silhouette";
import type { GameObject } from "@/game/types";

const KEY_MOVE_PX = 10;
const KEY_RESIZE = 1.04;

function boxStyle(rect: Rect, game: GameApi): CSSProperties {
  const s = game.state!;
  const b = rectToScreen(rect, s.camera, s.viewport);
  return {
    width: b.width,
    height: b.height,
    transform: `translate3d(${b.left}px, ${b.top}px, 0)`,
  };
}

type DragState =
  | { kind: "move"; grabOffset: Vec }
  | { kind: "resize"; startX: number; startY: number; scale: number; diagPx: number };

export function GameBoard({ game }: { game: GameApi }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const { state } = game;

  const getScreenPt = (e: PointerEvent): Vec | null => {
    const el = viewportRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // Measure the fixed viewport; init the round on first measure.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let initialised = false;
    const measure = () => {
      const vp = { width: el.clientWidth, height: el.clientHeight };
      if (!vp.width || !vp.height) return;
      if (!initialised) {
        initialised = true;
        game.init(pickRandomPuzzle(), vp);
      } else game.setViewport(vp);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playing = state?.phase === "PLAYING";

  const onTargetDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!state || !playing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const screenPt = getScreenPt(e);
    if (!screenPt) return;
    const worldPt = screenToWorld(screenPt, state.camera, state.viewport);
    drag.current = {
      kind: "move",
      grabOffset: {
        x: state.targetCenter.x - worldPt.x,
        y: state.targetCenter.y - worldPt.y,
      },
    };
  };

  const onHandleDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!state || !playing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const size = sizeFor(state.puzzle.target, state.guessScale);
    drag.current = {
      kind: "resize",
      startX: e.clientX,
      startY: e.clientY,
      scale: state.guessScale,
      diagPx: ((size.w + size.h) / 2) * state.camera.zoom,
    };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || !state) return;
    if (d.kind === "move") {
      const screenPt = getScreenPt(e);
      if (!screenPt) return;
      const worldPt = screenToWorld(screenPt, state.camera, state.viewport);
      game.moveTarget({
        x: worldPt.x + d.grabOffset.x,
        y: worldPt.y + d.grabOffset.y,
      });
    } else {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      // Up/right grows, down/left shrinks; one authoritative scale value.
      const factor = Math.max(0.01, (d.diagPx + (dx - dy)) / d.diagPx);
      game.resizeTarget(d.scale * factor);
    }
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onTargetKey = (e: KeyboardEvent) => {
    if (!state || !playing) return;
    const step = KEY_MOVE_PX / state.camera.zoom;
    const { x, y } = state.targetCenter;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const mv = moves[e.key];
    if (mv) {
      e.preventDefault();
      game.moveTarget({ x: x + mv[0], y: y + mv[1] });
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      game.resizeTarget(state.guessScale * KEY_RESIZE);
    } else if (e.key === "-") {
      e.preventDefault();
      game.resizeTarget(state.guessScale / KEY_RESIZE);
    }
  };

  return (
    <div
      ref={viewportRef}
      className="game-viewport relative aspect-[4/3] w-full touch-none select-none overflow-hidden sm:aspect-[16/9]"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="application"
      aria-label="Game board"
    >
      {state && (
        <>
          <SceneBox rect={referenceRect(state)} game={game} className="text-reference">
            <SilhouetteSvg object={state.puzzle.reference} />
            <ObjectLabel object={state.puzzle.reference} showMeasure />
          </SceneBox>

          {playing ? (
            <div
              className="target-box absolute left-0 top-0 cursor-grab text-target active:cursor-grabbing"
              style={boxStyle(guessRect(state), game)}
              onPointerDown={onTargetDown}
              onKeyDown={onTargetKey}
              tabIndex={0}
              role="group"
              aria-label={`${state.puzzle.target.name}, your estimate. Drag to move; use arrow keys to move and plus or minus to resize.`}
            >
              <SilhouetteSvg object={state.puzzle.target} />
              <ObjectLabel object={state.puzzle.target} />
              <button
                type="button"
                className="resize-handle"
                aria-label="Resize target (drag up to enlarge)"
                onPointerDown={onHandleDown}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowRight") {
                    e.preventDefault();
                    e.stopPropagation();
                    game.resizeTarget(state.guessScale * KEY_RESIZE);
                  } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    e.stopPropagation();
                    game.resizeTarget(state.guessScale / KEY_RESIZE);
                  }
                }}
              />
            </div>
          ) : (
            <>
              <SceneBox rect={correctRect(state)} game={game} className="text-correct">
                <SilhouetteSvg object={state.puzzle.target} />
              </SceneBox>
              <SceneBox rect={guessRect(state)} game={game} className="text-target opacity-45">
                <SilhouetteSvg object={state.puzzle.target} />
              </SceneBox>
            </>
          )}
        </>
      )}
    </div>
  );

}

function SceneBox({ rect, game, className, children }: { rect: Rect; game: GameApi; className: string; children: ReactNode }) {
  return (
    <div className={`pointer-events-none absolute left-0 top-0 ${className}`} style={boxStyle(rect, game)}>
      {children}
    </div>
  );
  }

function ObjectLabel({ object, showMeasure }: { object: GameObject; showMeasure?: boolean }) {
  return (
    <span className="object-label">
      {object.name}
      {showMeasure && (
        <span className="font-mono text-muted-foreground">
          {" · "}
          {formatMeasurement(object.actualMeasurement)}{" "}
          {object.axis}
        </span>
      )}
    </span>
  );
}
