"use client";

import { useSyncExternalStore } from "react";
import type { TypingEngine } from "./TypingEngine";

interface Props {
  engine: TypingEngine;
  onRestart: () => void;
  slug: string;
}

export function ResultsCard({ engine, onRestart, slug }: Props) {
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  if (s.status !== "ended") return null;

  // Save personal best to localStorage
  if (typeof window !== "undefined") {
    try {
      const key = `tq_best_${slug}`;
      const prev = Number(localStorage.getItem(key) ?? "0");
      if (s.wpm > prev) localStorage.setItem(key, String(s.wpm));
    } catch {}
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink/60 backdrop-blur-sm rounded-xl">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center">
        <h3 className="text-xl font-bold mb-1">Round complete</h3>
        <p className="text-ink/60 text-sm mb-4">Your stats</p>
        <div className="grid grid-cols-2 gap-3 text-left">
          <div>
            <div className="text-xs text-ink/60 uppercase">WPM</div>
            <div className="text-2xl font-bold text-accent">{s.wpm}</div>
          </div>
          <div>
            <div className="text-xs text-ink/60 uppercase">Accuracy</div>
            <div className="text-2xl font-bold">{s.accuracy}%</div>
          </div>
          <div>
            <div className="text-xs text-ink/60 uppercase">Words</div>
            <div className="text-2xl font-bold">{s.wordsCompleted}</div>
          </div>
          <div>
            <div className="text-xs text-ink/60 uppercase">Score</div>
            <div className="text-2xl font-bold">{s.score}</div>
          </div>
        </div>
        <button
          onClick={onRestart}
          className="mt-5 w-full bg-accent text-white py-2.5 rounded-lg font-semibold hover:opacity-90"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
