#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_CANDIDATES = path.join(ROOT, "data/iframe-candidates.json");
const DEFAULT_GAMES = path.join(ROOT, "data/games.json");
const DEFAULT_REPORT = path.join(ROOT, "data/iframe-match-report.json");
const DEFAULT_MARKDOWN = path.join(ROOT, "data/iframe-match-report.md");
const STOP = new Set([
  "the",
  "a",
  "an",
  "for",
  "to",
  "of",
  "and",
  "or",
  "in",
  "on",
  "with",
  "near",
  "me",
  "game",
  "games",
  "typing",
  "type",
  "test",
  "practice",
]);

const args = parseArgs(process.argv.slice(2));

if (!args.feed) {
  console.error(`Usage:
  npm run match:iframes -- --feed data/provider-feeds/gamemonetize.json --provider GameMonetize
  npm run match:iframes -- --feed https://example.com/feed.json --provider GameDistribution

Options:
  --feed <path-or-url>       Provider feed JSON, RSS/XML, or a URL returning JSON/RSS
  --provider <name>          Provider label written to the report
  --threshold <number>       Minimum score for "review" matches, default 55
  --apply                    Update games.json for high-confidence legal embed matches
  --apply-threshold <number> Minimum score for --apply, default 88
`);
  process.exit(1);
}

const threshold = Number(args.threshold ?? 55);
const applyThreshold = Number(args["apply-threshold"] ?? 88);
const provider = args.provider ?? "UnknownProvider";

const [candidateRows, games, rawFeed] = await Promise.all([
  readJson(DEFAULT_CANDIDATES),
  readJson(DEFAULT_GAMES),
  readInput(args.feed),
]);

const feedRecords = parseFeed(rawFeed, provider);
const matches = candidateRows.map((candidate) => {
  const scored = feedRecords
    .map((record) => ({
      record,
      score: scoreCandidate(candidate, record),
    }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return {
    keyword: candidate.keyword,
    slug: candidate.slug,
    currentEmbed: candidate.currentEmbed,
    fallbackEngineDesign: candidate.fallbackEngineDesign,
    provider,
    bestScore: scored[0]?.score ?? 0,
    matches: scored.map(({ record, score }) => ({
      score,
      title: record.title,
      embedUrl: record.embedUrl,
      playUrl: record.playUrl,
      thumbnail: record.thumbnail,
      categories: record.categories,
      tags: record.tags,
      legalStatus: record.embedUrl ? record.embedSource ?? "embeddable-field-present" : "no-embed-field",
    })),
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  provider,
  feed: args.feed,
  totalCandidates: candidateRows.length,
  totalFeedRecords: feedRecords.length,
  threshold,
  apply: Boolean(args.apply),
  buckets: {
    high: matches.filter((m) => m.bestScore >= 88).length,
    medium: matches.filter((m) => m.bestScore >= 70 && m.bestScore < 88).length,
    low: matches.filter((m) => m.bestScore >= threshold && m.bestScore < 70).length,
    none: matches.filter((m) => m.bestScore < threshold).length,
  },
  matches,
};

await fs.writeFile(DEFAULT_REPORT, JSON.stringify(report, null, 2) + "\n");
await fs.writeFile(DEFAULT_MARKDOWN, toMarkdown(report));

if (args.apply) {
  const bySlug = new Map(games.map((game) => [game.slug, game]));
  let applied = 0;
  for (const row of matches) {
    const best = row.matches[0];
    if (!best || best.score < applyThreshold || !best.embedUrl) continue;
    const game = bySlug.get(row.slug);
    if (!game) continue;
    game.embed = {
      kind: "iframe",
      url: best.embedUrl,
      provider,
      aspectRatio: "16:9",
    };
    applied += 1;
  }
  await fs.writeFile(DEFAULT_GAMES, JSON.stringify(games, null, 2) + "\n");
  report.applied = applied;
  await fs.writeFile(DEFAULT_REPORT, JSON.stringify(report, null, 2) + "\n");
}

console.log(`Feed records: ${feedRecords.length}`);
console.log(`Candidates: ${candidateRows.length}`);
console.log(`High: ${report.buckets.high}, medium: ${report.buckets.medium}, low: ${report.buckets.low}, none: ${report.buckets.none}`);
console.log(`Wrote ${path.relative(ROOT, DEFAULT_REPORT)}`);
console.log(`Wrote ${path.relative(ROOT, DEFAULT_MARKDOWN)}`);

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

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function readInput(input) {
  if (/^https?:\/\//i.test(input)) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Feed request failed: ${res.status} ${res.statusText}`);
    return await res.text();
  }
  return await fs.readFile(path.resolve(ROOT, input), "utf8");
}

function parseFeed(raw, provider) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("<")) return parseXmlFeed(trimmed, provider);
  const json = JSON.parse(trimmed);
  const records = Array.isArray(json)
    ? json
    : Array.isArray(json.games)
      ? json.games
      : Array.isArray(json.items)
        ? json.items
        : Array.isArray(json.data)
          ? json.data
          : [];
  return records.map((record) => normalizeRecord(record, provider)).filter((r) => r.title);
}

function parseXmlFeed(xml, provider) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  return items
    .map((item) => {
      const title = tagText(item, "title");
      const playUrl = tagText(item, "link");
      const description = stripTags(tagText(item, "description"));
      const categories = [...item.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((m) =>
        decodeXml(stripTags(m[1])).trim(),
      );
      const embedUrl = firstUrl(description, ["embed", "iframe"]) ?? firstUrl(item, ["embed", "iframe"]);
      return normalizeRecord({ title, name: title, url: playUrl, link: playUrl, description, categories, embedUrl }, provider);
    })
    .filter((r) => r.title);
}

function normalizeRecord(record, provider) {
  const title = String(record.title ?? record.name ?? record.gameName ?? record.gamename ?? "").trim();
  const directEmbedUrl =
    stringField(record, ["embedUrl", "embed_url", "iframeUrl", "iframe_url", "iframe", "embed", "gameIframe", "game_iframe"]) ??
    extractIframeSrc(String(record.embedCode ?? record.embed_code ?? record.html ?? ""));
  const playUrl = stringField(record, ["url", "link", "playUrl", "gameUrl", "game_url", "source"]);
  const providerEmbedUrl = providerUrlAsEmbed(playUrl, provider);
  const embedUrl = directEmbedUrl ?? providerEmbedUrl;
  const thumbnail = stringField(record, ["thumb", "thumbnail", "image", "imageUrl", "asset"]);
  const description = String(record.description ?? record.desc ?? record.instructions ?? "");
  const categories = arrayField(record, ["category", "categories", "genre", "genres"]);
  const tags = arrayField(record, ["tag", "tags", "keywords"]);
  return {
    provider,
    title,
    embedUrl,
    embedSource: directEmbedUrl ? "explicit-feed-field" : providerEmbedUrl ? "provider-html5-url" : undefined,
    playUrl,
    thumbnail,
    description,
    categories,
    tags,
    searchText: normalizeText([title, description, categories.join(" "), tags.join(" ")].join(" ")),
  };
}

function scoreCandidate(candidate, record) {
  const keyword = normalizeText(candidate.keyword);
  const design = normalizeText(candidate.fallbackEngineDesign);
  const slug = normalizeText(candidate.slug.replaceAll("-", " "));
  const text = record.searchText;
  const title = normalizeText(record.title);
  let score = 0;
  if (isTypingIntent(keyword) && !hasTypingSignal(text)) return 0;
  if (title === keyword || title === design || title === slug) score += 70;
  if (title.includes(keyword) || keyword.includes(title)) score += 35;
  if (title.includes(design) || design.includes(title)) score += 30;
  score += Math.round(tokenOverlap(keyword, text) * 35);
  score += Math.round(tokenOverlap(design, text) * 25);
  if (record.embedUrl) score += 12;
  if (/\btyping\b|\bkeyboard\b|\bword\b|\btype\b/i.test(record.title)) score += 10;
  return Math.min(100, score);
}

function isTypingIntent(text) {
  return /\b(typing|type|typer|keyboard|keystrokes?|wpm|touch|transcription|data entry)\b/.test(text);
}

function hasTypingSignal(text) {
  return /\b(typing|type|keyboard|keystrokes?|letters?|words?|wpm|text|sentences?)\b/.test(text);
}

function tokenOverlap(a, b) {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));
  if (left.size === 0 || right.size === 0) return 0;
  let hit = 0;
  for (const t of left) if (right.has(t)) hit += 1;
  return hit / left.size;
}

function tokens(s) {
  return normalizeText(s)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function normalizeText(s) {
  return String(s)
    .toLowerCase()
    .replace(/&amp;/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stringField(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function arrayField(record, keys) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === "string" && value.trim()) return value.split(/[,|]/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function tagText(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(stripCdata(match[1]).trim()) : "";
}

function stripCdata(s) {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, " ");
}

function decodeXml(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractIframeSrc(html) {
  const match = String(html).match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

function providerUrlAsEmbed(url, provider) {
  if (!url || !/gamemonetize/i.test(provider)) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "html5.gamemonetize.co" || parsed.hostname === "html5.gamemonetize.com") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function firstUrl(text, hints) {
  const urls = String(text).match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
  return urls.find((url) => hints.some((hint) => url.toLowerCase().includes(hint)));
}

function toMarkdown(report) {
  const groups = [
    ["High", report.matches.filter((m) => m.bestScore >= 88)],
    ["Medium", report.matches.filter((m) => m.bestScore >= 70 && m.bestScore < 88)],
    ["Low", report.matches.filter((m) => m.bestScore >= report.threshold && m.bestScore < 70)],
    ["None", report.matches.filter((m) => m.bestScore < report.threshold)],
  ];
  const lines = [
    `# Iframe Match Report: ${report.provider}`,
    "",
    `Feed records: ${report.totalFeedRecords}`,
    `Candidates: ${report.totalCandidates}`,
    "",
  ];
  for (const [label, rows] of groups) {
    lines.push(`## ${label} (${rows.length})`);
    lines.push("| Keyword | Current slug | Best score | Best feed title | Embed URL |");
    lines.push("|---|---|---:|---|---|");
    for (const row of rows) {
      const best = row.matches[0];
      lines.push(
        `| ${row.keyword} | \`/game/${row.slug}/\` | ${row.bestScore} | ${best?.title ?? ""} | ${best?.embedUrl ?? ""} |`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}
