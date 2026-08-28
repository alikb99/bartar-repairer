// Line-by-line comparison of the plain-text files in the export against the
// deployed site. verify-against-live.mjs only walks index.html pages, so
// llms.txt, llms-full.txt and robots.txt had no check at all.
//
//   node scripts/verify-text-files.mjs [--live <dir>] [--out <dir>] [--show N]
//
// Exact string equality per line, no tolerances. Differences that are
// deliberate are listed in ACCEPTED below with the reason, printed as
// ACCEPTED rather than UNRESOLVED — same rule as accepted-differences.mjs:
// if you cannot say why the new behaviour is correct, it is a regression.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", path.join(process.cwd(), "out"));
const SHOW = Number(argOf("--show", "25"));

const FILES = ["llms.txt", "llms-full.txt", "robots.txt"];

const ACCEPTED = [
  {
    id: "mobile-brand-h1-overrides",
    file: "llms-full.txt",
    reason:
      "Five mobile brand hubs (htc, asus, ناتینگ فون, گوگل پیکسل, موتورولا) " +
      "are headed here by the H1 the page actually renders, where the " +
      "deployed file still used the raw database title. The H1 on those pages " +
      "did not change — only this file now agrees with it.",
    matches: (live, build) =>
      /^## /.test(live) && /^## تعمیرات گوشی .* در تهران$/.test(build),
  },
  {
    id: "zwnj-double-space",
    file: "llms-full.txt",
    reason:
      "A ZWNJ in the WordPress export sat next to a real space, so replacing " +
      "it left a double space in the heading. The rebuild collapses the run; " +
      "the deployed file still carries the double space.",
    matches: (live, build) =>
      live.replace(/ {2,}/g, " ") === build.replace(/ {2,}/g, " "),
  },
];

const explain = (file, live, build) =>
  ACCEPTED.find((r) => r.file === file && r.matches(live ?? "", build ?? ""));

let unresolved = 0;
for (const name of FILES) {
  const livePath = path.join(LIVE, name);
  const outPath = path.join(OUT, name);
  if (!fs.existsSync(livePath)) { console.log(`? ${name}: not on the live site`); continue; }
  if (!fs.existsSync(outPath)) { console.log(`MISSING ${name}: the build did not emit it`); unresolved++; continue; }

  const A = fs.readFileSync(outPath, "utf8").split("\n");
  const B = fs.readFileSync(livePath, "utf8").split("\n");
  const hunks = [];
  let i = 0, j = 0;
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { i++; j++; continue; }
    // Re-sync on the nearest line that appears on both sides.
    let move = null;
    for (let d = 1; d <= 500 && !move; d++) {
      if (B[j + d] !== undefined && A[i] === B[j + d]) move = ["live", d];
      else if (A[i + d] !== undefined && A[i + d] === B[j]) move = ["build", d];
    }
    if (!move) { hunks.push({ line: j + 1, live: B[j], build: A[i] }); i++; j++; }
    else if (move[0] === "live") {
      for (let d = 0; d < move[1]; d++) hunks.push({ line: j + 1 + d, live: B[j + d], build: null });
      j += move[1];
    } else {
      for (let d = 0; d < move[1]; d++) hunks.push({ line: i + 1 + d, live: null, build: A[i + d] });
      i += move[1];
    }
  }
  for (; i < A.length; i++) hunks.push({ line: i + 1, live: null, build: A[i] });
  for (; j < B.length; j++) hunks.push({ line: j + 1, live: B[j], build: null });

  const accepted = new Map();
  const open = [];
  for (const h of hunks) {
    const rule = explain(name, h.live, h.build);
    if (rule) accepted.set(rule.id, (accepted.get(rule.id) ?? 0) + 1);
    else open.push(h);
  }
  unresolved += open.length;
  const verdict = open.length === 0 ? (accepted.size ? "ACCEPTED" : "IDENTICAL") : "UNRESOLVED";
  console.log(`\n${verdict} ${name} — ${hunks.length} differing line(s), ${open.length} unresolved`);
  for (const [id, n] of accepted) {
    const rule = ACCEPTED.find((r) => r.id === id);
    console.log(`  accepted ${n}× ${id}: ${rule.reason}`);
  }
  for (const h of open.slice(0, SHOW)) {
    console.log(`  line ${h.line}`);
    console.log(`    live : ${h.live === null ? "(absent)" : JSON.stringify(h.live.slice(0, 120))}`);
    console.log(`    build: ${h.build === null ? "(absent)" : JSON.stringify(h.build.slice(0, 120))}`);
  }
  if (open.length > SHOW) console.log(`  …${open.length - SHOW} more`);
}

console.log(`\nunresolved lines across all text files: ${unresolved}`);
process.exit(unresolved === 0 ? 0 : 1);
