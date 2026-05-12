import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.join(process.cwd(), "content", "games");

export interface MdxRecord {
  slug: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export function readMdx(slug: string): MdxRecord | null {
  const file = path.join(ROOT, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);
  return { slug, frontmatter: data, body: content };
}
