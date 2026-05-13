export type EngineMode =
  | "classic-time"
  | "classic-words"
  | "falling-words"
  | "spawn-targets"
  | "countdown-defuse";

export type EngineKernel =
  | "falling"
  | "lane"
  | "queue"
  | "target"
  | "rhythm"
  | "form";

export type GameplayTemplateId =
  | "fruit-drop-typer"
  | "food-rush-typer"
  | "space-asteroid-splitter"
  | "ghost-chase-typer"
  | "horror-flashlight-typer"
  | "racing-lane-typer"
  | "truck-dispatch-typer"
  | "ten-key-cashier"
  | "data-entry-warehouse"
  | "dispatch-call-queue"
  | "medical-scribe-shift"
  | "transcript-repair"
  | "certificate-exam"
  | "speed-ladder"
  | "accuracy-gate"
  | "rhythm-beat-typer"
  | "lyric-beat-typer"
  | "keyboard-layout-quest"
  | "dvorak-switch-quest"
  | "right-hand-rescue"
  | "blindfold-home-row"
  | "language-script-sprint"
  | "alphabet-rocket"
  | "kids-playground"
  | "tutor-monster-battle"
  | "custom-arena-builder"
  | "word-search-scanner"
  | "typewriter-ribbon-rally"
  | "shop-gear-sorter"
  | "boss-battle-typer";

export type Variant =
  | "fruit"
  | "rain"
  | "rocket"
  | "ghosts"
  | "alien"
  | "asteroid"
  | "bomb"
  | "chicken"
  | "zoo"
  | "jets"
  | "kangaroo"
  | "frog"
  | "kph-truck"
  | "food-deliver"
  | "money-counter"
  | "swim-lane"
  | "endurance-99"
  | "banana-letters"
  | "mavis-staged"
  | "dance-staged"
  | "profession-sim"
  | "medical-sim"
  | "number-pad"
  | "certificate-ladder"
  | "office-dash"
  | "language-sprint"
  | "layout-map"
  | "speed-ladder"
  | "kids-playground"
  | "shop-stack"
  | "retro-arcade"
  | "race-typing"
  | "space-patrol"
  | "spooky-chase"
  | "rhythm-lane"
  | "inspired-arcade"
  | "custom-arena"
  | "creative-gallery"
  | "typing-arcade";

export type ScoreUnit = "wpm" | "kph" | "score" | "money";

export interface EngineConfig {
  durationSec?: number;
  wordCount?: number;
  spawnRateMs?: number;
  fallSpeedPxSec?: number;
  livesAllowed?: number;
  scoreUnit?: ScoreUnit;
  variant: Variant;
}

export type Embed =
  | {
      kind: "iframe";
      url: string | null;
      provider: string;
      aspectRatio: "16:9" | "4:3";
    }
  | {
      kind: "engine";
      templateId: GameplayTemplateId;
      mode: EngineMode;
      wordlistIds: string[];
      config: EngineConfig;
    };

export interface GameplayTemplate {
  id: GameplayTemplateId;
  label: string;
  kernel: EngineKernel;
  mode: EngineMode;
  variant: Variant;
  defaultWordlistIds: string[];
  defaultConfig: Omit<EngineConfig, "variant">;
  goal: string;
  failureRule: string;
  scoring: ScoreUnit;
  visualMotif: string;
}

export interface ThemeTokens {
  palette: string;
  accent: string;
  accent2: string;
  surface: string;
  sprites: string;
}

export interface FAQEntry {
  q: string;
  a: string;
}

export interface Game {
  slug: string;
  title: string;
  keyword: string;
  searchVolume: number;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  embed: Embed;
  hero: { tagline: string; emoji?: string };
  theme: ThemeTokens;
  faq: FAQEntry[];
  related: string[];
  publishedAt: string;
  updatedAt: string;
}

export interface KeywordOpportunity {
  rank: number;
  priority: "P0" | "P1" | "P2" | "P3";
  bucket: string;
  keyword: string;
  kd: number;
  volume: number;
  intent: string;
  pageType: string;
  originalUrlSlug: string;
  source: string;
  notes: string;
}

export interface Wordlist {
  id: string;
  label: string;
  description: string;
  words: string[];
}

export interface EngineSnapshot {
  status: "idle" | "running" | "paused" | "ended";
  wpm: number;
  kph: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
  elapsedMs: number;
  remainingMs: number;
  wordsCompleted: number;
  livesLeft: number;
  score: number;
  currentWord: string;
  typedSoFar: string;
  combo: number;
  templateLabel: string;
  templateValue: string;
  templateStatus: string;
}
