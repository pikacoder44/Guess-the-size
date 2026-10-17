import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthPage } from "@/components/auth/AuthPage";
import { HomePage } from "@/pages/HomePage";
import { ScaleGuessPage } from "@/pages/ScaleGuessPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { LeaderboardPage } from "@/pages/LeaderboardPage";
import { Footer } from "@/components/home/Footer";
import { PublicProfilePage } from "@/pages/PublicProfilePage";
import { LogIn, UserPlus, LogOut, Brain, Settings, Trophy } from "lucide-react";

export type AppRoute =
  | "home"
  | "scaleGuess"
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
  if (path === "/scaleguess") return { route: "scaleGuess" };
  if (path === "/leaderboard") return { route: "leaderboard" };
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

    setRouteState({ route });
    const targetPath =
      route === "home"
        ? "/"
        : route === "scaleGuess"
        ? "/scaleGuess"
        : route === "leaderboard"
        ? "/leaderboard"
        : `/${route}`;

    if (window.location.pathname !== targetPath) {
      history.pushState(null, "", targetPath);
    }
  };

  const navigateToProfile = () => navigateTo("profile");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* ── Clear & Minimal Topbar ── */}
      <header className="border-b border-border/40 bg-card/40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => navigateTo("home")}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer group"
            aria-label="Synapse Home"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <Brain className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold font-display tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
              Synapse
            </span>
          </button>

          {/* Leaderboard nav link in topbar */}
          <button
            type="button"
            onClick={() => navigateTo("leaderboard")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentRoute === "leaderboard"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/70 border border-transparent"
            }`}
            aria-label="Global Hall of Fame"
          >
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
        </div>

        {/* Auth / Profile Area */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={navigateToProfile}
                title="Open Profile Settings"
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 hover:bg-secondary border border-border hover:border-primary/40 text-xs transition-all cursor-pointer group"
              >
                {user.avatarUrl || user.profilePicture ? (
                  <img
                    src={user.avatarUrl || user.profilePicture}
                    alt={user.username}
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-primary/40 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-5 h-5 rounded-full bg-primary/20 text-primary items-center justify-center font-bold text-[10px] ring-1 ring-primary/40 shrink-0"
                  style={{ display: user.avatarUrl || user.profilePicture ? "none" : "flex" }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono text-foreground font-medium max-w-28 sm:max-w-36 truncate group-hover:text-primary transition-colors">
                  {user.name ? user.name : `@${user.username}`}
                </span>
                <Settings className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (currentRoute === "home" || currentRoute === "scaleGuess" || currentRoute === "leaderboard") {
                    openLogin();
                  } else {
                    navigateTo("login");
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentRoute === "home" || currentRoute === "scaleGuess" || currentRoute === "leaderboard") {
                    openRegister();
                  } else {
                    navigateTo("register");
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
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
          onNavigateLeaderboard={() => navigateTo("leaderboard")}
        />
      ) : currentRoute === "publicProfile" ? (
        <PublicProfilePage
          key={String(publicProfileIdentifier || 1)}
          identifier={publicProfileIdentifier || 1}
          onBackToLeaderboard={() => navigateTo("leaderboard")}
          onNavigateToSelfSettings={() => navigateTo("profile")}
        />
      ) : currentRoute === "leaderboard" ? (
        <LeaderboardPage
          onNavigate={navigateTo}
          onBackToGame={() => navigateTo("scaleGuess")}
          onOpenLogin={openLogin}
        />
      ) : (
        <HomePage onNavigate={navigateTo} />
      )}

      {/* ── Footer ── */}
      <Footer onNavigate={navigateTo} />

      {/* ── In-App Auth Modal ── */}
      <AuthModal />
    </div>
  );
}

export default App;
