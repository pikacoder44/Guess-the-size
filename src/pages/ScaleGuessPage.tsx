import { useGame } from "@/game/useGame";
import { GameBoard } from "@/components/game/GameBoard";
import { ResultPanel } from "@/components/game/ResultPanel";
import { ArrowLeft, HelpCircle, Trophy } from "lucide-react";

interface ScaleGuessPageProps {
  onBackToHome: () => void;
  onNavigateLeaderboard?: () => void;
}

export function ScaleGuessPage({ onBackToHome, onNavigateLeaderboard }: ScaleGuessPageProps) {
  const game = useGame();
  const { state } = game;
  const playing = state?.phase === "PLAYING";

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
      {/* Sub-navigation & Header Bar */}
      <div className="flex items-center justify-between flex-nowrap shrink-0 gap-2 pb-2 border-b border-border/50 w-full overflow-hidden">
        <div className="flex items-center flex-nowrap shrink-0 gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 sm:px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">All Games</span>
          </button>

          <div className="flex items-center flex-nowrap shrink-0 gap-1.5 sm:gap-2">
            <span className="font-display font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0 whitespace-nowrap">
              ScaleGuess
            </span>
            <div className="flex items-center flex-nowrap shrink-0 gap-1.5 ml-1 whitespace-nowrap">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 whitespace-nowrap shrink-0 inline-flex items-center">
                {`Round ${state?.currentRound ?? 1} / ${state?.totalRounds ?? 5}`}
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border hidden md:inline-block whitespace-nowrap shrink-0">
                {playing
                  ? "Estimating"
                  : state?.phase === "FINISHED"
                    ? "Game Complete"
                    : "Round Result"}
              </span>
            </div>
          </div>
        </div>

        {/* Puzzle Target Info & Progress HUD */}
        {state && (
          <div className="flex items-center flex-nowrap shrink-0 gap-2 sm:gap-3 text-xs font-mono ml-auto">
            {/* Visual round progress pips */}
            <div className="hidden lg:flex items-center gap-1.5 shrink-0" aria-label="Round progress">
              {Array.from({ length: state.totalRounds }).map((_, idx) => {
                const roundNum = idx + 1;
                const isPast =
                  roundNum < state.currentRound ||
                  (state.phase === "FINISHED" && roundNum <= state.roundScores.length);
                const isCurrent = state.currentRound === roundNum && state.phase !== "FINISHED";
                return (
                  <div
                    key={roundNum}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shrink-0 ${
                      isPast
                        ? "bg-primary shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                        : isCurrent
                          ? "bg-primary/40 ring-2 ring-primary ring-offset-1 ring-offset-background scale-110"
                          : "bg-secondary border border-border/80"
                    }`}
                    title={`Round ${roundNum}`}
                  />
                );
              })}
            </div>

            {/* Running Total Score */}
            {state.roundScores.length > 0 && (
              <div className="flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded border border-border/70 text-foreground shrink-0 whitespace-nowrap">
                <span className="text-[10px] text-muted-foreground uppercase">Score:</span>
                <span className="font-bold text-primary">{state.totalScore}</span>
                <span className="text-[10px] text-muted-foreground">/500</span>
              </div>
            )}

            <div className="flex items-center flex-nowrap gap-1.5 shrink-0 whitespace-nowrap">
              <span className="text-muted-foreground uppercase text-[10px] hidden sm:inline">
                Ref:
              </span>
              <span className="font-medium text-foreground bg-secondary/60 px-2 py-0.5 rounded border border-border/50 truncate max-w-[80px] sm:max-w-none">
                {state.puzzle.reference.name}
              </span>
              <span className="text-muted-foreground opacity-30">vs</span>
              <span className="text-muted-foreground uppercase text-[10px] hidden sm:inline">
                Target:
              </span>
              <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 truncate max-w-[80px] sm:max-w-none">
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
              onNextRound={() => game.nextRound()}
              onPlayAgain={() => game.restartGame()}
              onNavigateLeaderboard={onNavigateLeaderboard}
            />
          )
        )}

        {/* Secondary Global Leaderboard button directly below interaction block */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1">
          <div className="text-[11px] font-mono text-muted-foreground/60 hidden sm:block">
            High stakes spatial challenge · Calibrated precision
          </div>
          <button
            type="button"
            id="game-leaderboard-cta"
            onClick={onNavigateLeaderboard}
            className="group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card/35 hover:bg-card/75 border border-border/60 hover:border-amber-400/70 hover:shadow-[0_0_20px_rgba(245,158,11,0.22)] backdrop-blur-md text-xs font-medium text-muted-foreground hover:text-amber-300 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer ml-auto sm:ml-0 overflow-hidden"
            aria-label="View Global Leaderboard"
          >
            {/* Shimmer sweep effect on button hover */}
            <span
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-amber-400/15 to-transparent -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none"
              aria-hidden="true"
            />
            <Trophy className="w-4 h-4 text-amber-400/80 group-hover:text-amber-400 group-hover:scale-110 transition-all duration-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
            <span className="font-semibold tracking-wide">Global Leaderboard</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 group-hover:bg-amber-400/25 group-hover:border-amber-400/50 transition-colors">
              Hall of Fame
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default ScaleGuessPage;
