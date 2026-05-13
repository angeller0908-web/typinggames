#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/ads.txt");
const ADSENSE_LINE = "google.com, pub-7103013772082124, DIRECT, f08c47fec0942fa0";
const GAMEPIX_ADS_TXT_URL = "https://www.gamepix.com/ads.txt";

const res = await fetch(GAMEPIX_ADS_TXT_URL, {
  headers: {
    "user-agent": "typingrally-ads-txt-updater/1.0",
    accept: "text/plain,*/*",
  },
});

if (!res.ok) {
  throw new Error(`Failed to fetch GamePix ads.txt: ${res.status} ${res.statusText}`);
}

const gamepixAdsTxt = (await res.text()).trim();
const content = [
  "# typingrally.com ads.txt",
  "# Updated by scripts/update-ads-txt.mjs",
  "",
  "# Google AdSense",
  ADSENSE_LINE,
  "",
  "# GamePix publisher requirements",
  gamepixAdsTxt,
  "",
].join("\n");

await fs.writeFile(OUT, content);
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
