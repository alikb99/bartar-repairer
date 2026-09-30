// Recovers the per-page callout box — the bordered "اگر خارج از … هستید" /
// "کدام دستگاه … را می خواهید تعمیر کنید" panel — from the deployed site.
//
//   node scripts/recover-callouts.mjs [--live <dir>] [--out <file>]
//
// The panel was written into the lost source tree; the deployed HTML is the
// only copy. Its markup is fixed (section > h2 > p, links inline), so parsing
// it back is a reversal, not a guess. What varies per page is the wording, the
// links and where the panel sits:
//
//   top   above the article body (brand hubs)
//   body  between the intro and the first <h2> of the body
//   end   after the body, before the related-articles block
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-callouts.ts");

const OPEN =
  '<section class="my-8 rounded-[22px] border-r-[3px] border-accent bg-paper p-5 sm:p-6">';

const ENT = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  zwnj: "\u200c",
  laquo: "«",
  raquo: "»",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};
const decode = (s) =>
  s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, b) => {
    if (b[0] === "#") {
      const c =
        b[1] === "x" || b[1] === "X"
          ? parseInt(b.slice(2), 16)
          : parseInt(b.slice(1), 10);
      return Number.isFinite(c) ? String.fromCodePoint(c) : m;
    }
    return b in ENT ? ENT[b] : m;
  });

// A paragraph is a run of text with inline links. React's <!-- --> text-node
// separators are dropped: they are an artifact of how JSX split the sentence
// and reappear on their own when the same sentence is rendered again.
function parseParagraph(inner) {
  const parts = [];
  const re = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  let last = 0;
  let m;
  const push = (raw) => {
    const t = decode(raw.replace(/<!--[\s\S]*?-->/g, ""));
    if (t) parts.push(t);
  };
  while ((m = re.exec(inner))) {
    push(inner.slice(last, m.index));
    parts.push({ href: decode(m[1]), text: decode(m[2].replace(/<!--[\s\S]*?-->/g, "")) });
    last = m.index + m[0].length;
  }
  push(inner.slice(last));
  return parts;
}

/** Index just past the close of the element that starts at `i`. */
function elementAt(html, i, tag) {
  const open = new RegExp(`<${tag}\\b`, "gi");
  const close = new RegExp(`</${tag}>`, "gi");
  let depth = 0;
  let cursor = i;
  for (;;) {
    open.lastIndex = cursor;
    close.lastIndex = cursor;
    const o = open.exec(html);
    const c = close.exec(html);
    if (!c) return html.length;
    if (o && o.index < c.index) {
      depth++;
      cursor = o.index + 1;
    } else {
      depth--;
      cursor = c.index + 1;
      if (depth === 0) return c.index + c[0].length;
    }
  }
}

const pages = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, `${rel}${e.name}/`);
    else if (e.name === "index.html") pages.push([rel === "" ? "/" : `/${rel}`, abs]);
  }
})(LIVE, "");

const recovered = [];
for (const [urlPath, file] of pages.sort()) {
  const html = fs.readFileSync(file, "utf8");
  const i = html.indexOf(OPEN);
  if (i < 0) continue;
  const block = html.slice(i, elementAt(html, i, "section"));

  const title = decode(
    ((block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ?? [])[1] ?? "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, ""),
  ).trim();
  const paras = [...block.matchAll(/<p class="mt-3 text-\[15px\][^"]*">([\s\S]*?)<\/p>/g)].map(
    (m) => parseParagraph(m[1]),
  );

  const body = html.indexOf('id="post-content"');
  const slot =
    body < 0 || i < body ? "top" : /<h2 id="sec-/.test(html.slice(i)) ? "body" : "end";

  recovered.push([urlPath, { slot, title, paras }]);
}

const j = (v, indent) =>
  JSON.stringify(v, null, 2).split("\n").join("\n" + " ".repeat(indent));

const body = recovered
  .map(
    ([p, b]) =>
      `  ${JSON.stringify(p)}: {\n` +
      `    slot: ${JSON.stringify(b.slot)},\n` +
      `    title: ${JSON.stringify(b.title)},\n` +
      `    paras: ${j(b.paras, 4)},\n  },`,
  )
  .join("\n");

fs.writeFileSync(
  OUT,
  `// Per-page callout boxes recovered from the deployed site.
//
// Written between 2026-07-25 and 2026-08-16 into a source tree that was lost;
// read back by scripts/recover-callouts.mjs from the rendered HTML, which is
// the only surviving copy. components/PageCallout.tsx renders them.
//
// Do not edit by hand — re-run the script.

/** A run of plain text, or an inline link inside a callout paragraph. */
export type CalloutPart = string | { href: string; text: string };

export type Callout = {
  /**
   * top  — above the body, on the brand hubs
   * body — between the intro and the first <h2> of the body
   * end  — after the body, before the related-articles block
   */
  slot: "top" | "body" | "end";
  title: string;
  paras: CalloutPart[][];
};

export const CALLOUTS: Record<string, Callout> = {
${body}
};

/** Callout for a page, or null when the page has none. */
export function calloutFor(path: string): Callout | null {
  return CALLOUTS[path] ?? null;
}
`,
  "utf8",
);

const bySlot = {};
for (const [, b] of recovered) bySlot[b.slot] = (bySlot[b.slot] ?? 0) + 1;
console.log(`recovered ${recovered.length} callouts -> ${OUT}`);
console.log(bySlot);
