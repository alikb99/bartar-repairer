// Recovers the short "notes" panel that sits above the body on a dozen
// neighbourhood laptop pages: the faults that brand actually arrives with, and
// how to get the device to us from that neighbourhood.
//
//   node scripts/recover-page-notes.mjs [--live <dir>] [--out <file>]
//
// It is the plainer cousin of the ClusterContent block — same card, no direct
// answer, no facts, no FAQ — and it only ever survived in the deployed HTML.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-page-notes.ts");

const OPEN =
  '<section class="mb-8 rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8"><div class="">';

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
const text = (html) =>
  decode(html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, ""))
    .replace(/[ \t\r\n]+/g, " ")
    .trim();

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
  const block = html.slice(i, html.indexOf("</section>", i));

  const sections = [];
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>((?:\s*<p[^>]*>[\s\S]*?<\/p>)+)/g;
  let m;
  while ((m = re.exec(block))) {
    sections.push({
      h: text(m[1]),
      p: [...m[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => text(x[1])),
    });
  }
  if (sections.length) recovered.push([urlPath, sections]);
}

const j = (v, indent) =>
  JSON.stringify(v, null, 2).split("\n").join("\n" + " ".repeat(indent));

fs.writeFileSync(
  OUT,
  `// Short notes panels recovered from the deployed site — see
// scripts/recover-page-notes.mjs. components/PageNotes.tsx renders them above
// the article body, in the slot the ClusterContent card uses on other pages.
//
// Do not edit by hand — re-run the script.

export type PageNote = { h: string; p: string[] };

export const PAGE_NOTES: Record<string, PageNote[]> = {
${recovered.map(([p, s]) => `  ${JSON.stringify(p)}: ${j(s, 2)},`).join("\n")}
};

/** The notes panel for a page, or null when it has none. */
export function pageNotesFor(path: string): PageNote[] | null {
  return PAGE_NOTES[path] ?? null;
}
`,
  "utf8",
);

console.log(`recovered notes on ${recovered.length} pages -> ${OUT}`);
for (const [p, s] of recovered)
  console.log(`  ${p}  ${s.length} section(s): ${s.map((x) => x.h).join(" · ")}`);
