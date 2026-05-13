import type { Metadata } from "next";
import { SITE } from "./site";
import type { Game } from "./types";
import { getKeywordOpportunity } from "./keywords";

function titleCaseKeyword(keyword: string): string {
  const lowerWords = new Set(["a", "an", "and", "for", "in", "of", "on", "or", "the", "to", "with"]);
  return keyword
    .split(/\s+/)
    .map((word, index) => {
      const normalized = word.toLowerCase();
      if (index > 0 && lowerWords.has(normalized)) return normalized;
      if (normalized === "wpm" || normalized === "kph") return normalized.toUpperCase();
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(" ");
}

function buildIntentTitle(game: Game): string {
  const opportunity = getKeywordOpportunity(game.slug);
  if (!opportunity) return `${game.title} — Play Free Online`;

  const keyword = titleCaseKeyword(opportunity.keyword);
  const pageType = opportunity.pageType.toLowerCase();
  const bucket = opportunity.bucket.toLowerCase();

  if (pageType.includes("profession") || bucket.includes("profession")) {
    return `${keyword} — Free Practice Game`;
  }
  if (pageType.includes("language") || bucket.includes("language")) {
    return `${keyword} — Free Online Typing Practice`;
  }
  if (pageType.includes("cert")) {
    return `${keyword} — Free Speed Challenge`;
  }
  if (pageType.includes("affiliate") || opportunity.bucket === "Commercial") {
    return `${keyword} — Practice With a Free Typing Game`;
  }
  if (pageType.includes("pillar") || pageType.includes("audience")) {
    return `${keyword} — Play and Practice Online`;
  }
  if (pageType.includes("comparison") || bucket.includes("branded")) {
    return `${keyword} — Unofficial Free Typing Game`;
  }
  if (pageType.includes("tool") || bucket.includes("tool")) {
    return `${keyword} — Free Typing Game`;
  }
  return `${game.title} — ${keyword} Online`;
}

function buildIntentDescription(game: Game): string {
  const opportunity = getKeywordOpportunity(game.slug);
  if (!opportunity) {
    return `${game.hero.tagline} Free, no signup. Practice typing the fun way with ${game.title}.`;
  }

  const keyword = opportunity.keyword;
  const pageType = opportunity.pageType.toLowerCase();
  const bucket = opportunity.bucket.toLowerCase();

  if (pageType.includes("profession") || bucket.includes("profession")) {
    return `Practice ${keyword} with a free browser typing game. Build speed, accuracy, and clean entry habits with no signup or download.`;
  }
  if (pageType.includes("language") || bucket.includes("language")) {
    return `Play a free ${keyword} game online. Practice themed words, careful spelling, and repeatable typing speed in your browser.`;
  }
  if (pageType.includes("cert")) {
    return `Try a free ${keyword} challenge with timed rounds, WPM feedback, and accuracy practice. No signup or download required.`;
  }
  if (pageType.includes("affiliate") || opportunity.bucket === "Commercial") {
    return `Explore ${keyword} through a free playable typing round. Practice the vocabulary before choosing books, gear, or study tools.`;
  }
  if (pageType.includes("pillar") || pageType.includes("audience")) {
    return `Learn and practice ${keyword} with a free online typing game. Short rounds help build accuracy, rhythm, and confidence.`;
  }
  if (pageType.includes("comparison") || bucket.includes("branded")) {
    return `Play an unofficial ${keyword} typing challenge online. Free browser practice with original prompts and no official brand assets.`;
  }
  return `Play ${game.title}, a free online typing game for ${keyword}. Short rounds, themed prompts, no signup, no download.`;
}

export function buildGameMetadata(game: Game): Metadata {
  const title = buildIntentTitle(game);
  const description = buildIntentDescription(game);
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
