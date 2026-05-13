// Build-time OG image generator.
// Reads data/games.json, renders 1200x630 PNG per game + a default, writes to public/og/.
// Decoupled from Next's opengraph-image system so it works with output: 'export'.

import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "@vercel/og";

const ROOT = path.resolve(process.cwd());
const OUT = path.join(ROOT, "public", "og");
const gamesJsonPath = path.join(ROOT, "data", "games.json");

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "typingrally";

fs.mkdirSync(OUT, { recursive: true });

/**
 * @param {{title:string, tagline:string, accent:string, accent2:string, emoji?:string}} opts
 */
async function renderCard(opts) {
  const { title, tagline, accent, accent2, emoji } = opts;
  const el = {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`,
        color: "#ffffff",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      children: [
        {
          type: "div",
          props: {
            style: { fontSize: 28, opacity: 0.85, letterSpacing: 1, textTransform: "uppercase" },
            children: SITE_NAME,
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 16 },
            children: [
              {
                type: "div",
                props: {
                  style: { fontSize: 140, lineHeight: 1 },
                  children: emoji ?? "⌨️",
                },
              },
              {
                type: "div",
                props: {
                  style: { fontSize: 90, fontWeight: 800, lineHeight: 1.05 },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 32,
                    opacity: 0.92,
                    maxWidth: 940,
                    lineHeight: 1.25,
                  },
                  children: tagline,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: 24, opacity: 0.8 },
            children: "Free typing game · No download · Play in browser",
          },
        },
      ],
    },
  };

  const res = new ImageResponse(el, { width: 1200, height: 630 });
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

(async () => {
  /** @type {Array<any>} */
  const games = JSON.parse(fs.readFileSync(gamesJsonPath, "utf-8"));

  for (const g of games) {
    const png = await renderCard({
      title: g.title,
      tagline: g.hero.tagline,
      accent: g.theme.accent,
      accent2: g.theme.accent2,
      emoji: g.hero.emoji,
    });
    const dest = path.join(OUT, `${g.slug}.png`);
    fs.writeFileSync(dest, png);
    console.log(`og: ${g.slug}.png`);
  }

  // Default OG
  const def = await renderCard({
    title: SITE_NAME,
    tagline: "20 free typing games to boost your WPM. No download, no signup.",
    accent: "#4f46e5",
    accent2: "#ec4899",
    emoji: "⌨️",
  });
  fs.writeFileSync(path.join(OUT, "_default.png"), def);
  console.log("og: _default.png");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
