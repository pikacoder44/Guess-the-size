import { useState, useCallback } from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { NotColorBlindGame } from "./NotColorBlindGame";
import { NotColorBlindLeaderboardModal } from "./NotColorBlindLeaderboardModal";
import {
  getNotColorBlindPersonalBest,
  type NotColorBlindScoreRecord,
} from "@/lib/notColorBlindApi";

export interface NotColorBlindPageProps {
  onBackToHome: () => void;
  onNavigateLeaderboard?: () => void;
}

export function NotColorBlindPage({ onBackToHome, onNavigateLeaderboard }: NotColorBlindPageProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [personalBest, setPersonalBest] = useState<number>(() => getNotColorBlindPersonalBest());

  const handleScoreSubmitted = useCallback((record: NotColorBlindScoreRecord) => {
    setPersonalBest((prev) => Math.max(prev, record.score));
  }, []);

  const handleOpenLeaderboard = useCallback(() => {
    if (onNavigateLeaderboard) {
      onNavigateLeaderboard();
    } else {
      setShowLeaderboard(true);
    }
  }, [onNavigateLeaderboard]);

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
          </div>

          {personalBest > 0 && (
            <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
              <span className="opacity-70">Best:</span>
              <span>{personalBest}/500</span>
            </div>
          )}
        </div>

        {/* Global Leaderboard Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenLeaderboard}
            className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer shrink-0"
            aria-label="Open Leaderboard"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Main Game Surface */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-110">
        <NotColorBlindGame
          onScoreSubmitted={handleScoreSubmitted}
          onOpenLeaderboard={handleOpenLeaderboard}
          onBackToHome={onBackToHome}
        />
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <NotColorBlindLeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}
    </main>
  );
}

export default NotColorBlindPage;
