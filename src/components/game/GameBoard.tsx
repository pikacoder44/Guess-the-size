import {
  useEffect,
  type ReactNode,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { pickRandomPuzzle } from "@/game/puzzles";
import {
  rectToScreen,
  screenToWorld,
  worldToScreen,
  sizeFor,
  type Rect,
  type Vec,
} from "@/game/geometry";
import {
  correctRect,
  guessRect,
  referenceRect,
  type GameApi,
} from "@/game/useGame";
import { formatMeasurement } from "@/game/scoring";
import { SilhouetteSvg } from "./Silhouette";
import { CameraControls } from "./CameraControls";
import type { GameObject } from "@/game/types";

const KEY_MOVE_PX = 10;
const KEY_RESIZE = 1.04;

function boxStyle(rect: Rect, game: GameApi): CSSProperties {
  const s = game.state;
  if (!s) return {};
  const b = rectToScreen(rect, s.camera, s.viewport);
  return {
    width: b.width,
    height: b.height,
    transform: `translate3d(${b.left}px, ${b.top}px, 0)`,
  };
}
type DragState =
  | { kind: "move"; pointerId: number; grabOffset: Vec }
  | {
      kind: "resize";
      pointerId: number;
      startX: number;
      startY: number;
      scale: number;
      diagPx: number;
    };

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

  // Measure the fixed viewport; init the round on first measure without wiping active rounds.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let initialised = false;
    const measure = () => {
      const vp = { width: el.clientWidth, height: el.clientHeight };
      if (!vp.width || !vp.height) return;
      if (!initialised && !game.state) {
        initialised = true;
        game.init(pickRandomPuzzle(), vp);
      } else {
        game.setViewport(vp);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playing = state?.phase === "PLAYING";

  const onTargetDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!state || !playing || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const screenPt = getScreenPt(e);
    if (!screenPt) return;
    const worldPt = screenToWorld(screenPt, state.camera, state.viewport);
    drag.current = {
      kind: "move",
      pointerId: e.pointerId,
      grabOffset: {
        x: state.targetCenter.x - worldPt.x,
        y: state.targetCenter.y - worldPt.y,
      },
    };
  };

  const onHandleDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!state || !playing || e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const size = sizeFor(state.puzzle.target, state.guessScale);
    drag.current = {
      kind: "resize",
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scale: state.guessScale,
      diagPx: ((size.w + size.h) / 2) * state.camera.zoom,
    };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || !state || e.pointerId !== d.pointerId) return;

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

  const endDrag = (e: PointerEvent) => {
    if (drag.current && drag.current.pointerId === e.pointerId) {
      drag.current = null;
    }
  };

  const cancelDrag = () => {
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
      className="game-viewport relative aspect-4/3 w-full touch-none select-none overflow-hidden sm:aspect-video"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={cancelDrag}
      onLostPointerCapture={cancelDrag}
      role="application"
      aria-label="Game board"
    >
      {state && (
        <>
          {/* Baseline: visible light stroke on which both objects sit initially */}
          <div
            className="baseline-stroke absolute inset-x-0 z-0 pointer-events-none"
            style={{
              top: `${worldToScreen({ x: 0, y: 0 }, state.camera, state.viewport).y}px`,
            }}
            aria-hidden="true"
          >
            <div className="baseline-line w-full border-b border-border/70" />
          </div>

          {/* Reference Object */}
          <SceneBox
            rect={referenceRect(state)}
            game={game}
            className="text-reference"
          >
            <SilhouetteSvg object={state.puzzle.reference} />
            <ObjectLabel object={state.puzzle.reference} showMeasure />
          </SceneBox>

          {/* Target: Interactive during PLAYING, Compared during RESULT */}
          {playing ? (
            <div
              className="target-box absolute left-0 top-0 cursor-grab text-target active:cursor-grabbing"
              style={boxStyle(guessRect(state), game)}
              onPointerDown={onTargetDown}
              onLostPointerCapture={cancelDrag}
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
                aria-label="Resize target (drag up-right to enlarge)"
                onPointerDown={onHandleDown}
                onLostPointerCapture={cancelDrag}
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
              {/* Correct silhouette (Solid) */}
              <SceneBox
                rect={correctRect(state)}
                game={game}
                className="text-white opacity-30"
              >
                <SilhouetteSvg object={state.puzzle.target} />
                <span className="object-label text-white/70 font-semibold">
                  Actual
                </span>
              </SceneBox>

              {/* Player's guess: 100% opacity, wherever the player sized and placed it */}
              <SceneBox
                rect={guessRect(state)}
                game={game}
                className="text-target opacity-100"
              >
                <SilhouetteSvg object={state.puzzle.target} />
                <span className="object-label text-target font-semibold">
                  Your guess
                </span>
              </SceneBox>
            </>
          )}

          {/* Floating Canvas Camera Controls */}
          <div className="absolute top-3 right-3 z-20 pointer-events-auto backdrop-blur-md bg-card/85 border border-border/70 rounded-xl p-1 shadow-lg shadow-black/25">
            <CameraControls game={game} />
          </div>
        </>
      )}
    </div>
  );
}

function SceneBox({
  rect,
  game,
  className,
  children,
}: {
  rect: Rect;
  game: GameApi;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none absolute left-0 top-0 ${className}`}
      style={boxStyle(rect, game)}
    >
      {children}
    </div>
  );
}

function ObjectLabel({
  object,
  showMeasure,
}: {
  object: GameObject;
  showMeasure?: boolean;
}) {
  return (
    <span className="object-label">
      {object.name}
      {showMeasure && (
        <span className="font-mono text-muted-foreground">
          {" · "}
          {formatMeasurement(object.actualMeasurement)} {object.axis}
        </span>
      )}
    </span>
  );
}
