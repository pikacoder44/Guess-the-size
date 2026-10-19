import {
  useState,
  useEffect,
  type ReactNode,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { generateGameSession } from "@/game/puzzles";
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
import { formatMeasurement, percentError } from "@/game/scoring";
import { SilhouetteSvg, type SilhouetteOutcome } from "./Silhouette";
import { CameraControls } from "./CameraControls";

const KEY_MOVE_PX = 10;
const KEY_RESIZE = 1.04;

function boxStyle(rect: Rect, game: GameApi): CSSProperties {
  const s = game.state;
  if (!s) return {};
  const b = rectToScreen(rect, s.camera, s.viewport);
  // Cap rendering scale so SVG/div fills never explode past texture/browser limits (max 2000% of canvas)
  const maxW = s.viewport.width * 20;
  const maxH = s.viewport.height * 20;
  const width = Math.max(0, Math.min(b.width, maxW));
  const height = Math.max(0, Math.min(b.height, maxH));
  return {
    width,
    height,
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
  const [interactionKind, setInteractionKind] = useState<"move" | "resize" | null>(null);
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
        game.init(generateGameSession(), vp);
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
      diagPx: ((size.w + size.h) / 2) * state.camera.zoom,
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
      // Up/right grows, down/left shrinks; one authoritative scale value.
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

  // Outcome calculation for RESULT phase
  const guessVal = state?.finalGuessScale ?? state?.guessScale ?? 0;
  const correctVal = state?.puzzle.target.actualMeasurement ?? 0;
  const absError = Math.abs(percentError(guessVal, correctVal));
  const outcome: SilhouetteOutcome = absError < 5 ? "elite" : absError <= 15 ? "good" : "miss";

  // Screen-space metrics for adaptive label sizing and extreme-ratio pin markers
  const refScreen = state ? rectToScreen(referenceRect(state), state.camera, state.viewport) : null;
  const guessScreen = state ? rectToScreen(guessRect(state), state.camera, state.viewport) : null;
  const correctScreen = state && !playing ? rectToScreen(correctRect(state), state.camera, state.viewport) : null;

  const isRefTiny = refScreen ? refScreen.height < 28 || refScreen.width < 12 : false;
  const refCenterX = refScreen ? refScreen.left + refScreen.width / 2 : 0;
  const refTopY = refScreen ? refScreen.top : 0;
  const refBottomY = refScreen ? refScreen.top + refScreen.height : 0;

  const isGuessTiny = guessScreen ? guessScreen.height < 28 || guessScreen.width < 12 : false;
  const guessCenterX = guessScreen ? guessScreen.left + guessScreen.width / 2 : 0;
  const guessTopY = guessScreen ? guessScreen.top : 0;
  const guessBottomY = guessScreen ? guessScreen.top + guessScreen.height : 0;

  // Stagger markers vertically if both reference and guess are tiny and close to each other
  const isClose = Math.abs(guessCenterX - refCenterX) < 140;

  const correctCenterX = correctScreen ? correctScreen.left + correctScreen.width / 2 : 0;
  const correctTopY = correctScreen ? correctScreen.top : 0;

  return (
    <div
      ref={viewportRef}
      className="game-viewport relative aspect-4/3 w-full touch-none select-none overflow-hidden sm:aspect-video rounded-2xl border border-border/80 bg-background/50 shadow-2xl backdrop-blur-sm"
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

          {/* SVG Silhouette Stage: Strict clipping so shapes never bleed into the grid background */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: "inset(0 round 1rem)" }}
          >
            {/* Reference Object: Cool Silver-White Glassmorphic Silhouette */}
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
                {/* 1. Actual Benchmark: Pure Translucent Emerald Silhouette */}
                <SceneBox
                  rect={correctRect(state)}
                  game={game}
                  className="z-10"
                >
                  <SilhouetteSvg object={state.puzzle.target} variant="actual" />
                </SceneBox>

                {/* 2. Player's Guess: Clean Silhouette tinted by error margin */}
                <SceneBox
                  rect={guessRect(state)}
                  game={game}
                  className="z-20"
                >
                  <SilhouetteSvg
                    object={state.puzzle.target}
                    variant="guess"
                    outcome={outcome}
                  />
                </SceneBox>
              </>
            )}
          </div>

          {/* Reference Guide Nameplate & Precision Outlined Marker Pin */}
          {refScreen && (
            <div
              className="absolute pointer-events-none z-30 flex flex-col items-center transition-all duration-300"
              style={{
                left: `${refCenterX}px`,
                top: `${isRefTiny ? refBottomY : refTopY}px`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div
                className="whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md bg-slate-950/90 border border-slate-400/80 text-xs shadow-xl shadow-black/60 pointer-events-auto mb-1 ring-1 ring-white/10"
                aria-label={`Reference Guide: ${state.puzzle.reference.name} (${formatMeasurement(state.puzzle.reference.actualMeasurement)})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Ref Guide</span>
                <span className="font-semibold text-slate-100">{state.puzzle.reference.name}</span>
                <span className="font-mono text-[11px] text-slate-300">
                  ({formatMeasurement(state.puzzle.reference.actualMeasurement)})
                </span>
              </div>

              {/* Pin indicator stem and baseline dot when reference object shrinks */}
              {isRefTiny && (
                <div className="flex flex-col items-center pointer-events-none">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-slate-300 to-slate-400/70 shadow-[0_0_6px_rgba(255,255,255,0.7)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border-2 border-slate-950 shadow-[0_0_10px_white] animate-pulse" />
                </div>
              )}
            </div>
          )}

          {/* Target: Interactive Golden Amber Silhouette during PLAYING */}
          {playing ? (
            <div
              className="target-box absolute left-0 top-0 cursor-grab text-target active:cursor-grabbing z-20"
              style={boxStyle(guessRect(state), game)}
              onPointerDown={onTargetDown}
              onLostPointerCapture={cancelDrag}
              onKeyDown={onTargetKey}
              tabIndex={0}
              role="group"
              aria-label={`${state.puzzle.target.name}, your estimate. Drag to move; use arrow keys to move and plus or minus to resize.`}
            >
              <div className="w-full h-full overflow-hidden">
                <SilhouetteSvg
                  object={state.puzzle.target}
                  variant="target"
                  isDragging={interactionKind === "move"}
                  isResizing={interactionKind === "resize"}
                />
              </div>

              {/* Floating Target Badge (No live meter values during estimating) */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md bg-amber-950/85 border border-amber-500/70 text-xs shadow-lg shadow-amber-950/50">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Target</span>
                <span className="font-semibold text-amber-100">{state.puzzle.target.name}</span>
                {interactionKind === "resize" && (
                  <span className="text-[10px] font-mono text-amber-400/80 uppercase">Resizing</span>
                )}
              </div>

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
              {/* Actual Benchmark Label */}
              {correctScreen && (
                <div
                  className="absolute pointer-events-none z-20 flex flex-col items-center transition-all duration-300"
                  style={{
                    left: `${correctCenterX}px`,
                    top: `${correctTopY}px`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <div className="whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md bg-emerald-950/90 border border-emerald-500/80 text-xs shadow-lg shadow-emerald-950/50 pointer-events-auto mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Actual</span>
                    <span className="font-semibold text-emerald-100">{state.puzzle.target.name}</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-300 bg-emerald-400/20 px-1.5 py-0.5 rounded">
                      {formatMeasurement(correctVal)}
                    </span>
                  </div>
                </div>
              )}

              {/* Player's Result Badge / Outlined Pin Marker */}
              {guessScreen && (
                <div
                  className="absolute pointer-events-none z-30 flex flex-col items-center transition-all duration-300"
                  style={{
                    left: `${guessCenterX}px`,
                    top: `${isGuessTiny ? guessBottomY : guessTopY}px`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <div
                    className={`whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md text-xs shadow-xl pointer-events-auto mb-1 ${
                      outcome === "elite"
                        ? "bg-emerald-950/90 border border-emerald-500 text-emerald-100 shadow-emerald-950/60"
                        : outcome === "good"
                          ? "bg-amber-950/90 border border-amber-500 text-amber-100 shadow-amber-950/60"
                          : "bg-rose-950/90 border border-rose-500 text-rose-100 shadow-rose-950/60"
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">Your Guess</span>
                    <span className="font-bold font-mono">
                      {formatMeasurement(guessVal)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        outcome === "elite"
                          ? "bg-emerald-400/30 text-emerald-300"
                          : outcome === "good"
                            ? "bg-amber-400/30 text-amber-300"
                            : "bg-rose-400/30 text-rose-300"
                      }`}
                    >
                      {absError < 1 ? "<1% off" : `${absError.toFixed(1)}% off`}
                    </span>
                  </div>

                  {/* Outlined Marker Pin Stem & Beacon Dot for tiny guess */}
                  {isGuessTiny && (
                    <div className="flex flex-col items-center pointer-events-none">
                      <div
                        className={`w-0.5 ${isClose && isRefTiny ? "h-14" : "h-6"} ${
                          outcome === "elite"
                            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                            : outcome === "good"
                              ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
                              : "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.7)]"
                        }`}
                      />
                      <div
                        className={`w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                          outcome === "elite"
                            ? "bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
                            : outcome === "good"
                              ? "bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)]"
                              : "bg-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.9)]"
                        } animate-pulse`}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Reference Guide pinned at bottom-left */}
          <div className="absolute bottom-3 left-3 z-30 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-xl backdrop-blur-md bg-card/80 border border-border/70 shadow-lg shadow-black/25 text-xs">
              <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  Reference Guide
                </span>
                <span className="font-semibold text-foreground">
                  {state.puzzle.reference.name}{" "}
                  <span className="font-mono text-muted-foreground font-normal">
                    ({formatMeasurement(state.puzzle.reference.actualMeasurement)})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Floating Canvas Camera Controls */}
          <div className="absolute top-3 right-3 z-20 pointer-events-auto backdrop-blur-md bg-card/85 border border-border/70 rounded-xl p-1 shadow-lg shadow-black/25">
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
      className={`pointer-events-none absolute left-0 top-0 overflow-hidden ${className}`}
      style={boxStyle(rect, game)}
    >
      {children}
    </div>
  );
}
