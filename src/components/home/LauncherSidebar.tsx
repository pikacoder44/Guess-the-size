import { User as UserIcon, Search } from "lucide-react";
import type { LauncherGame } from "./launcherData";
import { useAuth } from "@/context/AuthContext";

interface LauncherSidebarProps {
  games: LauncherGame[];
  activeGameId: string;
  onSelectGame: (gameId: string) => void;
  onProfileClick: () => void;
  onSearchClick: () => void;
  isSearchActive?: boolean;
}

export function LauncherSidebar({
  games,
  activeGameId,
  onSelectGame,
  onProfileClick,
  onSearchClick,
  isSearchActive = false,
}: LauncherSidebarProps) {
  const { user, isAuthenticated } = useAuth();

  return (
    <aside
      aria-label="Arcade Launcher Navigation"
      className="w-16 md:w-20 min-h-screen fixed left-0 top-0 bottom-0 bg-neutral-950/80 backdrop-blur-2xl border-r border-white/5 flex flex-col justify-between items-center py-6 z-30 select-none transform-gpu"
    >
      {/* ── Top: User Profile Avatar Icon Button ── */}
      <div className="relative group">
        <button
          type="button"
          onClick={onProfileClick}
          aria-label={isAuthenticated ? "Open Profile Settings" : "Sign In to Synapse"}
          className="w-10 h-10 md:w-11 md:h-11 rounded-full border border-white/15 hover:border-white/40 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 shadow-sm group-hover:shadow-[0_0_12px_rgba(255,255,255,0.15)] overflow-hidden"
        >
          {isAuthenticated && (user?.avatarUrl || user?.profilePicture) ? (
            <img
              src={user.avatarUrl || user.profilePicture || ""}
              alt={user.username || "Profile"}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : isAuthenticated && user?.username ? (
            <span className="font-mono text-xs font-bold text-white uppercase">
              {user.username.charAt(0)}
            </span>
          ) : (
            <UserIcon className="w-5 h-5 text-neutral-300 group-hover:text-white transition-colors" />
          )}
        </button>

        {/* Hover Tooltip */}
        <div className="absolute left-14 md:left-16 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-neutral-900/95 border border-white/15 text-white text-[11px] font-mono rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
          {isAuthenticated ? (user?.name || `@${user?.username}`) : "Sign In / Register"}
        </div>
      </div>

      {/* ── Middle: Game Library Bar (Vertical list of thumbnails) ── */}
      <nav aria-label="Game Library" className="flex flex-col items-center gap-3.5 my-auto">
        {games.map((game) => {
          const isActive = game.id === activeGameId;
          return (
            <div key={game.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelectGame(game.id)}
                aria-label={`Select ${game.title}`}
                className={`w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden cursor-pointer relative transition-all duration-200 active:scale-95 block ${
                  isActive
                    ? "ring-2 ring-white/95 border-transparent shadow-[0_0_16px_rgba(255,255,255,0.4)] scale-105"
                    : "border border-white/10 opacity-60 hover:opacity-100 hover:scale-102 hover:border-white/25"
                }`}
              >
                <img
                  src={game.thumbnail}
                  alt={game.title}
                  className="w-full h-full object-cover object-center"
                />
              </button>

              {/* Hover Tooltip */}
              <div className="absolute left-14 md:left-16 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-neutral-900/95 border border-white/15 text-white rounded-md shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 flex flex-col gap-0.5">
                <span className="text-xs font-bold font-sans whitespace-nowrap">
                  {game.title}
                </span>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                  {game.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: Glass Search Button ── */}
      <div className="relative group">
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Search Game Catalog"
          className={`w-10 h-10 md:w-11 md:h-11 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
            isSearchActive
              ? "bg-white text-neutral-950 border-white shadow-[0_0_14px_rgba(255,255,255,0.3)]"
              : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-neutral-400 hover:text-white"
          }`}
        >
          <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
        </button>

        {/* Hover Tooltip */}
        <div className="absolute left-14 md:left-16 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-neutral-900/95 border border-white/15 text-white text-[11px] font-mono rounded-md shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
          Search Games
        </div>
      </div>
    </aside>
  );
}

export default LauncherSidebar;
