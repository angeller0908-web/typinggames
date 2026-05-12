import type { Game } from "@/lib/types";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export function BreadcrumbJsonLd({ game }: { game: Game }) {
  const data = buildBreadcrumbJsonLd(game);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
