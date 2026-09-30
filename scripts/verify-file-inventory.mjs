// File-level inventory comparison of the exported build against the deployed
// snapshot. The HTML verifier only walks index.html; this one accounts for
// EVERY file in either tree: images, fonts, .htaccess, sitemap.xml, robots.txt,
// llms*.txt, the _next asset bundle — everything that gets uploaded.
//
//   node scripts/verify-file-inventory.mjs [--live <dir>] [--out <dir>] [--json <file>]
//
// Buckets:
//   ONLY_LIVE   file exists on the deployed site but the build does not make it
//   ONLY_BUILD  file the build makes that is not on the deployed site
//   DIFFERENT   same path, different bytes (sha256)
//   IDENTICAL   same path, same bytes
// HTML files are hashed too but reported apart, since verify-against-live.mjs
// judges them on meaning rather than bytes.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", path.join(process.cwd(), "out"));
const JSON_OUT = argOf("--json", "");
const SHOW = Number(argOf("--show", "60"));

function walk(root) {
  const files = new Map();
  const stack = [""];
  while (stack.length) {
    const rel = stack.pop();
    const abs = path.join(root, rel);
    let entries;
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) stack.push(r);
      else if (e.isFile()) files.set(r, path.join(root, r));
    }
  }
  return files;
}

const sha = (p) => {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(p));
  return h.digest("hex");
};

const live = walk(LIVE);
const build = walk(OUT);

const all = new Set([...live.keys(), ...build.keys()]);
const res = { onlyLive: [], onlyBuild: [], different: [], identical: [], htmlDifferent: [], htmlIdentical: [] };

for (const rel of [...all].sort()) {
  const isHtml = rel.endsWith(".html");
  const l = live.get(rel);
  const b = build.get(rel);
  if (l && !b) res.onlyLive.push(rel);
  else if (b && !l) res.onlyBuild.push(rel);
  else {
    const same = fs.statSync(l).size === fs.statSync(b).size && sha(l) === sha(b);
    if (isHtml) (same ? res.htmlIdentical : res.htmlDifferent).push(rel);
    else (same ? res.identical : res.different).push(rel);
  }
}

const list = (label, arr) => {
  console.log(`\n${label} (${arr.length})`);
  arr.slice(0, SHOW).forEach((r) => console.log("  " + r));
  if (arr.length > SHOW) console.log(`  … ${arr.length - SHOW} more`);
};

console.log(`live:  ${LIVE}  (${live.size} files)`);
console.log(`build: ${OUT}  (${build.size} files)`);
console.log(
  `\nnon-HTML: ${res.identical.length} identical · ${res.different.length} different · ` +
    `${res.onlyLive.length} only-live · ${res.onlyBuild.length} only-build`
);
console.log(`HTML bytes: ${res.htmlIdentical.length} identical · ${res.htmlDifferent.length} different`);
list("ONLY ON LIVE", res.onlyLive);
list("ONLY IN BUILD", res.onlyBuild);
list("DIFFERENT BYTES (non-HTML)", res.different);

if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(res, null, 2));
