import { getAllGames, getCategories } from "@/lib/games";
import { GameCard } from "@/components/game/GameCard";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { getAllHubs } from "@/lib/hubs";
import { sortGamesByOpportunity } from "@/lib/keywords";

export const metadata = {
  title: "Free Typing Games — Boost Your WPM, No Download",
  description:
    "A growing catalog of hand-crafted typing games. Fruit, racing, space, ghosts, jobs, languages, and more. No signup. No download.",
  alternates: { canonical: SITE.url + "/" },
};

const HOME_FAQ = [
  {
    q: "Are these typing games free?",
    a: "Yes. Every game runs in your browser with no signup. We may show ads to keep the lights on.",
  },
  {
    q: "Do the games work on mobile?",
    a: "Yes. Tap the game area and your phone keyboard pops up. Some falling-words games switch to a lock-and-type mode on touch screens.",
  },
  {
    q: "How is my WPM calculated?",
    a: "We use the standard formula: characters typed correctly divided by 5, divided by minutes elapsed. Most modern typing tests use this.",
  },
  {
    q: "Are these the same games as on Typing.com / Nitro Type?",
    a: "No. These are original browser games we built. They are fast, ad-light, and tuned for short sessions.",
  },
  {
    q: "Do you store my scores?",
    a: "Only locally in your browser. We do not have user accounts in v1.",
  },
];

export default function HomePage() {
  const games = sortGamesByOpportunity(getAllGames());
  const categories = getCategories();
  const hubs = getAllHubs();
  const featuredGames = games.slice(0, 12);
  return (
    <div className="py-8">
      <section className="text-center max-w-3xl mx-auto py-10">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Free typing games to boost your <span className="text-accent">WPM</span>
        </h1>
        <p className="mt-4 text-ink/70 text-lg">
          {games.length} hand-crafted browser games. No download, no signup.
        </p>
      </section>

      <section className="my-10">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Start with popular typing games</h2>
            <p className="text-sm text-ink/65 mt-1">
              High-demand rounds for speed, accuracy, jobs, kids, and everyday practice.
            </p>
          </div>
          <Link href="/games/popular/" className="text-sm font-medium text-accent hover:underline">
            View all popular games
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {featuredGames.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>

      <section className="my-12">
        <h2 className="text-xl font-bold mb-4">Choose a practice goal</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hubs.map((hub) => (
            <Link
              key={hub.slug}
              href={`/games/${hub.slug}/`}
              className="rounded-lg bg-white ring-1 ring-ink/10 p-4 hover:ring-accent hover:shadow-sm transition"
            >
              <div className="font-semibold">{hub.shortTitle}</div>
              <p className="text-sm text-ink/65 mt-1 line-clamp-3">{hub.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="my-10">
        <h2 className="text-xl font-bold mb-4">Browse by theme</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white ring-1 ring-ink/10 text-sm hover:ring-accent"
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
              <span className="text-ink/40 text-xs">({c.games.length})</span>
            </a>
          ))}
        </div>
      </section>

      {categories.map((c) => (
        <section key={c.id} id={`cat-${c.id}`} className="my-10 scroll-mt-20">
          <h2 className="text-xl font-bold mb-4">
            {c.emoji} {c.label}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortGamesByOpportunity(c.games).map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      ))}

      <section className="my-14 grid sm:grid-cols-3 gap-6">
        <div>
          <h3 className="font-bold mb-1">100% free</h3>
          <p className="text-sm text-ink/70">
            Every game is free forever. Ads keep the servers running.
          </p>
        </div>
        <div>
          <h3 className="font-bold mb-1">No install</h3>
          <p className="text-sm text-ink/70">
            Browser only. Works on desktop, Chromebook, tablet, and phone.
          </p>
        </div>
        <div>
          <h3 className="font-bold mb-1">Playable rounds</h3>
          <p className="text-sm text-ink/70">
            Every game page runs on our own typing engine with template-specific rules,
            goals, and score feedback.
          </p>
        </div>
      </section>

      <section className="my-12">
        <h2 className="text-xl font-bold mb-4">Frequently asked</h2>
        <div className="space-y-3">
          {HOME_FAQ.map((f) => (
            <details
              key={f.q}
              className="bg-white ring-1 ring-ink/10 rounded-lg p-4 group"
            >
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                {f.q}
                <span className="text-ink/40 group-open:rotate-180 transition-transform">⌄</span>
              </summary>
              <p className="text-ink/80 text-sm mt-2">{f.a}</p>
            </details>
          ))}
        </div>
        <FaqJsonLd faqs={HOME_FAQ} />
      </section>
    </div>
  );
}
