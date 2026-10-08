import { useGame } from "@/game/useGame";
import { GameBoard } from "@/components/game/GameBoard";
import { ResultPanel } from "@/components/game/ResultPanel";
import { pickRandomPuzzle } from "@/game/puzzles";
import { ArrowLeft, HelpCircle } from "lucide-react";

interface ScaleGuessPageProps {
  onBackToHome: () => void;
}

export function ScaleGuessPage({ onBackToHome }: ScaleGuessPageProps) {
  const game = useGame();
  const { state } = game;
  const playing = state?.phase === "PLAYING";

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
      {/* Sub-navigation & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Games</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              ScaleGuess
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary text-primary border border-border">
              {playing ? "Estimating" : "Result"}
            </span>
          </div>
        </div>

        {/* Puzzle Target Info */}
        {state && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground uppercase text-[10px]">
                Ref:
              </span>
              <span className="font-medium text-foreground bg-secondary/60 px-2 py-0.5 rounded border border-border/50">
                {state.puzzle.reference.name}
              </span>
            </div>
            <span className="text-muted-foreground opacity-30">vs</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground uppercase text-[10px]">
                Target:
              </span>
              <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                {state.puzzle.target.name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* The Primary Game Board */}
      <GameBoard game={game} />

      {/* Bottom Controls & Result Panel */}
      <div className="flex flex-col gap-4 pt-1">
        {playing ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/40 border border-border/60 p-3 sm:p-4 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              <p>
                Drag target to reposition · Drag top-right handle to resize (or use Arrow keys &amp; +/-)
              </p>
            </div>
            <button
              type="button"
              className="lock-btn w-full sm:w-auto shadow-md shadow-primary/20 cursor-pointer"
              onClick={game.lockIn}
              disabled={!state}
            >
              Lock In Guess
            </button>
          </div>
        ) : (
          state && (
            <ResultPanel
              state={state}
              onNextRound={() =>
                game.init(pickRandomPuzzle(state.puzzle.id), state.viewport)
              }
            />
          )
        )}
      </div>
    </main>
  );
}

export default ScaleGuessPage;
