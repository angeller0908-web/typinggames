import type { Game } from "@/lib/types";
import { GameCard } from "./GameCard";

export function RelatedGames({ games }: { games: Game[] }) {
  if (games.length === 0) return null;
  return (
    <section className="my-10">
      <h2 className="text-xl font-bold mb-4">Related games</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {games.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>
    </section>
  );
}
