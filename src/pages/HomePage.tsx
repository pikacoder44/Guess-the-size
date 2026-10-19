import { useState } from "react";
import { Trophy } from "lucide-react";
import { HeroSection } from "@/components/home/HeroSection";
import { PlayerStats } from "@/components/home/PlayerStats";
import { GameSection } from "@/components/home/GameSection";
import { LeaderboardModal } from "@/components/leaderboard/LeaderboardModal";
import type { AppRoute } from "@/App";

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleCardNavigate = (href: string) => {
    if (href === "/scaleGuess" || href === "/scaleguess") {
      onNavigate("scaleGuess");
    } else if (href === "/notColorBlind" || href === "/notcolorblind") {
      onNavigate("notColorBlind");
    } else if (href === "/leaderboard") {
      onNavigate("leaderboard");
    } else if (href === "/login") {
      onNavigate("login");
    } else if (href === "/register") {
      onNavigate("register");
    } else {
      history.pushState(null, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Player Stats */}
      <PlayerStats />

      {/* 3. Game Cards + Leaderboard trigger */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Games</span>
        <button
          type="button"
          id="open-leaderboard-btn"
          onClick={() => onNavigate("leaderboard")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
        >
          <Trophy className="w-3.5 h-3.5 text-primary group-hover:scale-105 transition-transform" />
          <span>Global Leaderboard</span>
        </button>
      </div>
      <GameSection onNavigate={handleCardNavigate} />

      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}

export default HomePage;
