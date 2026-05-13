import Link from "next/link";
import { SITE, NAV } from "@/lib/site";

export function Header() {
  return (
    <header className="border-b border-ink/10 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-site px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white text-sm shadow-sm">
            tr
          </span>
          <span className="text-accent">typing</span>
          <span>rally</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-accent transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
