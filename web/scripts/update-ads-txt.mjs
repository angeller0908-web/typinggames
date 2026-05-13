#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/ads.txt");
const ADSENSE_LINE = "google.com, pub-7103013772082124, DIRECT, f08c47fec0942fa0";
const GAMEPIX_PROPERTY_ADS_TXT = path.join(ROOT, "data/gamepix-property-77187-ads.txt");
const gamepixPropertyAdsTxt = (await fs.readFile(GAMEPIX_PROPERTY_ADS_TXT, "utf8")).trim();
const content = [
  "# typingrally.com ads.txt",
  "# Updated by scripts/update-ads-txt.mjs",
  "",
  "# Google AdSense",
  ADSENSE_LINE,
  "",
  "# GamePix property requirements",
  gamepixPropertyAdsTxt,
  "",
].join("\n");

await fs.writeFile(OUT, content);
console.log(`Wrote ${path.relative(ROOT, OUT)}`);
