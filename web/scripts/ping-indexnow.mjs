#!/usr/bin/env node
/**
 * Ping IndexNow (Bing / Yahoo / DuckDuckGo / Seznam / Naver) with site URLs.
 *
 * Usage:
 *   node scripts/ping-indexnow.mjs             # ping every URL in the sitemap set
 *   node scripts/ping-indexnow.mjs /game/foo/  # ping specific paths only
 *
 * The key file must be deployed at https://typingrally.com/<KEY>.txt first.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const KEY = "a1f744d6bde04bacbc2ccdd0e661e653";
const HOST = "typingrally.com";
const BASE = `https://${HOST}`;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const games = JSON.parse(readFileSync(join(root, "data/games.json"), "utf8"));

const HUB_SLUGS = [
  "popular",
  "typing-tests",
  "jobs",
  "kids",
  "languages",
  "keyboard-layout",
  "speed-certificate",
  "arcade",
];
const STATIC_PATHS = ["/", "/about/", "/contact/", "/privacy/", "/terms/", "/cookies/", "/dmca/"];

const args = process.argv.slice(2);
const urlList =
  args.length > 0
    ? args.map((p) => (p.startsWith("http") ? p : `${BASE}${p}`))
    : [
        ...STATIC_PATHS.map((p) => `${BASE}${p}`),
        ...HUB_SLUGS.map((s) => `${BASE}/games/${s}/`),
        ...games.map((g) => `${BASE}/game/${g.slug}/`),
      ];

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: `${BASE}/${KEY}.txt`,
  urlList,
};

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

console.log(`IndexNow: ${res.status} ${res.statusText} — pinged ${urlList.length} URLs`);
if (!res.ok) {
  const text = await res.text();
  console.error(text);
  process.exit(1);
}
