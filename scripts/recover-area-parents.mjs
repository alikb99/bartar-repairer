// Works out which published neighbourhood hub each unpublished area belongs to.
//
//   node scripts/recover-area-parents.mjs [--live <dir>] [--out <file>]
//
// A page about a street with only two pages behind it does not get its own hub,
// but the deployed Service schema still names a district for it: the Kashani
// pages serve "غرب تهران", the Chaharsu pages serve "خیابان جمهوری". That
// mapping was a judgement about the city, not a rule, so it is read back from
// the deployed pages rather than guessed from the branch.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-area-parents.ts");

// Read the area table out of the source so the two stay in step.
const src = fs.readFileSync("lib/service-areas.ts", "utf8");
const areas = [
  ...src.matchAll(
    /slug: "([^"]+)",\s*\n?\s*name: "([^"]+)",\s*\n?\s*aliases: \[([^\]]*)\]/g,
  ),
].map((m) => ({
  slug: m[1],
  name: m[2],
  aliases: [...m[3].matchAll(/"([^"]+)"/g)].map((a) => a[1]),
}));
const byName = new Map(areas.map((a) => [a.name, a.slug]));

const pages = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, `${rel}${e.name}/`);
    else if (e.name === "index.html") pages.push([`/${rel}`, abs]);
  }
})(LIVE, "");

// Which pages each published hub lists is the authoritative statement of what
// belongs to it: read the hub pages, then ask which unpublished areas those
// pages match. Everything a hub lists that is not its own area is an area it
// speaks for.
const votes = new Map(); // unpublished slug -> published slug -> count
const published = new Set(
  fs
    .readdirSync(path.join(LIVE, "areas"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name),
);
const titleOf = new Map(); // page path -> title, for alias matching
for (const [urlPath, file] of pages) {
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (m) titleOf.set(urlPath, m[1].replace(/<[^>]+>/g, "").trim());
}

for (const hub of published) {
  const file = path.join(LIVE, "areas", hub, "index.html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const i = html.indexOf("خدمات ما در");
  if (i < 0) continue;
  const block = html.slice(i, html.indexOf("</section>", i));
  for (const link of block.matchAll(/href="(\/[^"]+)"/g)) {
    const title = titleOf.get(link[1]);
    if (!title) continue;
    for (const a of areas) {
      if (published.has(a.slug)) continue; // it has a hub of its own
      if (!a.aliases.some((alias) => title.includes(alias))) continue;
      if (!votes.has(a.slug)) votes.set(a.slug, new Map());
      const inner = votes.get(a.slug);
      inner.set(hub, (inner.get(hub) ?? 0) + 1);
    }
  }
}

// A small area can belong to more than one published hub — Punak is listed
// under both west and north Tehran — so every hub that claims it is kept.
const rows = [...votes.entries()]
  .map(([from, inner]) => [from, [...inner.keys()].filter((to) => to !== from).sort()])
  .filter(([, tos]) => tos.length > 0)
  .sort((a, b) => a[0].localeCompare(b[0]));

const NL = String.fromCharCode(10);
fs.writeFileSync(
  OUT,
  `// The published neighbourhood hub that speaks for each area too small to have
// one of its own, read back from the deployed Service schema
// (scripts/recover-area-parents.mjs).
//
// Do not edit by hand — re-run the script.

export const AREA_PARENT: Record<string, string[]> = {
${rows.map(([from, tos]) => `  ${JSON.stringify(from)}: ${JSON.stringify(tos)},`).join(NL)}
};
`,
  "utf8",
);

console.log(`recovered ${rows.length} area parents -> ${OUT}`);
for (const [from, tos] of rows) console.log(`  ${from} -> ${tos.join(", ")}`);
  console.log(`  ${from} → ${to}  (${n}${variants > 1 ? `, ${variants} variants` : ""})`);
