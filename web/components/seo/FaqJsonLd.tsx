import { buildFaqJsonLd } from "@/lib/seo";

export function FaqJsonLd({ faqs }: { faqs: { q: string; a: string }[] }) {
  const data = buildFaqJsonLd(faqs);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
