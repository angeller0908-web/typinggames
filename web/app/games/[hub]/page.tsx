import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameCard } from "@/components/game/GameCard";
import { getAllHubs, getHub, getHubGames } from "@/lib/hubs";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllHubs().map((hub) => ({ hub: hub.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hub: string }>;
}): Promise<Metadata> {
  const { hub: slug } = await params;
  const hub = getHub(slug);
  if (!hub) return {};
  return {
    title: `${hub.title} — Free Online`,
    description: hub.description,
    alternates: { canonical: `${SITE.url}/games/${hub.slug}/` },
    openGraph: {
      type: "website",
      url: `${SITE.url}/games/${hub.slug}/`,
      title: `${hub.title} — Free Online`,
      description: hub.description,
      siteName: SITE.name,
      images: [{ url: SITE.defaultOgImage, width: 1200, height: 630, alt: hub.title }],
    },
  };
}

export default async function HubPage({ params }: { params: Promise<{ hub: string }> }) {
  const { hub: slug } = await params;
  const hub = getHub(slug);
  if (!hub) notFound();
  const games = getHubGames(slug);

  return (
    <article className="py-8">
      <header className="max-w-3xl mb-8">
        <p className="text-sm text-accent font-semibold mb-2">Typing game collection</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{hub.title}</h1>
        <p className="mt-4 text-lg text-ink/70">{hub.intro}</p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </section>

      <section className="my-12 max-w-3xl rounded-lg bg-white ring-1 ring-ink/10 p-5">
        <h2 className="text-2xl font-bold mb-3">How to use this collection</h2>
        <p className="text-ink/80 leading-relaxed">
          Pick one game for accuracy, replay it once for speed, then move to a related
          round with a different format. This keeps practice focused while still giving
          searchers a real playable answer instead of a static list.
        </p>
      </section>
    </article>
  );
}

