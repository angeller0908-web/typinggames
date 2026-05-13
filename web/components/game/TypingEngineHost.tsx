"use client";

import dynamic from "next/dynamic";
import type { Game } from "@/lib/types";
import { getGameplayTemplate } from "@/lib/gameplayTemplates";
import { mergeWordlists } from "@/lib/wordlists";
import type { EngineInit } from "./engine/TypingEngine";

const TypingEngineClient = dynamic(() => import("./TypingEngineClient"), {
  ssr: false,
  loading: () => (
    <div className="aspect-video rounded-xl ring-1 ring-ink/10 bg-[var(--game-surface)] flex items-center justify-center text-ink/60 text-sm">
      Loading game…
    </div>
  ),
});

export function TypingEngineHost({ game }: { game: Game }) {
  if (game.embed.kind !== "engine") return null;
  const template = getGameplayTemplate(game.embed.templateId);
  const wordlistIds = game.embed.wordlistIds.length > 0 ? game.embed.wordlistIds : template.defaultWordlistIds;
  const config = {
    ...template.defaultConfig,
    ...game.embed.config,
    variant: game.embed.config.variant ?? template.variant,
  };
  const words = mergeWordlists(wordlistIds);
  const init: EngineInit = {
    mode: game.embed.mode ?? template.mode,
    variant: config.variant,
    template,
    config,
    words,
    theme: {
      accent: game.theme.accent,
      accent2: game.theme.accent2,
      surface: game.theme.surface,
    },
  };
  return <TypingEngineClient init={init} slug={game.slug} />;
}
