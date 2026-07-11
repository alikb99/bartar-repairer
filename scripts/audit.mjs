import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const posts = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content", "posts.json"), "utf8"),
);
const byId = new Map(posts.map((x) => [x.id, x]));
function fp(post) {
  const parts = [];
  let cur = post;
  const seen = new Set();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    parts.unshift(cur.slug);
    cur = cur.parent ? byId.get(cur.parent) : null;
  }
  return "/" + parts.join("/") + "/";
}
const byPath = new Map(posts.map((x) => [fp(x), x]));

const menu = [
  "/samsung/mobile/","/xiaomi/mobile/","/apple/mobile-2/","/huawei/mobile/","/htc/mobile/","/asus/mobile/","/nokia/","/nothingphone-repair/","/google-pixel-mobile-phone-repair/","/motorola-mobile-repair-center/",
  "/asus/lap-top-2/","/lenovo/lap-top/","/hp/lap-top/","/dell/lap-top/","/lap-top-acer/","/sony/lap-top/","/samsung/lap-top/","/xiaomi/lap-top/","/apple/macbook/",
  "/samsung/","/xiaomi/","/apple/","/asus/","/lenovo/","/hp/","/huawei/","/sony/","/dell/","/htc/","/about/","/contact/",
];

function clean(c) {
  return c
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}
const count = (c, re) => (c.match(re) || []).length;

// global tag histogram + per-page anomalies
const allTags = {};
for (const u of menu) {
  const x = byPath.get(u);
  if (!x) {
    console.log("MISSING", u);
    continue;
  }
  const c = clean(x.content);
  for (const m of c.matchAll(/<([a-z][a-z0-9]*)\b/gi)) {
    const t = m[1].toLowerCase();
    allTags[t] = (allTags[t] || 0) + 1;
  }
  const info = {
    len: c.length,
    h1: count(c, /<h1\b/gi),
    h2: count(c, /<h2\b/gi),
    h3: count(c, /<h3\b/gi),
    img: count(c, /<img\b/gi),
    table: count(c, /<table\b/gi),
    iframe: count(c, /<iframe\b/gi),
    faq: count(c, /tabindex/gi),
    aNoHref: count(c, /<a(?![^>]*href)/gi),
    emptyP: count(c, /<p>\s*(&nbsp;)?\s*<\/p>/gi),
    figure: count(c, /<figure\b/gi),
    blockquote: count(c, /<blockquote\b/gi),
  };
  console.log(
    u.padEnd(34),
    Object.entries(info)
      .map(([k, v]) => `${k}:${v}`)
      .join(" "),
  );
}
console.log("\n=== global tag histogram (menu pages) ===");
console.log(
  Object.entries(allTags)
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${t}:${n}`)
    .join("  "),
);
