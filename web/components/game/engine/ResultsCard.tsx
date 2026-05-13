"use client";

import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import type { TypingEngine } from "./TypingEngine";

interface Props {
  engine: TypingEngine;
  onRestart: () => void;
  slug: string;
}

export function ResultsCard({ engine, onRestart, slug }: Props) {
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [isBest, setIsBest] = useState(false);
  const bestValue = Math.max(s.score, s.wpm);

  useEffect(() => {
    if (s.status !== "ended") return;
    try {
      const key = `typingrally_best_${slug}`;
      const prev = Number(localStorage.getItem(key) ?? "0");
      if (bestValue > prev) {
        localStorage.setItem(key, String(bestValue));
        setIsBest(true);
      } else {
        setIsBest(false);
      }
    } catch {
      setIsBest(false);
    }
  }, [bestValue, s.status, slug]);

  if (s.status !== "ended") return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-ink/60 backdrop-blur-sm rounded-lg">
      <div className="bg-white rounded-lg shadow-2xl p-5 w-full max-w-md mx-4 text-center">
        <h3 className="text-xl font-bold mb-1">Round complete</h3>
        <p className="text-ink/60 text-sm mb-4">
          {isBest ? "New personal best" : s.templateStatus}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
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
          <div>
            <div className="text-xs text-ink/60 uppercase">{s.templateLabel}</div>
            <div className="text-2xl font-bold">{s.templateValue}</div>
          </div>
          <div>
            <div className="text-xs text-ink/60 uppercase">Best metric</div>
            <div className="text-2xl font-bold">{bestValue}</div>
          </div>
        </div>
        <button
          onClick={onRestart}
          className="mt-5 w-full bg-accent text-white py-2.5 rounded-md font-semibold hover:opacity-90"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
