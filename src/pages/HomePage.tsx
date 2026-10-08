import { HeroSection } from "@/components/home/HeroSection";
import { PlayerStats } from "@/components/home/PlayerStats";
import { GameSection } from "@/components/home/GameSection";

interface HomePageProps {
  onNavigate: (route: "home" | "scaleGuess" | "login" | "register") => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const handleScrollToGames = () => {
    const el = document.getElementById("games-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCardNavigate = (href: string) => {
    if (href === "/scaleGuess" || href === "/scaleguess") {
      onNavigate("scaleGuess");
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
      <HeroSection
        onPlayFeatured={() => onNavigate("scaleGuess")}
        onExploreModules={handleScrollToGames}
      />

      {/* 2. Player Stats */}
      <PlayerStats />

      {/* 3. Game Cards */}
      <GameSection onNavigate={handleCardNavigate} />
    </div>
  );
}

export default HomePage;
