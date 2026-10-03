import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ObjectSilhouette } from "./components/ObjectSilhouette";
import {
  calculateRelativeError,
  calculateScore,
  formatMeasurement,
  getDailyPuzzles,
  getRandomPracticePuzzles,
  updateStatistics,
} from "./game";
import { loadStatistics, saveGameResult } from "./storage";
import { shareResult } from "./share";
import type {
  GameResult,
  Puzzle,
  RoundResult,
  ScaleObject,
  Statistics,
} from "./types";
import "./App.css";

// Paste into App.tsx: replace the old constants block (MIN_SCALE..BASE_TARGET_HEIGHT)
// and the whole `Game` function with everything below.
// Needs: import { useLayoutEffect } from "react"; (add to the existing react import)

// ───────────────────────── constants & pure helpers ─────────────────────────
const MIN_SCALE = 0.18;
const MAX_SCALE = 2.15;
const BASE_TARGET_WIDTH = 126;
const BASE_TARGET_HEIGHT = 190;

const UNITS_PER_SCALE = 6.3; // guess units represented by scale 1
const MIN_GUESS = MIN_SCALE * UNITS_PER_SCALE;
const MAX_GUESS = MAX_SCALE * UNITS_PER_SCALE;
const INITIAL_GUESS = 3.5;
// Exact 1:1 handle tracking: dragging the handle N stage-px up makes the box N px taller.
const GUESS_PER_PX = UNITS_PER_SCALE / BASE_TARGET_HEIGHT; // ≈ 0.0332 (was 0.035)
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 1.5;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const guessToScale = (g: number) =>
  clamp(g / UNITS_PER_SCALE, MIN_SCALE, MAX_SCALE);

interface Size {
  width: number;
  height: number;
}
/** x = left edge as a fraction (0..1) of stage width; y = px from stage bottom. Both in *stage space*. */
interface Pos {
  x: number;
  y: number;
}

type Gesture =
  | { kind: "move"; id: number; sx: number; sy: number; origin: Pos }
  | { kind: "resize"; id: number; sy: number; originGuess: number };

/** Keep the (scaled) box fully inside the stage. */
function clampPos(pos: Pos, scale: number, stage: Size): Pos {
  if (!stage.width || !stage.height) return pos;
  const boxW = BASE_TARGET_WIDTH * scale;
  const boxH = BASE_TARGET_HEIGHT * scale;
  return {
    x: clamp(pos.x, 0, Math.max(0, (stage.width - boxW) / stage.width)),
    y: clamp(pos.y, 0, Math.max(0, stage.height - boxH)),
  };
}

/** Largest guess whose box still fits when grown up/right from its bottom-left anchor. */
function maxGuessAt(pos: Pos, stage: Size): number {
  if (!stage.width || !stage.height) return MAX_GUESS;
  const byHeight = (stage.height - pos.y) / BASE_TARGET_HEIGHT;
  const byWidth = ((1 - pos.x) * stage.width) / BASE_TARGET_WIDTH;
  return clamp(
    Math.min(byHeight, byWidth) * UNITS_PER_SCALE,
    MIN_GUESS,
    MAX_GUESS,
  );
}

// ───────────────────────────────── component ─────────────────────────────────
function Game({
  puzzle,
  round,
  locked,
  onLock,
  onContinue,
  onHowTo,
  roundResults,
}: {
  puzzle: Puzzle;
  round: number;
  locked: boolean;
  onLock: (estimate: number) => void; // App no longer owns `guess`
  onContinue: () => void;
  onHowTo: () => void;
  roundResults: RoundResult[];
}) {
  // Local state: pointermove no longer re-renders <App/>. Game is remounted per round (key), so it resets itself.
  const [guess, setGuess] = useState(INITIAL_GUESS);
  const [pos, setPos] = useState<Pos>({ x: 0.55, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const stageSize = useRef<Size>({ width: 0, height: 0 });
  const gestureRef = useRef<Gesture | null>(null);

  const scale = guessToScale(guess);
  const actualScale = guessToScale(puzzle.target.dimension);
  const revealed = roundResults[round];

  const latest = useRef({ scale, guess });
  latest.current = { scale, guess };

  // Measure LAYOUT size (clientWidth/Height ignore ancestor transforms; getBoundingClientRect does not).
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      stageSize.current = { width: el.clientWidth, height: el.clientHeight };
      setPos((p) => clampPos(p, latest.current.scale, stageSize.current));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── gestures ──
  const endGesture = (e: React.PointerEvent<HTMLElement>) => {
    if (gestureRef.current?.id !== e.pointerId) return; // idempotent (events bubble from the handle)
    gestureRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const startMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (locked || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    gestureRef.current = {
      kind: "move",
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      origin: pos,
    };
    setDragging(true);
  };

  const startResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (locked || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    e.stopPropagation(); // don't start a move on the parent
    e.currentTarget.setPointerCapture(e.pointerId);
    gestureRef.current = {
      kind: "resize",
      id: e.pointerId,
      sy: e.clientY,
      originGuess: guess,
    };
    setDragging(true);
  };

  // Shared handler: pointermove from the captured handle bubbles to the box; the gesture ref decides what to do.
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const g = gestureRef.current;
    if (!g || g.id !== e.pointerId) return;
    const stage = stageSize.current;

    // ONE conversion screen → stage space for BOTH axes: divide by zoom.
    const dx = g.kind === "move" ? (e.clientX - g.sx) / zoom : 0;
    const dy = (g.sy - e.clientY) / zoom; // up is positive

    if (g.kind === "move") {
      if (!stage.width) return;
      setPos(
        clampPos(
          { x: g.origin.x + dx / stage.width, y: g.origin.y + dy },
          scale,
          stage,
        ),
      );
    } else {
      setGuess(
        clamp(
          g.originGuess + dy * GUESS_PER_PX,
          MIN_GUESS,
          maxGuessAt(pos, stage),
        ),
      );
    }
  };

  const keyResize = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const step = e.key === "ArrowUp" ? 0.1 : -0.1;
    setGuess((g) =>
      clamp(g + step, MIN_GUESS, maxGuessAt(pos, stageSize.current)),
    );
  };

  // ── styles: layout box (never transformed) vs. art (transformed) ──
  const boxStyle = (s: number): React.CSSProperties => ({
    position: "absolute",
    left: `${pos.x * 100}%`,
    bottom: pos.y,
    width: BASE_TARGET_WIDTH * s,
    height: BASE_TARGET_HEIGHT * s,
  });
  const artStyle = (s: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    bottom: 0,
    width: BASE_TARGET_WIDTH,
    height: BASE_TARGET_HEIGHT,
    transform: `scale(${s})`,
    transformOrigin: "bottom left",
    pointerEvents: "none", // the box receives the pointer, not the art
  });
  const tagStyle = (
    color: string,
    side: "left" | "right",
  ): React.CSSProperties => ({
    position: "absolute",
    bottom: "100%",
    [side]: 0,
    paddingBottom: 2,
    color,
    fontFamily: '"DM Mono", monospace',
    fontSize: 9,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  });

  return (
    <motion.section
      className="game-view"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <div className="game-title-block">
        <div className="game-title-row">
          <h1>
            Guessthesize <span>/ POP CULTURE</span>
          </h1>
          <button
            className="info-button"
            title="How to play"
            aria-label="How to play"
            onClick={onHowTo}
          >
            ?
          </button>
        </div>
        <p>Match the silhouette to its real-world scale.</p>
      </div>

      <div className="game-heading">
        <div>
          <div className="game-status">
            <span>ROUND {round + 1} / 5</span>
            <span>
              SCORE{" "}
              {roundResults.reduce((total, item) => total + item.score, 0)}
            </span>
          </div>
        </div>
        <div className="round-dots" aria-label={`Round ${round + 1} of 5`}>
          {[0, 1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              className={dot === round ? "active" : dot < round ? "done" : ""}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <div className="game-board">
        <div className="board-label">
          REFERENCE <strong>{puzzle.reference.name}</strong>
        </div>

        <div className="board-stage" ref={stageRef}>
          <div className="zoom-controls" aria-label="Canvas zoom controls">
            <button
              onClick={() =>
                setZoom((v) => Math.max(ZOOM_MIN, Number((v - 0.1).toFixed(2))))
              }
              aria-label="Zoom out"
            >
              −
            </button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() =>
                setZoom((v) => Math.min(ZOOM_MAX, Number((v + 0.1).toFixed(2))))
              }
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          {locked && revealed && (
            <motion.div
              className="round-result-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="result-card-kicker">ROUND RESULT</span>
              <strong>
                {revealed.score} <small>/ 100</small>
              </strong>
              <p>
                Your Answer:{" "}
                {formatMeasurement(revealed.estimate, puzzle.target.unit)}
              </p>
              <p>
                Actual: {formatMeasurement(revealed.actual, puzzle.target.unit)}{" "}
                ({puzzle.target.dimensionType})
              </p>
              <p>Off by {(revealed.error * 100).toFixed(0)}%</p>
            </motion.div>
          )}

          {/* Zoom layer. Everything inside is "stage space"; screen px / zoom = stage px. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${zoom})`,
              transformOrigin: "bottom center",
              pointerEvents: "none",
            }}
          >
            <div
              className="reference-object"
              style={{
                position: "absolute",
                left: "20%",
                bottom: 0,
                pointerEvents: "auto",
              }}
            >
              <ObjectSilhouette
                silhouette={puzzle.reference.silhouette}
                label={`${puzzle.reference.name} reference`}
                tone="reference"
              />
            </div>
            <div className="scale-line" aria-hidden="true" />

            {locked && (
              <div
                style={boxStyle(actualScale)}
                aria-label={`${puzzle.target.name} true scale`}
              >
                <div style={artStyle(actualScale)}>
                  <ObjectSilhouette
                    silhouette={puzzle.target.silhouette}
                    label={`${puzzle.target.name} true scale`}
                    tone="actual"
                  />
                </div>
                {/* Sibling of the art, so its offset is NOT multiplied by the scale */}
                <span style={tagStyle("var(--blueprint, #007bff)", "right")}>
                  TRUE SCALE
                </span>
              </div>
            )}

            <div
              className={`target-object ${dragging ? "is-dragging" : ""}`}
              style={{
                ...boxStyle(scale),
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                pointerEvents: locked ? "none" : "auto",
                cursor: locked ? "default" : dragging ? "grabbing" : "grab",
                transition: "none",
              }}
              onPointerDown={startMove}
              onPointerMove={onPointerMove}
              onPointerUp={endGesture}
              onPointerCancel={endGesture}
              onLostPointerCapture={endGesture}
              role="group"
              aria-label={`${puzzle.target.name} scalable target`}
            >
              <div style={artStyle(scale)}>
                <ObjectSilhouette
                  silhouette={puzzle.target.silhouette}
                  label={puzzle.target.name}
                  tone="target"
                />
              </div>

              {locked && (
                <span style={tagStyle("var(--accent, #ff5722)", "left")}>
                  Your guess
                </span>
              )}

              {!locked && (
                <button
                  className="resize-handle"
                  style={{
                    // Pinned to the real top-right corner of the layout box; only compensate for zoom.
                    position: "absolute",
                    top: 0,
                    right: 0,
                    left: "auto",
                    bottom: "auto",
                    transform: `translate(50%, -50%) scale(${1 / zoom})`,
                    transformOrigin: "center",
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    transition: "none",
                    zIndex: 100,
                  }}
                  aria-label="Drag up or down to resize the target"
                  title="Drag up or down to resize"
                  onPointerDown={startResize}
                  onPointerMove={onPointerMove}
                  onPointerUp={endGesture}
                  onPointerCancel={endGesture}
                  onLostPointerCapture={endGesture}
                  onKeyDown={keyResize}
                >
                  <span aria-hidden="true" style={{ pointerEvents: "none" }}>
                    ↖↘
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="board-label target-label">
          TARGET <strong>{puzzle.target.name}</strong>
          <small>
            {locked
              ? `Actual · ${formatMeasurement(puzzle.target.dimension, puzzle.target.unit)}`
              : "Drag freely to move · drag corner to resize"}
          </small>
        </div>
      </div>

      <div className="game-info-panel">
        <div>
          <span className="info-kicker">REFERENCE</span>
          <strong>
            <i className="legend-dot reference-dot" />
            {puzzle.reference.name}
          </strong>
          <small>{puzzle.reference.category} · Fixed position and scale</small>
        </div>
        <div>
          <span className="info-kicker">TARGET / GUESS</span>
          <strong>
            <i className="legend-dot target-dot" />
            {puzzle.target.name} ({puzzle.target.category})
          </strong>
          <small className="dimension-instruction">
            Adjust the {puzzle.target.dimensionType}
          </small>
        </div>
      </div>

      {!locked ? (
        <div className="control-panel">
          <button
            className="primary-button lock-button"
            onClick={() => onLock(guess)}
          >
            Lock in <span>↗</span>
          </button>
          <p className="keyboard-hint">
            Drag anywhere on the target to move freely · drag <kbd>↖↘</kbd> to
            resize
          </p>
        </div>
      ) : (
        <Reveal
          result={revealed}
          onContinue={onContinue}
          isLast={round === 4}
        />
      )}
      <ObjectLegend reference={puzzle.reference} target={puzzle.target} />
    </motion.section>
  );
}

function ObjectLegend({
  reference,
  target,
}: {
  reference: ScaleObject;
  target: ScaleObject;
}) {
  return (
    <div className="legend-row">
      <span>
        <i className="legend-dot reference-dot" />
        {reference.name}
      </span>
      <span>
        <i className="legend-dot target-dot" />
        {target.name}
      </span>
    </div>
  );
}

function Reveal({
  result,
  onContinue,
  isLast,
}: {
  result?: RoundResult;
  onContinue: () => void;
  isLast: boolean;
}) {
  if (!result) return null;
  return (
    <motion.div
      className="reveal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="reveal-stats">
        <div>
          <span>YOUR ANSWER</span>
          <strong>
            {formatMeasurement(result.estimate, result.puzzle.target.unit)}
          </strong>
        </div>
        <div>
          <span>ACTUAL</span>
          <strong>
            {formatMeasurement(result.actual, result.puzzle.target.unit)}
          </strong>
        </div>
        <div>
          <span>ERROR</span>
          <strong>{(result.error * 100).toFixed(0)}%</strong>
        </div>
        <div className="score-cell">
          <span>SCORE</span>
          <strong>{result.score}</strong>
        </div>
      </div>
      <p className="reveal-note">
        {result.puzzle.target.name} is measured by{" "}
        {result.puzzle.target.dimensionType}.
      </p>
      <button className="primary-button lock-button" onClick={onContinue}>
        {isLast ? "See results" : "Next round"}
        <span>↗</span>
      </button>
    </motion.div>
  );
}

function Results({
  result,
  onHome,
  onShare,
}: {
  result: GameResult;
  onHome: () => void;
  onShare: () => void;
}) {
  return (
    <motion.section
      className="results-view"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="results-top">
        <span className="eyebrow left">
          <i className="eyebrow-line" />
          GAME COMPLETE
        </span>
        <span className="result-date">
          {result.mode === "daily" ? "DAILY" : "PRACTICE"}
        </span>
      </div>
      <div className="score-hero">
        <span>TOTAL SCORE</span>
        <strong>
          {result.totalScore}
          <small> / 500</small>
        </strong>
        <p>
          {result.averageError < 0.1
            ? "Remarkably close."
            : "A useful measure of scale."}
        </p>
      </div>
      <div className="result-details">
        <div>
          <span>ROUNDS</span>
          <strong>{result.rounds.length}</strong>
        </div>
        <div>
          <span>AVERAGE ERROR</span>
          <strong>{(result.averageError * 100).toFixed(0)}%</strong>
        </div>
        <div>
          <span>MODE</span>
          <strong>{result.mode}</strong>
        </div>
      </div>
      <div className="round-results">
        {result.rounds.map((round, index) => (
          <div
            className="result-row"
            key={`${round.puzzle.target.id}-${index}`}
          >
            <span>0{index + 1}</span>
            <strong>{round.puzzle.target.name}</strong>
            <em>{formatMeasurement(round.actual, round.puzzle.target.unit)}</em>
            <b>{round.score}</b>
          </div>
        ))}
      </div>
      <div className="result-actions">
        <button className="secondary-button" onClick={onHome}>
          Back home
        </button>
        <button className="primary-button" onClick={onShare}>
          Share result<span>↗</span>
        </button>
      </div>
    </motion.section>
  );
}

function Home({
  stats,
  onStart,
  onHowTo,
}: {
  stats: Statistics;
  onStart: (mode: "daily" | "practice") => void;
  onHowTo: () => void;
}) {
  return (
    <motion.section
      className="home-view"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="eyebrow">
        <i className="eyebrow-line" />A GAME OF PROPORTION
        <i className="eyebrow-line" />
      </span>
      <h1>
        Guess the <em>size.</em>
      </h1>
      <p className="home-intro">
        Resize familiar silhouettes until they match reality.
        <br />
        Five objects. One reference. How close can you get?
      </p>
      <div className="home-actions">
        <button className="primary-button" onClick={() => onStart("daily")}>
          Play daily<span>↗</span>
        </button>
        <button
          className="secondary-button"
          onClick={() => onStart("practice")}
        >
          Practice<span>↗</span>
        </button>
      </div>
      <button className="text-button" onClick={onHowTo}>
        How to play<span>?</span>
      </button>
      <div className="stats-strip">
        <div className="stat">
          <span>GAMES PLAYED</span>
          <strong>{stats.gamesPlayed}</strong>
        </div>
        <div className="stat">
          <span>BEST SCORE</span>
          <strong>{stats.bestScore}</strong>
        </div>
        <div className="stat">
          <span>DAILY STREAK</span>
          <strong>{stats.currentStreak}</strong>
        </div>
        <div className="stat">
          <span>PERFECT ROUNDS</span>
          <strong>{stats.perfectRounds}</strong>
        </div>
      </div>
    </motion.section>
  );
}

function HowTo({ onBack }: { onBack: () => void }) {
  return (
    <motion.section
      className="how-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>
      <span className="eyebrow left">
        <i className="eyebrow-line" />
        HOW TO PLAY
      </span>
      <h2>
        Trust your <em>eye.</em>
      </h2>
      <div className="steps">
        <div className="step">
          <span>01</span>
          <h3>See the reference</h3>
          <p>A known object anchors every round.</p>
        </div>
        <div className="step">
          <span>02</span>
          <h3>Scale the target</h3>
          <p>Move and resize the silhouette.</p>
        </div>
        <div className="step">
          <span>03</span>
          <h3>Lock it in</h3>
          <p>Reveal the real measurement and score.</p>
        </div>
      </div>
    </motion.section>
  );
}

function App() {
  const today = new Date().toISOString().slice(0, 10);
  const initialRoute = window.location.pathname || "/";
  const initialMode = initialRoute === "/practice" ? "practice" : "daily";
  const [route, setRoute] = useState(initialRoute);
  const [stats, setStats] = useState<Statistics>(() => loadStatistics());
  const [mode, setMode] = useState<"daily" | "practice">(initialMode);
  const [puzzles, setPuzzles] = useState<Puzzle[]>(() =>
    initialRoute === "/daily"
      ? getDailyPuzzles()
      : initialRoute === "/practice"
        ? getRandomPracticePuzzles()
        : [],
  );
  const [round, setRound] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname || "/");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  };

  const startGame = (nextMode: "daily" | "practice") => {
    setMode(nextMode);
    setPuzzles(
      nextMode === "daily" ? getDailyPuzzles() : getRandomPracticePuzzles(),
    );
    setRound(0);
    setRoundResults([]);
    setResult(null);
    navigate(nextMode === "daily" ? "/daily" : "/practice");
  };

  const lockRound = (estimate: number) => {
    const puzzle = puzzles[round];
    if (!puzzle) return;
    const error = calculateRelativeError(estimate, puzzle.target.dimension);
    const nextResult: RoundResult = {
      puzzle,
      estimate,
      actual: puzzle.target.dimension,
      error,
      score: calculateScore(error),
    };
    setRoundResults((current) => [...current, nextResult]);
  };

  const continueGame = () => {
    if (round < puzzles.length - 1) {
      setRound((current) => current + 1);
      return;
    }
    const completed: GameResult = {
      mode,
      date: mode === "daily" ? today : undefined,
      totalScore: roundResults.reduce((total, item) => total + item.score, 0),
      averageError:
        roundResults.reduce((total, item) => total + item.error, 0) /
        roundResults.length,
      rounds: roundResults,
      completedAt: new Date().toISOString(),
    };
    const nextStats = updateStatistics(stats, completed);
    setStats(nextStats);
    saveGameResult(completed, nextStats);
    setResult(completed);
    navigate("/results");
  };

  const share = () => {
    if (result) void shareResult(result);
  };

  let content: React.ReactNode;
  if (route === "/how-to-play")
    content = <HowTo onBack={() => navigate("/")} />;
  else if (route === "/results" && result)
    content = (
      <Results result={result} onHome={() => navigate("/")} onShare={share} />
    );
  else if (
    (route === "/daily" || route === "/practice") &&
    puzzles.length &&
    puzzles[round]
  ) {
    content = (
      <Game
        key={`${mode}-${round}`}
        puzzle={puzzles[round]}
        round={round}
        locked={Boolean(roundResults[round])}
        onLock={lockRound}
        onContinue={continueGame}
        onHowTo={() => navigate("/how-to-play")}
        roundResults={roundResults}
      />
    );
  } else
    content = (
      <Home
        stats={stats}
        onStart={startGame}
        onHowTo={() => navigate("/how-to-play")}
      />
    );

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("/")}>
          <span className="brand-mark">+</span> SCALEGUESS
        </button>
        <span className="topbar-meta">
          <i className="live-dot" />
          {route === "/daily" ? "DAILY MODE" : "VISUAL PROPORTION"}
        </span>
      </header>
      <main className="main-content">
        <AnimatePresence mode="wait">{content}</AnimatePresence>
      </main>
      <footer className="footer">
        <span>ScaleGuess</span>
        <span>Make an educated guess</span>
      </footer>
    </div>
  );
}

export default App;
