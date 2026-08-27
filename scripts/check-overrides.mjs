// Prebuild guard for the override tables.
//
// A repeated key in a TypeScript object literal is NOT an error — the later
// value silently wins and the earlier one vanishes. That has quietly discarded
// finished title work more than once here, and nothing in the build output
// reveals it, so the tables are parsed and checked before every build.
//
// Also enforces two content rules that keep leaking into hand-written strings:
// no ZWNJ (نیم‌فاصله breaks spacing once rendered) and no exclamation marks.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = [
  ["lib/content.ts", ["TITLE_OVERRIDES", "META_OVERRIDES", "CANONICAL_TO", "PATH_RENAMES"]],
  ["lib/recovered-overrides.ts", ["TITLE_OVERRIDES_RECOVERED", "META_OVERRIDES_RECOVERED", "H1_OVERRIDES_RECOVERED"]],
  ["lib/recovered-membership.ts", ["ARTICLE_REPAIR_TYPE"]],
  ["lib/recovered-revised.ts", ["CLUSTER_REVISED"]],
];

const ZWNJ = "‌";
let failures = 0;
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failures++;
};

/** Extract the literal body of `const NAME ... = {` up to its matching brace. */
function objectBody(src, name) {
  const start = src.search(new RegExp(`const\\s+${name}\\b[^=]*=\\s*\\{`));
  if (start === -1) return null;
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return null;
}

for (const [rel, names] of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    fail(`${rel} is missing`);
    continue;
  }
  const src = fs.readFileSync(file, "utf8");
  for (const name of names) {
    const body = objectBody(src, name);
    if (body === null) {
      fail(`${rel}: could not find ${name}`);
      continue;
    }
    // Keys are always double-quoted string literals in these tables.
    const keys = [...body.matchAll(/^\s*"((?:[^"\\]|\\.)*)"\s*:/gm)].map((m) => m[1]);
    const seen = new Map();
    for (const k of keys) {
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    const dupes = [...seen].filter(([, n]) => n > 1);
    for (const [k, n] of dupes) {
      fail(`${rel} → ${name}: duplicate key "${k}" (${n}×) — the later value silently wins`);
    }
    console.log(`  ✓ ${rel} → ${name}: ${keys.length} keys, no duplicates`);

    // Value-level content rules (title/meta tables only).
    if (!/OVERRIDES/.test(name)) continue;
    const values = [...body.matchAll(/:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    for (const v of values) {
      if (v.includes(ZWNJ)) fail(`${rel} → ${name}: ZWNJ in "${v.slice(0, 48)}…"`);
      if (v.includes("!") || v.includes("!")) {
        fail(`${rel} → ${name}: exclamation mark in "${v.slice(0, 48)}…"`);
      }
    }
  }
}

if (failures) {
  console.error(`\ncheck-overrides: ${failures} problem(s) — build stopped.`);
  process.exit(1);
}
console.log("check-overrides: all override tables are clean.");
