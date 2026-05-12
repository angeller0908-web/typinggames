import type { Game } from "@/lib/types";
import { buildVideoGameJsonLd } from "@/lib/seo";

export function VideoGameJsonLd({ game }: { game: Game }) {
  const data = buildVideoGameJsonLd(game);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
