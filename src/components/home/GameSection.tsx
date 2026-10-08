import { GAMES, type GameCardData } from "@/data/games";
import { GameCard } from "./GameCard";

interface GameSectionProps {
  onNavigate: (href: string) => void;
}

export function GameSection({ onNavigate }: GameSectionProps) {
  return (
    <section id="games-section" className="w-full my-8 sm:my-12 scroll-mt-20">
      {/* Clean section header */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
          Brain Games
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Select a game below to start training.
        </p>
      </div>

      {/* Cards container:
          On desktop (lg:), using flex with flex-1 and hover:flex-[1.16] gives a smooth,
          physical horizontal expansion without distorting font metrics or graphics! */}
      <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full transition-all duration-300">
        {GAMES.map((game: GameCardData) => (
          <div
            key={game.id}
            className="flex-1 lg:hover:flex-[1.16] transition-[flex] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] min-w-0"
          >
            <GameCard card={game} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default GameSection;
