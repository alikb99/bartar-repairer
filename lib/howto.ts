// HowTo structured data extracted from real article markup.
//
// Only articles that genuinely describe a procedure get the schema: the title
// must signal how-to intent AND the body must contain either an ordered list
// with three or more items, or headings explicitly marked as steps
// ("مرحله اول", "گام ۲"). Nothing is invented — every step string comes from
// the database content, so the markup always matches what the reader sees.
import type { Post } from "./content";

const HOWTO_TITLE = /آموزش|چگونه|روش |راهنما|مراحل|گام به گام|نحوه/;
const STEP_HEADING = /^\s*(?:مرحله|گام|قدم)\s*[۰-۹0-9]|^\s*[۰-۹0-9]+\s*[-.)]/;

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export type HowToStep = { name: string; text: string };

function stepsFromOrderedList(html: string): HowToStep[] {
  for (const block of html.match(/<ol[\s\S]*?<\/ol>/gi) ?? []) {
    const items = [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((m) => strip(m[1]))
      .filter((t) => t.length >= 12);
    if (items.length >= 3) {
      return items.slice(0, 12).map((text) => ({
        // Google wants a short name plus the full text. Use the first clause
        // as the name when the step is long.
        name: text.length > 70 ? text.slice(0, 67).trimEnd() + "…" : text,
        text,
      }));
    }
  }
  return [];
}

function stepsFromHeadings(html: string): HowToStep[] {
  const out: HowToStep[] = [];
  const re = /<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>([\s\S]*?)(?=<h[23]\b|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const name = strip(m[1]);
    if (!STEP_HEADING.test(name)) continue;
    const text = strip(m[2]).slice(0, 320);
    if (name && text.length >= 12) out.push({ name, text });
  }
  return out.length >= 3 ? out.slice(0, 12) : [];
}

/** Ordered steps for an article, or [] when it is not a genuine procedure. */
export function howToSteps(post: Post): HowToStep[] {
  if (post.type !== "post") return [];
  if (!HOWTO_TITLE.test(post.title)) return [];
  const fromList = stepsFromOrderedList(post.content);
  if (fromList.length) return fromList;
  return stepsFromHeadings(post.content);
}

/** Complete HowTo JSON-LD node, or null when the article does not qualify. */
export function howToSchema(
  post: Post,
  domain: string,
  authorId: string,
): Record<string, unknown> | null {
  const steps = howToSteps(post);
  if (steps.length < 3) return null;
  const url = `${domain}${encodeURI(post.path)}`;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name: post.title,
    description: post.metaDesc,
    inLanguage: "fa-IR",
    mainEntityOfPage: url,
    author: { "@id": authorId },
    ...(post.image ? { image: `${domain}${post.image}` } : {}),
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${url}#sec-${i + 1}`,
    })),
  };
}
