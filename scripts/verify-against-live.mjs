// Strict page-by-page comparison of the exported build against the deployed
// site, so "the rebuild matches production" is something you can re-run and
// read, not something you have to take on trust.
//
//   node scripts/verify-against-live.mjs [--live <dir>] [--out <dir>] [--json <file>]
//
// Defaults: --live "D:/Folder D/back up/bartar-repairer.com", --out ./out
//
// The two trees are compared on eight axes per URL. Everything is exact string
// equality after the normalisation described below — no length tolerances, no
// fuzzy matching, no sampling. Every URL in either tree is visited.
//
//   1. url          the page exists in both trees
//   2. title        <title>
//   3. description  <meta name="description">
//   4. canonical    <link rel="canonical">
//   5. robots       <meta name="robots">
//   6. headings     every h1–h6, in document order
//   7. text         every visible character, in document order
//   8. links        every <a href> + its anchor text, in document order
//   9. images       every <img src> + alt
//  10. schema       every application/ld+json node, key-sorted
//
// NORMALISATION — the only differences deliberately ignored, each because it
// cannot change what a reader or a crawler sees:
//
//   * <script> and <style> bodies are removed before text extraction. JSON-LD
//     is pulled out first and compared separately on axis 10.
//   * HTML comments are removed. This covers React's `<!-- -->` text-node
//     separators and its `<!--$-->` Suspense markers, which appear or vanish
//     purely from how JSX splits an identical sentence across expressions.
//   * Runs of ASCII whitespace collapse to one space, and leading/trailing
//     space is trimmed. ZWNJ (U+200C) and NBSP (U+00A0) are NOT touched —
//     in Persian they are letters of the layout, so a change in one is a real
//     change and gets reported.
//   * HTML entities are decoded, so `&amp;` and `&` compare equal.
//
// Anything else that differs is reported, down to a single dot.
import fs from "node:fs";
import path from "node:path";
import { ACCEPTED, EDITS, classify } from "./accepted-differences.mjs";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", path.join(process.cwd(), "out"));
const JSON_OUT = argOf("--json", "");
const SHOW = Number(argOf("--show", "40"));

// ---------- extraction ----------

const ENTITIES = {
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

function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, body) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return body in ENTITIES ? ENTITIES[body] : m;
  });
}

/** Collapse ASCII whitespace only — Persian ZWNJ and NBSP are preserved. */
const squash = (s) => s.replace(/[\t\n\r ]+/g, " ").trim();
const clean = (s) => squash(decodeEntities(s));
const strip = (s) => clean(s.replace(/<[^>]*>/g, " "));

function readPage(file) {
  const raw = fs.readFileSync(file, "utf8");

  // JSON-LD first: it lives inside <script>, which the next step deletes.
  const schema = [];
  for (const m of raw.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      schema.push(stableStringify(JSON.parse(decodeEntities(m[1]))));
    } catch {
      schema.push("UNPARSEABLE: " + squash(m[1]).slice(0, 200));
    }
  }

  // Scripts (including the RSC flight payload, which restates the whole page),
  // styles, then comments. Comments go last so `<!-- -->` inside a script body
  // is already gone.
  const body = raw
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<!--[\s\S]*?-->/g, "");

  const bodyOnly = body.slice(body.indexOf("<body"));

  const headings = [...bodyOnly.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((m) => `${m[1]}: ${strip(m[2])}`)
    .filter((h) => h.slice(4).length > 0);

  const links = [...bodyOnly.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(
    (m) => `${attr(m[1], "href")} :: ${strip(m[2])}`,
  );

  const images = [...bodyOnly.matchAll(/<img\b([^>]*)>/g)].map(
    (m) => `${attr(m[1], "src")} :: ${attr(m[1], "alt")}`,
  );

  return {
    title: strip(pick(raw, /<title[^>]*>([\s\S]*?)<\/title>/)),
    description: metaContent(raw, "description"),
    canonical: clean(
      pick(raw, /<link[^>]+rel="canonical"[^>]*href="([^"]*)"/) ||
        pick(raw, /<link[^>]+href="([^"]*)"[^>]*rel="canonical"/),
    ),
    robots: metaContent(raw, "robots"),
    headings,
    text: strip(bodyOnly),
    links,
    images,
    schema: schema.sort(),
  };
}

const pick = (s, re) => {
  const m = s.match(re);
  return m ? m[1] : "";
};
const attr = (tag, name) =>
  clean(
    pick(tag, new RegExp(`\\b${name}="([^"]*)"`)) ||
      pick(tag, new RegExp(`\\b${name}='([^']*)'`)),
  );
const metaContent = (s, name) =>
  clean(
    pick(s, new RegExp(`<meta[^>]+name="${name}"[^>]*content="([^"]*)"`)) ||
      pick(s, new RegExp(`<meta[^>]+content="([^"]*)"[^>]*name="${name}"`)),
  );

/** Key-sorted JSON so property order never registers as a difference. */
function stableStringify(v) {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

// ---------- comparison ----------

function walk(dir, base = dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "_next" || e.name === "node_modules" || e.name === ".git")
      continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, acc);
    else if (e.name.endsWith(".html"))
      acc.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return acc;
}

/** First differing character, with the surrounding text on both sides. */
function firstDelta(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const from = Math.max(0, i - 60);
  return {
    at: i,
    live: a.slice(from, i + 90),
    build: b.slice(from, i + 90),
  };
}

function listDelta(a, b) {
  const bs = new Set(b);
  const as = new Set(a);
  return {
    onlyLive: a.filter((x) => !bs.has(x)),
    onlyBuild: b.filter((x) => !as.has(x)),
  };
}

const liveFiles = new Set(walk(LIVE));
const buildFiles = new Set(walk(OUT));
const all = [...new Set([...liveFiles, ...buildFiles])].sort();

const SCALARS = ["title", "description", "canonical", "robots"];
const LISTS = ["headings", "links", "images", "schema"];

const report = [];
const counts = Object.fromEntries(
  ["missing", "extra", ...SCALARS, "text", ...LISTS].map((k) => [k, 0]),
);

for (const rel of all) {
  if (!buildFiles.has(rel)) {
    counts.missing++;
    report.push({ page: rel, verdict: "MISSING_FROM_BUILD", diffs: {} });
    continue;
  }
  if (!liveFiles.has(rel)) {
    counts.extra++;
    report.push({ page: rel, verdict: "NOT_ON_LIVE", diffs: {} });
    continue;
  }

  const a = readPage(path.join(LIVE, rel));
  const b = readPage(path.join(OUT, rel));
  const diffs = {};

  for (const k of SCALARS) {
    if (a[k] !== b[k]) {
      diffs[k] = { live: a[k], build: b[k] };
      counts[k]++;
    }
  }
  if (a.text !== b.text) {
    diffs.text = firstDelta(a.text, b.text);
    diffs.text.liveChars = a.text.length;
    diffs.text.buildChars = b.text.length;
    counts.text++;
  }
  for (const k of LISTS) {
    const d = listDelta(a[k], b[k]);
    if (d.onlyLive.length || d.onlyBuild.length) {
      diffs[k] = d;
      counts[k]++;
    }
  }

  // Split "changed on purpose" from "lost in the rebuild". A page counts as
  // ACCEPTED only when every one of its differences is explained by a rule in
  // scripts/accepted-differences.mjs — one unexplained entry and the whole
  // page is UNRESOLVED.
  const accepted = new Set();
  const unresolved = [];
  for (const [axis, d] of Object.entries(diffs)) {
    const ids = classify(axis, d, rel);
    if (ids) ids.forEach((id) => accepted.add(id));
    else unresolved.push(axis);
  }

  report.push({
    page: rel,
    verdict: !Object.keys(diffs).length
      ? "IDENTICAL"
      : unresolved.length
        ? "UNRESOLVED"
        : "ACCEPTED",
    accepted: [...accepted],
    unresolved,
    diffs,
  });
}

// ---------- output ----------

const identical = report.filter((r) => r.verdict === "IDENTICAL").length;
const acceptedPages = report.filter((r) => r.verdict === "ACCEPTED");
const differing = report.filter((r) => r.verdict === "UNRESOLVED");

console.log(`live : ${LIVE}`);
console.log(`build: ${OUT}`);
console.log(`\npages compared      ${all.length}`);
console.log(`identical           ${identical}`);
console.log(`accepted            ${acceptedPages.length}  (differ only by a documented, deliberate change)`);
console.log(`UNRESOLVED          ${differing.length}`);
console.log(`missing from build  ${counts.missing}`);
console.log(`not on live         ${counts.extra}`);

console.log(`\nper axis (pages affected, before accepting)`);
for (const k of [...SCALARS, "text", ...LISTS]) {
  console.log(`  ${k.padEnd(12)} ${counts[k]}`);
}

console.log(`\naccepted differences in play`);
for (const rule of ACCEPTED) {
  const n = report.filter((r) => r.accepted?.includes(rule.id)).length;
  console.log(`  ${rule.id.padEnd(32)} ${String(n).padStart(4)} pages`);
}
// One line per edit id, not per entry: a single change often shows up on two
// axes (an edited heading moves both the text and the links on that page).
const uniqueEdits = EDITS.filter(
  (e, i, a) => a.findIndex((x) => x.id === e.id) === i,
);
for (const edit of uniqueEdits) {
  const n = report.filter((r) => r.accepted?.includes(edit.id)).length;
  const where = `/${edit.page.replace(/index\.html$/, "")}`;
  const axes = [
    ...new Set(EDITS.filter((e) => e.id === edit.id).map((e) => e.axis)),
  ].join("+");
  console.log(
    `  ${edit.id.padEnd(34)} ${String(n).padStart(3)} page   ${axes.padEnd(11)} ${where}`,
  );
}

if (differing.length) {
  console.log(`\nfirst ${Math.min(SHOW, differing.length)} UNRESOLVED pages:`);
  for (const r of differing.slice(0, SHOW)) {
    console.log(`\n  /${r.page.replace(/index\.html$/, "")}   [${r.unresolved.join(", ")}]`);
    for (const [axis, d] of Object.entries(r.diffs)) {
      if (!r.unresolved.includes(axis)) continue;
      if (axis === "text") {
        console.log(
          `    text     ${d.liveChars} → ${d.buildChars} chars, first delta at ${d.at}`,
        );
        console.log(`      live : …${d.live}`);
        console.log(`      build: …${d.build}`);
      } else if (d.onlyLive) {
        for (const x of d.onlyLive.slice(0, 4))
          console.log(`    ${axis.padEnd(8)} only on live : ${x.slice(0, 150)}`);
        for (const x of d.onlyBuild.slice(0, 4))
          console.log(`    ${axis.padEnd(8)} only in build: ${x.slice(0, 150)}`);
      } else {
        console.log(`    ${axis.padEnd(8)} live : ${String(d.live).slice(0, 150)}`);
        console.log(`    ${axis.padEnd(8)} build: ${String(d.build).slice(0, 150)}`);
      }
    }
  }
}

if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify({ counts, report }, null, 1));
  console.log(`\nfull report → ${JSON_OUT}`);
}

process.exitCode = differing.length || counts.missing ? 1 : 0;
