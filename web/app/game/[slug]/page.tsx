import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllSlugs, getGame, getRelated } from "@/lib/games";
import { buildGameMetadata } from "@/lib/seo";
import { previewSample } from "@/lib/wordlists";
import { GameEmbed } from "@/components/game/GameEmbed";
import { RelatedGames } from "@/components/game/RelatedGames";
import { VideoGameJsonLd } from "@/components/seo/VideoGameJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { getGameBody } from "@/lib/gameMdx";
import { getKeywordOpportunity } from "@/lib/keywords";
import { GameSeoPanel } from "@/components/game/GameSeoPanel";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return {};
  return buildGameMetadata(game);
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  const related = getRelated(game.slug, 6);
  const opportunity = getKeywordOpportunity(game.slug);
  const sampleWords =
    game.embed.kind === "engine" ? previewSample(game.embed.wordlistIds, 50) : [];
  const Body = getGameBody(game.slug);

  const themeStyle: React.CSSProperties = {
    ["--game-accent" as string]: game.theme.accent,
    ["--game-accent2" as string]: game.theme.accent2,
    ["--game-surface" as string]: game.theme.surface,
  };

  return (
    <article className="py-6" style={themeStyle}>
      <nav className="text-sm text-ink/60 mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>{" "}
        ›{" "}
        <Link href="/" className="hover:text-accent">
          Games
        </Link>{" "}
        › <span className="text-ink/80">{game.title}</span>
      </nav>

      <h2 className="text-lg text-ink/70 mb-2">
        Play {game.title} — {game.hero.tagline}
      </h2>

      <div className="my-4">
        <GameEmbed game={game} />
      </div>

      <header className="my-8 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{game.title}</h1>
        <p className="text-ink/70 mt-2 text-lg">{game.hero.tagline}</p>
      </header>

      <section className="max-w-3xl">{Body ? <Body /> : null}</section>

      <GameSeoPanel game={game} opportunity={opportunity} />

      {game.faq.length > 0 && (
        <section className="my-10 max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Frequently asked</h2>
          <div className="space-y-3">
            {game.faq.map((f) => (
              <details
                key={f.q}
                className="bg-white ring-1 ring-ink/10 rounded-lg p-4 group"
              >
                <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <span className="text-ink/40 group-open:rotate-180 transition-transform">
                    ⌄
                  </span>
                </summary>
                <p className="text-ink/80 text-sm mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <RelatedGames games={related} />

      <noscript>
        <div className="my-8 p-4 bg-yellow-50 ring-1 ring-yellow-200 rounded-lg max-w-3xl">
          <h2 className="font-bold mb-2">Enable JavaScript to play {game.title}</h2>
          <p className="text-sm mb-2">
            The interactive game needs JS. Sample words from this game's word list:
          </p>
          <p className="text-sm font-mono leading-relaxed">{sampleWords.join(" · ")}</p>
        </div>
      </noscript>

      <VideoGameJsonLd game={game} />
      <BreadcrumbJsonLd game={game} />
      {game.faq.length > 0 && <FaqJsonLd faqs={game.faq} />}
    </article>
  );
}
