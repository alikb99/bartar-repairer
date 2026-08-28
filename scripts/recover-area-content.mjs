// Recovers the two hand-written blocks on the neighbourhood hubs (/areas/*):
// the opening card that explains which branch that neighbourhood belongs to,
// and the neighbourhood-specific FAQ. Both were written into the source tree
// that was lost, so the deployed HTML is the only copy.
//
//   node scripts/recover-area-content.mjs [--live <dir>] [--out <file>]
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-area-content.ts");

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

const dir = path.join(LIVE, "areas");
const areas = fs
  .readdirSync(dir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const recovered = [];
for (const slug of areas) {
  const file = path.join(dir, slug, "index.html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");

  // Opening card: <h2>…</h2> then paragraphs; the last one (with the top rule)
  // is the coverage summary and is kept apart so the template can style it.
  const openIdx = html.indexOf(
    '<section class="mt-12 rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8">',
  );
  let intro = null;
  if (openIdx >= 0) {
    const card = html.slice(openIdx, html.indexOf("</section>", openIdx));
    const heading = text((card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ?? [])[1] ?? "");
    const paras = [
      ...card.matchAll(/<p class="mt-3 text-\[15px\] leading-9 text-ink-700">([\s\S]*?)<\/p>/g),
    ].map((m) => text(m[1]));
    const coverage = text(
      (card.match(
        /<p class="text-\[15px\] leading-9 text-ink-700 mt-5 border-t border-line pt-5">([\s\S]*?)<\/p>/,
      ) ?? [])[1] ?? "",
    );
    if (heading) intro = { heading, paras, ...(coverage ? { coverage } : {}) };
  }

  // Neighbourhood FAQ: <details> list under "پرسش های رایج درباره …".
  const faqIdx = html.indexOf("پرسش های رایج درباره");
  const faq = [];
  if (faqIdx >= 0) {
    const block = html.slice(faqIdx, html.indexOf("</section>", faqIdx));
    const re =
      /<span class="text-base font-semibold text-ink-900">([\s\S]*?)<\/span>[\s\S]*?<p class="px-5 pb-5 text-sm leading-8 text-ink-500">([\s\S]*?)<\/p>/g;
    let m;
    while ((m = re.exec(block))) faq.push({ q: text(m[1]), a: text(m[2]) });
  }

  if (intro || faq.length) recovered.push([`/areas/${slug}/`, { intro, faq }]);
}

const j = (v, indent) =>
  JSON.stringify(v, null, 2).split("\n").join("\n" + " ".repeat(indent));

fs.writeFileSync(
  OUT,
  `// Per-neighbourhood copy recovered from the deployed site — see
// scripts/recover-area-content.mjs. app/areas/[area]/page.tsx renders it.
//
// Do not edit by hand — re-run the script.

export type AreaIntro = {
  heading: string;
  paras: string[];
  /** Closing line about how much of the neighbourhood the site covers. */
  coverage?: string;
};

export type AreaContent = {
  intro: AreaIntro | null;
  faq: { q: string; a: string }[];
};

export const AREA_CONTENT: Record<string, AreaContent> = {
${recovered.map(([p, c]) => `  ${JSON.stringify(p)}: ${j(c, 2)},`).join("\n")}
};

/** Recovered copy for a neighbourhood hub, or null when it has none. */
export function areaContentFor(path: string): AreaContent | null {
  return AREA_CONTENT[path] ?? null;
}
`,
  "utf8",
);

console.log(`recovered ${recovered.length} area blocks -> ${OUT}`);
for (const [p, c] of recovered)
  console.log(
    `  ${p}  intro ${c.intro ? `${c.intro.paras.length}p${c.intro.coverage ? "+coverage" : ""}` : "none"} · faq ${c.faq.length}`,
  );
