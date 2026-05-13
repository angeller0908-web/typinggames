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
  movingTargets?: "bounce" | "lane" | "grid" | "chase" | "orbit";
  textTransform?: "numbers" | "upper" | "short" | "home" | "right";
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
    | "boss";
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
};

interface FallingItem {
  id: number;
  word: string;
  x: number;
  y: number;
  vy: number;
  hp: number;
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
}

interface BombItem {
  id: number;
  word: string;
  x: number;
  y: number;
  timerMs: number;
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

  constructor(init: EngineInit) {
    this.init = init;
    this.rule = TEMPLATE_RULES[init.template.id] ?? TEMPLATE_RULES["word-search-scanner"];
    this.wordPool = filterWordsForVariant(init.words, init.variant);
    this.remainingMs = (init.config.durationSec ?? 60) * 1000;
    this.livesLeft = init.config.livesAllowed ?? 3;
    this.snapshot = this.buildSnapshot();
  }

  // ---------------- Public API ----------------

  start() {
    if (this.status === "running") return;
    this.resetIfEnded();
    this.status = "running";
    this.startMs = performance.now();
    this.lastTickMs = this.startMs;
    this.spawnInitial();
    this.loop();
    this.broadcast(true);
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
    if (this.status !== "running") return;
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
    switch (this.rule.textTransform) {
      case "numbers":
        return this.rememberWord(
          makeReceiptCode(this.wordsCompleted + this.score + this.misses + this.wordSequence++ + 1),
        );
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
    if (this.status === "running") {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private tick(dt: number) {
    this.elapsedMs += dt;
    if (this.init.mode !== "classic-words") {
      this.remainingMs = Math.max(0, this.remainingMs - dt);
      if (this.remainingMs <= 0) {
        this.end("timeup");
        return;
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
    this.render();
    this.broadcast();
  }

  private end(_reason: "timeup" | "lives" | "win") {
    this.status = "ended";
    this.lastAction =
      _reason === "win" ? "Goal complete" : _reason === "lives" ? "Lives depleted" : "Time up";
    cancelAnimationFrame(this.rafId);
    this.broadcast(true);
  }

  private registerSuccess(word: string, baseScore = word.length) {
    this.combo += 1;
    this.wordsCompleted += 1;
    const streakBonus =
      this.rule.streakBonusEvery && this.combo % this.rule.streakBonusEvery === 0
        ? this.rule.scoreBonus
        : 0;
    this.score += baseScore + this.rule.scoreBonus + streakBonus;
    if (this.rule.timeBonusMs) {
      this.remainingMs += this.rule.timeBonusMs;
    }
    this.lastAction = `${this.rule.successVerb}: ${word}`;
    if (this.rule.targetWords && this.wordsCompleted >= this.rule.targetWords) {
      this.end("win");
    }
  }

  private registerMiss(reason: string) {
    this.combo = 0;
    this.misses += 1;
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
    // Remove off-screen / cost a life
    const remaining: FallingItem[] = [];
    for (const item of this.fallItems) {
      const offBottom = dir > 0 && item.y > h;
      const offTop = dir < 0 && item.y < 0;
      if (offBottom || offTop) {
        this.livesLeft -= 1;
        this.registerMiss(item.word);
      } else {
        remaining.push(item);
      }
    }
    this.fallItems = remaining;
    if (this.livesLeft <= 0) {
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
    this.fallItems.push({
      id: this.fallNextId++,
      word,
      x,
      y,
      vy: 0,
      hp: word.length,
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
        this.registerSuccess(candidate.word);
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
      for (const s of this.spawnItems) {
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
    const stationary = this.init.variant === "frog" || this.rule.movingTargets === "grid";
    const speed =
      this.rule.movingTargets === "chase" ? 110 : this.rule.movingTargets === "orbit" ? 80 : 60;
    const vx = stationary ? 0 : (Math.random() - 0.5) * speed;
    const vy = stationary ? 0 : (Math.random() - 0.5) * speed * 0.7;
    this.spawnItems.push({
      id: this.spawnNextId++,
      word,
      x,
      y,
      vx,
      vy,
      stationary,
      locked: false,
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
        this.registerSuccess(locked.word);
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
    this.bombs.push({
      id: this.bombNextId++,
      word,
      x: padding + Math.random() * Math.max(1, w - padding * 2),
      y: padding + Math.random() * Math.max(1, h - padding * 2),
      timerMs: this.rule.ticketTimerMs ?? 8000 + Math.random() * 4000,
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
        this.registerSuccess(locked.word);
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
    ctx.fillStyle = this.init.theme.surface;
    ctx.fillRect(0, 0, w, h);
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
  }

  private renderTemplateStage(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    const accent = this.init.theme.accent;
    const accent2 = this.init.theme.accent2;
    const kind = this.rule.progressKind;
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, withAlpha(accent, 0.12));
    gradient.addColorStop(1, withAlpha(accent2, 0.14));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    if (["track", "cargo", "calls", "language", "ribbon"].includes(kind)) {
      for (let y = 80; y < h; y += 54) {
        ctx.beginPath();
        ctx.moveTo(28, y);
        ctx.lineTo(w - 28, y);
        ctx.stroke();
      }
    } else if (["keyboard", "dvorak", "right-hand", "memory"].includes(kind)) {
      const keyW = Math.max(26, (w - 120) / 12);
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 12; col += 1) {
          const x = 36 + col * keyW + row * 10;
          const y = h - 138 + row * 38;
          roundRect(ctx, x, y, keyW - 6, 28, 6);
          ctx.stroke();
        }
      }
    } else {
      for (let i = 0; i < 9; i += 1) {
        ctx.beginPath();
        ctx.arc((w / 8) * i, h * 0.2 + ((i % 3) * h) / 5, 28 + i * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    ctx.font = "700 14px Inter, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#0b0d10";
    ctx.fillText(this.init.template.label, 18, 16);
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText(this.rule.statusLabel, 18, 38);

    const progress = this.getStageProgress();
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 18, h - 28, w - 36, 10, 5);
    ctx.fill();
    ctx.fillStyle = accent;
    roundRect(ctx, 18, h - 28, Math.max(8, (w - 36) * progress), 10, 5);
    ctx.fill();

    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.font = "700 13px Inter, system-ui, sans-serif";
    ctx.fillStyle = accent;
    ctx.fillText(`${this.rule.metricLabel}: ${this.getTemplateValue()}`, w - 18, 16);
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
      this.rule.progressKind === "register" || this.rule.progressKind === "warehouse"
        ? "bold 46px JetBrains Mono, monospace"
        : "bold 56px Inter, system-ui, sans-serif";
    const cx = w / 2;
    const cy =
      ["tickets", "calls", "chart", "transcript", "register", "warehouse"].includes(this.rule.progressKind)
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
      ctx.fillStyle = this.init.theme.accent;
      roundRect(ctx, carX - 22, trackY - 20, 44, 26, 8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(kind === "accuracy" ? "OK" : "GO", carX, trackY - 7);
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
    ctx.font = "bold 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of this.fallItems) {
      const isLocked = f.id === this.fallLockedId;
      const word = f.word;
      // background pill
      const padX = 12;
      const padY = 6;
      const tw = ctx.measureText(word).width;
      ctx.fillStyle = isLocked ? this.init.theme.accent : "#ffffff";
      ctx.strokeStyle = this.init.theme.accent;
      ctx.lineWidth = 2;
      roundRect(ctx, f.x - tw / 2 - padX, f.y - 18, tw + padX * 2, 36, 14);
      ctx.fill();
      ctx.stroke();
      // typed prefix
      if (isLocked && this.fallTyped) {
        const typed = this.fallTyped;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(typed, f.x - tw / 2 + ctx.measureText(typed).width / 2, f.y);
        ctx.fillStyle = "#0b0d10";
        const tail = word.slice(typed.length);
        ctx.fillText(tail, f.x + tw / 2 - ctx.measureText(tail).width / 2, f.y);
      } else {
        ctx.fillStyle = isLocked ? "#ffffff" : "#0b0d10";
        ctx.fillText(word, f.x, f.y);
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
        // bomb body
        ctx.beginPath();
        ctx.arc(b.x, b.y, 26, 0, Math.PI * 2);
        ctx.fillStyle = isLocked ? this.init.theme.accent : "#1f2937";
        ctx.fill();
        // timer
        ctx.fillStyle = b.timerMs < 3000 ? "#ef4444" : "#fde047";
        ctx.fillText(sec, b.x, b.y);
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

function uniqueWords(pool: string[]): string[] {
  return Array.from(new Set(pool.filter(Boolean)));
}

function filterByAllowedKeys(pool: string[], allowed: string[]): string[] {
  const set = new Set(allowed);
  return pool.filter((word) => word.length >= 2 && word.split("").every((c) => set.has(c.toLowerCase())));
}
