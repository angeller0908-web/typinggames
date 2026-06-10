import type { EngineConfig, EngineMode, EngineSnapshot, GameplayTemplate, Variant } from "@/lib/types";

export interface EngineInit {
  mode: EngineMode;
  variant: Variant;
  template: GameplayTemplate;
  config: EngineConfig;
  words: string[];
  theme: { accent: string; accent2: string; surface: string };
}

type Listener = () => void;

const SNAPSHOT_THROTTLE_MS = 100;
const DEFAULT_DURATION = 60_000;
const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

interface RuntimeRule {
  metricLabel: string;
  statusLabel: string;
  successVerb: string;
  missVerb: string;
  scoreBonus: number;
  streakBonusEvery?: number;
  timeBonusMs?: number;
  missTimePenaltyMs?: number;
  missScorePenalty?: number;
  missLifeEvery?: number;
  pressurePerScore?: number;
  maxActiveItems?: number;
  targetWords?: number;
  keyboardZone?: "all" | "right" | "home" | "dvorak";
  layoutTargeting?: boolean;
  clickToLock?: boolean;
  sequentialQueue?: boolean;
  rhythmWindowMs?: number;
  ticketTimerMs?: number;
  movingTargets?: "bounce" | "lane" | "grid" | "chase" | "orbit" | "run";
  textTransform?: "numbers" | "upper" | "short" | "home" | "right" | "codes";
  preferredWords?: string[];
  progressKind:
    | "basket"
    | "tickets"
    | "shield"
    | "lantern"
    | "flashlight"
    | "track"
    | "cargo"
    | "register"
    | "warehouse"
    | "calls"
    | "chart"
    | "transcript"
    | "certificate"
    | "ladder"
    | "accuracy"
    | "beat"
    | "lyrics"
    | "keyboard"
    | "dvorak"
    | "right-hand"
    | "memory"
    | "language"
    | "alphabet"
    | "playground"
    | "monster"
    | "custom"
    | "scanner"
    | "ribbon"
    | "shop"
    | "boss"
    | "coop"
    | "kphmeter";
}

const TEMPLATE_RULES: Record<string, RuntimeRule> = {
  "fruit-drop-typer": {
    metricLabel: "Basket",
    statusLabel: "Catch fruit before it drops",
    successVerb: "caught",
    missVerb: "dropped",
    scoreBonus: 3,
    streakBonusEvery: 5,
    maxActiveItems: 5,
    movingTargets: "lane",
    textTransform: "short",
    preferredWords: [
      "apple", "banana", "grape", "mango", "peach", "cherry", "melon", "lemon",
      "kiwi", "plum", "pear", "orange", "berry", "fig", "lime", "papaya",
    ],
    progressKind: "basket",
  },
  "food-rush-typer": {
    metricLabel: "Orders",
    statusLabel: "Kitchen rush is open",
    successVerb: "served",
    missVerb: "delayed",
    scoreBonus: 4,
    streakBonusEvery: 4,
    timeBonusMs: 400,
    missScorePenalty: 1,
    sequentialQueue: true,
    ticketTimerMs: 9000,
    progressKind: "tickets",
  },
  "space-asteroid-splitter": {
    metricLabel: "Shield",
    statusLabel: "Asteroids entering range",
    successVerb: "split",
    missVerb: "impact",
    scoreBonus: 5,
    pressurePerScore: 0.006,
    maxActiveItems: 6,
    movingTargets: "chase",
    progressKind: "shield",
  },
  "ghost-chase-typer": {
    metricLabel: "Lantern",
    statusLabel: "Ghosts are closing in",
    successVerb: "banished",
    missVerb: "escaped",
    scoreBonus: 4,
    pressurePerScore: 0.008,
    missTimePenaltyMs: 500,
    movingTargets: "chase",
    progressKind: "lantern",
  },
  "horror-flashlight-typer": {
    metricLabel: "Battery",
    statusLabel: "Keep the beam alive",
    successVerb: "lit",
    missVerb: "dimmed",
    scoreBonus: 4,
    missTimePenaltyMs: 900,
    pressurePerScore: 0.005,
    movingTargets: "chase",
    progressKind: "flashlight",
  },
  "racing-lane-typer": {
    metricLabel: "Position",
    statusLabel: "Clean streaks boost the car",
    successVerb: "advanced",
    missVerb: "skidded",
    scoreBonus: 5,
    streakBonusEvery: 3,
    missScorePenalty: 2,
    sequentialQueue: true,
    progressKind: "track",
  },
  "truck-dispatch-typer": {
    metricLabel: "Routes",
    statusLabel: "Dispatch cargo cleanly",
    successVerb: "routed",
    missVerb: "misrouted",
    scoreBonus: 4,
    missScorePenalty: 1,
    sequentialQueue: true,
    progressKind: "cargo",
  },
  "ten-key-cashier": {
    metricLabel: "Receipts",
    statusLabel: "Enter tickets before timeout",
    successVerb: "paid",
    missVerb: "voided",
    scoreBonus: 6,
    timeBonusMs: 300,
    maxActiveItems: 4,
    textTransform: "numbers",
    ticketTimerMs: 6500,
    progressKind: "register",
  },
  "data-entry-warehouse": {
    metricLabel: "Bins",
    statusLabel: "Warehouse queue active",
    successVerb: "filed",
    missVerb: "miskeyed",
    scoreBonus: 4,
    missScorePenalty: 1,
    sequentialQueue: true,
    ticketTimerMs: 10000,
    progressKind: "warehouse",
  },
  "dispatch-call-queue": {
    metricLabel: "Calls",
    statusLabel: "Priority calls waiting",
    successVerb: "handled",
    missVerb: "missed",
    scoreBonus: 5,
    missTimePenaltyMs: 500,
    sequentialQueue: true,
    ticketTimerMs: 8500,
    progressKind: "calls",
  },
  "medical-scribe-shift": {
    metricLabel: "Charts",
    statusLabel: "Accuracy gate is strict",
    successVerb: "charted",
    missVerb: "corrected",
    scoreBonus: 4,
    missScorePenalty: 2,
    sequentialQueue: true,
    textTransform: "upper",
    progressKind: "chart",
  },
  "transcript-repair": {
    metricLabel: "Repairs",
    statusLabel: "Clean fragments restore the note",
    successVerb: "repaired",
    missVerb: "marked",
    scoreBonus: 4,
    missScorePenalty: 2,
    sequentialQueue: true,
    progressKind: "transcript",
  },
  "certificate-exam": {
    metricLabel: "Exam",
    statusLabel: "Pass the timed gate",
    successVerb: "approved",
    missVerb: "flagged",
    scoreBonus: 5,
    targetWords: 30,
    sequentialQueue: true,
    progressKind: "certificate",
  },
  "speed-ladder": {
    metricLabel: "Tier",
    statusLabel: "Climb with streaks",
    successVerb: "climbed",
    missVerb: "slipped",
    scoreBonus: 4,
    streakBonusEvery: 5,
    missScorePenalty: 2,
    sequentialQueue: true,
    progressKind: "ladder",
  },
  "accuracy-gate": {
    metricLabel: "Gate",
    statusLabel: "Accuracy matters most",
    successVerb: "cleared",
    missVerb: "failed",
    scoreBonus: 3,
    missScorePenalty: 3,
    sequentialQueue: true,
    progressKind: "accuracy",
  },
  "rhythm-beat-typer": {
    metricLabel: "Beat",
    statusLabel: "Hit prompts before the beat closes",
    successVerb: "perfect",
    missVerb: "miss",
    scoreBonus: 7,
    timeBonusMs: 200,
    maxActiveItems: 4,
    rhythmWindowMs: 2200,
    ticketTimerMs: 2200,
    progressKind: "beat",
  },
  "lyric-beat-typer": {
    metricLabel: "Line",
    statusLabel: "Keep the lyric lane moving",
    successVerb: "sung",
    missVerb: "offbeat",
    scoreBonus: 6,
    timeBonusMs: 200,
    maxActiveItems: 4,
    rhythmWindowMs: 2600,
    ticketTimerMs: 2600,
    progressKind: "lyrics",
  },
  "keyboard-layout-quest": {
    metricLabel: "Keys",
    statusLabel: "Map the keyboard zones",
    successVerb: "mapped",
    missVerb: "lost",
    scoreBonus: 4,
    maxActiveItems: 7,
    layoutTargeting: true,
    keyboardZone: "all",
    movingTargets: "grid",
    progressKind: "keyboard",
  },
  "dvorak-switch-quest": {
    metricLabel: "Switches",
    statusLabel: "Alternate layout route",
    successVerb: "switched",
    missVerb: "reverted",
    scoreBonus: 5,
    maxActiveItems: 6,
    layoutTargeting: true,
    keyboardZone: "dvorak",
    movingTargets: "grid",
    progressKind: "dvorak",
  },
  "right-hand-rescue": {
    metricLabel: "Rescues",
    statusLabel: "Right-hand zone only",
    successVerb: "rescued",
    missVerb: "missed",
    scoreBonus: 5,
    maxActiveItems: 6,
    layoutTargeting: true,
    keyboardZone: "right",
    textTransform: "right",
    movingTargets: "grid",
    progressKind: "right-hand",
  },
  "blindfold-home-row": {
    metricLabel: "Memory",
    statusLabel: "Trust home-row memory",
    successVerb: "remembered",
    missVerb: "peeked",
    scoreBonus: 5,
    missScorePenalty: 2,
    layoutTargeting: true,
    keyboardZone: "home",
    textTransform: "home",
    movingTargets: "grid",
    progressKind: "memory",
  },
  "language-script-sprint": {
    metricLabel: "Script",
    statusLabel: "Script sprint active",
    successVerb: "matched",
    missVerb: "mistranscribed",
    scoreBonus: 4,
    sequentialQueue: true,
    progressKind: "language",
  },
  "alphabet-rocket": {
    metricLabel: "Launches",
    statusLabel: "Launch alphabet rockets",
    successVerb: "launched",
    missVerb: "scrubbed",
    scoreBonus: 5,
    maxActiveItems: 5,
    movingTargets: "lane",
    textTransform: "short",
    progressKind: "alphabet",
  },
  "kids-playground": {
    metricLabel: "Stars",
    statusLabel: "Gentle short-word play",
    successVerb: "starred",
    missVerb: "bounced",
    scoreBonus: 3,
    maxActiveItems: 5,
    movingTargets: "grid",
    textTransform: "short",
    progressKind: "playground",
  },
  "tutor-monster-battle": {
    metricLabel: "HP",
    statusLabel: "Monster HP falls with words",
    successVerb: "hit",
    missVerb: "blocked",
    scoreBonus: 6,
    targetWords: 18,
    maxActiveItems: 5,
    movingTargets: "chase",
    clickToLock: true,
    progressKind: "monster",
  },
  "custom-arena-builder": {
    metricLabel: "Rules",
    statusLabel: "Custom rule set active",
    successVerb: "built",
    missVerb: "reset",
    scoreBonus: 4,
    sequentialQueue: true,
    progressKind: "custom",
  },
  "word-search-scanner": {
    metricLabel: "Scans",
    statusLabel: "Scanner locks on words",
    successVerb: "scanned",
    missVerb: "blank",
    scoreBonus: 4,
    maxActiveItems: 7,
    movingTargets: "orbit",
    clickToLock: true,
    progressKind: "scanner",
  },
  "typewriter-ribbon-rally": {
    metricLabel: "Ribbon",
    statusLabel: "Keep the ribbon moving",
    successVerb: "typed",
    missVerb: "jammed",
    scoreBonus: 4,
    missScorePenalty: 1,
    sequentialQueue: true,
    progressKind: "ribbon",
  },
  "shop-gear-sorter": {
    metricLabel: "Shelf",
    statusLabel: "Sort gear before it falls",
    successVerb: "sorted",
    missVerb: "dropped",
    scoreBonus: 4,
    maxActiveItems: 6,
    movingTargets: "lane",
    progressKind: "shop",
  },
  "boss-battle-typer": {
    metricLabel: "Boss HP",
    statusLabel: "Attack windows are open",
    successVerb: "struck",
    missVerb: "countered",
    scoreBonus: 7,
    targetWords: 24,
    maxActiveItems: 5,
    movingTargets: "chase",
    clickToLock: true,
    progressKind: "boss",
  },
  "chicken-run": {
    metricLabel: "Eggs",
    statusLabel: "Stop the chickens before the coop",
    successVerb: "caught",
    missVerb: "escaped",
    scoreBonus: 3,
    streakBonusEvery: 4,
    maxActiveItems: 6,
    movingTargets: "run",
    textTransform: "short",
    preferredWords: [
      "hen", "egg", "corn", "coop", "peck", "wing", "nest", "seed",
      "cluck", "chick", "feed", "barn", "hay", "run", "flap", "beak",
    ],
    progressKind: "coop",
  },
  "kph-meter": {
    metricLabel: "KPH",
    statusLabel: "Live keystrokes-per-hour test",
    successVerb: "entered",
    missVerb: "error",
    scoreBonus: 5,
    sequentialQueue: true,
    textTransform: "codes",
    progressKind: "kphmeter",
  },
};

type BackdropKind =
  | "orchard"
  | "farm"
  | "sky"
  | "space"
  | "night"
  | "road"
  | "kitchen"
  | "panel"
  | "paper"
  | "stage"
  | "arcade"
  | "ocean";

interface SpriteTheme {
  glyphs: string[];
  backdrop: BackdropKind;
  burstColors: string[];
  burstGlyph?: string;
  itemScale?: number;
}

const DARK_BACKDROPS: ReadonlySet<BackdropKind> = new Set(["space", "night", "arcade"]);

const SPRITE_THEMES: Record<string, SpriteTheme> = {
  "fruit-drop-typer": {
    glyphs: ["🍎", "🍌", "🍉", "🍇", "🍓", "🍊", "🍑", "🍒", "🥝", "🍋"],
    backdrop: "orchard",
    burstColors: ["#ef4444", "#f97316", "#facc15", "#84cc16"],
    burstGlyph: "💦",
  },
  "chicken-run": {
    glyphs: ["🐔", "🐓", "🐤", "🐥"],
    backdrop: "farm",
    burstColors: ["#fafaf9", "#fde68a", "#f97316"],
    burstGlyph: "🥚",
  },
  "food-rush-typer": {
    glyphs: ["🍔", "🍕", "🌮", "🍜", "🍩", "🍣", "🥪", "🌭"],
    backdrop: "kitchen",
    burstColors: ["#f97316", "#fbbf24", "#ef4444"],
    burstGlyph: "✨",
  },
  "space-asteroid-splitter": {
    glyphs: ["☄️", "🪨", "🌑"],
    backdrop: "space",
    burstColors: ["#f97316", "#fbbf24", "#94a3b8"],
    burstGlyph: "💥",
  },
  "ghost-chase-typer": {
    glyphs: ["👻", "💀", "🎃"],
    backdrop: "night",
    burstColors: ["#c4b5fd", "#e9d5ff", "#f8fafc"],
    burstGlyph: "✨",
  },
  "horror-flashlight-typer": {
    glyphs: ["🦇", "🕷️", "👁️"],
    backdrop: "night",
    burstColors: ["#ef4444", "#a3a3a3", "#fca5a5"],
    burstGlyph: "💥",
  },
  "racing-lane-typer": {
    glyphs: ["🏎️", "🚗", "🚙"],
    backdrop: "road",
    burstColors: ["#38bdf8", "#fbbf24", "#f8fafc"],
    burstGlyph: "💨",
  },
  "truck-dispatch-typer": {
    glyphs: ["🚚", "🚛", "📦"],
    backdrop: "road",
    burstColors: ["#fbbf24", "#a3e635", "#f8fafc"],
    burstGlyph: "📦",
  },
  "ten-key-cashier": { glyphs: ["🧾"], backdrop: "panel", burstColors: ["#22c55e", "#86efac"], burstGlyph: "💵" },
  "data-entry-warehouse": { glyphs: ["📦"], backdrop: "panel", burstColors: ["#38bdf8", "#a5f3fc"], burstGlyph: "✅" },
  "dispatch-call-queue": { glyphs: ["📞"], backdrop: "panel", burstColors: ["#f87171", "#fca5a5"], burstGlyph: "✅" },
  "medical-scribe-shift": { glyphs: ["🩺"], backdrop: "panel", burstColors: ["#34d399", "#a7f3d0"], burstGlyph: "✅" },
  "transcript-repair": { glyphs: ["📝"], backdrop: "paper", burstColors: ["#818cf8", "#c7d2fe"], burstGlyph: "✅" },
  "certificate-exam": { glyphs: ["📜"], backdrop: "paper", burstColors: ["#fbbf24", "#fde68a"], burstGlyph: "🏅" },
  "kph-meter": { glyphs: [], backdrop: "panel", burstColors: ["#22c55e", "#86efac"], burstGlyph: "✓" },
  "speed-ladder": { glyphs: ["⚡"], backdrop: "stage", burstColors: ["#fbbf24", "#fde047"], burstGlyph: "⚡" },
  "accuracy-gate": { glyphs: ["🎯"], backdrop: "stage", burstColors: ["#22c55e", "#86efac"], burstGlyph: "🎯" },
  "rhythm-beat-typer": {
    glyphs: ["🥁", "🎵", "🎶"],
    backdrop: "arcade",
    burstColors: ["#e879f9", "#22d3ee", "#fde047"],
    burstGlyph: "🎵",
  },
  "lyric-beat-typer": {
    glyphs: ["🎤", "🎶"],
    backdrop: "arcade",
    burstColors: ["#f472b6", "#c4b5fd", "#fde047"],
    burstGlyph: "🎶",
  },
  "keyboard-layout-quest": { glyphs: ["⌨️"], backdrop: "panel", burstColors: ["#38bdf8", "#bae6fd"], burstGlyph: "✨" },
  "dvorak-switch-quest": { glyphs: ["🔀"], backdrop: "panel", burstColors: ["#a78bfa", "#ddd6fe"], burstGlyph: "✨" },
  "right-hand-rescue": { glyphs: ["🖐️"], backdrop: "stage", burstColors: ["#fb923c", "#fed7aa"], burstGlyph: "✨" },
  "blindfold-home-row": { glyphs: ["🕶️"], backdrop: "night", burstColors: ["#94a3b8", "#e2e8f0"], burstGlyph: "✨" },
  "language-script-sprint": { glyphs: ["🌍", "✍️"], backdrop: "paper", burstColors: ["#34d399", "#fbbf24"], burstGlyph: "✨" },
  "alphabet-rocket": {
    glyphs: ["🚀", "🛰️"],
    backdrop: "space",
    burstColors: ["#fb923c", "#fde047", "#f8fafc"],
    burstGlyph: "🔥",
  },
  "kids-playground": {
    glyphs: ["⭐", "🎈", "🦄", "🐥", "🎪"],
    backdrop: "sky",
    burstColors: ["#f472b6", "#fde047", "#4ade80", "#38bdf8"],
    burstGlyph: "⭐",
  },
  "tutor-monster-battle": {
    glyphs: ["👾", "🐲", "👹"],
    backdrop: "arcade",
    burstColors: ["#4ade80", "#fde047", "#f87171"],
    burstGlyph: "💥",
  },
  "custom-arena-builder": { glyphs: ["🧩"], backdrop: "stage", burstColors: ["#38bdf8", "#a78bfa"], burstGlyph: "🧩" },
  "word-search-scanner": { glyphs: ["🔍", "📡"], backdrop: "panel", burstColors: ["#22d3ee", "#a5f3fc"], burstGlyph: "✨" },
  "typewriter-ribbon-rally": { glyphs: ["🖋️"], backdrop: "paper", burstColors: ["#78716c", "#d6d3d1"], burstGlyph: "✒️" },
  "shop-gear-sorter": {
    glyphs: ["🎧", "🖱️", "⌨️", "🕹️"],
    backdrop: "stage",
    burstColors: ["#38bdf8", "#fbbf24"],
    burstGlyph: "🛒",
  },
  "boss-battle-typer": {
    glyphs: ["🐉", "👹"],
    backdrop: "arcade",
    burstColors: ["#f87171", "#fde047", "#fb923c"],
    burstGlyph: "⚔️",
  },
};

const DEFAULT_SPRITE: SpriteTheme = {
  glyphs: ["⭐"],
  backdrop: "stage",
  burstColors: ["#fbbf24", "#fde68a"],
  burstGlyph: "✨",
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  glyph?: string;
  rot: number;
  vr: number;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
}

interface FallingItem {
  id: number;
  word: string;
  x: number;
  y: number;
  vy: number;
  hp: number;
  glyph: string;
}

interface SpawnItem {
  id: number;
  word: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  stationary: boolean;
  locked: boolean;
  glyph: string;
}

interface BombItem {
  id: number;
  word: string;
  x: number;
  y: number;
  timerMs: number;
  glyph: string;
}

export class TypingEngine {
  readonly init: EngineInit;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rafId = 0;
  private lastTickMs = 0;
  private startMs = 0;
  private listeners = new Set<Listener>();
  private snapshot: EngineSnapshot;
  private lastBroadcastMs = 0;
  private status: EngineSnapshot["status"] = "idle";
  private elapsedMs = 0;
  private remainingMs: number;
  private livesLeft: number;
  private combo = 0;
  private misses = 0;
  private lastAction = "Ready";

  // Classic mode state
  private classicWords: string[] = [];
  private classicIndex = 0;
  private classicTyped = "";

  // Falling state
  private fallItems: FallingItem[] = [];
  private fallNextId = 1;
  private fallSpawnAccum = 0;
  private fallTyped = "";
  private fallLockedId: number | null = null;

  // Spawn state
  private spawnItems: SpawnItem[] = [];
  private spawnNextId = 1;
  private spawnAccum = 0;
  private spawnTyped = "";

  // Defuse state
  private bombs: BombItem[] = [];
  private bombNextId = 1;
  private bombSpawnAccum = 0;
  private bombTyped = "";
  private bombLockedId: number | null = null;

  // Stats
  private correctChars = 0;
  private totalChars = 0;
  private wordsCompleted = 0;
  private score = 0;

  // Word pool
  private wordPool: string[];
  private rule: RuntimeRule;
  private recentWords: string[] = [];
  private wordSequence = 0;

  // Visual effects
  private sprite: SpriteTheme;
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private shakeMs = 0;
  private flashMs = 0;

  // Attract mode: autoplays the scene before the user starts
  private demo = false;
  private demoAccum = 0;

  constructor(init: EngineInit) {
    this.init = init;
    this.rule = TEMPLATE_RULES[init.template.id] ?? TEMPLATE_RULES["word-search-scanner"];
    this.sprite = SPRITE_THEMES[init.template.id] ?? DEFAULT_SPRITE;
    this.wordPool = filterWordsForVariant(init.words, init.variant);
    this.remainingMs = (init.config.durationSec ?? 60) * 1000;
    this.livesLeft = init.config.livesAllowed ?? 3;
    this.snapshot = this.buildSnapshot();
  }

  // ---------------- Public API ----------------

  start() {
    if (this.status === "running") return;
    if (this.demo) {
      // Leaving attract mode: reset stats and timers but KEEP the live items —
      // the user is usually aiming at a word that is already on stage.
      this.demo = false;
      cancelAnimationFrame(this.rafId);
      this.elapsedMs = 0;
      this.remainingMs = (this.init.config.durationSec ?? 60) * 1000;
      this.livesLeft = this.init.config.livesAllowed ?? 3;
      this.correctChars = 0;
      this.totalChars = 0;
      this.wordsCompleted = 0;
      this.score = 0;
      this.combo = 0;
      this.misses = 0;
      this.lastAction = "Go";
      this.classicTyped = "";
      if (this.classicWords.length > 0) {
        this.classicWords = this.classicWords.slice(this.classicIndex);
        this.classicIndex = 0;
      }
      this.fallTyped = "";
      this.fallLockedId = null;
      this.spawnTyped = "";
      this.spawnItems.forEach((s) => (s.locked = false));
      this.bombTyped = "";
      this.bombLockedId = null;
      for (const b of this.bombs) b.timerMs = this.rule.ticketTimerMs ?? 8000;
      this.popups = [];
      this.status = "running";
      this.startMs = performance.now();
      this.lastTickMs = this.startMs;
      if (
        (this.init.mode === "classic-time" || this.init.mode === "classic-words") &&
        this.classicWords.length === 0
      ) {
        this.spawnInitial();
      }
      this.loop();
      this.broadcast(true);
      return;
    }
    this.resetIfEnded();
    this.status = "running";
    this.startMs = performance.now();
    this.lastTickMs = this.startMs;
    this.spawnInitial();
    this.loop();
    this.broadcast(true);
  }

  startDemo() {
    if (this.status !== "idle" || this.demo) return;
    this.demo = true;
    this.demoAccum = 0;
    this.lastTickMs = performance.now();
    this.spawnInitial();
    this.loop();
  }

  isDemo() {
    return this.demo;
  }

  pause() {
    if (this.status !== "running") return;
    this.status = "paused";
    cancelAnimationFrame(this.rafId);
    this.broadcast(true);
  }

  resume() {
    if (this.status !== "paused") return;
    this.status = "running";
    this.lastTickMs = performance.now();
    this.loop();
    this.broadcast(true);
  }

  restart() {
    cancelAnimationFrame(this.rafId);
    this.status = "idle";
    this.elapsedMs = 0;
    this.remainingMs = (this.init.config.durationSec ?? 60) * 1000;
    this.livesLeft = this.init.config.livesAllowed ?? 3;
    this.classicIndex = 0;
    this.classicTyped = "";
    this.classicWords = [];
    this.fallItems = [];
    this.fallTyped = "";
    this.fallLockedId = null;
    this.fallSpawnAccum = 0;
    this.spawnItems = [];
    this.spawnTyped = "";
    this.spawnAccum = 0;
    this.bombs = [];
    this.bombTyped = "";
    this.bombLockedId = null;
    this.bombSpawnAccum = 0;
    this.correctChars = 0;
    this.totalChars = 0;
    this.wordsCompleted = 0;
    this.score = 0;
    this.combo = 0;
    this.misses = 0;
    this.recentWords = [];
    this.wordSequence = 0;
    this.lastAction = "Ready";
    this.particles = [];
    this.popups = [];
    this.shakeMs = 0;
    this.flashMs = 0;
    this.broadcast(true);
  }

  feedString(s: string) {
    // HiddenInput pushes the entire input value; we extract the delta.
    if (s.length === 0) {
      this.handleBackspace();
      return;
    }
    const lastChar = s.slice(-1);
    this.feed(lastChar);
  }

  feed(ch: string) {
    if (this.status !== "running" && !this.demo) return;
    if (ch === "\b" || ch === "Backspace") {
      this.handleBackspace();
      return;
    }
    if (ch.length !== 1) return;
    this.totalChars += 1;
    switch (this.init.mode) {
      case "classic-time":
      case "classic-words":
        this.feedClassic(ch);
        break;
      case "falling-words":
        this.feedFalling(ch);
        break;
      case "spawn-targets":
        this.feedSpawn(ch);
        break;
      case "countdown-defuse":
        this.feedDefuse(ch);
        break;
    }
    this.broadcast();
  }

  clickAt(canvasX: number, canvasY: number) {
    // Used by mobile: lock onto closest target so user can type/defuse.
    if (this.status !== "running") return;
    if (this.init.mode === "spawn-targets") {
      let bestId: number | null = null;
      let bestDist = Infinity;
      for (const s of this.spawnItems) {
        const dx = s.x - canvasX;
        const dy = s.y - canvasY;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          bestDist = d2;
          bestId = s.id;
        }
      }
      this.spawnItems.forEach((s) => (s.locked = s.id === bestId));
      this.spawnTyped = "";
    } else if (this.init.mode === "falling-words") {
      let bestId: number | null = null;
      let bestDist = Infinity;
      for (const f of this.fallItems) {
        const dx = f.x - canvasX;
        const dy = f.y - canvasY;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          bestDist = d2;
          bestId = f.id;
        }
      }
      this.fallLockedId = bestId;
      this.fallTyped = "";
    } else if (this.init.mode === "countdown-defuse") {
      let bestId: number | null = null;
      let bestDist = Infinity;
      for (const b of this.bombs) {
        const dx = b.x - canvasX;
        const dy = b.y - canvasY;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          bestDist = d2;
          bestId = b.id;
        }
      }
      this.bombLockedId = bestId;
      this.bombTyped = "";
    }
    this.broadcast();
  }

  subscribe = (cb: Listener) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  getSnapshot = (): EngineSnapshot => this.snapshot;

  mountCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resizeCanvas();
    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
    this.resizeObserver.observe(canvas);
    this.render();
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.listeners.clear();
  }

  // ---------------- Internals ----------------

  private resetIfEnded() {
    if (this.status === "ended") {
      this.restart();
    }
  }

  private spawnInitial() {
    if (this.init.mode === "classic-time" || this.init.mode === "classic-words") {
      const target = this.init.config.wordCount ?? 99;
      this.classicWords = Array.from({ length: target }, () => this.nextWord());
      this.classicIndex = 0;
      this.classicTyped = "";
    }
  }

  private nextWord(): string {
    const pool = this.wordPool.length > 0 ? this.wordPool : ["typing"];
    if (this.rule.preferredWords && Math.random() < 0.7) {
      return this.pickWord(this.rule.preferredWords, pool);
    }
    switch (this.rule.textTransform) {
      case "numbers":
        return this.rememberWord(
          makeReceiptCode(this.wordsCompleted + this.score + this.misses + this.wordSequence++ + 1),
        );
      case "codes":
        return this.rememberWord(makeEntryCode(this.wordSequence++));
      case "upper":
        return this.pickWord(pool.map((word) => word.toUpperCase()));
      case "short":
        return this.pickWord(pool.filter((word) => word.length <= 6), pool);
      case "home":
        return this.pickWord(filterByAllowedKeys(pool, "asdfjklgh".split("")), pool);
      case "right":
        return this.pickWord(filterByAllowedKeys(pool, "yuiophjklbnm".split("")), pool);
      default:
        return this.pickWord(pool);
    }
  }

  private pickWord(candidates: string[], fallback: string[] = ["typing"]): string {
    const uniqueCandidates = uniqueWords(candidates.length > 0 ? candidates : fallback);
    const activeWords = this.activeWords();
    const recent = new Set(this.recentWords);
    const tiers = [
      uniqueCandidates.filter((word) => !activeWords.has(word) && !recent.has(word)),
      uniqueCandidates.filter((word) => !activeWords.has(word)),
      uniqueCandidates.filter((word) => !recent.has(word)),
      uniqueCandidates,
    ];
    const usable = tiers.find((tier) => tier.length > 0) ?? ["typing"];
    return this.rememberWord(usable[Math.floor(Math.random() * usable.length)] ?? "typing");
  }

  private rememberWord(word: string): string {
    this.recentWords.push(word);
    if (this.recentWords.length > 12) this.recentWords.shift();
    return word;
  }

  private activeWords(): Set<string> {
    return new Set([
      ...this.fallItems.map((item) => item.word),
      ...this.spawnItems.map((item) => item.word),
      ...this.bombs.map((item) => item.word),
    ]);
  }

  private spawnPosition(w: number, h: number, padding: number): { x: number; y: number } {
    if (this.rule.movingTargets === "run") {
      const lane = this.spawnNextId % 4;
      return {
        x: -24,
        y: 110 + lane * Math.max(48, (h - 180) / 4),
      };
    }
    if (this.rule.layoutTargeting || this.rule.movingTargets === "grid") {
      const cols = 6;
      const rows = 3;
      const index = this.spawnNextId % (cols * rows);
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * Math.max(68, (w - padding * 2) / Math.max(1, cols - 1));
      const y = 92 + row * Math.max(58, (h - 180) / Math.max(1, rows - 1));
      return { x: Math.min(w - padding, x), y: Math.min(h - 60, y) };
    }
    if (this.rule.movingTargets === "lane") {
      const lane = this.spawnNextId % 4;
      return {
        x: padding + Math.random() * Math.max(1, w - padding * 2),
        y: 92 + lane * Math.max(52, (h - 160) / 4),
      };
    }
    if (this.rule.movingTargets === "chase") {
      const side = this.spawnNextId % 2;
      return {
        x: side === 0 ? padding : w - padding,
        y: padding + Math.random() * Math.max(1, h - padding * 2),
      };
    }
    return {
      x: padding + Math.random() * Math.max(1, w - padding * 2),
      y: padding + Math.random() * Math.max(1, h - padding * 2),
    };
  }

  private loop = () => {
    const now = performance.now();
    const dt = Math.min(50, now - this.lastTickMs);
    this.lastTickMs = now;
    this.tick(dt);
    if (this.status === "running" || this.demo) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private tick(dt: number) {
    this.elapsedMs += dt;
    if (!this.demo) {
      if (this.init.mode !== "classic-words") {
        this.remainingMs = Math.max(0, this.remainingMs - dt);
        if (this.remainingMs <= 0) {
          this.end("timeup");
          return;
        }
      }
    }
    switch (this.init.mode) {
      case "falling-words":
        this.tickFalling(dt);
        break;
      case "spawn-targets":
        this.tickSpawn(dt);
        break;
      case "countdown-defuse":
        this.tickDefuse(dt);
        break;
    }
    if (this.demo) this.tickDemo(dt);
    this.updateEffects(dt);
    this.render();
    this.broadcast();
  }

  // Ghost player: types the most urgent target one key at a time so the
  // idle canvas shows real gameplay instead of a blank box.
  private tickDemo(dt: number) {
    this.demoAccum += dt;
    if (this.demoAccum < 160) return;
    this.demoAccum = 0;
    let word = this.getCurrentWord();
    let typed = this.getTypedSoFar();
    if (!word) {
      typed = "";
      switch (this.init.mode) {
        case "falling-words": {
          let best: FallingItem | null = null;
          for (const f of this.fallItems) {
            if (!best || f.y > best.y) best = f;
          }
          word = best?.word ?? "";
          break;
        }
        case "spawn-targets":
          word = this.spawnItems[0]?.word ?? "";
          break;
        case "countdown-defuse":
          word = this.bombs[0]?.word ?? "";
          break;
        default:
          word = "";
      }
    }
    const next = word[typed.length];
    if (next) this.feed(next);
  }

  private updateEffects(dt: number) {
    this.shakeMs = Math.max(0, this.shakeMs - dt);
    this.flashMs = Math.max(0, this.flashMs - dt);
    const sec = dt / 1000;
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * sec;
      p.y += p.vy * sec;
      p.vy += 320 * sec;
      p.rot += p.vr * sec;
      return p.life > 0;
    });
    this.popups = this.popups.filter((p) => {
      p.life -= dt;
      p.y -= 36 * sec;
      return p.life > 0;
    });
  }

  private burstAt(x: number, y: number) {
    const colors = this.sprite.burstColors;
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
      const speed = 90 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 70,
        life: 420 + Math.random() * 280,
        max: 700,
        size: 3 + Math.random() * 4,
        color: colors[i % colors.length],
        rot: 0,
        vr: 0,
      });
    }
    if (this.sprite.burstGlyph) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 80,
        vy: -160,
        life: 600,
        max: 600,
        size: 22,
        color: "#fff",
        glyph: this.sprite.burstGlyph,
        rot: 0,
        vr: (Math.random() - 0.5) * 6,
      });
    }
  }

  private popupAt(x: number, y: number, text: string, color: string) {
    this.popups.push({ x, y, text, life: 750, max: 750, color });
  }

  private end(_reason: "timeup" | "lives" | "win") {
    if (this.demo) {
      // Attract mode never ends; recycle counters and keep playing.
      this.wordsCompleted = 0;
      this.score = 0;
      this.misses = 0;
      this.livesLeft = this.init.config.livesAllowed ?? 3;
      this.remainingMs = (this.init.config.durationSec ?? 60) * 1000;
      if (this.init.mode === "classic-time" || this.init.mode === "classic-words") {
        this.spawnInitial();
      }
      return;
    }
    this.status = "ended";
    this.lastAction =
      _reason === "win" ? "Goal complete" : _reason === "lives" ? "Lives depleted" : "Time up";
    cancelAnimationFrame(this.rafId);
    this.broadcast(true);
  }

  private registerSuccess(word: string, baseScore = word.length, pos?: { x: number; y: number }) {
    this.combo += 1;
    this.wordsCompleted += 1;
    const streakBonus =
      this.rule.streakBonusEvery && this.combo % this.rule.streakBonusEvery === 0
        ? this.rule.scoreBonus
        : 0;
    const gained = baseScore + this.rule.scoreBonus + streakBonus;
    this.score += gained;
    if (this.rule.timeBonusMs) {
      this.remainingMs += this.rule.timeBonusMs;
    }
    const fx = pos ?? {
      x: (this.canvas?.clientWidth ?? 640) / 2,
      y: (this.canvas?.clientHeight ?? 360) / 2,
    };
    this.burstAt(fx.x, fx.y);
    this.popupAt(fx.x, fx.y - 24, `+${gained}`, this.init.theme.accent);
    if (this.combo > 1 && this.combo % (this.rule.streakBonusEvery ?? 5) === 0) {
      this.popupAt(fx.x, fx.y - 48, `${this.combo}x combo!`, "#f59e0b");
    }
    this.lastAction = `${this.rule.successVerb}: ${word}`;
    if (this.rule.targetWords && this.wordsCompleted >= this.rule.targetWords) {
      this.end("win");
    }
  }

  private registerMiss(reason: string) {
    this.combo = 0;
    this.misses += 1;
    this.shakeMs = 240;
    this.flashMs = 160;
    if (this.rule.missScorePenalty) {
      this.score = Math.max(0, this.score - this.rule.missScorePenalty);
    }
    if (this.rule.missTimePenaltyMs) {
      this.remainingMs = Math.max(0, this.remainingMs - this.rule.missTimePenaltyMs);
    }
    if (this.rule.missLifeEvery && this.misses % this.rule.missLifeEvery === 0) {
      this.livesLeft -= 1;
      if (this.livesLeft <= 0) this.end("lives");
    }
    this.lastAction = `${this.rule.missVerb}: ${reason}`;
  }

  // ---------------- Classic ----------------

  private feedClassic(ch: string) {
    const target = this.classicWords[this.classicIndex];
    if (!target) {
      this.end("win");
      return;
    }
    const nextChar = target[this.classicTyped.length];
    if (ch === nextChar) {
      this.classicTyped += ch;
        this.correctChars += 1;
      if (this.classicTyped.length === target.length) {
        this.registerSuccess(target);
        this.classicIndex += 1;
        this.classicTyped = "";
        if (
          this.init.mode === "classic-words" &&
          this.classicIndex >= this.classicWords.length
        ) {
          this.end("win");
        }
      }
    } else if (ch === " ") {
      // skip to next word on space — counts as miss
      this.registerMiss(target);
      this.classicIndex += 1;
      this.classicTyped = "";
    } else {
      this.registerMiss(target);
      // For 'rain' variant: reset whole word on typo
      if (this.init.variant === "rain") {
        this.classicTyped = "";
      }
    }
  }

  // ---------------- Falling ----------------

  private tickFalling(dt: number) {
    const cfg = this.init.config;
    const rate = cfg.spawnRateMs ?? 1500;
    this.fallSpawnAccum += dt;
    if (this.fallSpawnAccum >= rate) {
      this.fallSpawnAccum = 0;
      this.spawnFallingItem();
    }
    const dir = this.init.variant === "rocket" ? -1 : 1;
    const baseSpeed = cfg.fallSpeedPxSec ?? 60;
    const speedMul =
      this.init.variant === "ghosts" ? 1 + this.score / 200 : 1 + this.score * (this.rule.pressurePerScore ?? 0);
    for (const item of this.fallItems) {
      item.y += dir * (baseSpeed * speedMul) * (dt / 1000);
    }
    const h = this.canvas?.clientHeight ?? 360;
    const w = this.canvas?.clientWidth ?? 640;
    // Remove off-screen / cost a life (attract mode just recycles)
    const remaining: FallingItem[] = [];
    for (const item of this.fallItems) {
      const offBottom = dir > 0 && item.y > h;
      const offTop = dir < 0 && item.y < 0;
      if (offBottom || offTop) {
        if (this.demo) {
          item.y = dir > 0 ? -20 : h + 20;
          remaining.push(item);
          continue;
        }
        this.livesLeft -= 1;
        this.registerMiss(item.word);
      } else {
        remaining.push(item);
      }
    }
    this.fallItems = remaining;
    if (!this.demo && this.livesLeft <= 0) {
      this.end("lives");
    }
  }

  private spawnFallingItem() {
    if (!this.canvas) return;
    const word = this.nextWord();
    const w = this.canvas.clientWidth;
    const dir = this.init.variant === "rocket" ? -1 : 1;
    const padding = 60;
    const x =
      this.rule.movingTargets === "lane"
        ? padding + (this.fallNextId % 5) * Math.max(70, (w - padding * 2) / 5)
        : padding + Math.random() * Math.max(0, w - padding * 2);
    const y = dir > 0 ? -20 : this.canvas.clientHeight + 20;
    const id = this.fallNextId++;
    this.fallItems.push({
      id,
      word,
      x,
      y,
      vy: 0,
      hp: word.length,
      glyph: this.sprite.glyphs.length > 0 ? this.sprite.glyphs[id % this.sprite.glyphs.length] : "",
    });
  }

  private feedFalling(ch: string) {
    // Find item matching current typed prefix
    let candidate: FallingItem | null = null;
    if (this.fallLockedId != null) {
      candidate = this.fallItems.find((f) => f.id === this.fallLockedId) ?? null;
      if (!candidate) {
        this.fallLockedId = null;
        this.fallTyped = "";
      }
    }
    if (!candidate) {
      const wantPrefix = this.fallTyped + ch;
      // closest to "danger" zone
      let best: FallingItem | null = null;
      let bestY = -Infinity;
      for (const f of this.fallItems) {
        if (f.word.startsWith(wantPrefix)) {
          if (f.y > bestY) {
            bestY = f.y;
            best = f;
          }
        }
      }
      candidate = best;
      if (candidate) {
        this.fallLockedId = candidate.id;
      }
    }
    if (!candidate) {
      this.fallTyped = "";
      return;
    }
    const nextChar = candidate.word[this.fallTyped.length];
    if (ch === nextChar) {
      this.fallTyped += ch;
      this.correctChars += 1;
      if (this.fallTyped === candidate.word) {
        this.fallItems = this.fallItems.filter((f) => f.id !== candidate!.id);
        this.registerSuccess(candidate.word, candidate.word.length, { x: candidate.x, y: candidate.y });
        this.fallTyped = "";
        this.fallLockedId = null;
      }
    } else {
      this.registerMiss(candidate.word);
      this.fallTyped = "";
      this.fallLockedId = null;
    }
  }

  // ---------------- Spawn ----------------

  private tickSpawn(dt: number) {
    const cfg = this.init.config;
    const rate = cfg.spawnRateMs ?? 1500;
    this.spawnAccum += dt;
    if (this.spawnAccum >= rate) {
      this.spawnAccum = 0;
      this.spawnSpawnItem();
    }
    const stationary = this.init.variant === "frog";
    if (!stationary && this.canvas) {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      const escaped: SpawnItem[] = [];
      for (const s of this.spawnItems) {
        if (this.rule.movingTargets === "run") {
          // Runners (chickens) never stop — typing pressure comes from the coop line.
          s.x += s.vx * (dt / 1000);
          if (s.x > w - 56) escaped.push(s);
          continue;
        }
        if (s.locked) continue;
        if (this.rule.movingTargets === "chase") {
          const dx = w / 2 - s.x;
          const dy = h / 2 - s.y;
          const dist = Math.max(1, Math.hypot(dx, dy));
          s.vx = (dx / dist) * 55;
          s.vy = (dy / dist) * 40;
        } else if (this.rule.movingTargets === "orbit") {
          const angle = (performance.now() / 800 + s.id) % (Math.PI * 2);
          s.vx = Math.cos(angle) * 75;
          s.vy = Math.sin(angle) * 45;
        }
        s.x += s.vx * (dt / 1000);
        s.y += s.vy * (dt / 1000);
        if (s.x < 30 || s.x > w - 30) s.vx *= -1;
        if (s.y < 60 || s.y > h - 30) s.vy *= -1;
      }
      for (const s of escaped) {
        if (this.demo) {
          s.x = -24;
          continue;
        }
        this.spawnItems = this.spawnItems.filter((it) => it.id !== s.id);
        this.livesLeft -= 1;
        this.registerMiss(s.word);
        if (this.livesLeft <= 0) {
          this.end("lives");
          return;
        }
      }
    }
    // remove very old unhit items
    const maxItems = this.rule.maxActiveItems ?? 6;
    while (this.spawnItems.length > maxItems) {
      this.spawnItems.shift();
    }
  }

  private spawnSpawnItem() {
    if (!this.canvas) return;
    const word = this.nextWord();
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const padding = 60;
    const pos = this.spawnPosition(w, h, padding);
    const x = pos.x;
    const y = pos.y;
    const isRunner = this.rule.movingTargets === "run";
    const stationary =
      !isRunner && (this.init.variant === "frog" || this.rule.movingTargets === "grid");
    const speed =
      this.rule.movingTargets === "chase" ? 110 : this.rule.movingTargets === "orbit" ? 80 : 60;
    const vx = isRunner
      ? 34 + Math.random() * 26 + Math.min(40, this.score * 0.4)
      : stationary
        ? 0
        : (Math.random() - 0.5) * speed;
    const vy = isRunner || stationary ? 0 : (Math.random() - 0.5) * speed * 0.7;
    const id = this.spawnNextId++;
    this.spawnItems.push({
      id,
      word,
      x,
      y,
      vx,
      vy,
      stationary,
      locked: false,
      glyph: this.sprite.glyphs.length > 0 ? this.sprite.glyphs[id % this.sprite.glyphs.length] : "",
    });
  }

  private feedSpawn(ch: string) {
    let locked = this.spawnItems.find((s) => s.locked);
    if (!locked) {
      // No lock → try auto-lock on prefix match
      const want = this.spawnTyped + ch;
      const match = this.spawnItems.find((s) => s.word.startsWith(want));
      if (match) {
        this.spawnItems.forEach((s) => (s.locked = s.id === match.id));
        locked = match;
      } else {
        this.registerMiss(want);
        this.spawnTyped = "";
        return;
      }
    }
    const next = locked.word[this.spawnTyped.length];
    if (ch === next) {
      this.spawnTyped += ch;
      this.correctChars += 1;
      if (this.spawnTyped === locked.word) {
        this.spawnItems = this.spawnItems.filter((s) => s.id !== locked!.id);
        this.registerSuccess(locked.word, locked.word.length, { x: locked.x, y: locked.y });
        this.spawnTyped = "";
      }
    } else {
      this.registerMiss(locked.word);
      this.spawnTyped = "";
      this.spawnItems.forEach((s) => (s.locked = false));
    }
  }

  // ---------------- Defuse ----------------

  private tickDefuse(dt: number) {
    this.bombSpawnAccum += dt;
    const rate = this.init.config.spawnRateMs ?? 2500;
    if (this.bombSpawnAccum >= rate && this.bombs.length < 4) {
      this.bombSpawnAccum = 0;
      this.spawnBomb();
    }
    for (const b of this.bombs) {
      b.timerMs -= dt;
    }
    const exploded = this.bombs.filter((b) => b.timerMs <= 0);
    if (exploded.length > 0) {
      if (this.demo) {
        for (const b of exploded) b.timerMs = this.rule.ticketTimerMs ?? 8000;
        return;
      }
      this.livesLeft -= exploded.length;
      for (const b of exploded) this.registerMiss(b.word);
      this.bombs = this.bombs.filter((b) => b.timerMs > 0);
      if (this.livesLeft <= 0) this.end("lives");
    }
  }

  private spawnBomb() {
    if (!this.canvas) return;
    const word = this.nextWord();
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const padding = 60;
    const id = this.bombNextId++;
    this.bombs.push({
      id,
      word,
      x: padding + Math.random() * Math.max(1, w - padding * 2),
      y: padding + Math.random() * Math.max(1, h - padding * 2),
      timerMs: this.rule.ticketTimerMs ?? 8000 + Math.random() * 4000,
      glyph: this.sprite.glyphs.length > 0 ? this.sprite.glyphs[id % this.sprite.glyphs.length] : "",
    });
  }

  private feedDefuse(ch: string) {
    let locked: BombItem | undefined = this.bombLockedId
      ? this.bombs.find((b) => b.id === this.bombLockedId)
      : undefined;
    if (!locked) {
      const want = this.bombTyped + ch;
      locked = this.bombs.find((b) => b.word.startsWith(want));
      if (locked) this.bombLockedId = locked.id;
      else {
        this.registerMiss(want);
        this.bombTyped = "";
        return;
      }
    }
    const next = locked.word[this.bombTyped.length];
    if (ch === next) {
      this.bombTyped += ch;
      this.correctChars += 1;
      if (this.bombTyped === locked.word) {
        this.bombs = this.bombs.filter((b) => b.id !== locked!.id);
        this.registerSuccess(locked.word, locked.word.length, { x: locked.x, y: locked.y });
        this.bombTyped = "";
        this.bombLockedId = null;
      }
    } else {
      this.registerMiss(locked.word);
      this.bombTyped = "";
      this.bombLockedId = null;
    }
  }

  // ---------------- Backspace ----------------

  private handleBackspace() {
    if (this.status !== "running") return;
    switch (this.init.mode) {
      case "classic-time":
      case "classic-words":
        if (this.classicTyped.length > 0) {
          this.classicTyped = this.classicTyped.slice(0, -1);
        }
        break;
      case "falling-words":
        if (this.fallTyped.length > 0) {
          this.fallTyped = this.fallTyped.slice(0, -1);
        }
        break;
      case "spawn-targets":
        if (this.spawnTyped.length > 0) {
          this.spawnTyped = this.spawnTyped.slice(0, -1);
        }
        break;
      case "countdown-defuse":
        if (this.bombTyped.length > 0) {
          this.bombTyped = this.bombTyped.slice(0, -1);
        }
        break;
    }
    this.broadcast();
  }

  // ---------------- Snapshot / broadcast ----------------

  private buildSnapshot(): EngineSnapshot {
    const elapsedSec = Math.max(1, this.elapsedMs / 1000);
    const wpm = (this.correctChars / 5) / (elapsedSec / 60);
    const kph = this.correctChars / (elapsedSec / 3600);
    const accuracy = this.totalChars === 0 ? 100 : (this.correctChars / this.totalChars) * 100;
    const currentWord = this.getCurrentWord();
    const typed = this.getTypedSoFar();
    return {
      status: this.status,
      wpm: Math.round(wpm),
      kph: Math.round(kph),
      accuracy: Math.round(accuracy),
      correctChars: this.correctChars,
      totalChars: this.totalChars,
      elapsedMs: this.elapsedMs,
      remainingMs: this.remainingMs,
      wordsCompleted: this.wordsCompleted,
      livesLeft: this.livesLeft,
      score: this.score,
      currentWord,
      typedSoFar: typed,
      combo: this.combo,
      templateLabel: this.rule.metricLabel,
      templateValue: this.getTemplateValue(),
      templateStatus: this.getTemplateStatus(),
    };
  }

  private getTemplateValue(): string {
    switch (this.rule.progressKind) {
      case "boss":
      case "monster": {
        const target = this.rule.targetWords ?? 24;
        return `${Math.max(0, target - this.wordsCompleted)} HP`;
      }
      case "certificate": {
        const target = this.rule.targetWords ?? 30;
        return `${Math.min(100, Math.round((this.wordsCompleted / target) * 100))}%`;
      }
      case "accuracy":
        return `${this.snapshot?.accuracy ?? 100}%`;
      case "flashlight":
      case "lantern":
      case "shield": {
        const sec = Math.ceil(this.remainingMs / 1000);
        return `${sec}s`;
      }
      case "track":
      case "ladder":
        return `Tier ${Math.max(1, Math.floor(this.combo / 5) + 1)}`;
      case "beat":
      case "lyrics":
        return this.combo >= 5 ? "Perfect" : this.combo >= 2 ? "Good" : "Ready";
      case "ribbon":
        return this.combo > 0 ? `${this.combo}x flow` : "Ready";
      case "kphmeter": {
        const sec = Math.max(1, this.elapsedMs / 1000);
        return String(Math.round(this.correctChars / (sec / 3600)));
      }
      default:
        return String(this.wordsCompleted);
    }
  }

  private getTemplateStatus(): string {
    const combo = this.combo > 1 ? ` · ${this.combo}x combo` : "";
    return `${this.rule.statusLabel}${combo} · ${this.lastAction}`;
  }

  private getCurrentWord(): string {
    switch (this.init.mode) {
      case "classic-time":
      case "classic-words":
        return this.classicWords[this.classicIndex] ?? "";
      case "falling-words": {
        if (this.fallLockedId != null) {
          return this.fallItems.find((f) => f.id === this.fallLockedId)?.word ?? "";
        }
        return "";
      }
      case "spawn-targets":
        return this.spawnItems.find((s) => s.locked)?.word ?? "";
      case "countdown-defuse": {
        if (this.bombLockedId != null) {
          return this.bombs.find((b) => b.id === this.bombLockedId)?.word ?? "";
        }
        return "";
      }
    }
  }

  private getTypedSoFar(): string {
    switch (this.init.mode) {
      case "classic-time":
      case "classic-words":
        return this.classicTyped;
      case "falling-words":
        return this.fallTyped;
      case "spawn-targets":
        return this.spawnTyped;
      case "countdown-defuse":
        return this.bombTyped;
    }
  }

  private broadcast(force = false) {
    if (this.demo) return; // keep the HUD at rest during attract mode
    const now = performance.now();
    if (!force && now - this.lastBroadcastMs < SNAPSHOT_THROTTLE_MS) return;
    this.lastBroadcastMs = now;
    this.snapshot = this.buildSnapshot();
    this.listeners.forEach((l) => l());
  }

  // ---------------- Canvas ----------------

  private resizeCanvas() {
    if (!this.canvas || !this.ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (this.shakeMs > 0) {
      const mag = Math.min(5, this.shakeMs / 40);
      ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
    }
    ctx.fillStyle = this.init.theme.surface;
    ctx.fillRect(-8, -8, w + 16, h + 16);
    this.renderTemplateStage(ctx, w, h);
    switch (this.init.mode) {
      case "classic-time":
      case "classic-words":
        this.renderClassic(ctx, w, h);
        break;
      case "falling-words":
        this.renderFalling(ctx, w, h);
        break;
      case "spawn-targets":
        this.renderSpawn(ctx, w, h);
        break;
      case "countdown-defuse":
        this.renderDefuse(ctx, w, h);
        break;
    }
    this.renderEffects(ctx);
    if (this.flashMs > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${(this.flashMs / 160) * 0.14})`;
      ctx.fillRect(-8, -8, w + 16, h + 16);
    }
    ctx.restore();
  }

  private renderEffects(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.max);
      if (p.glyph) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        ctx.font = `${p.size}px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.glyph, 0, 0);
        ctx.restore();
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const p of this.popups) {
      const alpha = Math.max(0, p.life / p.max);
      ctx.globalAlpha = alpha;
      ctx.font = "800 18px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  private renderTemplateStage(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    const accent = this.init.theme.accent;
    const kind = this.rule.progressKind;
    const dark = DARK_BACKDROPS.has(this.sprite.backdrop);

    this.drawBackdrop(ctx, w, h);

    // Keyboard-grid stages keep their key outlines on top of the backdrop.
    if (["keyboard", "dvorak", "right-hand", "memory"].includes(kind)) {
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = dark ? "#94a3b8" : accent;
      ctx.lineWidth = 1;
      const keyW = Math.max(26, (w - 120) / 12);
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 12; col += 1) {
          const x = 36 + col * keyW + row * 10;
          const y = h - 138 + row * 38;
          roundRect(ctx, x, y, keyW - 6, 28, 6);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = dark ? "#f8fafc" : "#0b0d10";
    ctx.fillText(this.init.template.label, 18, 16);
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = dark ? "#cbd5e1" : "#475569";
    ctx.fillText(this.rule.statusLabel, 18, 38);

    const progress = this.getStageProgress();
    ctx.fillStyle = dark ? "rgba(255,255,255,0.25)" : "#ffffff";
    roundRect(ctx, 18, h - 28, w - 36, 10, 5);
    ctx.fill();
    ctx.fillStyle = accent;
    roundRect(ctx, 18, h - 28, Math.max(8, (w - 36) * progress), 10, 5);
    ctx.fill();

    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.font = "700 13px Inter, system-ui, sans-serif";
    ctx.fillStyle = dark ? "#fde047" : accent;
    ctx.fillText(`${this.rule.metricLabel}: ${this.getTemplateValue()}`, w - 18, 16);
    ctx.restore();
  }

  // Theme scenery painted behind the action. Deterministic — no per-frame randomness.
  private drawBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const accent = this.init.theme.accent;
    const accent2 = this.init.theme.accent2;
    const t = performance.now() / 1000;
    ctx.save();
    switch (this.sprite.backdrop) {
      case "orchard": {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#dbeafe");
        sky.addColorStop(0.8, "#fef9c3");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#86c447";
        ctx.fillRect(0, h - 44, w, 44);
        ctx.font = `26px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🌳", w * 0.08, h - 56);
        ctx.fillText("🌳", w * 0.9, h - 56);
        ctx.font = `30px ${EMOJI_FONT}`;
        ctx.fillText("☀️", w - 48, 52);
        ctx.font = `34px ${EMOJI_FONT}`;
        ctx.fillText("🧺", w / 2, h - 30);
        break;
      }
      case "farm": {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#bfdbfe");
        sky.addColorStop(0.75, "#fef3c7");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#d9b36c";
        ctx.fillRect(0, h - 50, w, 50);
        // fence
        ctx.strokeStyle = "rgba(120, 83, 30, 0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, h - 58);
        ctx.lineTo(w, h - 58);
        ctx.stroke();
        for (let x = 24; x < w; x += 56) {
          ctx.beginPath();
          ctx.moveTo(x, h - 58);
          ctx.lineTo(x, h - 36);
          ctx.stroke();
        }
        // coop on the right: the danger zone chickens run toward
        ctx.fillStyle = "rgba(180, 83, 9, 0.16)";
        ctx.fillRect(w - 64, 60, 64, h - 110);
        ctx.font = `34px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🛖", w - 32, 88);
        ctx.font = "700 10px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#92400e";
        ctx.fillText("COOP", w - 32, 116);
        ctx.font = `22px ${EMOJI_FONT}`;
        ctx.fillText("🌾", w * 0.12, h - 24);
        ctx.fillText("🌾", w * 0.4, h - 20);
        ctx.fillText("🚜", w * 0.72, h - 26);
        break;
      }
      case "sky": {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#bae6fd");
        sky.addColorStop(1, "#f0fdf4");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        ctx.font = `28px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("☁️", w * 0.2 + Math.sin(t * 0.4) * 8, 60);
        ctx.fillText("☁️", w * 0.65 + Math.sin(t * 0.3 + 2) * 10, 90);
        ctx.fillText("🌈", w * 0.88, 58);
        break;
      }
      case "space": {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#0b1026");
        g.addColorStop(1, "#1e1b4b");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        for (let i = 0; i < 26; i += 1) {
          const sx = ((i * 97) % 100) / 100 * w;
          const sy = ((i * 53) % 100) / 100 * h;
          const tw = 0.5 + ((Math.sin(t * 2 + i) + 1) / 2) * 1.2;
          ctx.fillRect(sx, sy, tw, tw);
        }
        ctx.font = `30px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🪐", w * 0.12, 64);
        ctx.fillText("🌍", w * 0.88, h - 70);
        break;
      }
      case "night": {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#111827");
        g.addColorStop(1, "#312e51");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.font = `30px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🌙", w - 52, 54);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 10, w * 0.45, 46, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `22px ${EMOJI_FONT}`;
        ctx.fillText("🪦", w * 0.14, h - 40);
        ctx.fillText("🌲", w * 0.85, h - 44);
        break;
      }
      case "road": {
        ctx.fillStyle = "#e7e5e4";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#57534e";
        ctx.fillRect(0, 70, w, h - 130);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.setLineDash([26, 22]);
        const dashShift = -((t * 60) % 48);
        for (let i = 1; i < 4; i += 1) {
          const y = 70 + ((h - 130) / 4) * i;
          ctx.beginPath();
          ctx.moveTo(dashShift, y);
          ctx.lineTo(w + 48, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.font = `26px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🏁", w - 30, 44);
        break;
      }
      case "kitchen": {
        ctx.fillStyle = "#fff7ed";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#fed7aa";
        ctx.fillRect(0, h - 56, w, 56);
        ctx.font = `24px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🍳", 34, h - 28);
        ctx.fillText("🔪", w - 34, h - 28);
        ctx.fillText("👨‍🍳", w / 2, h - 28);
        break;
      }
      case "panel": {
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        roundRect(ctx, 12, 58, w - 24, h - 100, 12);
        ctx.fill();
        ctx.stroke();
        break;
      }
      case "paper": {
        ctx.fillStyle = "#fefce8";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.14)";
        ctx.lineWidth = 1;
        for (let y = 80; y < h - 36; y += 30) {
          ctx.beginPath();
          ctx.moveTo(40, y);
          ctx.lineTo(w - 40, y);
          ctx.stroke();
        }
        ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
        ctx.beginPath();
        ctx.moveTo(64, 60);
        ctx.lineTo(64, h - 40);
        ctx.stroke();
        break;
      }
      case "arcade": {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#1e1b4b");
        g.addColorStop(1, "#0f172a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(232, 121, 249, 0.35)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 7; i += 1) {
          const y = h * 0.55 + i * i * 4;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        for (let i = 0; i <= 10; i += 1) {
          ctx.beginPath();
          ctx.moveTo(w / 2 + (i - 5) * 24, h * 0.55);
          ctx.lineTo(w / 2 + (i - 5) * 110, h);
          ctx.stroke();
        }
        break;
      }
      case "ocean": {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#cffafe");
        g.addColorStop(1, "#0ea5e9");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i += 1) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 14) {
            const y = h * 0.4 + i * 44 + Math.sin(x / 36 + t * 1.4 + i) * 6;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.font = `24px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🐟", w * 0.18, h * 0.78);
        ctx.fillText("🏊", w * 0.8, h * 0.3);
        break;
      }
      case "stage":
      default: {
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, withAlpha(accent, 0.1));
        gradient.addColorStop(1, withAlpha(accent2, 0.12));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.62, w * 0.34, h * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
    ctx.restore();
  }

  private getStageProgress(): number {
    if (this.rule.targetWords) return Math.min(1, this.wordsCompleted / this.rule.targetWords);
    if (this.init.mode === "classic-words") {
      const target = this.init.config.wordCount ?? 40;
      return Math.min(1, this.wordsCompleted / target);
    }
    const duration = (this.init.config.durationSec ?? 60) * 1000;
    return Math.min(1, Math.max(0, this.elapsedMs / duration));
  }

  private renderClassic(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const word = this.classicWords[this.classicIndex] ?? "";
    const next1 = this.classicWords[this.classicIndex + 1] ?? "";
    const next2 = this.classicWords[this.classicIndex + 2] ?? "";
    this.renderClassicTemplateChrome(ctx, w, h, word, [next1, next2]);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font =
      ["register", "warehouse", "kphmeter"].includes(this.rule.progressKind)
        ? "bold 46px JetBrains Mono, monospace"
        : "bold 56px Inter, system-ui, sans-serif";
    const cx = w / 2;
    const cy =
      ["tickets", "calls", "chart", "transcript", "register", "warehouse", "kphmeter"].includes(this.rule.progressKind)
        ? h / 2 + 28
        : h / 2;
    // Typed prefix in accent
    const typed = this.classicTyped;
    ctx.fillStyle = this.init.theme.accent;
    const typedWidth = ctx.measureText(typed).width;
    const fullWidth = ctx.measureText(word).width;
    ctx.fillText(typed, cx - fullWidth / 2 + typedWidth / 2, cy);
    // Untyped tail
    ctx.fillStyle = "#0b0d10";
    const tail = word.slice(typed.length);
    ctx.fillText(tail, cx + fullWidth / 2 - ctx.measureText(tail).width / 2, cy);

    ctx.font = "20px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#94a3b8";
    if (next1) ctx.fillText(next1, cx, cy + 62);
    if (next2) ctx.fillText(next2, cx, cy + 92);
  }

  private renderClassicTemplateChrome(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    word: string,
    next: string[],
  ) {
    const kind = this.rule.progressKind;
    ctx.save();
    if (["track", "ladder", "accuracy"].includes(kind)) {
      const trackY = h / 2 - 82;
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(60, trackY);
      ctx.lineTo(w - 60, trackY);
      ctx.stroke();
      const carX = 60 + (w - 120) * Math.min(1, (this.wordsCompleted + this.combo / 5) / 40);
      const vehicle = this.sprite.glyphs[0];
      if (vehicle && kind === "track") {
        ctx.font = `38px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(vehicle, carX, trackY - 14);
      } else {
        ctx.fillStyle = this.init.theme.accent;
        roundRect(ctx, carX - 22, trackY - 20, 44, 26, 8);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(kind === "accuracy" ? "OK" : "GO", carX, trackY - 7);
      }
    } else if (kind === "kphmeter") {
      // Professional data-entry test chrome: live KPH meter, no cartoons.
      const elapsedSec = Math.max(1, this.elapsedMs / 1000);
      const kph = Math.round(this.correctChars / (elapsedSec / 3600));
      const accuracy =
        this.totalChars === 0 ? 100 : Math.round((this.correctChars / this.totalChars) * 100);
      ctx.fillStyle = "#0f172a";
      roundRect(ctx, w / 2 - 170, 70, 340, 64, 10);
      ctx.fill();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "800 30px JetBrains Mono, monospace";
      ctx.fillStyle = "#4ade80";
      ctx.fillText(String(kph).padStart(5, "0"), w / 2 - 70, 102);
      ctx.font = "700 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("LIVE KPH", w / 2 - 70, 124);
      ctx.font = "800 30px JetBrains Mono, monospace";
      ctx.fillStyle = accuracy >= 97 ? "#4ade80" : accuracy >= 90 ? "#fbbf24" : "#f87171";
      ctx.fillText(`${accuracy}%`, w / 2 + 80, 102);
      ctx.font = "700 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("ACCURACY", w / 2 + 80, 124);
    } else if (["tickets", "calls", "warehouse", "chart", "transcript", "cargo"].includes(kind)) {
      const cards = [word, ...next.filter(Boolean)];
      ctx.textAlign = "left";
      for (let i = 0; i < cards.length; i += 1) {
        const x = 42 + i * Math.min(170, (w - 100) / 3);
        const y = 86;
        ctx.fillStyle = i === 0 ? "#ffffff" : "rgba(255,255,255,0.65)";
        ctx.strokeStyle = i === 0 ? this.init.theme.accent : "#cbd5e1";
        ctx.lineWidth = i === 0 ? 3 : 1;
        roundRect(ctx, x, y, 150, 72, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#64748b";
        ctx.font = "11px Inter, system-ui, sans-serif";
        ctx.fillText(kind === "calls" ? `CALL ${i + 1}` : kind === "chart" ? `CHART ${i + 1}` : `TICKET ${i + 1}`, x + 12, y + 12);
        ctx.fillStyle = "#0b0d10";
        ctx.font = "bold 15px Inter, system-ui, sans-serif";
        ctx.fillText(cards[i].slice(0, 14), x + 12, y + 38);
      }
    } else if (kind === "certificate") {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = this.init.theme.accent;
      ctx.lineWidth = 2;
      roundRect(ctx, w / 2 - 155, 74, 310, 84, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#0b0d10";
      ctx.font = "bold 18px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Certification Gate", w / 2, 100);
      ctx.font = "13px Inter, system-ui, sans-serif";
      ctx.fillText(`${this.wordsCompleted}/${this.rule.targetWords ?? 30} clean entries`, w / 2, 128);
    } else if (kind === "ribbon") {
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, 56, 82, w - 112, h - 150, 8);
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.stroke();
      ctx.fillStyle = this.init.theme.accent;
      roundRect(ctx, 70, h / 2 - 8, w - 140, 16, 8);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderFalling(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const t = performance.now() / 1000;
    for (const f of this.fallItems) {
      const isLocked = f.id === this.fallLockedId;
      const word = f.word;
      const sway = Math.sin(t * 2 + f.id) * 4;
      // themed sprite above the word
      if (f.glyph) {
        ctx.save();
        ctx.translate(f.x + sway, f.y - 34);
        ctx.rotate(Math.sin(t * 1.6 + f.id) * 0.18);
        ctx.font = `${isLocked ? 42 : 34}px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.glyph, 0, 0);
        ctx.restore();
      }
      ctx.font = "bold 20px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const padX = 11;
      const tw = ctx.measureText(word).width;
      ctx.fillStyle = isLocked ? this.init.theme.accent : "rgba(255,255,255,0.94)";
      ctx.strokeStyle = this.init.theme.accent;
      ctx.lineWidth = 2;
      roundRect(ctx, f.x + sway - tw / 2 - padX, f.y - 16, tw + padX * 2, 32, 13);
      ctx.fill();
      ctx.stroke();
      if (isLocked && this.fallTyped) {
        const typed = this.fallTyped;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(typed, f.x + sway - tw / 2 + ctx.measureText(typed).width / 2, f.y);
        ctx.fillStyle = "#0b0d10";
        const tail = word.slice(typed.length);
        ctx.fillText(tail, f.x + sway + tw / 2 - ctx.measureText(tail).width / 2, f.y);
      } else {
        ctx.fillStyle = isLocked ? "#ffffff" : "#0b0d10";
        ctx.fillText(word, f.x + sway, f.y);
      }
    }
  }

  private renderSpawn(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (["boss", "monster"].includes(this.rule.progressKind)) {
      this.renderBossChrome(ctx, w);
    }
    ctx.font = "bold 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const s of this.spawnItems) {
      // target marker
      if (this.rule.layoutTargeting) {
        this.drawKeyTarget(ctx, s);
      } else if (["boss", "monster"].includes(this.rule.progressKind)) {
        ctx.beginPath();
        ctx.arc(s.x, s.y - 24, s.locked ? 24 : 18, 0, Math.PI * 2);
        ctx.fillStyle = s.locked ? "#ef4444" : this.init.theme.accent2;
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Inter, system-ui, sans-serif";
        ctx.fillText(this.rule.progressKind === "boss" ? "!" : "HP", s.x, s.y - 24);
        ctx.font = "bold 22px Inter, system-ui, sans-serif";
      } else if (s.glyph) {
        const t = performance.now() / 1000;
        const isRunner = this.rule.movingTargets === "run";
        const hop = isRunner ? Math.abs(Math.sin(t * 7 + s.id)) * 5 : Math.sin(t * 2 + s.id) * 3;
        ctx.save();
        ctx.translate(s.x, s.y - 26 - hop);
        if (isRunner) ctx.rotate(Math.sin(t * 7 + s.id) * 0.1);
        ctx.font = `${s.locked ? 42 : 34}px ${EMOJI_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.glyph, 0, 0);
        ctx.restore();
        ctx.font = "bold 22px Inter, system-ui, sans-serif";
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y - 22, 18, 0, Math.PI * 2);
        ctx.fillStyle = s.locked ? this.init.theme.accent : this.init.theme.accent2;
        ctx.fill();
      }
      // word pill
      const tw = ctx.measureText(s.word).width;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = s.locked ? this.init.theme.accent : "#0b0d10";
      ctx.lineWidth = s.locked ? 3 : 1.5;
      roundRect(ctx, s.x - tw / 2 - 10, s.y + 4, tw + 20, 32, 12);
      ctx.fill();
      ctx.stroke();
      if (s.locked && this.spawnTyped) {
        const typed = this.spawnTyped;
        ctx.fillStyle = this.init.theme.accent;
        ctx.fillText(typed, s.x - tw / 2 + ctx.measureText(typed).width / 2, s.y + 20);
        ctx.fillStyle = "#0b0d10";
        const tail = s.word.slice(typed.length);
        ctx.fillText(tail, s.x + tw / 2 - ctx.measureText(tail).width / 2, s.y + 20);
      } else {
        ctx.fillStyle = "#0b0d10";
        ctx.fillText(s.word, s.x, s.y + 20);
      }
    }
  }

  private drawKeyTarget(ctx: CanvasRenderingContext2D, s: SpawnItem) {
    const tw = Math.max(52, ctx.measureText(s.word).width + 22);
    ctx.fillStyle = s.locked ? this.init.theme.accent : "#ffffff";
    ctx.strokeStyle = s.locked ? this.init.theme.accent : "#94a3b8";
    ctx.lineWidth = s.locked ? 3 : 1.5;
    roundRect(ctx, s.x - tw / 2, s.y - 38, tw, 42, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = s.locked ? "#ffffff" : "#475569";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillText(
      this.rule.keyboardZone === "right"
        ? "RIGHT"
        : this.rule.keyboardZone === "home"
          ? "HOME"
          : this.rule.keyboardZone === "dvorak"
            ? "DVORAK"
            : "KEY",
      s.x,
      s.y - 24,
    );
  }

  private renderBossChrome(ctx: CanvasRenderingContext2D, w: number) {
    const target = this.rule.targetWords ?? 24;
    const hp = Math.max(0, target - this.wordsCompleted);
    const pct = hp / target;
    ctx.save();
    ctx.fillStyle = "#111827";
    roundRect(ctx, w / 2 - 160, 72, 320, 38, 12);
    ctx.fill();
    ctx.fillStyle = this.rule.progressKind === "boss" ? "#ef4444" : this.init.theme.accent;
    roundRect(ctx, w / 2 - 152, 82, 304 * pct, 18, 9);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${this.rule.metricLabel}: ${hp}`, w / 2, 84);
    ctx.restore();
  }

  private renderDefuse(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.font = "bold 20px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const b of this.bombs) {
      const isLocked = b.id === this.bombLockedId;
      const sec = (b.timerMs / 1000).toFixed(1);
      if (this.rule.progressKind === "register") {
        ctx.fillStyle = isLocked ? this.init.theme.accent : "#ffffff";
        ctx.strokeStyle = this.init.theme.accent;
        ctx.lineWidth = isLocked ? 3 : 1.5;
        roundRect(ctx, b.x - 56, b.y - 42, 112, 76, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isLocked ? "#ffffff" : "#475569";
        ctx.font = "11px Inter, system-ui, sans-serif";
        ctx.fillText("RECEIPT", b.x, b.y - 22);
        ctx.font = "bold 18px JetBrains Mono, monospace";
        ctx.fillText(sec, b.x, b.y + 2);
      } else if (this.rule.progressKind === "beat" || this.rule.progressKind === "lyrics") {
        const maxTimer = this.rule.ticketTimerMs ?? 2500;
        const pct = Math.max(0, b.timerMs / maxTimer);
        ctx.beginPath();
        ctx.arc(b.x, b.y, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.strokeStyle = b.timerMs < 900 ? "#ef4444" : this.init.theme.accent;
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x, b.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = isLocked ? this.init.theme.accent : "#ffffff";
        ctx.fill();
        ctx.strokeStyle = this.init.theme.accent2;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = isLocked ? "#ffffff" : "#0b0d10";
        ctx.font = "bold 12px Inter, system-ui, sans-serif";
        ctx.fillText(this.rule.progressKind === "lyrics" ? "LINE" : "BEAT", b.x, b.y);
      } else {
        if (b.glyph) {
          const pulse = b.timerMs < 3000 ? 1 + Math.sin(performance.now() / 90) * 0.12 : 1;
          ctx.font = `${Math.round((isLocked ? 44 : 38) * pulse)}px ${EMOJI_FONT}`;
          ctx.fillText(b.glyph, b.x, b.y - 6);
          ctx.font = "bold 14px JetBrains Mono, monospace";
          ctx.fillStyle = b.timerMs < 3000 ? "#ef4444" : "#475569";
          ctx.fillText(sec, b.x, b.y + 22 - 46);
          ctx.font = "bold 20px JetBrains Mono, monospace";
        } else {
          // bomb body
          ctx.beginPath();
          ctx.arc(b.x, b.y, 26, 0, Math.PI * 2);
          ctx.fillStyle = isLocked ? this.init.theme.accent : "#1f2937";
          ctx.fill();
          // timer
          ctx.fillStyle = b.timerMs < 3000 ? "#ef4444" : "#fde047";
          ctx.fillText(sec, b.x, b.y);
        }
      }
      // word below
      const tw = ctx.measureText(b.word).width;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = isLocked ? this.init.theme.accent : "#0b0d10";
      ctx.lineWidth = isLocked ? 3 : 1.5;
      roundRect(ctx, b.x - tw / 2 - 10, b.y + 32, tw + 20, 28, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#0b0d10";
      if (isLocked && this.bombTyped) {
        ctx.fillStyle = this.init.theme.accent;
        ctx.fillText(this.bombTyped, b.x - tw / 2 + ctx.measureText(this.bombTyped).width / 2, b.y + 46);
        ctx.fillStyle = "#0b0d10";
        const tail = b.word.slice(this.bombTyped.length);
        ctx.fillText(tail, b.x + tw / 2 - ctx.measureText(tail).width / 2, b.y + 46);
      } else {
        ctx.fillText(b.word, b.x, b.y + 46);
      }
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function filterWordsForVariant(words: string[], variant: Variant): string[] {
  if (variant === "banana-letters") {
    return words.filter((w) => w.toLowerCase().startsWith("b"));
  }
  if (variant === "mavis-staged" || variant === "dance-staged") {
    // Stage 1: home row a/s/d/f/j/k/l + simple letters
    const homeKeys = new Set("asdfjkl;ghqweruio".split(""));
    return words.filter((w) =>
      w.split("").every((c) => homeKeys.has(c.toLowerCase())),
    );
  }
  return words;
}

function pickWords(pool: string[], n: number, variant: Variant): string[] {
  const out: string[] = [];
  const filtered = pool.length > 0 ? pool : ["typing"];
  for (let i = 0; i < n; i++) {
    out.push(filtered[Math.floor(Math.random() * filtered.length)]);
  }
  return out;
}

function makeReceiptCode(seed: number): string {
  const dollars = 3 + ((seed * 7) % 87);
  const cents = (seed * 13) % 100;
  return `${dollars}.${String(cents).padStart(2, "0")}`;
}

// Pure 10-key style data-entry codes for the KPH test (digits, dash, dot only).
function makeEntryCode(seed: number): string {
  const a = 10000 + ((seed * 7919) % 90000);
  const b = 100 + ((seed * 104729) % 900);
  const c = 1000 + ((seed * 1299709) % 9000);
  switch (seed % 4) {
    case 0:
      return String(a);
    case 1:
      return `${b}-${c}`;
    case 2:
      return `${String(a).slice(0, 2)}.${String(b)}`;
    default:
      return `${c}${String(b).slice(0, 2)}`;
  }
}

function uniqueWords(pool: string[]): string[] {
  return Array.from(new Set(pool.filter(Boolean)));
}

function filterByAllowedKeys(pool: string[], allowed: string[]): string[] {
  const set = new Set(allowed);
  return pool.filter((word) => word.length >= 2 && word.split("").every((c) => set.has(c.toLowerCase())));
}
