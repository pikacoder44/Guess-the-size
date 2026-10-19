import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { NotColorBlindGame } from "@/games/not-color-blind/NotColorBlindGame";
import type { GamePhase } from "@/games/not-color-blind/types";

interface NotColorBlindPageProps {
  onBackToHome: () => void;
}

export function NotColorBlindPage({ onBackToHome }: NotColorBlindPageProps) {
  const [phase, setPhase] = useState<GamePhase>("MEMORIZE");

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Sub-navigation & Header Bar */}
      <div className="flex items-center justify-between flex-nowrap shrink-0 gap-2 pb-3 border-b border-border/50 w-full overflow-hidden">
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
              Not Color Blind
            </span>
            <div className="flex items-center flex-nowrap shrink-0 gap-1.5 ml-1 whitespace-nowrap">
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 whitespace-nowrap shrink-0 inline-flex items-center">
                HSB Recall
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border hidden sm:inline-block whitespace-nowrap shrink-0">
                {phase === "MEMORIZE"
                  ? "Memorize"
                  : phase === "RECALL"
                  ? "Recall"
                  : "Match Result"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/70 hidden md:flex">
          <span>Perceptual Memory Recall</span>
        </div>
      </div>

      {/* Main Game Surface */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[440px]">
        <NotColorBlindGame onPhaseChange={setPhase} />
      </div>
    </main>
  );
}

export default NotColorBlindPage;
