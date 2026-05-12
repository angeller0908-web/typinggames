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
  const [started, setStarted] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    const engine = new TypingEngine(init);
    engineRef.current = engine;
    if (canvasRef.current) engine.mountCanvas(canvasRef.current);

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
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
    setStarted(true);
    force((n) => n + 1);
  };

  const handleRestart = () => {
    engineRef.current?.restart();
    engineRef.current?.start();
    setStarted(true);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    engineRef.current.clickAt(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div className="grid md:grid-cols-[1fr_240px] gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full aspect-video rounded-xl ring-1 ring-ink/10 bg-[var(--game-surface)]"
          aria-label={`${init.mode} typing game canvas`}
        />
        {!started && (
          <button
            onClick={handleStart}
            className="absolute inset-0 m-auto bg-accent text-white text-lg font-semibold px-8 py-3 rounded-xl shadow-xl w-fit h-fit hover:opacity-90"
          >
            ▶ Start
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
        <p className="text-[11px] text-ink/50 leading-snug">
          Tip: tap the canvas to focus, then type. On mobile, your keyboard pops up automatically.
        </p>
      </aside>
    </div>
  );
}
