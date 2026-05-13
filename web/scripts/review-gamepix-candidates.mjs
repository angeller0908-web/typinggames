#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const args = parseArgs(process.argv.slice(2));
const feedPath = args.feed ?? "data/provider-feeds/gamepix-all.json";
const gamesPath = args.games ?? "data/games.json";
const outJson = args.out ?? "data/gamepix-review-candidates.json";
const outMd = args.markdown ?? "data/gamepix-review-candidates.md";
const minScore = Number(args["min-score"] ?? 45);

const [games, feed] = await Promise.all([
  readJson(gamesPath),
  readJson(feedPath),
]);

const records = feed.map(normalizeRecord).filter((r) => r.title && r.embedUrl);
const reviews = games.map((game) => {
  const matches = records
    .map((record) => ({ ...record, score: scoreGame(game, record) }))
    .filter((record) => record.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  return {
    slug: game.slug,
    title: game.title,
    keyword: game.keyword,
    category: game.category,
    currentEmbed: game.embed.kind,
    bestScore: matches[0]?.score ?? 0,
    matches: matches.map((m) => ({
      score: m.score,
      title: m.title,
      category: m.category,
      embedUrl: m.embedUrl,
      description: m.description,
    })),
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  feed: feedPath,
  totalGames: games.length,
  totalFeedRecords: records.length,
  minScore,
  buckets: {
    strong: reviews.filter((r) => r.bestScore >= 80).length,
    review: reviews.filter((r) => r.bestScore >= 60 && r.bestScore < 80).length,
    weak: reviews.filter((r) => r.bestScore >= minScore && r.bestScore < 60).length,
    none: reviews.filter((r) => r.bestScore < minScore).length,
  },
  reviews,
};

await fs.writeFile(path.resolve(ROOT, outJson), JSON.stringify(report, null, 2) + "\n");
await fs.writeFile(path.resolve(ROOT, outMd), toMarkdown(report));

console.log(`Feed records: ${records.length}`);
console.log(`Games: ${games.length}`);
console.log(`Strong: ${report.buckets.strong}, review: ${report.buckets.review}, weak: ${report.buckets.weak}, none: ${report.buckets.none}`);
console.log(`Wrote ${outJson}`);
console.log(`Wrote ${outMd}`);

function normalizeRecord(row) {
  const title = String(row.title ?? "").trim();
  const description = String(row.description ?? "");
  const category = String(row.category ?? "");
  const namespace = String(row.namespace ?? "");
  const embedUrl = String(row.url ?? "");
  const searchText = normalize([title, description, category, namespace].join(" "));
  return { title, description, category, namespace, embedUrl, searchText };
}

function scoreGame(game, record) {
  const keyword = normalize(game.keyword);
  const title = normalize(game.title);
  const slug = normalize(game.slug.replaceAll("-", " "));
  const category = normalize(game.category);
  const tagline = normalize(game.hero?.tagline ?? "");
  const text = record.searchText;
  const recordTitle = normalize(record.title);

  let score = 0;
  if (recordTitle === title || recordTitle === keyword || recordTitle === slug) score += 90;
  if (recordTitle.includes(title) || title.includes(recordTitle)) score += 40;
  if (recordTitle.includes(keyword) || keyword.includes(recordTitle)) score += 35;

  score += Math.round(overlap(keyword, text) * 45);
  score += Math.round(overlap(title, text) * 40);
  score += Math.round(overlap(slug, text) * 35);
  score += Math.round(overlap(tagline, text) * 20);

  const theme = themeTerms(game);
  score += Math.min(35, theme.filter((term) => text.includes(term)).length * 10);

  if (category && text.includes(category)) score += 8;
  if (/\b(typing|typer|typefast|keyboard|keystroke)\b/.test(text)) score += 12;
  if (/\b(typing|type|typer|wpm|keyboard|keystroke)\b/.test(keyword) && !/\b(typing|type|typer|keyboard|letter|word|keystroke)\b/.test(text)) {
    score -= 35;
  }

  return Math.max(0, Math.min(100, score));
}

function themeTerms(game) {
  const terms = new Set();
  for (const raw of [game.slug, game.keyword, game.title, game.hero?.tagline, game.category]) {
    for (const token of tokens(raw)) terms.add(token);
  }
  const map = {
    fruit: ["fruit", "fruits", "watermelon", "juicy"],
    food: ["food", "burger", "pizza", "sushi", "sandwich"],
    truck: ["truck", "transport", "driving"],
    rocket: ["rocket", "space", "galaxy", "planet"],
    alien: ["alien", "space", "galaxy"],
    asteroid: ["asteroid", "space", "meteor"],
    ghost: ["ghost", "horror", "halloween"],
    horror: ["horror", "scary", "ghost"],
    alphabet: ["alphabet", "letter", "abc"],
    kids: ["kids", "child", "junior", "alphabet"],
    frog: ["frog", "froggy"],
    zoo: ["zoo", "animal"],
    rhythm: ["music", "rhythm", "dance", "fnf"],
    spanish: ["spanish", "word", "language"],
    korean: ["korean", "hangul"],
    japanese: ["japanese", "kana"],
    hindi: ["hindi"],
    medical: ["doctor", "hospital", "medical"],
    money: ["money", "cash", "coin"],
    race: ["race", "racing", "runner", "nitro"],
    space: ["space", "galaxy", "cosmic", "star"],
    word: ["word", "letter", "typing"],
  };
  for (const [key, values] of Object.entries(map)) {
    if ([...terms].some((term) => term.includes(key) || key.includes(term))) {
      for (const value of values) terms.add(value);
    }
  }
  return [...terms].filter((term) => term.length > 2);
}

function overlap(a, b) {
  const left = tokens(a);
  if (left.length === 0) return 0;
  let hit = 0;
  for (const token of left) if (b.includes(token)) hit += 1;
  return hit / left.length;
}

function tokens(value) {
  const stop = new Set(["the", "and", "for", "with", "game", "games", "typing", "type", "test", "practice"]);
  return normalize(value).split(" ").filter((x) => x.length > 1 && !stop.has(x));
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&amp;/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(path.resolve(ROOT, file), "utf8"));
}

function toMarkdown(report) {
  const groups = [
    ["Strong", report.reviews.filter((r) => r.bestScore >= 80)],
    ["Review", report.reviews.filter((r) => r.bestScore >= 60 && r.bestScore < 80)],
    ["Weak", report.reviews.filter((r) => r.bestScore >= report.minScore && r.bestScore < 60)],
    ["None", report.reviews.filter((r) => r.bestScore < report.minScore)],
  ];
  const lines = [
    "# GamePix Review Candidates",
    "",
    `Feed records: ${report.totalFeedRecords}`,
    `Games: ${report.totalGames}`,
    "",
  ];
  for (const [label, rows] of groups) {
    lines.push(`## ${label} (${rows.length})`);
    lines.push("| Page | Keyword | Score | Candidate | Category | Embed URL |");
    lines.push("|---|---|---:|---|---|---|");
    for (const row of rows) {
      const best = row.matches[0];
      lines.push(`| \`/game/${row.slug}/\` | ${row.keyword} | ${row.bestScore} | ${best?.title ?? ""} | ${best?.category ?? ""} | ${best?.embedUrl ?? ""} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}
