/**
 * ScaleGuess — Single-Page Visual Size Estimation Game
 * Fixed Canvas & Intelligent Camera Zoom Architecture
 */

import { useState, useCallback, useRef } from "react";
import type { Puzzle } from "./types";
import type { GamePhase, ScoringResult } from "./types/game";
import { BALANCED_PUZZLES, getObjectById, OBJECTS } from "./data/objects";
import { computeScore } from "./utils/scoring";
import { useTargetTransform } from "./hooks/useTargetTransform";
import { GameHeader } from "./components/game/GameHeader";
import { GameBoard, REFERENCE_PX, GROUND_Y, FIXED_CANVAS_HEIGHT } from "./components/game/GameBoard";
import { ControlPanel } from "./components/game/ControlPanel";
import { ResultView } from "./components/game/ResultView";
import "./App.css";

// Select balanced, visually manageable puzzle pairs (ratio 0.3x - 3.0x, e.g. car vs bus, dog vs horse)
function getRandomBalancedPuzzle(excludeTargetId?: string): Puzzle {
  const pool = BALANCED_PUZZLES.filter((p) => p.targetId !== excludeTargetId);
  const selectedPool = pool.length > 0 ? pool : BALANCED_PUZZLES;
  const pair = selectedPool[Math.floor(Math.random() * selectedPool.length)];
  const reference = getObjectById(pair.referenceId) ?? OBJECTS[0];
  const target = getObjectById(pair.targetId) ?? OBJECTS[1];
  return { reference, target };
}

// Initial puzzle: Car (4.1m) vs Bus (12.0m) — classic, visually comparable, challenging
const INITIAL_PUZZLE: Puzzle = {
  reference: getObjectById("car") ?? OBJECTS[0],
  target: getObjectById("bus") ?? OBJECTS[1],
};

export function App() {
  const [phase, setPhase] = useState<GamePhase>("PLAYING");
  const [puzzle, setPuzzle] = useState<Puzzle>(INITIAL_PUZZLE);

  // Fit Both camera callback ref
  const fitBothRef = useRef<() => void>(() => {});

  // Authoritative independent target transform: position & scale with canvas boundary clamping
  const {
    position,
    scale,
    isDragging,
    isResizing,
    moveHandlers,
    resizeHandlers,
    resetTransform,
  } = useTargetTransform({
    initialPosition: { x: 340, y: 0 },
    initialScale: 1.0,
    locked: phase === "RESULT",
    canvasBounds: {
      width: 880,
      height: FIXED_CANVAS_HEIGHT,
      groundY: GROUND_Y,
      referencePx: REFERENCE_PX,
      aspectRatio: puzzle.target.aspectRatio,
    },
  });

  // Captured round result state
  const [capturedGuessScale, setCapturedGuessScale] = useState<number | null>(null);
  const [resultData, setResultData] = useState<ScoringResult | null>(null);

  // Lock In action: captures guess scale, freezes gameplay, switches to RESULT
  const handleLockIn = useCallback(() => {
    if (phase !== "PLAYING") return;

    const currentGuess = scale;
    const scoreResult = computeScore(currentGuess, puzzle.reference, puzzle.target);

    setCapturedGuessScale(currentGuess);
    setResultData(scoreResult);
    setPhase("RESULT");
  }, [phase, scale, puzzle]);

  // Play next test round action
  const handlePlayNextRound = useCallback(() => {
    const nextPuzzle = getRandomBalancedPuzzle(puzzle.target.id);
    setPuzzle(nextPuzzle);
    setPhase("PLAYING");
    setCapturedGuessScale(null);
    setResultData(null);
    resetTransform({ x: 340, y: 0 }, 1.0);
  }, [puzzle.target.id, resetTransform]);

  return (
    <div className="app-shell">
      {/* ── Topbar Brand ── */}
      <header className="topbar" role="banner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">⊕</span>
          ScaleGuess
        </div>
        <div className="topbar-badge" aria-live="polite">
          <span className="live-dot" aria-hidden="true" />
          {phase === "PLAYING" ? "SINGLE-ROUND TEST" : "RESULT OVERLAY"}
        </div>
      </header>

      {/* ── Main Single-Page Gameplay Stage ── */}
      <main
        className="main-content"
        role="main"
        id="main"
        style={{
          padding: "24px 20px 48px",
          maxWidth: "920px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Stage Header */}
        <GameHeader
          reference={puzzle.reference}
          target={puzzle.target}
          phase={phase}
        />

        {/* ── The Fixed Canvas Game Board (Active in both PLAYING and RESULT) ── */}
        <GameBoard
          reference={puzzle.reference}
          target={puzzle.target}
          targetPosition={position}
          targetScale={scale}
          phase={phase}
          capturedGuessScale={capturedGuessScale}
          correctScale={resultData?.correctScale}
          guessedDimension={resultData?.guessedDimension}
          correctDimension={resultData?.correctDimension}
          isDraggingTarget={isDragging}
          isResizingTarget={isResizing}
          targetMoveHandlers={moveHandlers}
          targetResizeHandlers={resizeHandlers}
          onRegisterFitBoth={(fn) => {
            fitBothRef.current = fn;
          }}
        />

        {/* ── Controls / Result Panels ── */}
        {phase === "PLAYING" ? (
          <ControlPanel
            reference={puzzle.reference}
            target={puzzle.target}
            onLockIn={handleLockIn}
          />
        ) : (
          resultData &&
          capturedGuessScale !== null && (
            <ResultView
              reference={puzzle.reference}
              target={puzzle.target}
              score={resultData.score}
              relativeError={resultData.relativeError}
              differenceFormatted={resultData.differenceFormatted}
              onFitBoth={() => fitBothRef.current()}
              onPlayAgain={handlePlayNextRound}
            />
          )
        )}
      </main>

      {/* ── Minimal Footer ── */}
      <footer
        className="footer"
        role="contentinfo"
        style={{
          marginTop: "auto",
          borderTop: "1px solid var(--border)",
          padding: "16px 20px",
          textAlign: "center",
          color: "var(--text-faint, #4a5c55)",
          fontSize: "11px",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        ScaleGuess · Fixed Canvas & Intelligent Camera Zoom
      </footer>
    </div>
  );
}

export default App;
