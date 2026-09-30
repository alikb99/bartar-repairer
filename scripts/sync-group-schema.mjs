/**
 * Applies the group's `subOrganization` edge, and the /group/ footer link, to
 * the four frozen pages in public/.
 *
 * Those pages are pre-rendered HTML rather than Next routes (see
 * docs/frozen-pages.md), so they never see app/layout.tsx. Every sitewide
 * header, footer or schema change has to be replayed into them by hand, and the
 * ownership declaration is exactly the kind of claim that is weakened by being
 * absent from four URLs — a parent that admits to its subsidiaries on 950 pages
 * and stays silent on four looks inconsistent rather than thorough.
 *
 * The subOrganization array is lifted out of the BUILT output rather than
 * re-derived from lib/data.ts, so what lands in the frozen pages is byte-identical
 * to what the rest of the site publishes. That means this runs AFTER `npm run
 * build`, and has to be re-run whenever GROUP_SITES changes.
 *
 * Idempotent: running it twice changes nothing the second time.
 *
 *   node scripts/sync-group-schema.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ORG_ID = "https://bartar-repairer.com/#organization";
const FROZEN = ["acer", "prices", "mobile-repair-online", "app"];
// Any built page carries the sitewide Organization node; contact is stable.
const SOURCE = path.join(ROOT, "out", "contact", "index.html");

const SCRIPT_RE =
  /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

/** Every JSON-LD node in an HTML string, flattened through @graph. */
function nodesOf(json) {
  const roots = Array.isArray(json) ? json : [json];
  return roots.flatMap((r) => (Array.isArray(r?.["@graph"]) ? r["@graph"] : [r]));
}

// ---------- 1. read the canonical array out of the build ----------
if (!fs.existsSync(SOURCE)) {
  console.error(`missing ${path.relative(ROOT, SOURCE)} — run \`npm run build\` first.`);
  process.exit(1);
}

let subOrganization = null;
for (const m of fs.readFileSync(SOURCE, "utf8").matchAll(SCRIPT_RE)) {
  let parsed;
  try {
    parsed = JSON.parse(m[1]);
  } catch {
    continue;
  }
  const org = nodesOf(parsed).find(
    (n) => n?.["@id"] === ORG_ID && n.subOrganization
  );
  if (org) {
    subOrganization = org.subOrganization;
    break;
  }
}

if (!subOrganization?.length) {
  console.error(
    "no Organization node with subOrganization in the build — did GROUP_SITES or app/layout.tsx change?"
  );
  process.exit(1);
}

console.log(`source: ${subOrganization.length} group sites from the build`);

// ---------- 2. replay it into each frozen page ----------
const FOOTER_LINK = '<a class="transition hover:text-white" href="/directory/">فهرست کامل صفحات</a>';
const FOOTER_ADD =
  FOOTER_LINK +
  '<a class="transition hover:text-white" href="/group/">سایت های مجموعه</a>';

let changed = 0;

for (const slug of FROZEN) {
  const file = path.join(ROOT, "public", slug, "index.html");
  if (!fs.existsSync(file)) {
    console.log(`  ${slug}: no index.html, skipped`);
    continue;
  }

  const before = fs.readFileSync(file, "utf8");
  let html = before;
  let patchedSchema = false;

  html = html.replace(SCRIPT_RE, (whole, body) => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return whole;
    }
    const org = nodesOf(parsed).find((n) => n?.["@id"] === ORG_ID);
    if (!org) return whole;
    // Mutating the node in place keeps it wherever it sat in the graph.
    org.subOrganization = subOrganization;
    patchedSchema = true;
    return whole.replace(body, JSON.stringify(parsed));
  });

  if (!patchedSchema) {
    console.log(`  ${slug}: WARNING — no Organization node at ${ORG_ID}, schema not applied`);
  }

  // The hand-built /acer/ landing has its own footer and none of this markup;
  // it reaches /group/ through the schema edge alone.
  if (html.includes(FOOTER_LINK) && !html.includes('href="/group/"')) {
    html = html.replace(FOOTER_LINK, FOOTER_ADD);
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed++;
    console.log(`  ${slug}: updated`);
  } else {
    console.log(`  ${slug}: already current`);
  }
}

console.log(changed === 0 ? "nothing to do" : `${changed} frozen page(s) updated`);
