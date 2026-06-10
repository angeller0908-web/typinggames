"use client";

import { useEffect, useRef, useState } from "react";
import { TypingEngine, type EngineInit } from "./engine/TypingEngine";
import { HiddenInput } from "./engine/HiddenInput";
import { Hud } from "./engine/Hud";
import { ResultsCard } from "./engine/ResultsCard";
import { KeyboardHint } from "./engine/KeyboardHint";

interface Props {
  init: EngineInit;
  slug: string;
}

export default function TypingEngineClient({ init, slug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TypingEngine | null>(null);
  const startedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    const engine = new TypingEngine(init);
    engineRef.current = engine;
    startedRef.current = false;
    if (canvasRef.current) engine.mountCanvas(canvasRef.current);
    // Attract mode: the canvas plays itself until the user joins in.
    engine.startDemo();
    force((n) => n + 1);
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __engine?: TypingEngine }).__engine = engine;
    }

    const begin = () => {
      engine.start();
      startedRef.current = true;
      setStarted(true);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA") && !target.classList.contains("sr-only")) {
        return;
      }
      if (!startedRef.current) {
        // First real keystroke starts the game and counts immediately.
        if (e.key.length === 1) {
          e.preventDefault();
          begin();
          engine.feed(e.key);
        }
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        engine.feed("Backspace");
      } else if (e.key.length === 1) {
        engine.feed(e.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      engine.destroy();
      engineRef.current = null;
    };
  }, [init]);

  const handleStart = () => {
    engineRef.current?.start();
    startedRef.current = true;
    setStarted(true);
    force((n) => n + 1);
  };

  const handleRestart = () => {
    engineRef.current?.restart();
    engineRef.current?.start();
    startedRef.current = true;
    setStarted(true);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;
    if (!startedRef.current) {
      handleStart();
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    engineRef.current.clickAt(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_260px] gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full aspect-video rounded-lg ring-1 ring-ink/10 bg-[var(--game-surface)] shadow-sm cursor-pointer"
          aria-label={`${init.mode} typing game canvas`}
        />
        {!started && (
          <button
            onClick={handleStart}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-ink/85 text-white text-sm sm:text-base font-semibold px-5 py-2.5 rounded-full shadow-xl backdrop-blur animate-pulse hover:animate-none hover:bg-ink"
          >
            <span aria-hidden>⌨️</span>
            <span className="hidden sm:inline">Start typing to play</span>
            <span className="sm:hidden">Tap to play</span>
          </button>
        )}
        {engineRef.current && started && (
          <ResultsCard engine={engineRef.current} onRestart={handleRestart} slug={slug} />
        )}
        {engineRef.current && (
          <HiddenInput
            onChar={(ch) => engineRef.current?.feed(ch)}
            onBackspace={() => engineRef.current?.feed("Backspace")}
            disabled={!started}
          />
        )}
        {engineRef.current && started && <KeyboardHint engine={engineRef.current} />}
      </div>
      <aside className="space-y-3">
        {engineRef.current && (
          <Hud engine={engineRef.current} scoreUnit={init.config.scoreUnit ?? "wpm"} />
        )}
        <div className="rounded-lg bg-white ring-1 ring-ink/10 p-3 text-xs text-ink/70 shadow-sm">
          <div className="font-semibold text-ink">{init.template.label}</div>
          <p className="mt-1 leading-snug">{init.template.goal}</p>
          <p className="mt-2 leading-snug text-ink/55">{init.template.failureRule}</p>
        </div>
        <p className="text-[11px] text-ink/50 leading-snug">
          Tip: just start typing — the game begins on your first key. On mobile, tap the
          play area and your keyboard pops up.
        </p>
      </aside>
    </div>
  );
}
