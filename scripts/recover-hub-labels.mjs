// Recovers what each hub page is CALLED when other pages link up to it.
//
//   node scripts/recover-hub-labels.mjs [--live <dir>] [--out <file>]
//
// The database title of a hub is written for the SERP ("تعمیرات لپ تاپ Acer با
// گارانتی خدمات | عیب یابی رایگان"); inside a related-links heading it has to
// read as a name ("تعمیرات لپ تاپ Acer"). The deployed site had one short name
// per hub, and it is not derivable from the title by rule — some hubs keep a
// parenthesis, others drop everything after it. It is read back from the
// "مشاهده صفحه …: X" up-link, whose href names the hub the label belongs to.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-hub-labels.ts");

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
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs);
    else if (e.name === "index.html") pages.push(abs);
  }
})(LIVE);

// <a class="…" href="/hub/"><span …>مشاهده صفحه نمایندگی: LABEL</span>
// Attribute order follows the JSX, so href is not always first.
const UP = /<a\b([^>]*)>\s*<span[^>]*>([\s\S]*?)<\/span>/g;

const labels = new Map(); // hub path -> label -> count
const cards = new Map(); // child path -> card heading on its brand hub
const headings = new Map(); // hub path -> heading label -> count
for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  UP.lastIndex = 0;
  let m;
  while ((m = UP.exec(html))) {
    const label = text(m[2]);
    // Only the cluster up-link ("… نمایندگی:") names the parent hub. The other
    // variant ("… اصلی:") carries the pillar label, which the source already has.
    const cut = label.match(/^مشاهده صفحه نمایندگی: (.+)$/);
    if (!cut) continue;
    const href = m[1].match(/href="([^"]*)"/);
    if (!href) continue;
    const hub = decode(href[1]);
    if (!labels.has(hub)) labels.set(hub, new Map());
    const byLabel = labels.get(hub);
    byLabel.set(cut[1], (byLabel.get(cut[1]) ?? 0) + 1);
  }

  // The related-links heading names the hub too — and not always with the same
  // label as the up-link right under it ("سایر خدمات تعمیرات لپ تاپ" over
  // "مشاهده صفحه اصلی: تعمیر لپ تاپ"), so it is recorded separately.
  const headingMatch = html.match(
    /<h2[^>]*>\s*سایر خدمات([\s\S]*?)<\/h2>/,
  );
  if (headingMatch) {
    const head = headingMatch.index;
    const block = html.slice(head, html.indexOf("</section>", head));
    const label = text(headingMatch[1]).trim();
    const seen = block.indexOf("مشاهده صفحه");
    const openTag = seen >= 0 ? block.lastIndexOf("<a", seen) : -1;
    const href =
      openTag >= 0 ? block.slice(openTag, seen).match(/href="([^"]*)"/) : null;
    if (label && href) {
      const hub = decode(href[1]);
      if (!headings.has(hub)) headings.set(hub, new Map());
      const inner = headings.get(hub);
      inner.set(label, (inner.get(label) ?? 0) + 1);
    }
  }

  // The services grid on a brand hub names each child page in its own <h3>,
  // and that name does not always match the child's H1 either.
  const grid = html.indexOf('<section id="brand-services"');
  if (grid >= 0) {
    const block = html.slice(grid, html.indexOf("</section>", grid));
    const CARD = /<a\b([^>]*)>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/g;
    let c;
    while ((c = CARD.exec(block))) {
      const href = c[1].match(/href="([^"]*)"/);
      if (href) cards.set(decode(href[1]), text(c[2]));
    }
  }
}

const rows = [...labels.entries()]
  .map(([hub, byLabel]) => {
    const [label, n] = [...byLabel.entries()].sort((a, b) => b[1] - a[1])[0];
    return [hub, label, n, byLabel.size];
  })
  .sort((a, b) => a[0].localeCompare(b[0]));

const NL = String.fromCharCode(10);
fs.writeFileSync(
  OUT,
  `// The short name each hub page is linked by, read back from the deployed site
// (scripts/recover-hub-labels.mjs). lib/content.ts falls back to trimming the
// title when a hub is not listed here.
//
// Do not edit by hand — re-run the script.

export const HUB_LABELS: Record<string, string> = {
${rows.map(([hub, label]) => `  ${JSON.stringify(hub)}: ${JSON.stringify(label)},`).join("\n")}
};

/** How the related-links heading names a hub. */
export const HEADING_LABELS: Record<string, string> = {
${[...headings.entries()]
  // Only hubs the deployed pages name the SAME way everywhere. Where the
  // heading varies from page to page there is nothing to pin down, and the
  // general rule (hubLabel) is left to handle it.
  .filter(([, inner]) => inner.size === 1)
  .map(([hub, inner]) => [hub, [...inner.keys()][0]])
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([hub, label]) => `  ${JSON.stringify(hub)}: ${JSON.stringify(label)},`)
  .join(NL)}
};

/** How the services grid on a brand hub names each child page. */
export const CARD_LABELS: Record<string, string> = {
${[...cards.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([child, label]) => `  ${JSON.stringify(child)}: ${JSON.stringify(label)},`)
  .join("\n")}
};
`,
  "utf8",
);

console.log(`recovered ${rows.length} hub labels and ${cards.size} card labels -> ${OUT}`);
for (const [hub, label, n, variants] of rows)
  console.log(`  ${hub} → ${label}  (${n} link${n === 1 ? "" : "s"}${variants > 1 ? `, ${variants} variants!` : ""})`);
