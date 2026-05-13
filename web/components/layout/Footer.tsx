import Link from "next/link";
import { SITE, FOOTER_LINKS } from "@/lib/site";
import { getAllHubs } from "@/lib/hubs";

export function Footer() {
  const hubs = getAllHubs();
  return (
    <footer className="mt-20 border-t border-ink/10 bg-white">
      <div className="mx-auto max-w-site px-4 sm:px-6 lg:px-8 py-10 text-sm">
        <div className="flex flex-wrap gap-4 mb-4">
          {hubs.map((hub) => (
            <Link key={hub.slug} href={`/games/${hub.slug}/`} className="text-ink/70 hover:text-accent">
              {hub.shortTitle}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink/70 hover:text-accent">
              {l.label}
            </Link>
          ))}
          <Link href="/sitemap.xml" className="text-ink/70 hover:text-accent">
            Sitemap
          </Link>
        </div>
        <div className="text-ink/60">
          © {new Date().getFullYear()} {SITE.name}. Free typing games for everyone.
        </div>
      </div>
    </footer>
  );
}
