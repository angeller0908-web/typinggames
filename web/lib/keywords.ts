import keywordMapData from "@/data/keyword-map.json";
import type { Game, KeywordOpportunity } from "./types";

type KeywordMapData = {
  generatedFrom: string;
  generatedAt: string;
  totalKeywords: number;
  totalMappedGames: number;
  entries: Record<string, KeywordOpportunity>;
};

const keywordMap = keywordMapData as KeywordMapData;

const priorityWeight: Record<KeywordOpportunity["priority"], number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

export function getKeywordOpportunity(slug: string): KeywordOpportunity | undefined {
  return keywordMap.entries[slug];
}

export function getKeywordMapMeta() {
  return {
    generatedFrom: keywordMap.generatedFrom,
    generatedAt: keywordMap.generatedAt,
    totalKeywords: keywordMap.totalKeywords,
    totalMappedGames: keywordMap.totalMappedGames,
  };
}

export function opportunityScore(opportunity?: KeywordOpportunity): number {
  if (!opportunity) return 0;
  const priority = 4 - priorityWeight[opportunity.priority];
  const volume = Math.log10(Math.max(opportunity.volume, 1) + 1);
  const difficulty = Math.max(0.25, (60 - Math.min(opportunity.kd, 60)) / 60);
  return Number((priority * volume * difficulty).toFixed(4));
}

export function sortGamesByOpportunity(games: Game[]): Game[] {
  return [...games].sort((a, b) => {
    const ao = getKeywordOpportunity(a.slug);
    const bo = getKeywordOpportunity(b.slug);
    const byScore = opportunityScore(bo) - opportunityScore(ao);
    if (byScore !== 0) return byScore;
    const byVolume = (bo?.volume ?? b.searchVolume) - (ao?.volume ?? a.searchVolume);
    if (byVolume !== 0) return byVolume;
    return a.title.localeCompare(b.title);
  });
}

export function isHighValueGame(game: Game): boolean {
  const opportunity = getKeywordOpportunity(game.slug);
  if (!opportunity) return game.searchVolume >= 1000;
  return (
    opportunity.priority === "P0" ||
    opportunity.volume >= 1000 ||
    opportunity.kd <= 12
  );
}

