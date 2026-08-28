// Recovers the in-body internal links the deployed site injected into the
// WordPress copy — the phrase → page map behind linkifyInternal().
//
//   node scripts/recover-internal-links.mjs [--live <dir>] [--out <file>]
//
// A link counts as injected when the rendered page has it inside a body
// paragraph but the database copy of that page does not. The pairs that survive
// on several pages are the ones that were in the map; a pair seen once is kept
// too, because a single page is where most of these were aimed.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-internal-links.ts");

const posts = JSON.parse(fs.readFileSync("content/posts.json", "utf8"));
const byId = new Map(posts.map((p) => [p.id, p]));
const pathOf = (p) => {
  const seg = [];
  let cur = p;
  while (cur) {
    seg.unshift(cur.slug);
    cur = cur.parent ? byId.get(cur.parent) : null;
  }
  return `/${seg.join("/")}/`;
};
// The rendered page has ZWNJ replaced by a space (site convention), so the
// database copy is normalised the same way before phrases are looked up in it.
const flat = (s) =>
  (s ?? "").replace(/‌/g, " ").replace(/\s+/g, " ");
// The export writes some in-body links as absolute URLs; the site strips the
// origin at build time. Strip it here too, or every one of them looks injected.
const ORIGIN = /https?:\/\/(?:www\.)?bartar-repairer\.com/g;
const bodyByPath = new Map(
  posts.map((p) => [pathOf(p), flat((p.content ?? "").replace(ORIGIN, ""))]),
);

const ENT = { amp: "&", nbsp: "\u00a0", zwnj: "\u200c", quot: '"', lt: "<", gt: ">" };
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
    else if (e.name === "index.html") pages.push([`/${rel}`, abs]);
  }
})(LIVE, "");

const byPage = new Map(); // page path -> [phrase, href][]
for (const [urlPath, file] of pages) {
  const body = bodyByPath.get(urlPath);
  if (body === undefined) continue;
  const whole = fs.readFileSync(file, "utf8");
  // Only the body: the header has an unbalanced <p>, and a paragraph regex run
  // over the whole document would swallow it and mis-record which paragraph a
  // link sat in.
  const bodyStart = whole.indexOf('id="post-content"');
  const html = bodyStart < 0 ? whole : whole.slice(bodyStart);
  const isComponent = (attrs) =>
    /class="[^"]*(?:mt-|px-|text-\[|leading-|line-clamp|flex|grid)/.test(attrs);
  for (const m of html.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/g)) {
    if (isComponent(m[1])) continue;
    for (const a of m[2].matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const href = decode(a[1]);
      const phrase = text(a[2]);
      if (!href.startsWith("/") || !phrase) continue;
      if (!body.includes(flat(phrase))) continue; // the phrase has to be in the copy
      // Which paragraph the link sat in matters: the same phrase often appears
      // in several paragraphs and the deployed page linked exactly one of them.
      const para = flat(text(m[2])).slice(0, 60);
      if (!byPage.has(urlPath)) byPage.set(urlPath, []);
      const list = byPage.get(urlPath);
      if (!list.some(([f, h, w]) => f === phrase && h === href && w === para))
        list.push([phrase, href, para]);
    }
  }
}

const pagesOut = [...byPage.entries()]
  .map(([page, list]) => [
    page,
    // Longest phrase first: the first phrase that matches a paragraph wins.
    list.slice().sort((a, b) => b[0].length - a[0].length),
  ])
  .sort((a, b) => a[0].localeCompare(b[0]));
const total = pagesOut.reduce((n, [, l]) => n + l.length, 0);

const NL = String.fromCharCode(10);
const header = [
  "// In-body links the deployed site injected into the WordPress copy, read back",
  "// per page (scripts/recover-internal-links.mjs).",
  "//",
  "// Recorded page by page rather than as one phrase map because that is what the",
  "// deployed pages actually carry: the same phrase is linked on one page and left",
  "// as plain text on another. lib/content.ts uses a page's list when it has one",
  "// and falls back to the hand-written map otherwise.",
  "//",
  "// Within a page the longest phrase comes first, because the first phrase that",
  "// matches a paragraph wins.",
  "//",
  "// Do not edit by hand - re-run the script.",
  "",
  "export const INJECTED_LINKS: Record<string, [string, string, string][]> = {",
];
const body = [];
for (const [page, list] of pagesOut) {
  body.push("  " + JSON.stringify(page) + ": [");
  for (const [phrase, href, para] of list)
    body.push(
      "    [" +
        JSON.stringify(phrase) +
        ", " +
        JSON.stringify(href) +
        ", " +
        JSON.stringify(para) +
        "],",
    );
  body.push("  ],");
}
fs.writeFileSync(OUT, header.concat(body, ["};", ""]).join(NL), "utf8");

console.log(`recovered ${total} injected links on ${pagesOut.length} pages -> ${OUT}`);
for (const [page, list] of pagesOut.slice(0, 10))
  console.log(`  ${page}  ${list.length}`);
