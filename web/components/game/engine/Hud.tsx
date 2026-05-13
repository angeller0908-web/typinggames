"use client";

import { useSyncExternalStore } from "react";
import type { TypingEngine } from "./TypingEngine";
import type { ScoreUnit } from "@/lib/types";

interface Props {
  engine: TypingEngine;
  scoreUnit: ScoreUnit;
}

export function Hud({ engine, scoreUnit }: Props) {
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);

  const primary = (() => {
    switch (scoreUnit) {
      case "kph":
        return { label: "KPH", value: s.kph };
      case "money":
        return { label: "$ earned", value: `$${(s.score * 0.1).toFixed(2)}` };
      case "score":
        return { label: "Score", value: s.score };
      default:
        return { label: "WPM", value: s.wpm };
    }
  })();

  const sec = Math.ceil(s.remainingMs / 1000);

  return (
    <div className="grid grid-cols-2 gap-2.5 text-sm">
      <Stat label={primary.label} value={String(primary.value)} accent />
      <Stat label="Accuracy" value={`${s.accuracy}%`} />
      <Stat label="Time" value={`${sec}s`} />
      <Stat label="Lives" value={"♥".repeat(Math.max(0, s.livesLeft)) || "—"} />
      <Stat label={s.templateLabel} value={s.templateValue} />
      <Stat label="Combo" value={s.combo > 0 ? `${s.combo}x` : "—"} />
      <Stat label="Words" value={String(s.wordsCompleted)} />
      <Stat label="Status" value={s.status} />
      <div className="col-span-2 rounded-lg bg-white ring-1 ring-ink/10 p-3 shadow-sm">
        <div className="text-[11px] uppercase tracking-wider text-ink/60">Template state</div>
        <div className="mt-1 text-sm font-semibold text-ink leading-snug">{s.templateStatus}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-white ring-1 ring-ink/10 p-3 shadow-sm min-h-[72px]">
      <div className="text-[11px] uppercase tracking-wider text-ink/60">{label}</div>
      <div
        className={`text-xl font-bold tabular-nums ${accent ? "text-accent" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}
