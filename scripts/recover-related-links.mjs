// Recovers the related-links list of the pages where the deployed site does not
// agree with what lib/content.ts computes.
//
//   node scripts/recover-related-links.mjs [--live <dir>] [--out <file>]
//
// The cluster lists are computed, not stored: siblings in database order, cut
// to eight. On most pages that reproduces the deployed list exactly. On a few
// dozen it does not — the deployed site was rebuilt several times while pages
// were added, and those lists froze in an order no rule reproduces (rotating
// the cluster fits some pages and breaks a hundred others; both were measured).
//
// Rather than invent a ranking, the pages that disagree keep their deployed
// list as data. Run this after a build: it compares out/ against the live
// snapshot and records only the differences.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-related.ts");
const BUILD = argOf("--out-dir", "out");

/** The hrefs of the related-links card grid, in order, or null when absent. */
function relatedList(html) {
  const heading = html.indexOf("سایر خدمات");
  const alt = html.indexOf("مقالات مرتبط");
  const more = html.indexOf("مطالب بیشتر");
  const at = [heading, alt, more].filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (at === undefined) return null;
  const end = html.indexOf("</section>", at);
  if (end < 0) return null;
  const block = html.slice(at, end);
  const grid = block.indexOf('class="mt-7 grid');
  if (grid < 0) return null;
  return [...block.slice(grid).matchAll(/href="([^"]+)"/g)].map((m) =>
    decodeURIComponent(m[1]),
  );
}

const pages = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, `${rel}${e.name}/`);
    else if (e.name === "index.html") pages.push([`/${rel}`, abs]);
  }
})(LIVE, "");

// The table only ever grows: a path already in it keeps its recorded list even
// when the current build happens to agree, because the agreement is BECAUSE of
// the override. Dropping it would put the page back where it started.
const existing = new Map();
if (fs.existsSync(OUT)) {
  const prev = fs.readFileSync(OUT, "utf8");
  let key = null;
  for (const line of prev.split(String.fromCharCode(10))) {
    const k = line.match(/^ {2}"([^"]+)": \[$/);
    if (k) {
      key = k[1];
      existing.set(key, []);
      continue;
    }
    const href = line.match(/^ {4}"([^"]+)",$/);
    if (href && key) existing.get(key).push(href[1]);
    if (line === "  ],") key = null;
  }
}

const rows = [];
let compared = 0;
for (const [urlPath, file] of pages.sort()) {
  const built = path.join(BUILD, urlPath, "index.html");
  if (!fs.existsSync(built)) continue;
  compared++;
  const live = relatedList(fs.readFileSync(file, "utf8"));
  const ours = relatedList(fs.readFileSync(built, "utf8"));
  if (!live || !ours) continue;
  if (!existing.has(urlPath) && live.join("|") === ours.join("|")) continue;
  rows.push([urlPath, live]);
}

// prebuild deletes out/, so running this against a half-finished build would
// compare nothing and write an empty table over the recovered one.
if (compared < pages.length / 2) {
  console.error(
    `only ${compared} of ${pages.length} pages are in ${BUILD} — build first; nothing written`,
  );
  process.exit(1);
}

const NL = String.fromCharCode(10);
const out = [
  "// Related-links lists that the deployed site froze in an order the sibling",
  "// rule does not reproduce (scripts/recover-related-links.mjs).",
  "//",
  "// components/RelatedLinks.tsx uses a page's list when it has one, and",
  "// computes the list as usual for every other page. Each entry is the list of",
  "// linked pages, in the order they appear on the deployed page.",
  "//",
  "// Do not edit by hand - re-run the script after a build.",
  "",
  "export const RELATED_OVERRIDES: Record<string, string[]> = {",
];
for (const [page, list] of rows) {
  out.push(`  ${JSON.stringify(page)}: [`);
  for (const href of list) out.push(`    ${JSON.stringify(href)},`);
  out.push("  ],");
}
out.push("};", "");
fs.writeFileSync(OUT, out.join(NL), "utf8");

console.log(`recovered ${rows.length} related-links lists -> ${OUT}`);
for (const [page, list] of rows.slice(0, 12)) console.log(`  ${page}  ${list.length}`);
