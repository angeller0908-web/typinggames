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
import professional from "@/data/wordlists/professional.json";
import medical from "@/data/wordlists/medical.json";
import numbers from "@/data/wordlists/numbers.json";
import certificate from "@/data/wordlists/certificate.json";
import office from "@/data/wordlists/office.json";
import keyboard from "@/data/wordlists/keyboard.json";
import speed from "@/data/wordlists/speed.json";
import kids from "@/data/wordlists/kids.json";
import shop from "@/data/wordlists/shop.json";
import retro from "@/data/wordlists/retro.json";
import race from "@/data/wordlists/race.json";
import rhythm from "@/data/wordlists/rhythm.json";
import branded from "@/data/wordlists/branded.json";
import custom from "@/data/wordlists/custom.json";
import creative from "@/data/wordlists/creative.json";
import japaneseromaji from "@/data/wordlists/japanese-romaji.json";
import urdu from "@/data/wordlists/urdu.json";
import spanish from "@/data/wordlists/spanish.json";
import russian from "@/data/wordlists/russian.json";
import khmer from "@/data/wordlists/khmer.json";
import korean from "@/data/wordlists/korean.json";
import punjabi from "@/data/wordlists/punjabi.json";
import nepali from "@/data/wordlists/nepali.json";
import hindi from "@/data/wordlists/hindi.json";
import languagegeneral from "@/data/wordlists/language-general.json";

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
  "professional": professional as Wordlist,
  "medical": medical as Wordlist,
  "numbers": numbers as Wordlist,
  "certificate": certificate as Wordlist,
  "office": office as Wordlist,
  "keyboard": keyboard as Wordlist,
  "speed": speed as Wordlist,
  "kids": kids as Wordlist,
  "shop": shop as Wordlist,
  "retro": retro as Wordlist,
  "race": race as Wordlist,
  "rhythm": rhythm as Wordlist,
  "branded": branded as Wordlist,
  "custom": custom as Wordlist,
  "creative": creative as Wordlist,
  "japanese-romaji": japaneseromaji as Wordlist,
  "urdu": urdu as Wordlist,
  "spanish": spanish as Wordlist,
  "russian": russian as Wordlist,
  "khmer": khmer as Wordlist,
  "korean": korean as Wordlist,
  "punjabi": punjabi as Wordlist,
  "nepali": nepali as Wordlist,
  "hindi": hindi as Wordlist,
  "language-general": languagegeneral as Wordlist,
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
