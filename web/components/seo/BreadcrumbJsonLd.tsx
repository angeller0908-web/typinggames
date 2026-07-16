import type { Game } from "@/lib/types";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export function BreadcrumbJsonLd({
  game,
  hub,
}: {
  game: Game;
  hub?: { title: string; slug: string };
}) {
  const data = buildBreadcrumbJsonLd(game, hub);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
