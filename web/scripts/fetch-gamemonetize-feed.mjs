#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const args = parseArgs(process.argv.slice(2));
const out = args.out ?? "data/provider-feeds/gamemonetize.json";
const match = args.match !== false && args.match !== "false";
const delayMs = Number(args["delay-ms"] ?? 3000);
const retries = Number(args.retries ?? 2);
const maxRetryAfterMs = Number(args["max-retry-after-ms"] ?? 5000);
const strategy = args.strategy ?? (args.query ? "query" : "discover");
const candidateSearch = strategy === "exhaustive" || args["candidate-search"] === true || args["candidate-search"] === "true";
const pages = Number(args.pages ?? (strategy === "latest" ? 20 : 1));
const allMode = args.all === true || args.all === "true" || String(args.num ?? "").toLowerCase() === "all";
const num = allMode ? undefined : Number(args.num ?? 100);
const queryParam = args["query-param"] ?? "name";
const candidatesPath = args.candidates ?? "data/iframe-candidates.json";
const maxQueries = args["max-queries"] ? Number(args["max-queries"]) : undefined;
const discoveryQueries = [
  "typing",
  "keyboard",
  "word",
  "letters",
  "alphabet",
  "race",
  "space typing",
  "typing game",
  "typing race",
  "typing fighter",
];

await fs.mkdir(path.dirname(path.resolve(ROOT, out)), { recursive: true });

const all = [];
const seen = new Set();
const queries = args.query
  ? [String(args.query)]
  : candidateSearch
    ? await buildCandidateQueries(candidatesPath)
    : strategy === "latest"
      ? [""]
      : discoveryQueries;
if (maxQueries && queries.length > maxQueries) queries.length = maxQueries;
const totalFetches = queries.length * pages;
let fetchIndex = 0;

console.log(`Queries: ${queries.length}`);
console.log(`Strategy: ${strategy}`);
console.log(`Pages per query: ${pages}`);
console.log(`Games per page: ${allMode ? "All" : num}`);
console.log(`Delay: ${delayMs}ms`);

for (const query of queries) {
  for (let page = 1; page <= pages; page += 1) {
    fetchIndex += 1;
    const url = feedUrl({ page, num, query, queryParam });
    const label = query ? `"${query}" page ${page}` : `latest page ${page}`;
    process.stdout.write(`[${fetchIndex}/${totalFetches}] Fetching ${label}... `);
    try {
      const res = await fetchWithRetry(url, retries);
      if (!res.ok) {
        console.log(`HTTP ${res.status}`);
        await sleep(delayMs);
        continue;
      }
      const text = await res.text();
      const rows = parseRows(text).map((row) => ({ ...row, _typingrallyQuery: query || "latest" }));
      let added = 0;
      for (const row of rows) {
        const key = stableKey(row);
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(row);
        added += 1;
      }
      console.log(`${rows.length} rows, ${added} new`);
      if (rows.length === 0) break;
      if (added === 0) {
        console.log(`No new games on ${label}; stopping this query.`);
        break;
      }
    } catch (error) {
      console.log(`failed: ${error.message}`);
    }
    await sleep(delayMs);
  }
}

await fs.writeFile(path.resolve(ROOT, out), JSON.stringify(all, null, 2) + "\n");
console.log(`Saved ${all.length} unique games to ${out}`);

if (match) {
  const result = spawnSync(
    process.execPath,
    [
      "scripts/match-iframe-feed.mjs",
      "--feed",
      out,
      "--provider",
      "GameMonetize",
      "--threshold",
      String(args.threshold ?? 55),
    ],
    { cwd: ROOT, stdio: "inherit" },
  );
  process.exitCode = result.status ?? 0;
}

function feedUrl({ page, num, query, queryParam }) {
  const url = new URL("https://gamemonetize.com/feed.php");
  url.searchParams.set("format", "0");
  if (num !== undefined) url.searchParams.set("num", String(num));
  url.searchParams.set("page", String(page));
  if (query) url.searchParams.set(queryParam, query);
  return url.toString();
}

async function fetchWithRetry(url, retries) {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, {
      headers: {
        "user-agent": "typingrally-feed-matcher/1.0",
        accept: "application/json,text/plain,*/*",
      },
    });
    if (res.status !== 429 || attempt >= retries) return res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const serverWaitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delayMs * (attempt + 2);
    const waitMs = Math.min(serverWaitMs, maxRetryAfterMs);
    process.stdout.write(`HTTP 429, retrying in ${waitMs}ms... `);
    await sleep(waitMs);
    attempt += 1;
  }
}

function parseRows(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const json = JSON.parse(trimmed);
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.games)) return json.games;
  if (Array.isArray(json.items)) return json.items;
  if (Array.isArray(json.data)) return json.data;
  return [];
}

function stableKey(row) {
  return String(
    row.id ??
      row.ID ??
      row.game_id ??
      row.title ??
      row.name ??
      row.url ??
      row.game_url ??
      JSON.stringify(row).slice(0, 200),
  ).toLowerCase();
}

async function buildCandidateQueries(file) {
  const rows = JSON.parse(await fs.readFile(path.resolve(ROOT, file), "utf8"));
  const queries = [];
  const seenQueries = new Set();
  for (const row of rows) {
    for (const query of candidateQueries(row)) {
      const normalized = normalizeQuery(query);
      if (!normalized || seenQueries.has(normalized)) continue;
      seenQueries.add(normalized);
      queries.push(normalized);
    }
  }
  return queries;
}

function candidateQueries(row) {
  const values = [row.keyword, row.fallbackEngineDesign, String(row.slug ?? "").replaceAll("-", " ")];
  const out = [];
  for (const value of values) {
    const cleaned = normalizeQuery(value);
    if (!cleaned) continue;
    out.push(cleaned);
    const noTyping = cleaned.replace(/\b(typing|type|typer|keyboard|practice|test|game|games)\b/g, " ").replace(/\s+/g, " ").trim();
    if (noTyping && noTyping.length >= 3) out.push(noTyping);
  }
  out.push("typing", "keyboard", "word");
  return out.slice(0, 5);
}

function normalizeQuery(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
