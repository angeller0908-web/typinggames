import Link from "next/link";
import type { Game, KeywordOpportunity } from "@/lib/types";

function describeIntent(opportunity: KeywordOpportunity) {
  const pageType = opportunity.pageType.toLowerCase();
  const bucket = opportunity.bucket.toLowerCase();

  if (pageType.includes("profession") || bucket.includes("profession")) {
    return {
      heading: "Job-style typing practice",
      body: `${opportunity.keyword} searches usually come from people who need practical speed, accuracy, or keystrokes-per-hour practice. This round keeps the pressure short and repeatable so you can build cleaner entry habits without a formal test screen.`,
      bullets: ["Watch accuracy before chasing speed", "Replay the same word pool to measure progress", "Use the result as practice, not an official certification"],
    };
  }
  if (pageType.includes("language") || bucket.includes("language")) {
    return {
      heading: "Language typing practice",
      body: `${opportunity.keyword} practice works best when the words are focused and the round is short. This page keeps the vocabulary themed so you can repeat the same patterns until spelling and key order feel more natural.`,
      bullets: ["Read the full word before typing", "Slow down on unfamiliar letter patterns", "Replay for accuracy before trying a faster run"],
    };
  }
  if (pageType.includes("cert")) {
    return {
      heading: "Certificate-style speed practice",
      body: `${opportunity.keyword} intent is usually about proving speed or preparing for a timed check. This game is not an official certificate, but it gives you a fast way to rehearse WPM, accuracy, and calm restarts.`,
      bullets: ["Aim for a clean first run", "Repeat until accuracy stays stable", "Use your best score as a local benchmark"],
    };
  }
  if (pageType.includes("affiliate") || opportunity.bucket === "Commercial") {
    return {
      heading: "Practice before choosing tools",
      body: `${opportunity.keyword} can lead to books, keyboards, wrist rests, or practice gear. A playable round helps you notice what actually slows you down before spending money on a fix.`,
      bullets: ["If accuracy drops, practice before buying gear", "If your hands tire, test shorter sessions", "Use related games to compare different typing skills"],
    };
  }
  if (pageType.includes("pillar")) {
    return {
      heading: "Learn by playing",
      body: `${opportunity.keyword} is a broad topic, so this page turns the idea into a short typing round. The game gives the concept a practical anchor: you can read the explanation, play, and immediately feel which habit needs work.`,
      bullets: ["Use the game as a quick diagnostic", "Follow related games for narrower drills", "Come back after a few sessions to compare results"],
    };
  }
  if (pageType.includes("comparison") || bucket.includes("branded")) {
    return {
      heading: "Unofficial typing challenge",
      body: `${opportunity.keyword} often points to a known game, tool, or brand. This page is an original typingrally challenge built for similar practice intent without using official assets or claiming affiliation.`,
      bullets: ["Use it as a free alternative practice round", "Try related games for different pacing", "Avoid automation shortcuts if your goal is real speed"],
    };
  }
  if (pageType.includes("tool") || bucket.includes("tool")) {
    return {
      heading: "Typing tool in game form",
      body: `${opportunity.keyword} does not have to be a plain test page. This round keeps the useful measurement loop but adds a playable goal, so practice feels less repetitive.`,
      bullets: ["Run one accuracy pass", "Run one speed pass", "Compare which mistakes repeat"],
    };
  }
  return {
    heading: "Why this game helps",
    body: `${opportunity.keyword} is matched with a playable typing round so the page gives you something to do, not just something to read. Short sessions make improvement easier to notice.`,
    bullets: ["Start with accuracy", "Replay for speed", "Use related games for variety"],
  };
}

function readableBadges(opportunity: KeywordOpportunity): string[] {
  const badges: string[] = [];
  if (opportunity.priority === "P0" || opportunity.volume >= 1000) {
    badges.push("High-demand practice");
  }
  if (opportunity.kd <= 12) {
    badges.push("Beginner-friendly search");
  }
  if (opportunity.bucket.includes("Profession")) badges.push("Job practice");
  else if (opportunity.bucket.includes("Language")) badges.push("Language practice");
  else if (opportunity.bucket.includes("Cert")) badges.push("Speed benchmark");
  else if (opportunity.bucket === "Commercial") badges.push("Buying research support");
  else badges.push(opportunity.bucket.replace(/-/g, " "));
  return badges;
}

export function GameSeoPanel({
  game,
  opportunity,
}: {
  game: Game;
  opportunity?: KeywordOpportunity;
}) {
  if (!opportunity) return null;
  const copy = describeIntent(opportunity);
  const badges = readableBadges(opportunity);

  return (
    <section className="my-8 max-w-3xl rounded-lg bg-white ring-1 ring-ink/10 p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/60 mb-3">
        {badges.map((badge) => (
          <span key={badge} className="rounded-full bg-[var(--game-surface)] px-2 py-1 text-ink/80">
            {badge}
          </span>
        ))}
      </div>
      <h2 className="text-2xl font-bold mb-3">{copy.heading}</h2>
      <p className="text-ink/80 leading-relaxed">{copy.body}</p>
      <ul className="mt-4 grid gap-2 text-sm text-ink/75 sm:grid-cols-3">
        {copy.bullets.map((item) => (
          <li key={item} className="rounded-md bg-[var(--game-surface)] px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink/70">
        Practice focus: <strong>{opportunity.keyword}</strong>. Current game:{" "}
        <Link href={`/game/${game.slug}/`} className="text-accent hover:underline">
          {game.title}
        </Link>
        .
      </p>
    </section>
  );
}
