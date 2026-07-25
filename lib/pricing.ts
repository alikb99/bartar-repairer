// Repair prices and customer reviews.
//
// PRICES are generated, not hand-written. `scripts/sync-parts-prices.mjs`
// pulls the shop's supplier parts feed and adds the fixed labour rate
// (+۵۰۰٬۰۰۰ تومان under ۲۰ میلیون, +۱٬۰۰۰٬۰۰۰ above), writing
// content/parts-prices.json. Re-run that script whenever supplier prices move;
// do not edit the JSON by hand or the next sync will overwrite it.
//
// REVIEWS are still intentionally EMPTY. Invented reviews violate Google's
// structured-data policy and can trigger a manual action against the whole
// domain, so no AggregateRating markup is emitted until real ones exist.
//
// HOW TO ADD REVIEWS
//   Only add reviews a real customer actually left (Google Business Profile,
//   an in-store form, a message you have on record). Never paraphrase into a
//   rating the customer did not give.
//     { author: "نام مشتری", rating: 5, body: "متن نظر", date: "2026-05-12" }
import partsPrices from "@/content/parts-prices.json";

export type PriceRange = {
  /** Slug from lib/repair-types.ts */
  repairType: string;
  /** Device or model the price applies to. */
  device: string;
  /** Brand, for grouping and filtering. */
  brand?: string;
  /** Marketing name when `device` shows a factory code — matching only. */
  aka?: string;
  /** Lower bound, تومان. */
  from: number;
  /** Upper bound, تومان. Omit when the price is fixed or "starting from". */
  to?: number;
  /** Optional note, e.g. "قطعه اورجینال". */
  note?: string;
};

export type CustomerReview = {
  author: string;
  /** 1–5, exactly what the customer gave. */
  rating: number;
  body: string;
  /** ISO date, e.g. "2026-05-12". */
  date: string;
  /** Where the review came from, e.g. "Google". */
  source?: string;
};

/** Repair prices: supplier parts cost + labour. See sync-parts-prices.mjs. */
export const PRICE_RANGES: PriceRange[] = partsPrices.rows as PriceRange[];

/** Date the prices were last synced, shown next to the table. */
export const PRICES_UPDATED = partsPrices.updated;

/** Real customer reviews. Empty = no review markup is emitted. */
export const CUSTOMER_REVIEWS: CustomerReview[] = [];

/** Prices attached to a repair-type hub. */
export function pricesFor(repairTypeSlug: string): PriceRange[] {
  return PRICE_RANGES.filter((p) => p.repairType === repairTypeSlug);
}

// ---- Prices on individual service pages ----
// A page like /iphone-battery-replacement/ should show ONLY the Apple battery
// rows, not all 98. Brand and repair type are both read from the page title,
// which is the most reliable signal in this dataset.

/** Page-title phrases → the brand string used in the price data. */
const BRAND_FROM_TITLE: [RegExp, string][] = [
  [/آیفون|ایفون|iphone|اپل|apple|آیپد|ipad/i, "اپل"],
  [/سامسونگ|samsung|گلکسی|galaxy/i, "سامسونگ"],
  [/شیائومی|xiaomi|ردمی|redmi|پوکو|poco/i, "شیائومی"],
  [/هواوی|هوآوی|huawei/i, "هواوی"],
  [/موتورولا|motorola/i, "موتورولا"],
  [/نوکیا|nokia/i, "نوکیا"],
  [/ناتینگ|nothing/i, "ناتینگ فون"],
  [/آنر|انر|honor/i, "آنر"],
];

/** Page-title phrases → repair-type slug. Order matters: most specific first. */
const REPAIR_FROM_TITLE: [RegExp, string][] = [
  [/درب پشت|قاب پشت|تعویض قاب|back ?(cover|door)/i, "back-cover-replacement"],
  [/باتری|battery/i, "battery-replacement"],
  [/ال ?سی ?دی|LCD|نمایشگر|تاچ|گلس|صفحه نمایش/i, "lcd-replacement"],
  [/سوکت شارژ|کانکتور شارژ|شارژر/i, "charging-port-repair"],
  [/اسپیکر|میکروفون|speaker/i, "speaker-microphone-repair"],
];

// The price data covers phones and tablets only. A page about a TV, laptop,
// fridge or washing machine must never show phone part prices.
const NOT_A_PHONE =
  /لپ ?تاپ|laptop|مک ?بوک|macbook|تلویزیون|تلوزیون|\btv\b|مانیتور|monitor|یخچال|لباسشویی|ظرفشویی|جاروبرقی|کولر|اسپیلت|ماکروویو|کنسول|پلی ?استیشن|ایکس ?باکس|console|ساعت هوشمند|smart ?watch|اپل واچ|apple ?watch|ایرپاد|airpod/i;

function brandOf(title: string): string | null {
  for (const [re, brand] of BRAND_FROM_TITLE) if (re.test(title)) return brand;
  return null;
}
function repairOf(title: string): string | null {
  for (const [re, slug] of REPAIR_FROM_TITLE) if (re.test(title)) return slug;
  return null;
}

// ---- Model matching ----
// A page about one model ("تعمیر گوشی S24 Ultra سامسونگ") should show that
// model's prices, not the brand's entire catalogue. Titles mix Persian and
// Latin spellings, so both sides are normalised to a comparable token string.
const FA_DIGITS: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};
const FA_WORDS: [RegExp, string][] = [
  [/پرو ?مکس/g, "pro max"],
  [/پرو/g, "pro"],
  [/مکس/g, "max"],
  [/پلاس/g, "plus"],
  [/اولترا|الترا/g, "ultra"],
  [/لایت/g, "lite"],
  [/مینی/g, "mini"],
  [/نوت/g, "note"],
  [/ردمی/g, "redmi"],
  [/پوکو/g, "poco"],
  [/گلکسی/g, "galaxy"],
  [/آیفون|ایفون/g, "iphone"],
  [/تب\b/g, "tab"],
];

function normalizeModel(s: string): string {
  let t = s.toLowerCase();
  t = t.replace(/[۰-۹]/g, (d) => FA_DIGITS[d] ?? d);
  for (const [re, to] of FA_WORDS) t = t.replace(re, to);
  // Drop brand words and generic repair vocabulary so only the model remains.
  t = t.replace(
    /سامسونگ|samsung|شیائومی|xiaomi|اپل|apple|هواوی|هوآوی|huawei|موتورولا|motorola|نوکیا|nokia|آنر|honor/g,
    " ",
  );
  t = t.replace(
    /تعمیر\S*|تعویض|قیمت|هزینه|گوشی|موبایل|تبلت|صفحه|نمایشگر|باتری|ال ?سی ?دی|lcd|تاچ|گلس|شیشه|درب پشت|قاب|دوربین|اسپیکر|میکروفون|برد|سوکت|شارژ|در تهران|تهران|با گارانتی|گارانتی|اورجینال|اصل|نمایندگی|مرکز|تخصصی/g,
    " ",
  );
  t = t.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  return t;
}

const tokens = (s: string) => normalizeModel(s).split(" ").filter(Boolean);

/**
 * Rows whose device the title clearly names. Returns [] when the title is not
 * model-specific, so the caller can fall back to a brand-wide list.
 */
function rowsForNamedModel(title: string, brand: string): PriceRange[] {
  const titleTokens = tokens(title);
  if (titleTokens.length === 0) return [];
  const titleSet = new Set(titleTokens);

  let best: { score: number; key: string } | null = null;
  const scored = new Map<string, number>();

  // Network suffixes are optional: a page titled "تعمیر گوشی A34 سامسونگ" is
  // about the same handset as the feed's "A34 5G".
  const OPTIONAL = new Set(["5g", "4g", "lte", "3g"]);

  for (const row of PRICE_RANGES) {
    if (row.brand !== brand) continue;
    // Try the marketing alias first ("سامسونگ A53") — page titles use that,
    // not the factory code the supplier feed ships.
    for (const candidate of [row.aka, row.device]) {
      if (!candidate) continue;
      const modelTokens = tokens(candidate);
      const required = modelTokens.filter((t) => !OPTIONAL.has(t));
      // Need at least one token carrying a digit, so a bare word cannot match.
      if (required.length === 0 || !required.some((t) => /\d/.test(t))) continue;
      // Every required token must appear in the title, so "A5" cannot match a
      // page about "A54".
      if (!required.every((t) => titleSet.has(t))) continue;
      // Present optional tokens make the match more specific.
      const bonus = modelTokens.filter(
        (t) => OPTIONAL.has(t) && titleSet.has(t),
      ).length;
      const score = required.join(" ").length + bonus;
      scored.set(row.device, score);
      if (!best || score > best.score) best = { score, key: row.device };
      break;
    }
  }
  if (!best) return [];

  // Keep only the most specific match: "13 pro max" wins over "13".
  return PRICE_RANGES.filter(
    (r) => r.brand === brand && r.device === best!.key,
  );
}

export type PagePrices = {
  rows: PriceRange[];
  /** Heading for the table on this page. */
  heading: string;
  /** True when rows span several repair types (brand hub pages). */
  grouped: boolean;
};

/**
 * Prices to show on a service page, or null when the page has no clear
 * brand+repair match. Two shapes:
 *   - brand + repair in the title  → that exact slice ("تعویض باتری آیفون")
 *   - brand only (a brand hub)     → every repair for that brand, grouped
 */
// Pages allowed to show a brand's ENTIRE price list. Anywhere else, a table
// that broad is noise: an antenna-repair page has no business listing every
// screen and battery price. Those pages only get a table when the title names
// a model or a specific repair.
const BRAND_HUB_PATHS = new Set([
  "/samsung/",
  "/samsung/mobile/",
  "/xiaomi/",
  "/xiaomi/mobile/",
  "/apple/",
  "/apple/mobile-2/",
  "/huawei/",
  "/huawei/mobile/",
  "/htc/",
  "/htc/mobile/",
  "/nokia/",
  "/motorola-mobile-repair-center/",
  "/nothingphone-repair/",
  "/services/category-mobile-phone-repair/",
]);

export function pricesForPage(title: string, path?: string): PagePrices | null {
  // Never put phone part prices on a TV, laptop or home-appliance page.
  if (NOT_A_PHONE.test(title)) return null;

  const brand = brandOf(title);
  if (!brand) return null;
  const repair = repairOf(title);

  // Most specific case: the title names one model. Show that model only.
  const modelRows = rowsForNamedModel(title, brand);
  if (modelRows.length > 0) {
    const device = modelRows[0].device;
    if (repair) {
      const rows = modelRows.filter((r) => r.repairType === repair);
      if (rows.length > 0) {
        const label = REPAIR_LABELS[repair] ?? "تعمیر";
        return { rows, heading: `هزینه ${label} ${device}`, grouped: false };
      }
    }
    return {
      rows: modelRows,
      heading: `هزینه تعمیرات ${device}`,
      grouped: true,
    };
  }

  // Brand + repair type, no specific model: the brand's list for that repair.
  if (repair) {
    const rows = PRICE_RANGES.filter(
      (p) => p.repairType === repair && p.brand === brand,
    );
    if (rows.length < 2) return null;
    const label = REPAIR_LABELS[repair] ?? "تعمیر";
    return { rows, heading: `هزینه ${label} ${brand} به تفکیک مدل`, grouped: false };
  }

  // Brand hub with no repair named: the brand's full price list.
  if (!path || !BRAND_HUB_PATHS.has(path)) return null;
  const rows = PRICE_RANGES.filter((p) => p.brand === brand);
  if (rows.length < 4) return null;
  return { rows, heading: `هزینه تعمیرات ${brand} به تفکیک مدل`, grouped: true };
}

export const REPAIR_LABELS: Record<string, string> = {
  "lcd-replacement": "تعویض ال سی دی",
  "battery-replacement": "تعویض باتری",
  "back-cover-replacement": "تعویض درب پشت",
  "charging-port-repair": "تعمیر سوکت شارژ",
  "speaker-microphone-repair": "تعمیر اسپیکر و میکروفون",
};

/** Rounded average and count, or null when there are no reviews. */
export function ratingSummary(): { value: number; count: number } | null {
  if (CUSTOMER_REVIEWS.length === 0) return null;
  const sum = CUSTOMER_REVIEWS.reduce((a, r) => a + r.rating, 0);
  return {
    value: Math.round((sum / CUSTOMER_REVIEWS.length) * 10) / 10,
    count: CUSTOMER_REVIEWS.length,
  };
}

/** Persian thousands formatting for تومان amounts. */
export function toman(n: number): string {
  return n.toLocaleString("fa-IR");
}
