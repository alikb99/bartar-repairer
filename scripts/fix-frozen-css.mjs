// Frozen pages (docs/frozen-pages.md) are raw HTML copied from public/ into
// out/. They carry a hardcoded <link> to a hashed Tailwind bundle, but that
// hash changes whenever any page's markup changes, so the reference goes stale
// on its own and the pages deploy with no styling at all — which is exactly
// what happened to /prices/, /app/ and /mobile-repair-online/.
//
// This runs after every build and repoints them at the stylesheet the build
// actually emitted, read off a real Next page so there is no second source of
// truth about which bundle is current.
//
// /app/, /acer/ and /warranty/ are not listed: they are fully self-contained
// (inline CSS, own fonts) and never reference the Next stylesheet.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const REFERENCE_PAGE = "out/index.html";
const FROZEN = [
  "out/prices/index.html",
  "out/mobile-repair-online/index.html",
];

const STYLESHEET = /<link rel="stylesheet" href="(\/_next\/static\/css\/[^"]+)"/;

const reference = readFileSync(REFERENCE_PAGE, "utf8").match(STYLESHEET);
if (!reference) {
  console.error(`fix-frozen-css: no stylesheet found in ${REFERENCE_PAGE}`);
  process.exit(1);
}
const current = reference[1];

let changed = 0;
for (const file of FROZEN) {
  if (!existsSync(file)) {
    console.error(`fix-frozen-css: ${file} is missing from the export`);
    process.exit(1);
  }

  const html = readFileSync(file, "utf8");
  const found = html.match(STYLESHEET);
  if (!found) {
    console.error(`fix-frozen-css: ${file} has no stylesheet link`);
    process.exit(1);
  }
  if (found[1] === current) continue;

  writeFileSync(file, html.replace(found[1], current));
  console.log(`fix-frozen-css: ${file}  ${found[1]} -> ${current}`);
  changed++;
}

console.log(
  changed
    ? `fix-frozen-css: repointed ${changed} frozen page(s) at ${current}`
    : `fix-frozen-css: ${FROZEN.length} frozen pages already on ${current}`,
);
