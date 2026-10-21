import { useState } from "react";
import { HeroSpotlight } from "@/components/home/HeroSpotlight";
import { GameSection } from "@/components/home/GameSection";
import { ActivitySidebar } from "@/components/home/ActivitySidebar";
import type { AppRoute } from "@/App";

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
  searchQuery?: string;
}

export function HomePage({ onNavigate, searchQuery: externalSearchQuery }: HomePageProps) {
  const [localSearchQuery] = useState("");
  const activeSearchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;

  const handleCardNavigate = (href: string) => {
    const cleanHref = href.toLowerCase().replace(/\/+$/, "");
    if (cleanHref === "/games/scale-guess" || cleanHref === "/scaleguess") {
      onNavigate("scaleGuess");
    } else if (
      cleanHref === "/games/not-color-blind" ||
      cleanHref === "/notcolorblind"
    ) {
      onNavigate("notColorBlind");
    } else if (
      cleanHref === "/games/scale-guess/leaderboard" ||
      cleanHref === "/scaleguess/leaderboard" ||
      cleanHref === "/leaderboard"
    ) {
      onNavigate("scaleGuessLeaderboard");
    } else if (
      cleanHref === "/games/not-color-blind/leaderboard" ||
      cleanHref === "/notcolorblind/leaderboard"
    ) {
      onNavigate("notColorBlindLeaderboard");
    } else if (cleanHref === "/profile") {
      onNavigate("profile");
    } else {
      history.pushState(null, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8">
      {/* ── 1. Hero Spotlight Carousel / Banner (Top Section) ── */}
      <HeroSpotlight onNavigate={handleCardNavigate} />

      {/* ── 2. Store Showcase & Quick Dashboard Split Layout (Steam Style) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column (8 cols): Game Library Grid */}
        <div className="lg:col-span-8 w-full">
          <GameSection
            onNavigate={handleCardNavigate}
            searchQuery={activeSearchQuery}
          />
        </div>

        {/* Sidebar Column (4 cols): Player Activity & Quick Stats */}
        <div className="lg:col-span-4 w-full">
          <ActivitySidebar onNavigate={handleCardNavigate} />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
