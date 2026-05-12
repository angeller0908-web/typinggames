import type { EngineConfig, EngineMode, EngineSnapshot, Variant } from "@/lib/types";

export interface EngineInit {
  mode: EngineMode;
  variant: Variant;
  config: EngineConfig;
  words: string[];
  theme: { accent: string; accent2: string; surface: string };
}

type Listener = () => void;

const SNAPSHOT_THROTTLE_MS = 100;
const DEFAULT_DURATION = 60_000;

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

  constructor(init: EngineInit) {
    this.init = init;
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
      this.classicWords = pickWords(this.wordPool, target, this.init.variant);
      this.classicIndex = 0;
      this.classicTyped = "";
    }
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
    cancelAnimationFrame(this.rafId);
    this.broadcast(true);
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
        this.wordsCompleted += 1;
        this.score += target.length;
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
      this.classicIndex += 1;
      this.classicTyped = "";
    } else {
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
    const speedMul = this.init.variant === "ghosts" ? 1 + this.score / 200 : 1;
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
    const word = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    const w = this.canvas.clientWidth;
    const dir = this.init.variant === "rocket" ? -1 : 1;
    const padding = 60;
    const x = padding + Math.random() * Math.max(0, w - padding * 2);
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
        this.score += candidate.word.length;
        this.wordsCompleted += 1;
        this.fallTyped = "";
        this.fallLockedId = null;
      }
    } else {
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
        s.x += s.vx * (dt / 1000);
        s.y += s.vy * (dt / 1000);
        if (s.x < 30 || s.x > w - 30) s.vx *= -1;
        if (s.y < 60 || s.y > h - 30) s.vy *= -1;
      }
    }
    // remove very old unhit items
    const maxItems = 6;
    while (this.spawnItems.length > maxItems) {
      this.spawnItems.shift();
    }
  }

  private spawnSpawnItem() {
    if (!this.canvas) return;
    const word = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const padding = 60;
    const x = padding + Math.random() * Math.max(1, w - padding * 2);
    const y = padding + Math.random() * Math.max(1, h - padding * 2);
    const stationary = this.init.variant === "frog";
    const vx = stationary ? 0 : (Math.random() - 0.5) * 60;
    const vy = stationary ? 0 : (Math.random() - 0.5) * 40;
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
        this.score += locked.word.length;
        this.wordsCompleted += 1;
        this.spawnTyped = "";
      }
    } else {
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
      this.bombs = this.bombs.filter((b) => b.timerMs > 0);
      if (this.livesLeft <= 0) this.end("lives");
    }
  }

  private spawnBomb() {
    if (!this.canvas) return;
    const word = this.wordPool[Math.floor(Math.random() * this.wordPool.length)];
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const padding = 60;
    this.bombs.push({
      id: this.bombNextId++,
      word,
      x: padding + Math.random() * Math.max(1, w - padding * 2),
      y: padding + Math.random() * Math.max(1, h - padding * 2),
      timerMs: 8000 + Math.random() * 4000,
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
        this.score += locked.word.length;
        this.wordsCompleted += 1;
        this.bombTyped = "";
        this.bombLockedId = null;
      }
    } else {
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
    };
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

  private renderClassic(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const word = this.classicWords[this.classicIndex] ?? "";
    const next1 = this.classicWords[this.classicIndex + 1] ?? "";
    const next2 = this.classicWords[this.classicIndex + 2] ?? "";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 56px Inter, system-ui, sans-serif";
    const cx = w / 2;
    const cy = h / 2;
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
    if (next1) ctx.fillText(next1, cx, cy + 60);
    if (next2) ctx.fillText(next2, cx, cy + 90);
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
    ctx.font = "bold 22px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const s of this.spawnItems) {
      // target circle
      ctx.beginPath();
      ctx.arc(s.x, s.y - 22, 18, 0, Math.PI * 2);
      ctx.fillStyle = s.locked ? this.init.theme.accent : this.init.theme.accent2;
      ctx.fill();
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

  private renderDefuse(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.font = "bold 20px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const b of this.bombs) {
      const isLocked = b.id === this.bombLockedId;
      const sec = (b.timerMs / 1000).toFixed(1);
      // bomb body
      ctx.beginPath();
      ctx.arc(b.x, b.y, 26, 0, Math.PI * 2);
      ctx.fillStyle = isLocked ? this.init.theme.accent : "#1f2937";
      ctx.fill();
      // timer
      ctx.fillStyle = b.timerMs < 3000 ? "#ef4444" : "#fde047";
      ctx.fillText(sec, b.x, b.y);
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
