import { useState, useEffect } from "react";
import { useGame } from "@/game/useGame";
import { GameBoard } from "@/components/game/GameBoard";
import { ResultPanel } from "@/components/game/ResultPanel";
import { pickRandomPuzzle } from "@/game/puzzles";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { AuthPage } from "@/components/auth/AuthPage";
import {
  LogIn,
  UserPlus,
  LogOut,
  Gamepad2,
  User as UserIcon,
} from "lucide-react";

export function App() {
  const game = useGame();
  const { state } = game;
  const playing = state?.phase === "PLAYING";

  const { user, isAuthenticated, openLogin, openRegister, logout } = useAuth();

  // Full-page route tracking (/login, /register, or game)
  const [currentRoute, setCurrentRoute] = useState<
    "game" | "login" | "register"
  >(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === "/login") return "login";
    if (path === "/register") return "register";
    return "game";
  });

  useEffect(() => {
    function handleLocation() {
      const path = window.location.pathname.toLowerCase();
      if (path === "/login") {
        setCurrentRoute("login");
      } else if (path === "/register") {
        setCurrentRoute("register");
      } else {
        setCurrentRoute("game");
      }
    }

    window.addEventListener("popstate", handleLocation);
    return () => window.removeEventListener("popstate", handleLocation);
  }, []);

  const navigateTo = (route: "game" | "login" | "register") => {
    setCurrentRoute(route);
    const newPath = route === "game" ? "/" : `/${route}`;
    history.pushState(null, "", newPath);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* ── Topbar ── */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo("game")}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="text-xl font-bold font-display tracking-tight text-primary">
              ScaleGuess
            </span>
          </button>
          {currentRoute === "game" ? (
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
              {playing ? "Estimating" : "Result"}
            </span>
          ) : (
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-secondary text-primary border border-border">
              {currentRoute === "login" ? "Sign In" : "Register"}
            </span>
          )}
        </div>

        {/* Puzzle Target Info (only in Game view) */}
        {currentRoute === "game" && state && (
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <span>{state.puzzle.reference.name}</span>
            <span className="opacity-40">/</span>
            <span className="text-primary font-medium">
              {state.puzzle.target.name}
            </span>
          </div>
        )}

        {/* Auth / Profile Area */}
        <div className="flex items-center gap-2.5">
          {currentRoute !== "game" ? (
            <button
              type="button"
              onClick={() => navigateTo("game")}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-primary" />
              <span>Play Game</span>
            </button>
          ) : null}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-border/50 sm:border-l-0 sm:pl-0">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-xs">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] ring-1 ring-primary/40">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono text-foreground font-medium max-w-30 sm:max-w-40 truncate">
                  @{user.username}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
                  if (currentRoute !== "game") {
                    navigateTo("login");
                  } else {
                    openLogin();
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentRoute !== "game") {
                    navigateTo("register");
                  } else {
                    openRegister();
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Area ── */}
      {currentRoute === "login" ? (
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
          <AuthPage
            initialMode="login"
            onSuccess={() => navigateTo("game")}
            onClose={() => navigateTo("game")}
          />
        </main>
      ) : currentRoute === "register" ? (
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex items-center justify-center">
          <AuthPage
            initialMode="register"
            onSuccess={() => navigateTo("game")}
            onClose={() => navigateTo("game")}
          />
        </main>
      ) : (
        /* ── The Primary Game Board ── */
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
          {state && (
            <div className="flex items-center justify-between px-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Reference:
                </span>
                <span className="font-medium text-foreground">
                  {state.puzzle.reference.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Target:
                </span>
                <span className="font-semibold text-primary">
                  {state.puzzle.target.name}
                </span>
              </div>
            </div>
          )}

          <GameBoard game={game} />

          {/* ── Bottom Controls & Result Panel ── */}
          <div className="flex flex-col gap-4 pt-1">
            {playing ? (
              <div className="flex flex-col sm:row items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Drag the target to move · Drag handle at top-right to resize
                  (or use arrow keys and +/-)
                </p>
                <button
                  type="button"
                  className="lock-btn w-full sm:w-auto"
                  onClick={game.lockIn}
                  disabled={!state}
                >
                  Lock In
                </button>
              </div>
            ) : (
              state && (
                <ResultPanel
                  state={state}
                  onNextRound={() =>
                    game.init(pickRandomPuzzle(state.puzzle.id), state.viewport)
                  }
                />
              )
            )}
          </div>
        </main>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-3 text-center text-xs text-muted-foreground font-mono">
        ScaleGuess · Size Estimation
      </footer>

      {/* ── Auth Modal (for in-game prompt) ── */}
      <AuthModal />
    </div>
  );
}

export default App;
