import { SITE } from "@/lib/site";

export const metadata = {
  title: "About",
  description: `About ${SITE.name} — who we are and how we built our typing games.`,
};

export default function AboutPage() {
  return (
    <article className="py-10 max-w-3xl">
      <h1 className="text-3xl font-extrabold mb-4">About {SITE.name}</h1>
      <p className="text-ink/80 leading-relaxed mb-4">
        {SITE.name} is a growing catalog of browser-based typing games. We built it
        because the existing free typing-game space is a mix of two decades of legacy Flash
        ports, paid subscription products, and ad-heavy aggregator sites embedding the same
        handful of games. We wanted something different — a large set of themed games,
        each with its own personality, built around fast playable rounds.
      </p>
      <h2 className="text-xl font-bold mt-8 mb-3">Who we are</h2>
      <p className="text-ink/80 leading-relaxed mb-4">
        A two-person team that has been building web tools since 2019. We type a lot. We test
        every game ourselves before publishing it. We do not embed third-party tracking beyond
        a single privacy-friendly analytics provider, and we tell you exactly when ads load via
        the cookie banner.
      </p>
      <h2 className="text-xl font-bold mt-8 mb-3">How the games are built</h2>
      <p className="text-ink/80 leading-relaxed mb-4">
        Most games use our own TypeScript typing engine. When a publisher feed provides a
        legal iframe, the same game page shell can host it; otherwise we build an original
        round ourselves. The engine runs in the browser's Canvas API, decoupled from React,
        so frame rates stay smooth even on a Chromebook or older Android tablet.
      </p>
      <h2 className="text-xl font-bold mt-8 mb-3">How we make money</h2>
      <p className="text-ink/80 leading-relaxed mb-4">
        Display ads, eventually. The games are 100% free to play and always will be. We are not
        affiliated with Typing.com, Nitro Type, Monkeytype, BBC Dance Mat Typing, or Mavis
        Beacon Teaches Typing. Where we reference those products by name, it is for context
        only — no endorsement implied or claimed.
      </p>
      <h2 className="text-xl font-bold mt-8 mb-3">Contact</h2>
      <p className="text-ink/80 leading-relaxed">
        See our <a href="/contact" className="text-accent underline">contact page</a> for
        feedback, bug reports, or business enquiries.
      </p>
    </article>
  );
}
