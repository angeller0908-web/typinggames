export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "typingrally",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://typingrally.com",
  description:
    "Free typing games to boost WPM. A growing catalog of browser games for speed, jobs, languages, space, ghosts, and more. No download, no signup.",
  twitter: "@typingrally",
  locale: "en_US",
  defaultOgImage: "/og/_default.png",
};

export const NAV = [
  { label: "Games", href: "/" },
  { label: "Tests", href: "/tests" },
  { label: "Learn", href: "/learn" },
];

export const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "DMCA", href: "/dmca" },
  { label: "Contact", href: "/contact" },
];
