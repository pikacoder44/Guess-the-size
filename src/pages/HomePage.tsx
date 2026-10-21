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
    <div className="relative min-h-[calc(100vh-4rem)] flex-1 flex flex-col bg-transparent">
      {/* ── Ambient Store Backdrop (Visible 50% opacity + custom radial vignette) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src="/assets/banners/store-bg.jpg"
          alt=""
          className="w-full h-full object-cover opacity-50 scale-105"
        />
        {/* Explicit radial gradient vignette so background texture is visible behind UI components */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, transparent 20%, rgba(10, 10, 10, 0.75) 75%, #0a0a0a 100%)'
          }} 
        />
      </div>

      {/* ── Main Homepage Layout ── */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8">
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
    </div>
  );
}

export default HomePage;