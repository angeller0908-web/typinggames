#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const args = parseArgs(process.argv.slice(2));
const category = args.category ?? "word";
const order = args.order ?? "quality";
const pages = Number(args.pages ?? 4);
const pagination = Number(args.pagination ?? 12);
const sid = String(args.sid ?? 1);
const delayMs = Number(args["delay-ms"] ?? 500);
const out = args.out ?? "data/provider-feeds/gamepix-word.json";
const match = args.match !== false && args.match !== "false";

await fs.mkdir(path.dirname(path.resolve(ROOT, out)), { recursive: true });

const all = [];
const seen = new Set();

let nextUrl = feedUrl({ page: 1, pagination, category, order, sid });

for (let page = 1; page <= pages && nextUrl; page += 1) {
  const url = nextUrl;
  process.stdout.write(`Fetching GamePix ${category} page ${page}/${pages}... `);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "typingrally-provider-matcher/1.0",
        accept: "application/feed+json,application/json,text/plain,*/*",
      },
    });
    if (!res.ok) {
      console.log(`HTTP ${res.status}`);
      await sleep(delayMs);
      continue;
    }
    const json = await res.json();
    const rows = Array.isArray(json.items) ? json.items : [];
    let added = 0;
    for (const row of rows) {
      const key = stableKey(row);
      if (seen.has(key)) continue;
      seen.add(key);
      all.push({ ...row, _typingrallyCategory: category });
      added += 1;
    }
    console.log(`${rows.length} rows, ${added} new`);
    nextUrl = typeof json.next_url === "string" ? json.next_url : "";
    if (rows.length === 0) break;
  } catch (error) {
    console.log(`failed: ${error.message}`);
  }
  await sleep(delayMs);
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
      "GamePix",
      "--threshold",
      String(args.threshold ?? 55),
    ],
    { cwd: ROOT, stdio: "inherit" },
  );
  process.exitCode = result.status ?? 0;
}

function feedUrl({ page, pagination, category, order, sid }) {
  const url = new URL("https://feeds.gamepix.com/v2/json");
  url.searchParams.set("page", String(page));
  url.searchParams.set("pagination", String(pagination));
  url.searchParams.set("category", category);
  url.searchParams.set("order", order);
  url.searchParams.set("sid", sid);
  return url.toString();
}

function stableKey(row) {
  return String(row.id ?? row.namespace ?? row.title ?? row.url ?? JSON.stringify(row).slice(0, 200)).toLowerCase();
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
