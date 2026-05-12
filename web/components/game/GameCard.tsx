import Link from "next/link";
import type { Game } from "@/lib/types";

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/game/${game.slug}/`}
      className="group block rounded-xl bg-white ring-1 ring-ink/10 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
      style={{
        ["--game-accent" as string]: game.theme.accent,
        ["--game-accent2" as string]: game.theme.accent2,
        ["--game-surface" as string]: game.theme.surface,
      }}
    >
      <div
        className="aspect-video flex items-center justify-center text-5xl"
        style={{
          background: `linear-gradient(135deg, ${game.theme.accent} 0%, ${game.theme.accent2} 100%)`,
        }}
      >
        <span className="drop-shadow-md">{game.hero.emoji ?? "🎮"}</span>
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm group-hover:text-accent transition-colors">
          {game.title}
        </div>
        <div className="text-[11px] text-ink/60 mt-0.5 line-clamp-2">{game.hero.tagline}</div>
      </div>
    </Link>
  );
}
