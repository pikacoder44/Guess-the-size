import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthPage } from "@/components/auth/AuthPage";
import { HomePage } from "@/pages/HomePage";
import { ScaleGuessPage } from "@/games/scale-guess/ScaleGuessPage";
import { ScaleGuessLeaderboardPage } from "@/games/scale-guess/ScaleGuessLeaderboardPage";
import { NotColorBlindPage } from "@/games/not-color-blind/NotColorBlindPage";
import { NotColorBlindLeaderboardPage } from "@/games/not-color-blind/NotColorBlindLeaderboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { Footer } from "@/components/home/Footer";
import { PublicProfilePage } from "@/pages/PublicProfilePage";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import {
  LogIn,
  UserPlus,
  LogOut,
  Brain,
  Settings,
  Trophy,
  Search,
  Gamepad2,
  BarChart2,
  X,
} from "lucide-react";

export type AppRoute =
  | "home"
  | "scaleGuess"
  | "scaleGuessLeaderboard"
  | "notColorBlind"
  | "notColorBlindLeaderboard"
  | "login"
  | "register"
  | "profile"
  | "leaderboard"
  | "publicProfile";

interface RouteState {
  route: AppRoute;
  identifier?: string;
}

function getRouteInfoFromPath(pathname: string): RouteState {
  const path = pathname.toLowerCase().replace(/\/+$/, "");
  if (
    path === "/games/scale-guess/leaderboard" ||
    path === "/scaleguess/leaderboard" ||
    path === "/leaderboard"
  ) {
    return { route: "scaleGuessLeaderboard" };
  }
  if (path === "/games/scale-guess" || path === "/scaleguess") {
    return { route: "scaleGuess" };
  }
  if (
    path === "/games/not-color-blind/leaderboard" ||
    path === "/notcolorblind/leaderboard"
  ) {
    return { route: "notColorBlindLeaderboard" };
  }
  if (path === "/games/not-color-blind" || path === "/notcolorblind") {
    return { route: "notColorBlind" };
  }
  if (path === "/login") return { route: "login" };
  if (path === "/register") return { route: "register" };
  if (path === "/profile") return { route: "profile" };
  if (path.startsWith("/profile/") || path.startsWith("/user/")) {
    const rawSegments = pathname.split("/").filter(Boolean);
    const id = rawSegments[1] || "";
    return { route: "publicProfile", identifier: id };
  }
  return { route: "home" };
}

export function App() {
  const { user, isAuthenticated, openLogin, openRegister, logout } = useAuth();

  const [routeState, setRouteState] = useState<RouteState>(() =>
    getRouteInfoFromPath(window.location.pathname),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const currentRoute = routeState.route;
  const publicProfileIdentifier = routeState.identifier;

  useEffect(() => {
    function handleLocation() {
      setRouteState(getRouteInfoFromPath(window.location.pathname));
    }

    window.addEventListener("popstate", handleLocation);
    return () => window.removeEventListener("popstate", handleLocation);
  }, []);

  const navigateTo = (route: AppRoute, param?: string | number) => {
    if (route === "publicProfile" && param !== undefined) {
      const id = String(param);
      setRouteState({ route: "publicProfile", identifier: id });
      const targetPath = /^\d+$/.test(id) ? `/profile/${id}` : `/user/${encodeURIComponent(id)}`;
      if (window.location.pathname !== targetPath) {
        history.pushState(null, "", targetPath);
      }
      return;
    }

    const canonicalRoute = route === "leaderboard" ? "scaleGuessLeaderboard" : route;
    setRouteState({ route: canonicalRoute });

    const targetPath =
      canonicalRoute === "home"
        ? "/"
        : canonicalRoute === "scaleGuess"
        ? "/games/scale-guess"
        : canonicalRoute === "scaleGuessLeaderboard"
        ? "/games/scale-guess/leaderboard"
        : canonicalRoute === "notColorBlind"
        ? "/games/not-color-blind"
        : canonicalRoute === "notColorBlindLeaderboard"
        ? "/games/not-color-blind/leaderboard"
        : `/${canonicalRoute}`;

    if (window.location.pathname !== targetPath) {
      history.pushState(null, "", targetPath);
    }
  };

  const navigateToProfile = () => navigateTo("profile");

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-neutral-800">
      {/* ── Steam / Epic Games Style Store Header ── */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30 gap-4">
        {/* Left: Synapse Logo + Nav Items ("Store / Arcade", "Leaderboards", "My Stats") */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo("home")}
            className="flex items-center gap-2.5 hover:opacity-95 transition-opacity cursor-pointer group"
            aria-label="Synapse Arcade Store"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-neutral-900 to-neutral-800 border border-neutral-700/80 flex items-center justify-center text-amber-400 group-hover:text-amber-300 transition-colors shadow-sm">
              <Brain className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white font-sans leading-none">
                Synapse<span className="text-amber-400">.</span>
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-semibold leading-none mt-0.5 hidden xs:block">
                ARCADE
              </span>
            </div>
          </button>

          {/* Store Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => navigateTo("home")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                currentRoute === "home"
                  ? "bg-neutral-850 text-white font-semibold shadow-inner border border-neutral-700/80"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Store / Arcade</span>
            </button>

            <button
              type="button"
              id="open-leaderboard-btn"
              onClick={() => navigateTo("scaleGuessLeaderboard")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                currentRoute === "scaleGuessLeaderboard" ||
                currentRoute === "notColorBlindLeaderboard" ||
                currentRoute === "leaderboard"
                  ? "bg-neutral-850 text-white font-semibold shadow-inner border border-neutral-700/80"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Leaderboards</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isAuthenticated) {
                  navigateTo("profile");
                } else {
                  openLogin();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                currentRoute === "profile"
                  ? "bg-neutral-850 text-white font-semibold shadow-inner border border-neutral-700/80"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">My Stats</span>
            </button>
          </nav>
        </div>

        {/* Right: Search Bar, Auth Buttons, Profile Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search bar input (Steam/Epic style) */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentRoute !== "home") navigateTo("home");
              }}
              className="w-28 xs:w-36 sm:w-48 lg:w-56 pl-8 pr-7 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 focus:border-neutral-500 focus:outline-none text-xs text-neutral-100 placeholder:text-neutral-500 transition-all font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Auth / Profile Actions */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={navigateToProfile}
                title="Open Profile Settings"
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/80 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-all cursor-pointer group"
              >
                {user.avatarUrl || user.profilePicture ? (
                  <img
                    src={user.avatarUrl || user.profilePicture}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-neutral-700 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 items-center justify-center font-bold text-[9px] ring-1 ring-neutral-700 shrink-0"
                  style={{ display: user.avatarUrl || user.profilePicture ? "none" : "flex" }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono text-neutral-200 max-w-24 sm:max-w-32 truncate group-hover:text-white transition-colors text-xs">
                  {user.name ? user.name : `@${user.username}`}
                </span>
                <Settings className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0 hidden sm:block" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (
                    currentRoute === "home" ||
                    currentRoute === "scaleGuess" ||
                    currentRoute === "notColorBlind" ||
                    currentRoute === "scaleGuessLeaderboard" ||
                    currentRoute === "notColorBlindLeaderboard" ||
                    currentRoute === "leaderboard"
                  ) {
                    openLogin();
                  } else {
                    navigateTo("login");
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 sm:px-3 py-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    currentRoute === "home" ||
                    currentRoute === "scaleGuess" ||
                    currentRoute === "notColorBlind" ||
                    currentRoute === "scaleGuessLeaderboard" ||
                    currentRoute === "notColorBlindLeaderboard" ||
                    currentRoute === "leaderboard"
                  ) {
                    openRegister();
                  } else {
                    navigateTo("register");
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 sm:px-3 py-1.5 rounded-lg bg-white text-neutral-950 hover:bg-neutral-100 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main View Router ── */}
      {currentRoute === "login" ? (
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
          <AuthPage
            initialMode="login"
            onSuccess={() => navigateTo("home")}
            onClose={() => navigateTo("home")}
          />
        </main>
      ) : currentRoute === "register" ? (
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
          <AuthPage
            initialMode="register"
            onSuccess={() => navigateTo("home")}
            onClose={() => navigateTo("home")}
          />
        </main>
      ) : currentRoute === "profile" ? (
        <ProfilePage
          onBack={() => navigateTo("home")}
          onOpenLogin={() => { openLogin(); navigateTo("home"); }}
        />
      ) : currentRoute === "scaleGuess" ? (
        <ScaleGuessPage
          onBackToHome={() => navigateTo("home")}
          onNavigateLeaderboard={() => navigateTo("scaleGuessLeaderboard")}
        />
      ) : currentRoute === "scaleGuessLeaderboard" || currentRoute === "leaderboard" ? (
        <ScaleGuessLeaderboardPage
          onNavigate={navigateTo}
          onBackToGame={() => navigateTo("scaleGuess")}
          onOpenLogin={openLogin}
        />
      ) : currentRoute === "notColorBlind" ? (
        <NotColorBlindPage
          onBackToHome={() => navigateTo("home")}
          onNavigateLeaderboard={() => navigateTo("notColorBlindLeaderboard")}
        />
      ) : currentRoute === "notColorBlindLeaderboard" ? (
        <NotColorBlindLeaderboardPage
          onNavigate={navigateTo}
          onBackToGame={() => navigateTo("notColorBlind")}
          onOpenLogin={openLogin}
        />
      ) : currentRoute === "publicProfile" ? (
        <PublicProfilePage
          key={String(publicProfileIdentifier || 1)}
          identifier={publicProfileIdentifier || 1}
          onBackToLeaderboard={() => navigateTo("scaleGuessLeaderboard")}
          onNavigateToSelfSettings={() => navigateTo("profile")}
        />
      ) : (
        <HomePage onNavigate={navigateTo} searchQuery={searchQuery} />
      )}

      {/* ── Footer ── */}
      <Footer onNavigate={navigateTo} />

      {/* ── In-App Auth Modal ── */}
      <AuthModal />
    </div>
  </SmoothScrollProvider>
  );
}

export default App;
