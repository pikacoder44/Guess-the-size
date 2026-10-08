import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthPage } from "@/components/auth/AuthPage";
import { HomePage } from "@/pages/HomePage";
import { ScaleGuessPage } from "@/pages/ScaleGuessPage";
import { Footer } from "@/components/home/Footer";
import { LogIn, UserPlus, LogOut, Brain } from "lucide-react";

export type AppRoute = "home" | "scaleGuess" | "login" | "register";

function getRouteFromPath(pathname: string): AppRoute {
  const path = pathname.toLowerCase().replace(/\/+$/, "");
  if (path === "/scaleguess") return "scaleGuess";
  if (path === "/login") return "login";
  if (path === "/register") return "register";
  return "home";
}

export function App() {
  const { user, isAuthenticated, openLogin, openRegister, logout } = useAuth();

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() =>
    getRouteFromPath(window.location.pathname),
  );

  useEffect(() => {
    function handleLocation() {
      setCurrentRoute(getRouteFromPath(window.location.pathname));
    }

    window.addEventListener("popstate", handleLocation);
    return () => window.removeEventListener("popstate", handleLocation);
  }, []);

  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    const targetPath =
      route === "home"
        ? "/"
        : route === "scaleGuess"
        ? "/scaleGuess"
        : `/${route}`;

    if (window.location.pathname !== targetPath) {
      history.pushState(null, "", targetPath);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* ── Clear & Minimal Topbar ── */}
      <header className="border-b border-border/40 bg-card/40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
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

        {/* Auth / Profile Area */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-xs">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] ring-1 ring-primary/40">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono text-foreground font-medium max-w-28 sm:max-w-36 truncate">
                  @{user.username}
                </span>
              </div>
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
                  if (currentRoute === "home" || currentRoute === "scaleGuess") {
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
                  if (currentRoute === "home" || currentRoute === "scaleGuess") {
                    openRegister();
                  } else {
                    navigateTo("register");
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer font-semibold"
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
      ) : currentRoute === "scaleGuess" ? (
        <ScaleGuessPage onBackToHome={() => navigateTo("home")} />
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
