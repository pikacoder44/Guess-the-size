import {
  useState,
  useEffect,
  type ReactNode,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  rectToScreen,
  screenToWorld,
  worldToScreen,
  sizeFor,
  type Rect,
  type Vec,
  type Viewport,
  type Camera,
} from "@/game/geometry";
import {
  correctRect,
  guessRect,
  referenceRect,
  type GameApi,
} from "@/game/useGame";
import { SilhouetteSvg } from "@/components/game/Silhouette";
import { CameraControls } from "@/components/game/CameraControls";
import { generateSmartSession } from "./data/items";

const KEY_MOVE_PX = 10;
const KEY_RESIZE = 1.04;
export const MIN_SILHOUETTE_PX = 24;

/**
 * Calculates a visually normalized bounding box using logarithmic normalization
 * so that microscopic silhouettes maintain a minimum visible stroke/fill size
 * (minimum 24px) during active guessing, while preventing shapes from shrinking
 * to 0px or disappearing off-screen.
 */
export function calculateNormalizedBox(
  rect: Rect,
  camera: Camera,
  viewport: Viewport,
  minPx = MIN_SILHOUETTE_PX,
): { width: number; height: number; left: number; top: number; style: CSSProperties } {
  const b = rectToScreen(rect, camera, viewport);
  const maxW = viewport.width * 20;
  const maxH = viewport.height * 20;

  let width = Math.max(0, Math.min(b.width, maxW));
  let height = Math.max(0, Math.min(b.height, maxH));

  const minDimension = Math.min(width, height);

  // Logarithmic scale normalization for sub-24px silhouettes
  if (minDimension < minPx) {
    const ratio = minPx / Math.max(1e-6, minDimension);
    // Smooth logarithmic expansion curve
    const logScaleFactor = 1 + Math.log2(Math.max(1, ratio));
    const effectiveFactor = Math.max(ratio, logScaleFactor);

    const aspect = width > 0 && height > 0 ? width / height : 1;
    if (width <= height) {
      width = Math.max(minPx, width * effectiveFactor);
      height = Math.max(minPx, width / Math.max(1e-6, aspect));
    } else {
      height = Math.max(minPx, height * effectiveFactor);
      width = Math.max(minPx, height * aspect);
    }
  }

  // Prevent shrinking to 0px
  width = Math.max(minPx, width);
  height = Math.max(minPx, height);

  // Screen Y of the bottom edge of the rect (ground baseline for y=0)
  const screenBottom = b.top + b.height;
  const top = screenBottom - height;

  // Center horizontally relative to original bounding box
  const left = b.left + b.width / 2 - width / 2;

  return {
    width,
    height,
    left,
    top,
    style: {
      width,
      height,
      transform: `translate3d(${left}px, ${top}px, 0)`,
    },
  };
}

function boxStyle(rect: Rect, game: GameApi): CSSProperties {
  const s = game.state;
  if (!s) return {};
  return calculateNormalizedBox(rect, s.camera, s.viewport).style;
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

export function ScaleGuessCanvas({ game }: { game: GameApi }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [interactionKind, setInteractionKind] = useState<"move" | "resize" | null>(null);
  const { state } = game;

  const getScreenPt = (e: PointerEvent): Vec | null => {
    const el = viewportRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // Measure the viewport and initialize session with smart category bounds
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let initialised = false;
    const measure = () => {
      const vp = { width: el.clientWidth, height: el.clientHeight };
      if (!vp.width || !vp.height) return;
      if (!initialised && !game.state) {
        initialised = true;
        game.init(generateSmartSession(), vp);
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
    setInteractionKind("move");
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
      diagPx: Math.max(MIN_SILHOUETTE_PX, ((size.w + size.h) / 2) * state.camera.zoom),
    };
    setInteractionKind("resize");
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
      // Up/right grows, down/left shrinks
      const factor = Math.max(0.01, (d.diagPx + (dx - dy)) / d.diagPx);
      game.resizeTarget(d.scale * factor);
    }
  };

  const endDrag = (e: PointerEvent) => {
    if (drag.current && drag.current.pointerId === e.pointerId) {
      drag.current = null;
      setInteractionKind(null);
    }
  };

  const cancelDrag = () => {
    drag.current = null;
    setInteractionKind(null);
  };

  const onTargetKey = (e: KeyboardEvent) => {
    if (!state || !playing) return;
    const step = KEY_MOVE_PX / Math.max(1e-9, state.camera.zoom);
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
      className="game-viewport relative aspect-4/3 w-full touch-none select-none overflow-hidden sm:aspect-video rounded-2xl border border-border/70 bg-card/25 shadow-xl backdrop-blur-sm bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={cancelDrag}
      onLostPointerCapture={cancelDrag}
      role="application"
      aria-label="ScaleGuess Canvas Board"
    >
      {state && (
        <>
          {/* Baseline Ground Stroke */}
          <div
            className="baseline-stroke absolute inset-x-0 z-0 pointer-events-none"
            style={{
              top: `${worldToScreen({ x: 0, y: 0 }, state.camera, state.viewport).y}px`,
            }}
            aria-hidden="true"
          >
            <div className="baseline-line w-full border-b border-border/60" />
          </div>

          {/* SVG Silhouette Stage: Unclipped, overflow-visible */}
          <div
            className="absolute inset-0 pointer-events-none overflow-visible"
            style={{ overflow: "visible" }}
          >
            {/* Reference Object */}
            <SceneBox
              rect={referenceRect(state)}
              game={game}
              className="text-reference z-10"
            >
              <SilhouetteSvg object={state.puzzle.reference} variant="reference" />
            </SceneBox>

            {/* Target Silhouettes in RESULT phase */}
            {!playing && (
              <>
                {/* Benchmark silhouette */}
                <SceneBox
                  rect={correctRect(state)}
                  game={game}
                  className="z-10"
                >
                  <SilhouetteSvg object={state.puzzle.target} variant="actual" />
                </SceneBox>

                {/* Player's locked guess silhouette */}
                <SceneBox
                  rect={guessRect(state)}
                  game={game}
                  className="z-20"
                >
                  <SilhouetteSvg
                    object={state.puzzle.target}
                    variant="guess"
                  />
                </SceneBox>
              </>
            )}
          </div>

          {/* Target Box during Active Guessing */}
          {playing && (
            <div
              className="target-box absolute left-0 top-0 cursor-grab text-target active:cursor-grabbing z-20 overflow-visible"
              style={{ ...boxStyle(guessRect(state), game), overflow: "visible" }}
              onPointerDown={onTargetDown}
              onLostPointerCapture={cancelDrag}
              onKeyDown={onTargetKey}
              tabIndex={0}
              role="group"
              aria-label={`${state.puzzle.target.name}, your estimate. Drag to reposition; drag top-right handle or press +/- to resize.`}
            >
              <div
                className="w-full h-full overflow-visible min-w-[24px] min-h-[24px]"
                style={{ overflow: "visible" }}
              >
                <SilhouetteSvg
                  object={state.puzzle.target}
                  variant="target"
                  isDragging={interactionKind === "move"}
                  isResizing={interactionKind === "resize"}
                />
              </div>

              {/* Corner Resize Handle */}
              <button
                type="button"
                className="resize-handle cursor-nwse-resize"
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
          )}

          {/* Floating Canvas Camera Controls */}
          <div className="absolute top-3 right-3 z-20 pointer-events-auto backdrop-blur-md bg-card/80 border border-border/60 rounded-xl p-1 shadow-lg">
            <CameraControls game={game} />
          </div>
        </>
      )}

      {!state && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/10 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono tracking-wider">Loading Round...</span>
          </div>
        </div>
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
      className={`pointer-events-none absolute left-0 top-0 overflow-visible min-w-[24px] min-h-[24px] ${className}`}
      style={{ ...boxStyle(rect, game), overflow: "visible" }}
    >
      {children}
    </div>
  );
}

export const GameBoard = ScaleGuessCanvas;
export default ScaleGuessCanvas;
