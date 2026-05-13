import { getAllGames } from "./games";
import { getKeywordOpportunity, sortGamesByOpportunity } from "./keywords";
import type { Game } from "./types";

export interface GameHub {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  intro: string;
  selector: (game: Game) => boolean;
}

export const GAME_HUBS: GameHub[] = [
  {
    slug: "popular",
    title: "Popular Typing Games",
    shortTitle: "Popular",
    description: "Popular free typing games, including fruit typing, typing food, truck typer, keyboard zoo, and more.",
    intro:
      "Start with the games people most often look for. These pages cover fruit typing, typing food, truck routes, keyboard zoo drills, and other strong entry points for quick practice.",
    selector: (game) => {
      const opportunity = getKeywordOpportunity(game.slug);
      return Boolean(opportunity && (opportunity.priority === "P0" || opportunity.volume >= 1000));
    },
  },
  {
    slug: "typing-tests",
    title: "Typing Test Games",
    shortTitle: "Tests",
    description: "Free typing test games for WPM, accuracy, custom prompts, certificates, and quick brown fox practice.",
    intro:
      "These rounds turn typing tests into playable games. Use them for WPM checks, clean-text drills, custom prompts, certificate-style practice, and short repeatable benchmarks.",
    selector: (game) => {
      const o = getKeywordOpportunity(game.slug);
      return Boolean(o && (o.bucket.includes("Tool") || o.pageType.includes("Tool")));
    },
  },
  {
    slug: "jobs",
    title: "Job and Data Entry Typing Games",
    shortTitle: "Jobs",
    description: "Practice KPH, 10-key, 911 dispatcher, medical scribe, transcription, and data entry typing in free browser games.",
    intro:
      "Job-style typing searches need more than an arcade score. These games emphasize clean entry, KPH, numeric accuracy, call queues, medical terms, and practical workplace prompts.",
    selector: (game) => ["jobs-data", "medical", "numbers", "money-pro"].includes(game.category),
  },
  {
    slug: "kids",
    title: "Typing Games for Kids",
    shortTitle: "Kids",
    description: "Free kids typing games for children, kindergarteners, short words, animals, alphabet drills, and beginner-friendly targets.",
    intro:
      "Kids typing games should feel safe, simple, and playable. This hub groups beginner-friendly games for kids and kindergarteners with short words, animal themes, alphabet practice, and forgiving target rounds.",
    selector: (game) => game.category === "kids" || game.category === "animals",
  },
  {
    slug: "languages",
    title: "Language Typing Practice Games",
    shortTitle: "Languages",
    description: "Practice Hindi, Nepali, Korean, Spanish, Urdu, Khmer, Punjabi, Russian, and Japanese typing with free game rounds.",
    intro:
      "Language typing pages work best with focused word pools and repeatable practice. These games cover transliteration, unfamiliar spelling patterns, and careful character order.",
    selector: (game) => game.category === "languages",
  },
  {
    slug: "keyboard-layout",
    title: "Keyboard Layout Practice Games",
    shortTitle: "Keyboard",
    description: "Free games for touch typing, touch type keyboard layout, Dvorak, right-hand practice, home row, and muscle memory.",
    intro:
      "Keyboard layout and touch typing searches often need a practical drill. These games focus on hand placement, right-hand practice, Dvorak switching, keyboard maps, and muscle memory.",
    selector: (game) => game.category === "keyboard-layout" || game.category === "speed-test",
  },
  {
    slug: "speed-certificate",
    title: "Speed and Certificate Typing Games",
    shortTitle: "Speed",
    description: "Free WPM games for good WPM, fastest WPM practice, 60 WPM, certificate-style trials, endurance, and accuracy gates.",
    intro:
      "Use this hub when the goal is a measurable result. These rounds are built around good WPM, fastest WPM practice, accuracy gates, timed endurance, and certificate-style practice.",
    selector: (game) => {
      const o = getKeywordOpportunity(game.slug);
      return game.category === "speed-test" || Boolean(o && (o.bucket.includes("Cert") || o.bucket.includes("Pillar-Question")));
    },
  },
  {
    slug: "arcade",
    title: "Arcade Typing Games",
    shortTitle: "Arcade",
    description: "Free arcade typing games with racing typing games, space, ghosts, rhythm, retro, branded-inspired, and boss battle themes.",
    intro:
      "These are the most game-like pages in the catalog. Pick this hub for falling words, targets, rhythm windows, racing typing games, spooky rounds, and retro arcade sessions.",
    selector: (game) =>
      ["space", "spooky", "vehicles", "retro-arcade", "rhythm", "branded-inspired", "creative", "sports", "food-fruit"].includes(game.category),
  },
];

export function getAllHubs(): GameHub[] {
  return GAME_HUBS;
}

export function getHub(slug: string): GameHub | undefined {
  return GAME_HUBS.find((hub) => hub.slug === slug);
}

export function getHubGames(slug: string): Game[] {
  const hub = getHub(slug);
  if (!hub) return [];
  return sortGamesByOpportunity(getAllGames().filter(hub.selector));
}
