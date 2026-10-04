/**
 * ScaleGuess — App.tsx
 *
 * Architecture overview:
 * - App: routing + game orchestration
 * - Home, HowTo, Results: screen-level views
 * - Game: the main gameplay screen (remounted per round via key)
 * - TargetObject: wrapper + SVG + ResizeHandle (pointer-event resize)
 * - ReferenceObject: fixed silhouette
 * - ResizeHandle: separate HTML element, absolutely positioned top-right of wrapper
 *
 * Resize interaction:
 *   pointerdown → record startY, startScale
 *   pointermove → deltaY = startY - currentY; newScale = startScale + deltaY * sensitivity
 *   The wrapper dimensions = BASE_PX * scale * [1, aspectRatio]
 *   The handle sits at position: absolute; top: 0; right: 0
 *   No translateY changes. No position patching. No slider.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ObjectSilhouette } from "./components/ObjectSilhouette";
import {
  calculateRelativeError,
  calculateScore,
  formatMeasurement,
  getDailyPuzzles,
  getRandomPracticePuzzles,
  getTodayString,
  updateStatistics,
} from "./game";
import {
  loadStatistics,
  saveGameResult,
  loadDailyResult,
  hasDailyBeenCompleted,
} from "./storage";
import { shareResult } from "./share";
import type {
  GameMode,
  GameResult,
  Puzzle,
  RoundResult,
  ScaleObject,
  Statistics,
} from "./types";
import "./App.css";

// ─────────────────────────── Layout constants ─────────────────────────────────

/**
 * The reference object is rendered at a fixed pixel height.
 * All visual scaling is relative to this anchor.
 */
const REFERENCE_PX = 160; // px height of reference object on screen

/**
 * Resize sensitivity: px of upward drag → scale multiplier change.
 * Higher = faster resize.
 */
const DRAG_SENSITIVITY = 0.007;

const MIN_SCALE = 0.12;
const MAX_SCALE = 6.0;
const INITIAL_SCALE = 1.0;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// ─────────────────────────── Color tokens ────────────────────────────────────
const REFERENCE_COLOR = "#7cb8e8";
const TARGET_COLOR = "#e47b5f";
const ACTUAL_COLOR = "#6dc98a";

// ─────────────────────────── TargetObject ────────────────────────────────────

interface TargetObjectProps {
  object: ScaleObject;
  /** Rendered height of reference in px (establishes visual coordinate system) */
  referencePx: number;
  locked: boolean;
  onScaleChange?: (scale: number) => void;
  /** If set, render at this scale (reveal mode) */
  overrideScale?: number;
  color?: string;
  label?: string;
  showHandle?: boolean;
}

function TargetObject({
  object,
  referencePx,
  locked,
  onScaleChange,
  overrideScale,
  color = TARGET_COLOR,
  label,
  showHandle = true,
  position,
  onPositionChange,
}: TargetObjectProps & { position?: { x: number; y: number }; onPositionChange?: (pos: { x: number; y: number }) => void }) {
  // Scale is stored in a ref for performance — no React re-render on every pointer event
  const scaleRef = useRef(INITIAL_SCALE);
  const [renderScale, setRenderScale] = useState(INITIAL_SCALE);
  const dragRef = useRef<{ startY: number; startScale: number } | null>(null);
  
  // Position state for moving (fallback if uncontrolled)
  const [internalPos, setInternalPos] = useState({ x: 0, y: 0 });
  const currentPos = position ?? internalPos;
  const posRef = useRef(currentPos);
  
  useEffect(() => {
    posRef.current = currentPos;
  }, [currentPos]);

  const moveDragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const effectiveScale = overrideScale ?? renderScale;

  // Base pixel dimensions from reference
  // We want the target at scale=1 to represent "reference.dimension" units.
  // The reference SVG is rendered at referencePx tall.
  // target base height in px = referencePx * (target.dimension / reference.dimension... wait,
  // this would make scale=1 mean "same as reference" which isn't right.
  //
  // The initial visual scale is set so the target looks reasonable at scale=1.
  // We start at INITIAL_SCALE = 1.0 which maps to some base px height.
  //
  // Actually: base height = referencePx (so at scale 1 the target is same px as reference).
  // The guess is computed from scale * reference.dimension.
  // This means: guess = scale * reference.dimension
  // And actual = target.dimension
  // Score compares them as a ratio.
  const basePx = referencePx;
  const wrapperH = basePx * effectiveScale;
  const wrapperW = wrapperH * object.aspectRatio;

  // Notify parent of scale changes
  useEffect(() => {
    if (!overrideScale) onScaleChange?.(renderScale);
  }, [renderScale, overrideScale, onScaleChange]);

  // Pointer down on object to move it
  const handleMovePointerDown = useCallback((e: React.PointerEvent) => {
    if (locked) return;
    // Don't start move if clicking the resize handle
    if ((e.target as HTMLElement).closest('.resize-handle')) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    moveDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: posRef.current.x,
      startPosY: posRef.current.y,
    };
  }, [locked]);

  // Pointer move to drag object
  const handleMovePointerMove = useCallback((e: React.PointerEvent) => {
    if (!moveDragRef.current) return;
    e.preventDefault();
    const deltaX = e.clientX - moveDragRef.current.startX;
    const deltaY = moveDragRef.current.startY - e.clientY; // bottom-based: mouse up -> increase y
    
    const newX = Math.max(0, moveDragRef.current.startPosX + deltaX);
    const newY = Math.max(0, moveDragRef.current.startPosY + deltaY);
    
    if (onPositionChange) {
      onPositionChange({ x: newX, y: newY });
    } else {
      setInternalPos({ x: newX, y: newY });
    }
  }, [onPositionChange]);

  // Pointer up to stop moving
  const handleMovePointerUp = useCallback((e: React.PointerEvent) => {
    if (moveDragRef.current) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      moveDragRef.current = null;
    }
  }, []);

  // Pointer down on resize handle
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (locked) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startY: e.clientY,
        startScale: scaleRef.current,
      };
    },
    [locked],
  );

  // Pointer move: resize
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      e.preventDefault();
      const deltaY = dragRef.current.startY - e.clientY; // up = positive
      const newScale = clamp(
        dragRef.current.startScale + deltaY * DRAG_SENSITIVITY,
        MIN_SCALE,
        MAX_SCALE,
      );
      scaleRef.current = newScale;
      setRenderScale(newScale);
    },
    [],
  );

  // Pointer up: stop drag
  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Keyboard resize: Arrow Up/Down on the handle
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (locked) return;
      const step = e.shiftKey ? 0.1 : 0.03;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const newScale = clamp(scaleRef.current + step, MIN_SCALE, MAX_SCALE);
        scaleRef.current = newScale;
        setRenderScale(newScale);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const newScale = clamp(scaleRef.current - step, MIN_SCALE, MAX_SCALE);
        scaleRef.current = newScale;
        setRenderScale(newScale);
      }
    },
    [locked],
  );

  return (
    <div
      className="target-wrapper"
      ref={wrapperRef}
      style={{
        width: wrapperW,
        height: wrapperH,
        position: "absolute",
        left: currentPos.x,
        bottom: currentPos.y,
        cursor: locked ? 'default' : (moveDragRef.current ? 'grabbing' : 'grab'),
        touchAction: 'none',
        flexShrink: 0,
      }}
      onPointerDown={handleMovePointerDown}
      onPointerMove={handleMovePointerMove}
      onPointerUp={handleMovePointerUp}
      onPointerCancel={handleMovePointerUp}
      aria-label={label ?? object.name}
    >
      {/* The SVG silhouette fills the wrapper perfectly */}
      <div
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <ObjectSilhouette
          silhouette={object.silhouette}
          label={label ?? object.name}
          color={color}
        />
      </div>

      {/* Resize handle: absolutely positioned at top-right of wrapper */}
      {showHandle && !locked && (
        <div
          ref={handleRef}
          className="resize-handle"
          role="slider"
          aria-label={`Resize ${object.name}. Arrow Up to enlarge, Arrow Down to shrink.`}
          aria-valuenow={Math.round(effectiveScale * 100)}
          aria-valuemin={Math.round(MIN_SCALE * 100)}
          aria-valuemax={Math.round(MAX_SCALE * 100)}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onKeyDown={handleKeyDown}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M2 12L12 2M7 2h5v5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Game (one round) ────────────────────────────────

function Game({
  puzzle,
  round,
  locked,
  onLock,
  onContinue,
  roundResults,
}: {
  puzzle: Puzzle;
  round: number;
  locked: boolean;
  onLock: (estimate: number) => void;
  onContinue: () => void;
  roundResults: RoundResult[];
}) {
  const [scale, setScale] = useState(INITIAL_SCALE);
  const revealed = roundResults[round];
  const isLast = round === 4;
  const viewportRef = useRef<HTMLDivElement>(null);

  // Bottom-up coordinate system
  const START_X = 200; // Ref object position
  const GROUND_Y = 50;  // Pixels from bottom

  const [targetPos, setTargetPos] = useState({ x: START_X + 150, y: GROUND_Y });

  useEffect(() => {
    // Reset positions on new round
    setTargetPos({ x: START_X + 150, y: GROUND_Y });
    setScale(INITIAL_SCALE);
  }, [round]);

  // Compute the current estimate:
  // scale=1 means target is visually same height as reference.
  // So estimate = scale * reference.dimension
  const estimate = scale * puzzle.reference.dimension;

  // Compute the actual scale that the target should be displayed at after reveal:
  // actualScale = target.dimension / reference.dimension
  const actualScale = puzzle.target.dimension / puzzle.reference.dimension;

  const handleLock = () => {
    onLock(estimate);
  };

  return (
    <motion.section
      className="game-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22 }}
    >
      {/* ── Round Header ── */}
      <div className="round-header">
        <div className="round-meta">
          <span className="round-label">ROUND {round + 1} / 5</span>
          <div className="round-dots" aria-label={`Round ${round + 1} of 5`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={
                  i === round ? "dot dot-active" : i < round ? "dot dot-done" : "dot"
                }
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
        <div className="round-score-tally">
          <span>SCORE</span>
          <strong>
            {roundResults.reduce((t, r) => t + r.score, 0)}
          </strong>
          <span>/ {round * 100}</span>
        </div>
      </div>

      {/* ── Game Board ── */}
      <div className="game-board" aria-label="Game board" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', overflow: 'hidden' }}>
        {/* Column header row */}
        <div className="board-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
          <div className="board-col-header" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span className="col-tag reference-tag" style={{ font: '500 9px var(--font-mono)', letterSpacing: '0.16em', color: 'var(--ref-color)' }}>REFERENCE</span>
            <span className="col-name" style={{ fontSize: '14px', fontWeight: 700 }}>{puzzle.reference.name}</span>
          </div>
          <div className="board-col-header" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '5px', borderLeft: '1px solid var(--border)' }}>
            <span className="col-tag target-tag" style={{ font: '500 9px var(--font-mono)', letterSpacing: '0.16em', color: 'var(--target-color)' }}>TARGET</span>
            <span className="col-name" style={{ fontSize: '14px', fontWeight: 700 }}>{puzzle.target.name}</span>
          </div>
        </div>

        {/* Stage: Expandable canvas inside fixed viewport */}
        <div 
          className="board-stage-viewport" 
          ref={viewportRef}
          style={{ width: '100%', height: '450px', overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column-reverse' }}
        >
          <div 
            className="board-stage-canvas" 
            style={{
              position: 'relative',
              minWidth: '100%',
              minHeight: '100%',
              width: `${Math.max(100, targetPos.x + (REFERENCE_PX * scale * puzzle.target.aspectRatio) + 100)}px`,
              height: `${Math.max(100, targetPos.y + (REFERENCE_PX * scale) + 100)}px`,
              background: 'repeating-linear-gradient(0deg, transparent, transparent 39px, var(--border) 39px, var(--border) 40px)'
            }}
          >
            <div 
              className="stage-ground-line" 
              aria-hidden="true" 
              style={{ position: 'absolute', bottom: GROUND_Y, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, var(--ref-color) 50%, var(--target-color) 50%)', opacity: 0.3 }} 
            />
            <div 
              className="stage-divider" 
              aria-hidden="true" 
              style={{ position: 'absolute', top: 0, bottom: 0, left: START_X, width: '1px', background: 'var(--border)', opacity: 0.5 }} 
            />

            {/* Reference object — fixed, not resizable */}
            <div 
              className="reference-object"
              style={{ 
                position: 'absolute', 
                bottom: GROUND_Y, 
                left: START_X - 40, 
                transform: 'translateX(-100%)' 
              }}
            >
              <div
                style={{
                  width: REFERENCE_PX * puzzle.reference.aspectRatio,
                  height: REFERENCE_PX,
                  flexShrink: 0,
                }}
              >
                <ObjectSilhouette
                  silhouette={puzzle.reference.silhouette}
                  label={`${puzzle.reference.name} — reference`}
                  color={REFERENCE_COLOR}
                />
              </div>
            </div>

            {/* Target object area */}
            {locked && revealed ? (
              /* Reveal: show both guess (faded) and actual (highlighted) */
              <div 
                className="reveal-comparison"
                style={{ 
                  position: 'absolute', 
                  bottom: GROUND_Y, 
                  left: START_X + 40, 
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '24px'
                }}
              >
                <div className="reveal-guess-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.45 }}>
                  <div
                    className="reveal-obj"
                    style={{
                      width: Math.max(16, REFERENCE_PX * (revealed.estimate / puzzle.reference.dimension) * puzzle.target.aspectRatio),
                      height: Math.max(16, REFERENCE_PX * (revealed.estimate / puzzle.reference.dimension)),
                    }}
                    aria-label="Your guess"
                  >
                    <ObjectSilhouette
                      silhouette={puzzle.target.silhouette}
                      label="Your guess"
                      color={TARGET_COLOR}
                    />
                  </div>
                  <span className="reveal-tag guess-tag" style={{ font: '500 9px var(--font-mono)', color: 'var(--target-color)', background: 'rgba(228, 123, 95, 0.1)', padding: '3px 8px', borderRadius: '3px', whiteSpace: 'nowrap' }}>YOUR GUESS</span>
                </div>

                <motion.div
                  className="reveal-actual-wrap"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.35 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                >
                  <div
                    className="reveal-obj"
                    style={{
                      width: Math.max(16, REFERENCE_PX * actualScale * puzzle.target.aspectRatio),
                      height: Math.max(16, REFERENCE_PX * actualScale),
                    }}
                    aria-label="Actual size"
                  >
                    <ObjectSilhouette
                      silhouette={puzzle.target.silhouette}
                      label="Actual size"
                      color={ACTUAL_COLOR}
                    />
                  </div>
                  <span className="reveal-tag actual-tag" style={{ font: '500 9px var(--font-mono)', color: 'var(--actual-color)', background: 'rgba(109, 201, 138, 0.1)', padding: '3px 8px', borderRadius: '3px', whiteSpace: 'nowrap' }}>ACTUAL</span>
                </motion.div>
              </div>
            ) : (
              /* Playing: resizable target */
              <TargetObject
                key={`target-${round}`}
                object={puzzle.target}
                referencePx={REFERENCE_PX}
                locked={locked}
                onScaleChange={setScale}
                position={targetPos}
                onPositionChange={setTargetPos}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Controls / Reveal ── */}
      {!locked ? (
        <div className="control-panel">
          <button
            id={`lock-in-btn-${round}`}
            className="lock-button"
            onClick={handleLock}
            aria-label="Lock in your estimate"
          >
            Lock In
            <span className="lock-arrow" aria-hidden="true">↗</span>
          </button>
          <p className="control-hint">
            Drag <kbd>↗</kbd> handle up to enlarge · down to shrink
            <span className="hint-sep">·</span>
            keyboard: <kbd>↑</kbd> <kbd>↓</kbd>
          </p>
        </div>
      ) : (
        <RevealPanel
          result={revealed}
          onContinue={onContinue}
          isLast={isLast}
        />
      )}

      {/* ── Object Legend ── */}
      <ObjectLegend reference={puzzle.reference} target={puzzle.target} />
    </motion.section>
  );
}

// ─────────────────────────── Reveal Panel ────────────────────────────────────

function RevealPanel({
  result,
  onContinue,
  isLast,
}: {
  result?: RoundResult;
  onContinue: () => void;
  isLast: boolean;
}) {
  if (!result) return null;
  const pct = (result.error * 100).toFixed(1);
  const feedbackMessage =
    result.score === 100
      ? "Perfect — spot on!"
      : result.score >= 80
        ? "Very close!"
        : result.score >= 50
          ? "Not bad"
          : result.score >= 20
            ? "Off by quite a bit"
            : "Way off — ouch!";

  return (
    <motion.div
      className="reveal-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="reveal-stats">
        <div className="reveal-stat">
          <span>YOUR GUESS</span>
          <strong>
            {formatMeasurement(result.estimate, result.puzzle.target.unit)}
          </strong>
        </div>
        <div className="reveal-stat">
          <span>ACTUAL {result.puzzle.target.dimensionType.toUpperCase()}</span>
          <strong>
            {formatMeasurement(result.actual, result.puzzle.target.unit)}
          </strong>
        </div>
        <div className="reveal-stat">
          <span>ERROR</span>
          <strong>{pct}%</strong>
        </div>
        <div className="reveal-stat score-stat">
          <span>SCORE</span>
          <strong>{result.score}</strong>
          <small>/ 100</small>
        </div>
      </div>
      <p className="reveal-feedback">{feedbackMessage}</p>
      <button
        className="continue-button"
        onClick={onContinue}
        id={`continue-btn`}
      >
        {isLast ? "See results" : "Next round"}
        <span aria-hidden="true">→</span>
      </button>
    </motion.div>
  );
}

// ─────────────────────────── Object Legend ───────────────────────────────────

function ObjectLegend({
  reference,
  target,
}: {
  reference: ScaleObject;
  target: ScaleObject;
}) {
  return (
    <div className="legend" aria-label="Object descriptions">
      <div className="legend-item">
        <span
          className="legend-dot"
          style={{ background: REFERENCE_COLOR }}
          aria-hidden="true"
        />
        <div>
          <strong>{reference.name}</strong>
          <small>{reference.description}</small>
        </div>
      </div>
      <div className="legend-item">
        <span
          className="legend-dot"
          style={{ background: TARGET_COLOR }}
          aria-hidden="true"
        />
        <div>
          <strong>{target.name}</strong>
          <small>{target.description}</small>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Home ────────────────────────────────────────────

function Home({
  stats,
  onStart,
  onHowTo,
  dailyAlreadyPlayed,
  dailyScore,
}: {
  stats: Statistics;
  onStart: (mode: GameMode) => void;
  onHowTo: () => void;
  dailyAlreadyPlayed: boolean;
  dailyScore?: number;
}) {
  return (
    <motion.section
      className="home-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="home-hero">
        <p className="home-eyebrow">A GAME OF PROPORTION</p>
        <h1 className="home-title">
          Scale<em>Guess</em>
        </h1>
        <p className="home-tagline">How good is your sense of scale?</p>
      </div>

      <div className="home-actions">
        {dailyAlreadyPlayed ? (
          <div className="daily-complete-notice">
            <span className="notice-check">✓</span>
            <div>
              <strong>Today's challenge complete</strong>
              <small>Score: {dailyScore ?? "—"} / 500</small>
            </div>
          </div>
        ) : (
          <button
            id="btn-daily"
            className="primary-button"
            onClick={() => onStart("daily")}
          >
            Daily Challenge
            <span aria-hidden="true">↗</span>
          </button>
        )}
        <button
          id="btn-practice"
          className="secondary-button"
          onClick={() => onStart("practice")}
        >
          Practice
          <span aria-hidden="true">↗</span>
        </button>
        <button
          id="btn-how-to-play"
          className="text-link-button"
          onClick={onHowTo}
        >
          How to play
        </button>
      </div>

      <div className="stats-strip">
        <div className="stat-item">
          <span>GAMES</span>
          <strong>{stats.gamesPlayed}</strong>
        </div>
        <div className="stat-item">
          <span>BEST</span>
          <strong>{stats.bestScore || "—"}</strong>
        </div>
        <div className="stat-item">
          <span>STREAK</span>
          <strong>{stats.currentStreak}</strong>
        </div>
        <div className="stat-item">
          <span>PERFECT</span>
          <strong>{stats.perfectRounds}</strong>
        </div>
      </div>
    </motion.section>
  );
}

// ─────────────────────────── HowTo ───────────────────────────────────────────

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
      <h2 className="how-title">
        Trust your <em>eye.</em>
      </h2>
      <p className="how-subtitle">No ruler. No numbers. Just your instinct.</p>
      <div className="steps">
        <div className="step">
          <span className="step-num">01</span>
          <h3>See the reference</h3>
          <p>A known object anchors every round. Its size is fixed.</p>
        </div>
        <div className="step">
          <span className="step-num">02</span>
          <h3>Size it up</h3>
          <p>
            Drag the <strong>↗</strong> handle up or down to resize the target.
            Drag <strong>↑</strong> to grow, <strong>↓</strong> to shrink.
          </p>
        </div>
        <div className="step">
          <span className="step-num">03</span>
          <h3>Lock in</h3>
          <p>Commit to your estimate. The actual size is revealed.</p>
        </div>
        <div className="step">
          <span className="step-num">04</span>
          <h3>Score</h3>
          <p>
            The closer you are, the more points. Perfect within ~5%: 100 pts.
            Five rounds, 500 max.
          </p>
        </div>
      </div>
      <div className="how-keyboard">
        <h3>Keyboard shortcuts</h3>
        <table>
          <tbody>
            <tr>
              <td><kbd>↑</kbd></td>
              <td>Enlarge target (focus the resize handle)</td>
            </tr>
            <tr>
              <td><kbd>↓</kbd></td>
              <td>Shrink target</td>
            </tr>
            <tr>
              <td><kbd>Shift + ↑/↓</kbd></td>
              <td>Large step resize</td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

// ─────────────────────────── Results ─────────────────────────────────────────

function Results({
  result,
  onHome,
  onPractice,
  onShare,
  shareStatus,
}: {
  result: GameResult;
  onHome: () => void;
  onPractice: () => void;
  onShare: () => void;
  shareStatus: "idle" | "shared" | "copied";
}) {
  const performanceLabel =
    result.totalScore >= 450
      ? "Exceptional sense of scale."
      : result.totalScore >= 350
        ? "Strong spatial intuition."
        : result.totalScore >= 250
          ? "A decent eye for scale."
          : result.totalScore >= 150
            ? "Room for improvement."
            : "Keep practicing!";

  return (
    <motion.section
      className="results-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="results-header">
        <span className="results-mode">
          {result.mode === "daily" ? `DAILY · ${result.date}` : "PRACTICE"}
        </span>
        <h2 className="results-title">
          {result.mode === "daily" ? "Daily Complete" : "Game Over"}
        </h2>
      </div>

      <div className="score-hero">
        <div className="score-number">
          <strong>{result.totalScore}</strong>
          <span>/ 500</span>
        </div>
        <p className="score-label">{performanceLabel}</p>
      </div>

      <div className="result-meta">
        <div className="result-meta-item">
          <span>AVG ERROR</span>
          <strong>{(result.averageError * 100).toFixed(1)}%</strong>
        </div>
        <div className="result-meta-item">
          <span>BEST ROUND</span>
          <strong>{Math.max(...result.rounds.map((r) => r.score))}</strong>
        </div>
        <div className="result-meta-item">
          <span>ROUNDS</span>
          <strong>{result.rounds.length}</strong>
        </div>
      </div>

      <div className="round-breakdown">
        {result.rounds.map((r, i) => (
          <div className="breakdown-row" key={`${r.puzzle.target.id}-${i}`}>
            <span className="breakdown-num">0{i + 1}</span>
            <strong className="breakdown-name">{r.puzzle.target.name}</strong>
            <div className="breakdown-bar-wrap">
              <div
                className="breakdown-bar"
                style={{ width: `${r.score}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="breakdown-score">{r.score}</span>
          </div>
        ))}
      </div>

      <div className="results-actions">
        <button
          id="btn-share"
          className="primary-button"
          onClick={onShare}
        >
          {shareStatus === "copied"
            ? "Copied!"
            : shareStatus === "shared"
              ? "Shared!"
              : "Share result"}
          <span aria-hidden="true">↗</span>
        </button>
        <button
          id="btn-practice-results"
          className="secondary-button"
          onClick={onPractice}
        >
          Practice
        </button>
        <button
          id="btn-home"
          className="text-link-button"
          onClick={onHome}
        >
          Back home
        </button>
      </div>
    </motion.section>
  );
}

// ─────────────────────────── App ─────────────────────────────────────────────

type Route = "/" | "/daily" | "/practice" | "/how-to-play" | "/results";

function App() {
  const today = getTodayString();
  const [route, setRoute] = useState<Route>(
    (window.location.pathname as Route) || "/",
  );
  const [stats, setStats] = useState<Statistics>(() => loadStatistics());
  const [mode, setMode] = useState<GameMode>("daily");
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [round, setRound] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [result, setResult] = useState<GameResult | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied">("idle");

  // Check daily completion
  const todayResult = loadDailyResult(today);
  const dailyAlreadyPlayed = hasDailyBeenCompleted(today);

  useEffect(() => {
    const onPop = () => setRoute((window.location.pathname as Route) || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (path: Route) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  };

  const startGame = (nextMode: GameMode) => {
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
    setRoundResults((prev) => [...prev, nextResult]);
  };

  const continueGame = () => {
    if (round < puzzles.length - 1) {
      setRound((r) => r + 1);
      return;
    }
    const allResults = roundResults; // already has the last result
    const completed: GameResult = {
      mode,
      date: mode === "daily" ? today : undefined,
      totalScore: allResults.reduce((t, r) => t + r.score, 0),
      averageError:
        allResults.reduce((t, r) => t + r.error, 0) / allResults.length,
      rounds: allResults,
      completedAt: new Date().toISOString(),
    };
    const nextStats = updateStatistics(stats, completed, mode);
    setStats(nextStats);
    saveGameResult(completed, nextStats);
    setResult(completed);
    navigate("/results");
  };

  const handleShare = async () => {
    if (!result) return;
    const status = await shareResult(result);
    setShareStatus(status === "shared" ? "shared" : status === "copied" ? "copied" : "idle");
    setTimeout(() => setShareStatus("idle"), 3000);
  };

  // ── Routing ──
  let content: React.ReactNode;

  if (route === "/how-to-play") {
    content = <HowTo key="how" onBack={() => navigate("/")} />;
  } else if (route === "/results" && result) {
    content = (
      <Results
        key="results"
        result={result}
        onHome={() => navigate("/")}
        onPractice={() => startGame("practice")}
        onShare={handleShare}
        shareStatus={shareStatus}
      />
    );
  } else if (
    (route === "/daily" || route === "/practice") &&
    puzzles.length > 0 &&
    puzzles[round]
  ) {
    content = (
      <Game
        key={`game-${mode}-${round}`}
        puzzle={puzzles[round]}
        round={round}
        locked={Boolean(roundResults[round])}
        onLock={lockRound}
        onContinue={continueGame}
        roundResults={roundResults}
      />
    );
  } else {
    content = (
      <Home
        key="home"
        stats={stats}
        onStart={startGame}
        onHowTo={() => navigate("/how-to-play")}
        dailyAlreadyPlayed={dailyAlreadyPlayed}
        dailyScore={todayResult?.totalScore}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar" role="banner">
        <button
          className="brand"
          onClick={() => navigate("/")}
          aria-label="ScaleGuess home"
        >
          <span className="brand-mark" aria-hidden="true">⊕</span>
          ScaleGuess
        </button>
        <span className="topbar-badge" aria-live="polite">
          <span className="live-dot" aria-hidden="true" />
          {route === "/daily" ? "DAILY MODE" : route === "/practice" ? "PRACTICE" : "VISUAL SCALE"}
        </span>
      </header>

      <main className="main-content" role="main" id="main">
        <AnimatePresence mode="wait">{content}</AnimatePresence>
      </main>

      <footer className="footer" role="contentinfo">
        <span>ScaleGuess</span>
        <span>How good is your sense of scale?</span>
      </footer>
    </div>
  );
}

export default App;
