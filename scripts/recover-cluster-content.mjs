// Recovers the enrichment blocks (ClusterContent) that exist on the deployed
// site but never made it back into lib/cluster-content.ts — part of the three
// weeks of work that was written into a source tree that no longer exists.
//
//   node scripts/recover-cluster-content.mjs [--live <dir>] [--out <file>]
//
// It parses <section id="cluster-answer"> out of every deployed page and turns
// it back into the ClusterBlock object that produced it. The markup is fully
// determined by components/ClusterContent.tsx, so this reverses that component
// rather than guessing: answer paragraph, facts <dl>, section <h2>+<p>s,
// optional photo figures, the "avoid" panel, and the FAQ <details> list.
//
// Every page carrying the block is recovered, including the ones lib/cluster-content.ts
// still has hand-written: the deployed HTML is what the site has to match, and
// several of those entries were edited after the source copy was written.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-cluster-content.ts");

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

// Text of an element: strip the inline <svg> icons and React's comment
// separators, then the remaining tags. ASCII whitespace runs collapse, but ZWNJ
// and NBSP are left alone — in Persian they are part of the word.
const text = (html) =>
  decode(
    html
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t\r\n]+/g, " ")
    .trim();

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

/** Every element whose class starts with `classPrefix`, at any depth. */
function divsWithClass(html, classPrefix) {
  const out = [];
  const re = new RegExp(`<div class="${classPrefix}[^"]*"`, "gi");
  let m;
  while ((m = re.exec(html))) {
    const end = elementAt(html, m.index, "div");
    out.push(html.slice(m.index, end));
    re.lastIndex = end;
  }
  return out;
}

function parseBlock(html) {
  const start = html.indexOf('<section id="cluster-answer"');
  if (start < 0) return null;
  const block = html.slice(start, elementAt(html, start, "section"));

  const answer = text(
    (block.match(/<p class="text-\[16px\][^"]*">([\s\S]*?)<\/p>/) ?? [])[1] ?? "",
  );

  const facts = [];
  const dl = block.match(/<dl[\s\S]*?<\/dl>/);
  if (dl) {
    const re = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g;
    let m;
    while ((m = re.exec(dl[0]))) facts.push({ label: text(m[1]), value: text(m[2]) });
  }

  const sections = [];
  const photos = [];
  const faq = [];
  let avoid = null;

  for (const div of divsWithClass(block, "mt-8")) {
    const h2 = div.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    const heading = h2 ? text(h2[1]) : "";

    if (heading === "پرسش های پرتکرار") {
      const re =
        /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
      let m;
      while ((m = re.exec(div))) faq.push({ q: text(m[1]), a: text(m[2]) });
      continue;
    }

    if (heading === "تصویرهایی از کار ما") {
      const re = /<img([^>]*)>[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g;
      let m;
      while ((m = re.exec(div))) {
        const attrs = m[1];
        const at = (n) => (attrs.match(new RegExp(`${n}="([^"]*)"`)) ?? [])[1] ?? "";
        photos.push({
          src: decode(at("src")),
          alt: decode(at("alt")),
          w: Number(at("width")),
          h: Number(at("height")),
          caption: text(m[2]),
        });
      }
      continue;
    }

    if (/border-accent\/25/.test(div.slice(0, 200))) {
      avoid = {
        title: heading,
        items: [...div.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => text(m[1])),
      };
      continue;
    }

    const paras = [
      ...div.matchAll(/<p class="mt-3 text-\[15px\][^"]*">([\s\S]*?)<\/p>/g),
    ].map((m) => text(m[1]));
    if (heading && paras.length) sections.push({ h: heading, p: paras });
  }

  return { answer, facts, sections, photos, avoid, faq };
}

// ---------- walk the deployed tree ----------
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
  if (!html.includes('id="cluster-answer"')) continue;
  const block = parseBlock(html);
  if (block) recovered.push([urlPath, block]);
}

const j = (v, indent) =>
  JSON.stringify(v, null, 2).split("\n").join("\n" + " ".repeat(indent));

const body = recovered
  .map(([p, b]) => {
    const parts = [
      `    answer: ${JSON.stringify(b.answer)},`,
      `    facts: ${j(b.facts, 4)},`,
      `    sections: ${j(b.sections, 4)},`,
    ];
    if (b.photos.length) parts.push(`    photos: ${j(b.photos, 4)},`);
    if (b.avoid) parts.push(`    avoid: ${j(b.avoid, 4)},`);
    parts.push(`    faq: ${j(b.faq, 4)},`);
    return `  ${JSON.stringify(p)}: {\n${parts.join("\n")}\n  },`;
  })
  .join("\n");

const header = `// Enrichment blocks recovered from the deployed site.
//
// These were written between 2026-07-25 and 2026-08-16 into a source tree that
// was lost; the only surviving copy was the rendered HTML. They are read back
// by scripts/recover-cluster-content.mjs, which reverses the markup that
// components/ClusterContent.tsx produces, for every page that carries one.
//
// This table wins over the hand-written blocks in lib/cluster-content.ts: some
// of those were edited on the live site after the source copy was written, and
// what the site actually serves is the reference.
//
// Do not edit by hand — re-run the script.
import type { ClusterBlock } from "./cluster-content";

export const CLUSTER_CONTENT_RECOVERED: Record<string, ClusterBlock> = {
${body}
};
`;

fs.writeFileSync(OUT, header, "utf8");
console.log(`recovered ${recovered.length} enrichment blocks -> ${OUT}`);
for (const [p, b] of recovered) {
  const bits = [
    `facts ${b.facts.length}`,
    `sections ${b.sections.length}`,
    `faq ${b.faq.length}`,
  ];
  if (b.photos.length) bits.push(`photos ${b.photos.length}`);
  if (!b.avoid) bits.push("NO AVOID PANEL");
  console.log(`  ${p}  ${bits.join(" · ")}`);
}
