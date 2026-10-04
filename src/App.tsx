/**
 * ScaleGuess — Single-Page Visual Size Estimation Game
 * First Playable Round Architecture
 */

import { useState, useCallback } from "react";
import type { Puzzle } from "./types";
import type { GamePhase, ScoringResult } from "./types/game";
import { PUZZLE_POOL, getObjectById, OBJECTS } from "./data/objects";
import { computeScore } from "./utils/scoring";
import { useTargetTransform } from "./hooks/useTargetTransform";
import { GameHeader } from "./components/game/GameHeader";
import { GameBoard } from "./components/game/GameBoard";
import { ControlPanel } from "./components/game/ControlPanel";
import { ResultView } from "./components/game/ResultView";
import "./App.css";

function getRandomPuzzle(excludeTargetId?: string): Puzzle {
  const pool = PUZZLE_POOL.filter((p) => p.targetId !== excludeTargetId);
  const selectedPool = pool.length > 0 ? pool : PUZZLE_POOL;
  const pair = selectedPool[Math.floor(Math.random() * selectedPool.length)];
  const reference = getObjectById(pair.referenceId) ?? OBJECTS[0];
  const target = getObjectById(pair.targetId) ?? OBJECTS[1];
  return { reference, target };
}

// Initial test puzzle: human (1.75m) vs elephant (3.2m) - rich, visible, intuitive comparison
const INITIAL_PUZZLE: Puzzle = {
  reference: getObjectById("human") ?? OBJECTS[0],
  target: getObjectById("elephant") ?? OBJECTS[1],
};

export function App() {
  const [phase, setPhase] = useState<GamePhase>("PLAYING");
  const [puzzle, setPuzzle] = useState<Puzzle>(INITIAL_PUZZLE);

  // Authoritative independent target transform: position & scale
  const {
    position,
    scale,
    isDragging,
    isResizing,
    moveHandlers,
    resizeHandlers,
    resetTransform,
  } = useTargetTransform({
    initialPosition: { x: 380, y: 0 },
    initialScale: 1.0,
    locked: phase === "RESULT",
  });

  // Captured round result state
  const [capturedGuessScale, setCapturedGuessScale] = useState<number | null>(null);
  const [resultData, setResultData] = useState<ScoringResult | null>(null);

  // Lock In action
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
    const nextPuzzle = getRandomPuzzle(puzzle.target.id);
    setPuzzle(nextPuzzle);
    setPhase("PLAYING");
    setCapturedGuessScale(null);
    setResultData(null);
    resetTransform({ x: 380, y: 0 }, 1.0);
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
          FIRST PLAYABLE ROUND
        </div>
      </header>

      {/* ── Main Single-Page Gameplay Stage ── */}
      <main className="main-content" role="main" id="main" style={{ padding: "30px 24px 60px", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        {/* Stage Header */}
        <GameHeader
          reference={puzzle.reference}
          target={puzzle.target}
          phase={phase}
        />

        {phase === "PLAYING" ? (
          <>
            {/* The Interactive Game Board Workspace */}
            <GameBoard
              reference={puzzle.reference}
              target={puzzle.target}
              targetPosition={position}
              targetScale={scale}
              locked={false}
              isDraggingTarget={isDragging}
              isResizingTarget={isResizing}
              targetMoveHandlers={moveHandlers}
              targetResizeHandlers={resizeHandlers}
            />

            {/* Lock In and Interaction Controls */}
            <ControlPanel
              reference={puzzle.reference}
              target={puzzle.target}
              onLockIn={handleLockIn}
            />
          </>
        ) : (
          resultData &&
          capturedGuessScale !== null && (
            /* Dedicated Result Comparison Showcase */
            <ResultView
              reference={puzzle.reference}
              target={puzzle.target}
              capturedGuessScale={capturedGuessScale}
              correctScale={resultData.correctScale}
              guessedDimension={resultData.guessedDimension}
              correctDimension={resultData.correctDimension}
              score={resultData.score}
              relativeError={resultData.relativeError}
              differenceFormatted={resultData.differenceFormatted}
              onPlayAgain={handlePlayNextRound}
            />
          )
        )}
      </main>

      {/* ── Minimal Footer ── */}
      <footer className="footer" role="contentinfo" style={{ marginTop: "auto", borderTop: "1px solid var(--border)", padding: "20px 24px", textAlign: "center", color: "var(--text-faint, #4a5c55)", fontSize: "12px", fontFamily: "var(--font-mono, monospace)" }}>
        ScaleGuess · Size Estimation Interaction Prototype
      </footer>
    </div>
  );
}

export default App;
