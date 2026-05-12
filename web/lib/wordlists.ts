import type { Wordlist } from "./types";

import fruits from "@/data/wordlists/fruits.json";
import vehicles from "@/data/wordlists/vehicles.json";
import foods from "@/data/wordlists/foods.json";
import farmAnimals from "@/data/wordlists/farm-animals.json";
import zooAnimals from "@/data/wordlists/zoo-animals.json";
import australianAnimals from "@/data/wordlists/australian-animals.json";
import animals from "@/data/wordlists/animals.json";
import space from "@/data/wordlists/space.json";
import scifi from "@/data/wordlists/sci-fi.json";
import aircraft from "@/data/wordlists/aircraft.json";
import waterSports from "@/data/wordlists/water-sports.json";
import finance from "@/data/wordlists/finance.json";
import horror from "@/data/wordlists/horror.json";
import commonEn from "@/data/wordlists/common-en.json";

const REGISTRY: Record<string, Wordlist> = {
  fruits: fruits as Wordlist,
  vehicles: vehicles as Wordlist,
  foods: foods as Wordlist,
  "farm-animals": farmAnimals as Wordlist,
  "zoo-animals": zooAnimals as Wordlist,
  "australian-animals": australianAnimals as Wordlist,
  animals: animals as Wordlist,
  space: space as Wordlist,
  "sci-fi": scifi as Wordlist,
  aircraft: aircraft as Wordlist,
  "water-sports": waterSports as Wordlist,
  finance: finance as Wordlist,
  horror: horror as Wordlist,
  "common-en": commonEn as Wordlist,
};

export function loadWordlist(id: string): Wordlist {
  const w = REGISTRY[id];
  if (!w) throw new Error(`Wordlist not found: ${id}`);
  return w;
}

export function mergeWordlists(ids: string[]): string[] {
  const out: string[] = [];
  for (const id of ids) {
    out.push(...loadWordlist(id).words);
  }
  return Array.from(new Set(out));
}

export function bananaFilter(words: string[]): string[] {
  return words.filter((w) => w.toLowerCase().startsWith("b"));
}

export function previewSample(ids: string[], n = 50): string[] {
  return mergeWordlists(ids).slice(0, n);
}
