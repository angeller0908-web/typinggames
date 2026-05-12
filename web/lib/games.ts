import gamesData from "@/data/games.json";
import relatedData from "@/data/related.json";
import type { Game } from "./types";

const games = gamesData as Game[];
const related = relatedData as Record<string, string[]>;

export function getAllGames(): Game[] {
  return games;
}

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}

export function getAllSlugs(): string[] {
  return games.map((g) => g.slug);
}

export function getRelated(slug: string, limit = 6): Game[] {
  const ids = related[slug] ?? [];
  const list: Game[] = [];
  for (const id of ids) {
    const g = getGame(id);
    if (g) list.push(g);
    if (list.length >= limit) break;
  }
  if (list.length < limit) {
    for (const g of games) {
      if (g.slug !== slug && !list.find((x) => x.slug === g.slug)) {
        list.push(g);
        if (list.length >= limit) break;
      }
    }
  }
  return list;
}

export function getByCategory(category: string): Game[] {
  return games.filter((g) => g.category === category);
}

export function getCategories(): { id: string; label: string; emoji: string; games: Game[] }[] {
  const map = new Map<string, { id: string; label: string; emoji: string; games: Game[] }>();
  const meta: Record<string, { label: string; emoji: string }> = {
    "food-fruit": { label: "Food & Fruit", emoji: "🍎" },
    space: { label: "Space", emoji: "🚀" },
    spooky: { label: "Spooky", emoji: "👻" },
    animals: { label: "Animals", emoji: "🐔" },
    vehicles: { label: "Vehicles", emoji: "✈️" },
    "money-pro": { label: "Pro & Money", emoji: "💰" },
    "speed-test": { label: "Speed Test", emoji: "⌨️" },
    sports: { label: "Sports", emoji: "🏊" },
  };
  for (const g of games) {
    const m = meta[g.category] ?? { label: g.category, emoji: "🎮" };
    if (!map.has(g.category)) {
      map.set(g.category, { id: g.category, label: m.label, emoji: m.emoji, games: [] });
    }
    map.get(g.category)!.games.push(g);
  }
  return Array.from(map.values());
}
