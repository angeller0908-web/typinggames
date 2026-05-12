"use client";

import { useSyncExternalStore } from "react";
import type { TypingEngine } from "./TypingEngine";

interface Props {
  engine: TypingEngine;
}

const ROW1 = "qwertyuiop".split("");
const ROW2 = "asdfghjkl".split("");
const ROW3 = "zxcvbnm".split("");

export function KeyboardHint({ engine }: Props) {
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const nextChar = s.currentWord[s.typedSoFar.length]?.toLowerCase() ?? "";
  return (
    <div className="select-none text-center text-xs mt-3 hidden md:block">
      <div className="flex justify-center gap-1 mb-1">
        {ROW1.map((k) => (
          <Key key={k} char={k} active={k === nextChar} />
        ))}
      </div>
      <div className="flex justify-center gap-1 mb-1">
        {ROW2.map((k) => (
          <Key key={k} char={k} active={k === nextChar} />
        ))}
      </div>
      <div className="flex justify-center gap-1">
        {ROW3.map((k) => (
          <Key key={k} char={k} active={k === nextChar} />
        ))}
      </div>
    </div>
  );
}

function Key({ char, active }: { char: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded font-mono text-xs ring-1 ${
        active ? "bg-accent text-white ring-accent" : "bg-white ring-ink/15 text-ink/70"
      }`}
    >
      {char}
    </span>
  );
}
