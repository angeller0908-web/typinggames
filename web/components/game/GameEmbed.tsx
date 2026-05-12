import type { Game } from "@/lib/types";
import { TypingEngineHost } from "./TypingEngineHost";

export function GameEmbed({ game }: { game: Game }) {
  if (game.embed.kind === "iframe") {
    // Reserved for future: real publisher iframes
    return (
      <iframe
        src={game.embed.url ?? ""}
        title={game.title}
        className="w-full aspect-video rounded-xl ring-1 ring-ink/10"
        loading="lazy"
        allowFullScreen
      />
    );
  }
  return <TypingEngineHost game={game} />;
}
