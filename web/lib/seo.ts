import type { Metadata } from "next";
import { SITE } from "./site";
import type { Game } from "./types";

export function buildGameMetadata(game: Game): Metadata {
  const title = `${game.title} — Play Free Online`;
  const description = `${game.hero.tagline} Free, no signup. Practice typing the fun way with ${game.title}.`;
  const url = `${SITE.url}/game/${game.slug}/`;
  const og = `/og/${game.slug}.png`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE.name,
      images: [{ url: og, width: 1200, height: 630, alt: game.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [og],
    },
  };
}

export function buildVideoGameJsonLd(game: Game) {
  const url = `${SITE.url}/game/${game.slug}/`;
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.hero.tagline,
    url,
    image: `${SITE.url}/og/${game.slug}.png`,
    inLanguage: "en",
    genre: ["Typing", "Educational"],
    gamePlatform: "Web Browser",
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    datePublished: game.publishedAt,
    dateModified: game.updatedAt,
    author: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
}

export function buildBreadcrumbJsonLd(game: Game) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/` },
      { "@type": "ListItem", position: 2, name: "Games", item: `${SITE.url}/` },
      {
        "@type": "ListItem",
        position: 3,
        name: game.title,
        item: `${SITE.url}/game/${game.slug}/`,
      },
    ],
  };
}

export function buildFaqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
