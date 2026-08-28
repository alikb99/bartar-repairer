// Recovers which repair-type hubs each page belongs to, by reading the hubs
// themselves off the deployed site.
//
//   node scripts/recover-repair-type-membership.mjs [--live <dir>] [--out <file>]
//
// The title regexes in lib/repair-types.ts get most pages right but not all:
// "مشکل تاچ گوشی هنگام شارژ" is filed under both the screen hub and the
// charging hub on the deployed site, and no regex over the title says so. The
// hub pages list their own members, so they are the record.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-membership-types.ts");

const dir = path.join(LIVE, "repairs");
const hubs = fs
  .readdirSync(dir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const byPage = new Map(); // page path -> Set(hub slug)
for (const hub of hubs) {
  const file = path.join(dir, hub, "index.html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  // The hub lists its services and articles as cards; everything else on the
  // page (nav, footer, branch block) links out of the /repairs/ tree or to
  // another hub, so links to other hubs are dropped.
  for (const m of html.matchAll(/href="(\/[^"#]+\/)"/g)) {
    const href = decodeURIComponent(m[1]);
    if (href.startsWith("/repairs/") || href === "/") continue;
    if (!byPage.has(href)) byPage.set(href, new Set());
    byPage.get(href).add(hub);
  }
}

// Links in the header, footer and branch locator appear on every hub; a page
// that "belongs" to all of them belongs to none of them.
const ALL = hubs.length;
const rows = [...byPage.entries()]
  .map(([page, set]) => [page, [...set].sort()])
  .filter(([, list]) => list.length < ALL - 2)
  .sort((a, b) => a[0].localeCompare(b[0]));

fs.writeFileSync(
  OUT,
  `// Repair-type hub membership recovered from the deployed hubs
// (scripts/recover-repair-type-membership.mjs). A page can sit under more than
// one hub — a touch fault that only shows while charging belongs to both.
//
// Do not edit by hand — re-run the script.

export const REPAIR_TYPE_MEMBERSHIP: Record<string, string[]> = {
${rows.map(([page, list]) => `  ${JSON.stringify(page)}: ${JSON.stringify(list)},`).join("\n")}
};
`,
  "utf8",
);

const multi = rows.filter(([, l]) => l.length > 1).length;
console.log(
  `recovered membership for ${rows.length} pages (${multi} in more than one hub) -> ${OUT}`,
);
