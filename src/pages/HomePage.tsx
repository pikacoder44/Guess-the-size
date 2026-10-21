import { useState } from "react";
import { LauncherSidebar } from "@/components/home/LauncherSidebar";
import { LauncherHero } from "@/components/home/LauncherHero";
import { LauncherCatalog } from "@/components/home/LauncherCatalog";
import { LAUNCHER_GAMES } from "@/components/home/launcherData";
import { useAuth } from "@/context/AuthContext";
import type { AppRoute } from "@/App";

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
  searchQuery?: string;
}

export function HomePage({
  onNavigate,
  searchQuery: externalSearchQuery,
}: HomePageProps) {
  const { isAuthenticated, openLogin } = useAuth();
  const [selectedGameId, setSelectedGameId] = useState<string>("scale-guess");
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);
  const [localSearchQuery, setLocalSearchQuery] = useState<string>("");

  const activeSearchQuery =
    externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;

  const activeGame =
    LAUNCHER_GAMES.find((g) => g.id === selectedGameId) || LAUNCHER_GAMES[0];

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
    } else if (cleanHref === "/login") {
      onNavigate("login");
    } else {
      history.pushState(null, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      onNavigate("profile");
    } else {
      openLogin();
    }
  };

  const handleSearchToggle = () => {
    setIsSearchVisible((prev) => !prev);
    const catalogElement = document.getElementById("store-catalog");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-neutral-100 flex overflow-x-hidden selection:bg-neutral-800">
      {/* ── A. Left Vertical Sidebar (Fixed Navigation 1:1 inspo.jpg) ── */}
      <LauncherSidebar
        games={LAUNCHER_GAMES}
        activeGameId={selectedGameId}
        onSelectGame={(id) => setSelectedGameId(id)}
        onProfileClick={handleProfileClick}
        onSearchClick={handleSearchToggle}
        isSearchActive={isSearchVisible}
      />

      {/* ── Main Launcher Workspace (offset by sidebar width w-16 md:w-20) ── */}
      <main className="flex-1 ml-16 md:ml-20 flex flex-col min-h-screen relative z-10">
        {/* ── B. Full-Bleed Hero Stage (Top 70vh 1:1 inspo.jpg) ── */}
        <LauncherHero
          game={activeGame}
          onPlayGame={handleCardNavigate}
          onViewLeaderboard={handleCardNavigate}
        />

        {/* ── C. Lower Store Catalog Section (1:1 inspo.jpg) ── */}
        <LauncherCatalog
          games={LAUNCHER_GAMES}
          onPlayGame={handleCardNavigate}
          onSelectHeroGame={(id) => setSelectedGameId(id)}
          searchQuery={activeSearchQuery}
          onClearSearch={() => setLocalSearchQuery("")}
          isSearchVisible={isSearchVisible}
          onSearchChange={setLocalSearchQuery}
        />

        {/* ── Sleek Minimalist Launcher Footer ── */}
        <footer className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-sans">Synapse Arcade</span>
            <span>•</span>
            <span>Calibrated Cognitive Training Platform</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <button
              type="button"
              onClick={() => handleCardNavigate("/games/scale-guess/leaderboard")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Leaderboards
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleProfileClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              My Profile
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default HomePage;