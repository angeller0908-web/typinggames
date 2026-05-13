import secondaryKeywordsData from "@/data/secondary-keywords.json";

export interface SecondaryKeyword {
  keyword: string;
  volume: number;
  kd: number;
  class: string;
  sources: string;
}

type SecondaryKeywordData = {
  generatedFrom: string;
  entries: Record<string, SecondaryKeyword[]>;
};

const secondaryKeywords = secondaryKeywordsData as SecondaryKeywordData;

export function getSecondaryKeywords(slug: string, limit = 5): SecondaryKeyword[] {
  return (secondaryKeywords.entries[slug] ?? []).slice(0, limit);
}

