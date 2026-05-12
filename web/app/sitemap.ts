import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getAllSlugs } from "@/lib/games";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const base = SITE.url;
  const games = getAllSlugs().map((slug) => ({
    url: `${base}/game/${slug}/`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const pages = [
    { url: `${base}/`, priority: 1.0 },
    { url: `${base}/about/`, priority: 0.4 },
    { url: `${base}/contact/`, priority: 0.3 },
    { url: `${base}/privacy/`, priority: 0.2 },
    { url: `${base}/terms/`, priority: 0.2 },
    { url: `${base}/cookies/`, priority: 0.2 },
    { url: `${base}/dmca/`, priority: 0.2 },
  ].map((p) => ({
    ...p,
    lastModified,
    changeFrequency: "yearly" as const,
  }));
  return [...pages, ...games];
}
