// Sync repair prices from the supplier's parts price list.
//
// Source: https://8fx.ir/api/prices — the shop's own supplier feed, listing
// each model/part at three quality tiers (کپی۲ / کپی۱ / اورجینال) in تومان.
//
// The published number is a REPAIR price, not a parts price: supplier cost
// plus the shop's fixed labour rate.
//
//   part  <  20,000,000 تومان  →  +   500,000 تومان اجرت
//   part  >= 20,000,000 تومان  →  + 1,000,000 تومان اجرت
//
// Output: content/parts-prices.json, consumed by lib/pricing.ts.
// Re-run whenever supplier prices change:  node scripts/sync-parts-prices.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "content", "parts-prices.json");

const SOURCE = "https://8fx.ir/api/prices";
const LABOUR_THRESHOLD = 20_000_000;
const LABOUR_LOW = 500_000;
const LABOUR_HIGH = 1_000_000;

/** Supplier part category → repair-type hub slug in lib/repair-types.ts */
const CATEGORY_TO_HUB = {
  "ال‌سی‌دی": "lcd-replacement",
  "ال سی دی": "lcd-replacement",
  "باتری": "battery-replacement",
  "درب پشت": "back-cover-replacement",
  "شارژر": "charging-port-repair",
  "اسپیکر": "speaker-microphone-repair",
  "دوربین": "camera-repair",
  "برد": "board-repair",
};

const labourFor = (partPrice) =>
  partPrice >= LABOUR_THRESHOLD ? LABOUR_HIGH : LABOUR_LOW;

// The feed spells a few brands loosely; use the spelling the rest of the site
// and Persian searchers use.
const BRAND_FIX = { "انر": "آنر", "هوآوی": "هواوی" };
const fixBrand = (b) => BRAND_FIX[b] ?? b;

// Samsung rows arrive as factory codes ("SM-A536B"). Site pages use marketing
// names ("A53"), so without this map a page like /samsung-a53repair/ cannot
// find its own price and falls back to the whole brand list. The code stays in
// the displayed name — people search both — and the marketing name is added as
// a matching alias.
const SM_CODE_NAMES = {
  "SM-A013F": "A01 Core",
  "SM-A065F": "A06",
  "SM-A055F": "A05s",
  "SM-A105F": "A10",
  "SM-A135F": "A13",
  "SM-A165F": "A16",
  "SM-A217F": "A21s",
  "SM-A225F": "A22",
  "SM-A226B": "A22 5G",
  "SM-A235F": "A23",
  "SM-A305F": "A30",
  "SM-A307F": "A30s",
  "SM-A325F": "A32",
  "SM-A336E": "A33 5G",
  "SM-A346B": "A34 5G",
  "SM-A356E": "A35 5G",
  "SM-A405F": "A40",
  "SM-A505F": "A50",
  "SM-A525F": "A52",
  "SM-A526B": "A52 5G",
  "SM-A536B": "A53 5G",
  "SM-A546E": "A54 5G",
  "SM-A556E": "A55 5G",
  "SM-A715F": "A71",
  "SM-A736B": "A73 5G",
  "SM-J700F": "J7",
  "SM-J730": "J7 Pro",
  "SM-M315F": "M31",
  "SM-M325FV": "M32",
};
/** Marketing alias for a factory code, used only for matching. */
function aliasFor(modelRaw) {
  const code = String(modelRaw || "").trim().toUpperCase().replace(/_/g, "-");
  return SM_CODE_NAMES[code] ?? null;
}

// Model names arrive inconsistently ("SM-A715F", "samsung a54 5g",
// "iphone 13 promax", "8 PLUSE", "SAMSUNG S24 U"). Normalise for display
// without inventing information: fix casing and known typos, drop a
// duplicated brand prefix, and tidy separators.
const TYPOS = [
  [/\bpluse\b/gi, "Plus"],
  [/\bpromax\b/gi, "Pro Max"],
  [/\b(\d+)pro\b/gi, "$1 Pro"],
  [/\bnormal\b/gi, ""],
  [/_/g, "-"],
];

const UPPER_WORD = /^(5g|4g|3g|lte|nfc|fe|se|gt|ultra|pro|max|plus|lite|mini)$/i;

function titleCase(s) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => {
      // Model codes (SM-A715F, T865) and anything with a digit stay uppercase.
      if (/\d/.test(w) || w.length <= 2) return w.toUpperCase();
      if (UPPER_WORD.test(w)) return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

function cleanModel(raw, brandFa) {
  let s = String(raw || "").trim().replace(/\s+/g, " ");
  for (const [re, to] of TYPOS) s = s.replace(re, to);
  s = s.replace(/\s+/g, " ").trim();

  if (brandFa === "اپل") {
    // Every Apple row here is a phone; normalise to a single "آیفون N …" form.
    s = s.replace(/^iphone\s*/i, "").trim();
    s = s.replace(/\bU\b$/i, "Ultra");
    return `آیفون ${titleCase(s)}`.replace(/\s+/g, " ").trim();
  }

  // Strip a brand name repeated inside the model string.
  s = s.replace(/^(samsung|xiaomi|motorola|nokia|huawei|honor)\s+/i, "");
  s = s.replace(/^sam\s+/i, "");
  s = s.replace(/\bU\b$/i, "Ultra");
  return `${brandFa} ${titleCase(s)}`.replace(/\s+/g, " ").trim();
}

// ---- Supplier data-quality guard ----
// The feed mis-files a batch of Xiaomi Redmi Note models under سامسونگ
// ("samsung note 12 pro 5g"). Samsung's Note line never went past Note 20, so
// publishing those would create pages for phones that do not exist. Anything
// flagged here is written to a review file instead of the site.
const REAL_SAMSUNG_NOTES = /^note\s*(8|9|10|20)\b/i;
function suspicious(brandFa, modelRaw) {
  const m = String(modelRaw || "")
    .replace(/^samsung\s+/i, "")
    .trim();
  if (brandFa === "سامسونگ" && /^note\b/i.test(m) && !REAL_SAMSUNG_NOTES.test(m)) {
    return "سامسونگ مدل Note با این شماره ندارد (احتمالا ردمی نوت شیائومی)";
  }
  // Redmi/Poco/Mi are Xiaomi lines — never Samsung.
  if (brandFa === "سامسونگ" && /^(redmi|poco|mi)\b/i.test(m)) {
    return "مدل شیائومی زیر برند سامسونگ ثبت شده";
  }
  if (brandFa === "شیائومی" && /^(galaxy|sm-)/i.test(m)) {
    return "مدل سامسونگ زیر برند شیائومی ثبت شده";
  }
  return null;
}

const res = await fetch(SOURCE, { headers: { accept: "application/json" } });
if (!res.ok) {
  console.error(`supplier feed returned ${res.status}`);
  process.exit(1);
}
const rows = await res.json();
if (!Array.isArray(rows) || rows.length === 0) {
  console.error("supplier feed returned no rows — keeping existing file");
  process.exit(1);
}

const out = [];
const flagged = [];
let skipped = 0;

for (const r of rows) {
  const hub = CATEGORY_TO_HUB[r.partCategory?.name?.trim()];
  const brandFa = fixBrand(r.model?.brand?.name?.trim());
  const modelRaw = r.model?.name?.trim();
  if (!hub || !brandFa || !modelRaw) {
    skipped++;
    continue;
  }

  const problem = suspicious(brandFa, modelRaw);
  if (problem) {
    flagged.push({ brand: brandFa, model: modelRaw, part: r.partCategory?.name, problem });
    continue;
  }

  // Cheapest available tier → the "from" end; original → the "to" end.
  const tiers = [r.copy2Price, r.copy1Price, r.originalPrice]
    .filter((n) => typeof n === "number" && n > 0)
    .sort((a, b) => a - b);
  if (tiers.length === 0) {
    skipped++;
    continue;
  }

  const low = tiers[0];
  const high = tiers[tiers.length - 1];
  const from = low + labourFor(low);
  const to = high + labourFor(high);

  const alias = aliasFor(modelRaw);
  out.push({
    repairType: hub,
    // Show the factory code AND the marketing name so both are searchable.
    device: alias
      ? `${brandFa} ${alias} (${modelRaw.toUpperCase().replace(/_/g, "-")})`
      : cleanModel(modelRaw, brandFa),
    brand: brandFa,
    ...(alias ? { aka: `${brandFa} ${alias}` } : {}),
    from,
    ...(to > from ? { to } : {}),
    // Say what the range means so the page can be explicit about tiers.
    note:
      tiers.length > 1
        ? "از قطعه کپی تا اورجینال، شامل اجرت"
        : "شامل اجرت نصب",
  });
}

// Stable, readable ordering: brand, then device, then repair type.
out.sort(
  (a, b) =>
    a.repairType.localeCompare(b.repairType) ||
    a.brand.localeCompare(b.brand, "fa") ||
    a.device.localeCompare(b.device, "fa"),
);

// The feed spells some phones two ways ("13 normal" and "iphone 13"), which
// normalise to the same device. Merge those into one row spanning the widest
// real range rather than showing the customer two prices for one repair.
const merged = new Map();
for (const r of out) {
  const k = `${r.repairType}|${r.device}`;
  const prev = merged.get(k);
  if (!prev) {
    merged.set(k, r);
    continue;
  }
  prev.from = Math.min(prev.from, r.from);
  const prevTo = prev.to ?? prev.from;
  const rTo = r.to ?? r.from;
  const to = Math.max(prevTo, rTo);
  if (to > prev.from) prev.to = to;
}
const unique = [...merged.values()];

const payload = {
  updated: new Date().toISOString().slice(0, 10),
  source: "supplier feed",
  currency: "تومان",
  labour: { threshold: LABOUR_THRESHOLD, low: LABOUR_LOW, high: LABOUR_HIGH },
  rows: unique,
};

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));

const byHub = {};
for (const r of unique) byHub[r.repairType] = (byHub[r.repairType] || 0) + 1;
console.log(`wrote ${unique.length} price rows (skipped ${skipped}, merged ${out.length - unique.length})`);
for (const [k, v] of Object.entries(byHub)) console.log(`  ${k}: ${v}`);

if (flagged.length) {
  const REVIEW = path.join(ROOT, "content", "_price-data-review.json");
  fs.writeFileSync(REVIEW, JSON.stringify(flagged, null, 2));
  console.log(
    `\n${flagged.length} rows NOT published — brand/model mismatch in the supplier feed.` +
      `\nReview content/_price-data-review.json and fix them at the source:`,
  );
  for (const f of flagged.slice(0, 10)) {
    console.log(`  ${f.brand} / ${f.model} (${f.part}) — ${f.problem}`);
  }
  if (flagged.length > 10) console.log(`  … and ${flagged.length - 10} more`);
}
