import { useGame } from "@/game/useGame";
import { GameBoard } from "@/components/game/GameBoard";
import { CameraControls } from "@/components/game/CameraControls";
import { ResultPanel } from "@/components/game/ResultPanel";
import { pickRandomPuzzle } from "@/game/puzzles";

export function App() {
  const game = useGame();
  const { state } = game;
  const playing = state?.phase === "PLAYING";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* ── Topbar ── */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-display tracking-tight text-primary">
              ScaleGuess
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
            {playing ? "Estimating" : "Result"}
          </span>
        </div>

        <CameraControls game={game} />
      </header>

      {/* ── Main Game Area ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {state && (
          <div className="flex items-center justify-between px-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Reference:</span>
              <span className="font-medium text-foreground">{state.puzzle.reference.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Target:</span>
              <span className="font-semibold text-primary">{state.puzzle.target.name}</span>
            </div>
          </div>
        )}

        {/* ── The Primary Game Board ── */}
        <GameBoard game={game} />

        {/* ── Bottom Controls & Result Panel ── */}
        <div className="flex flex-col gap-4 pt-1">
          {playing ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Drag the target to move · Drag handle at top-right to resize (or use arrow keys and +/-)
              </p>
              <button
                type="button"
                className="lock-btn w-full sm:w-auto"
                onClick={game.lockIn}
                disabled={!state}
              >
                Lock In
              </button>
            </div>
          ) : (
            state && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                <ResultPanel state={state} />
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="lock-btn"
                    onClick={() => game.init(pickRandomPuzzle(), state.viewport)}
                  >
                    Next Round →
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-3 text-center text-xs text-muted-foreground font-mono">
        ScaleGuess · Size Estimation
      </footer>
    </div>
  );
}

export default App;
