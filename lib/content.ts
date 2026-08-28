// Server-only content layer built from the extracted WordPress database.
// Loaded via fs at build time (SSG) so the dataset never reaches the client
// bundle. Pages keep their EXACT hierarchical WordPress URLs and content.
import fs from "node:fs";
import path from "node:path";
import { HEADING_LABELS, HUB_LABELS } from "./recovered-hub-labels";
import { INJECTED_LINKS } from "./recovered-internal-links";
import { SITE } from "./data";
// Replays the SEO surface of the 2026-08-16 production build, whose source was
// never committed (see docs/00-CRITICAL-source-location.md in the deploy repo).
// Layered ON TOP of the hand tables below rather than merged into them, because
// a duplicate key in a single object literal is dropped silently, not flagged.
import {
  TITLE_OVERRIDES_RECOVERED,
  META_OVERRIDES_RECOVERED,
  H1_OVERRIDES_RECOVERED,
} from "./recovered-overrides";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const readJson = (f: string) =>
  JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, f), "utf8"));

// Replace every ZWNJ (half-space, U+200C) with a normal space across rendered
// database text per site convention. Applied at render time so posts.json stays
// the untouched source of truth.
//  - deZwnj: plain text (titles, meta, excerpt).
//  - deZwnjHtml: HTML bodies — only touches TEXT between tags, never attribute
//    values, so Persian image/file URLs that contain a ZWNJ are not corrupted.
// A ZWNJ often sits NEXT to a real space in the export ("می‌ دهد"), so the two
// together have to become ONE space — but only around the ZWNJ. A double space
// that was typed into the title stays: the deployed pages carry it in their
// JSON-LD, which is compared byte for byte. The plain-text files tidy the rest
// themselves (see tidy() in the llms routes), where nothing collapses it later.
const deZwnj = (s: string): string =>
  s ? s.replace(/[ 	]*‌[ 	]*/g, " ") : s;
const deZwnjHtml = (s: string): string =>
  s
    ? s
        .split(/(<[^>]*>)/)
        .map((part) =>
          part.startsWith("<")
            ? // inside a tag: clean human-readable attributes but NEVER URL
              // attributes (src/href/srcset), whose Persian filenames may use a
              // ZWNJ that must stay to match the file on disk.
              part.replace(
                /\b(alt|title|aria-label|placeholder)="([^"]*)"/gi,
                (_m, name, val) => `${name}="${deZwnj(val)}"`,
              )
            : deZwnj(part),
        )
        .join("")
    : s;

// Whether a local /wp-content/... asset actually exists on disk. Some original
// WordPress media was never migrated, so referencing it returns 404 and hurts
// crawl health. External URLs (http…) are left untouched (treated as present).
const uploadExistsCache = new Map<string, boolean>();
function uploadExists(src: string): boolean {
  if (!src) return false;
  const clean = src.split("?")[0].split("#")[0];
  // Hotlinked off-site images rot: the host renames or expires the file and the
  // article then ships a broken image. Two Yandex thumbnails already 404 and the
  // rest are decorative thumbs borrowed from other sites. Only our own domain is
  // trusted; anything else is dropped like a missing local upload.
  if (/^https?:\/\//i.test(clean)) {
    return clean.startsWith(`${SITE.domain}/`) || clean.startsWith("https://www.bartar-repairer.com/");
  }
  if (!clean.startsWith("/wp-content/")) return true; // non-upload local path
  const cached = uploadExistsCache.get(clean);
  if (cached !== undefined) return cached;
  let rel = clean;
  try {
    rel = decodeURIComponent(clean);
  } catch {
    /* keep raw */
  }
  const ok = fs.existsSync(path.join(PUBLIC_DIR, rel));
  uploadExistsCache.set(clean, ok);
  return ok;
}

const categoriesJson = readJson("categories.json");
const postsJson = readJson("posts.json");
const siteJson = readJson("site.json");

// Build-time image manifest produced by scripts/optimize-images.mjs:
//   { "/wp-content/uploads/…/foo.jpg": { w, h, webp:"…/foo.webp" }, … }
// Used to swap raster <img> sources to webp (LCP) and inject intrinsic
// width/height (CLS). Optional — if the file is absent we degrade gracefully.
type ImgMeta = { w?: number; h?: number; webp?: string };
let imageMeta: Record<string, ImgMeta> = {};
try {
  imageMeta = readJson("_image-meta.json") as Record<string, ImgMeta>;
} catch {
  imageMeta = {};
}
function lookupImg(src: string): ImgMeta | undefined {
  if (!src) return undefined;
  const clean = src.split("?")[0].split("#")[0];
  if (imageMeta[clean]) return imageMeta[clean];
  try {
    return imageMeta[decodeURIComponent(clean)];
  } catch {
    return undefined;
  }
}
// Prefer a webp sibling for a local raster source (keeps query/hash off).
function toWebp(src: string): string {
  const meta = lookupImg(src);
  return meta?.webp || src;
}

export type Category = {
  termId: number;
  name: string;
  slug: string;
  slugDecoded: string;
  parent: number;
  count: number;
  description: string;
};

type RawPost = {
  id: number;
  type: "post" | "page";
  slug: string;
  slugDecoded: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  modified: string;
  parent: number;
  categories: number[];
  image: string;
  seoTitle: string;
  seoDesc: string;
};

export type Post = RawPost & {
  /** Exact hierarchical URL path, e.g. "/xiaomi/mobile/" */
  path: string;
  /** Path segments for the [...slug] route */
  segments: string[];
  /** Unique, SEO-friendly <title> */
  metaTitle: string;
  /** Always-present meta description */
  metaDesc: string;
};

// ---- URL + content normalization ----
const ORIGINS = [
  "https://bartar-repairer.com",
  "http://bartar-repairer.com",
  "https://www.bartar-repairer.com",
  "http://www.bartar-repairer.com",
];
function localizeUrls(s: string): string {
  if (!s) return s;
  let out = s;
  for (const o of ORIGINS) out = out.split(o).join("");
  return out;
}
// Internal links found in the WordPress content that point at URLs which are
// not built (404). Keys are the host-stripped href exactly as it appears in the
// content; values are the correct existing page. Fixing these here keeps
// posts.json untouched while consolidating link equity onto the real pages.
const LINK_FIXES: [string, string][] = [
  ["/acer/lap-top/", "/lap-top-acer/"],
  // /acer/ is NOT in this list: it is a real page, shipped pre-rendered from
  // public/acer/ (see docs/frozen-pages.md), and the body links that point at
  // it are correct as written.
  ["/acer-tablet-board-repair/", "/acer-tablet-boardrepair/"],
  ["/repair-honor-9x/", "/repair-honor9x/"],
  [
    "/services/category-mobile-phone-repair/oppo-repair/oppo-reno-10-phone-repair/",
    "/services/category-mobile-phone-repair/oppo-repair/oppo-reno-10-phonerepair/",
  ],
  ["/xiaomi-mobile-lcd-replacement/", "/xiaomi-mobile-lcdreplacement/"],
  ["/xiaomi/mobile/repair-xiaomi-battery/", "/repair-xiaomi-battery/"],
  ["/xiaomi/mobile/xiaomi-phone-lcd-repair/", "/xiaomi-phone-lcd-repair/"],
  ["/iphone-xs-repair/", "/iphone-xs-repairs/"],
  [
    "/samsung-mobile-phone-repairs-in-sattarkhan/",
    "/samsung-mobile-phone-repairs-in-sattarkhan-2/",
  ],
  [
    "/%D8%AA%D8%B9%D9%85%DB%8C%D8%B1-%D8%A2%D8%A8%D8%AE%D9%88%D8%B1%D8%AF%DA%AF%DB%8C-%D9%84%D9%BE%D8%AA%D8%A7%D9%BE-%D8%A7%D9%BE%D9%84/",
    "/apple/macbook/",
  ],
];

function cleanContent(html: string): string {
  if (!html) return html;
  let out = localizeUrls(html);
  // Drop decorative inline SVG icons and scripts/styles that render broken
  // without their original theme CSS (the giant black arrows).
  out = out.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "");
  out = out.replace(/<i\b[^>]*>\s*<\/i>/gi, ""); // empty icon <i> tags
  // Remove inline style attributes so the content inherits our design.
  out = out.replace(/\s+style="[^"]*"/gi, "");
  // Avoid a duplicate <h1> (the hero already renders the title).
  out = out.replace(/<h1\b[^>]*>/gi, "<h2>").replace(/<\/h1>/gi, "</h2>");
  // Remove the leftover "درباره ما / همین الان تماس بگیرید / تماس با ما" widget.
  out = out.replace(
    /<a[^>]*href="\/about\/"[^>]*>\s*درباره ما\s*<\/a>\s*همین الان با ما تماس بگیرید[\s\S]*?<a[^>]*href="\/contact\/"[^>]*>\s*تماس با ما\s*<\/a>/gi,
    "",
  );
  // Drop links to category / tag / author archives entirely (keep inner text);
  // those archive URLs are not built and would 404.
  out = out.replace(
    /<a\b[^>]*href="[^"]*\/(?:category|tag|author)\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
    "$1",
  );
  // Repair stale / mistyped internal links that point at URLs which were never
  // built (they 404). Each maps to the correct existing page.
  for (const [from, to] of LINK_FIXES) {
    out = out.split(`href="${from}"`).join(`href="${to}"`);
  }
  // The "/app/" links (a non-existent app page) are unwrapped to plain text.
  out = out.replace(
    /<a\b[^>]*href="\/app\/"[^>]*>([\s\S]*?)<\/a>/gi,
    "$1",
  );
  // Remove srcset/sizes (resized variants weren't downloaded) and lazy-load.
  out = out.replace(/\s+srcset="[^"]*"/gi, "");
  out = out.replace(/\s+sizes="[^"]*"/gi, "");
  // Strip <img> tags whose local upload file is missing (would 404), then clean
  // up any now-empty wrappers (linked images / figures) they leave behind.
  // Surviving tags are upgraded to webp and given intrinsic width/height (CLS).
  out = out.replace(/<img\b[^>]*>/gi, (tag) => {
    const m = tag.match(/\bsrc="([^"]*)"/i);
    if (!m || !uploadExists(m[1])) return "";
    let t = tag;
    const src = m[1];
    const meta = lookupImg(src);
    const webp = meta?.webp;
    if (webp && webp !== src) t = t.replace(src, webp);
    // inject width/height only when both are absent (avoid double attrs)
    if (meta?.w && meta?.h && !/\bwidth=/i.test(t) && !/\bheight=/i.test(t)) {
      t = t.replace(/<img\b/i, `<img width="${meta.w}" height="${meta.h}"`);
    }
    return t;
  });
  out = out.replace(/<a\b[^>]*>\s*<\/a>/gi, "");
  // The WordPress export lost the href on 108 anchors across 49 pages — 45
  // bare <a> wrapping a branch address ("خیابان گلبرگ غربی…", "میدان کاج…"),
  // 59 <a tabindex="0"> left over from the old theme, and one anchor pasted in
  // without its URL, plus three with an empty href. An <a> with no usable
  // href is not a link: clicking it does
  // nothing, screen readers still announce it as a link, and a crawler sees a
  // dangling anchor. Turn each one into a plain <span> — the attributes go too,
  // since tabindex="0" on something that cannot be activated is worse than no
  // tabindex at all. A <span> rather than nothing on purpose: three of these
  // anchors sit against a &nbsp;, so removing the tag outright shifts one space
  // at the tag boundary in every text extraction of the page (the browser
  // renders it the same either way). Keeping a neutral wrapper changes the
  // markup and nothing else, which is what was wrong here.
  // href="" counts as no href: three iPhone pages carry
  // <a href="" target="_blank">برتر سرویس</a>, which resolves to the current
  // URL and reopens the page in a new tab.
  out = out.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (full, attrs: string, inner: string) => {
    const m = attrs.match(/\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = (m?.[1] ?? m?.[2] ?? m?.[3] ?? "").trim();
    return href ? full : `<span>${inner}</span>`;
  });
  // HEADINGS WITH NO TEXT. Two shapes, both from the WordPress editor:
  //   <h2></h2>            the heading's text was deleted, the block stayed
  //   <h2><img …></h2>     a picture was dropped into a heading block
  // Neither is a heading. Both render as a gap or a stray image, a screen
  // reader announces "heading, level 2" with no name, and — because the
  // article table of contents is built from the <h2>s — both put a blank
  // numbered row into the contents list. The image is content, so it is kept
  // and only its heading wrapper goes; a heading with nothing in it at all is
  // removed outright.
  out = out.replace(
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
    (full, _level: string, inner: string) => {
      if (inner.replace(/<[^>]+>/g, "").replace(/[\s\u200c]|&nbsp;/g, "")) return full;
      return /<img\b/i.test(inner) ? inner : "";
    },
  );
  // Outbound links opened from body content get rel="noopener". The pages come
  // from a WordPress export where the editor set target="_blank" by hand and
  // rel by accident; without it the opened tab can reach back through
  // window.opener. Manufacturer links stay followed — they are cited as
  // sources, and nofollowing asus.com or hp.com would be dishonest.
  out = out.replace(/<a\b([^>]*href="https?:\/\/[^"]*"[^>]*)>/gi, (full, attrs: string) => {
    if (/bartar-repairer\.com/i.test(attrs) || /\srel\s*=/i.test(attrs)) return full;
    return `<a${attrs} rel="noopener">`;
  });
  out = out.replace(/<figure\b[^>]*>\s*(?:<figcaption[^>]*>\s*<\/figcaption>)?\s*<\/figure>/gi, "");
  out = out.replace(/<img /gi, '<img loading="lazy" decoding="async" ');
  // Wrap tables so they scroll inside their box instead of overflowing the page.
  out = out
    .replace(/<table/gi, '<div class="table-wrap"><table')
    .replace(/<\/table>/gi, "</table></div>");
  return out;
}

const escAttr = (s: string) => s.replace(/"/g, "&quot;").trim();

// Brand logo filenames used in the "برندهای قابل تعمیر" grids. These carry no
// Persian text in the filename, so they need an explicit label.
const LOGO_ALT: [RegExp, string][] = [
  [/^samsung\b/i, "تعمیر گوشی سامسونگ"],
  [/^apple\b/i, "تعمیر گوشی آیفون"],
  [/^xiaomi\b/i, "تعمیر گوشی شیائومی"],
  [/^huawei\b/i, "تعمیر گوشی هواوی"],
  [/^realme\b/i, "تعمیر گوشی ریلمی"],
  [/^oppo\b/i, "تعمیر گوشی اوپو"],
  [/^oneplus\b/i, "تعمیر گوشی وان پلاس"],
  [/^vivo\b/i, "تعمیر گوشی ویوو"],
  [/^nokia\b/i, "تعمیر گوشی نوکیا"],
  [/^motorola\b/i, "تعمیر گوشی موتورولا"],
  [/^sony\b/i, "تعمیر گوشی سونی"],
  [/^htc\b/i, "تعمیر گوشی اچ تی سی"],
  [/^asus\b/i, "تعمیر گوشی ایسوس"],
  [/^lenovo\b/i, "تعمیر لپ تاپ لنوو"],
  [/^(hp|acer|dell|msi)\b/i, "تعمیر لپ تاپ"],
  [/^nothing/i, "تعمیر گوشی ناتینگ فون"],
];

// Filenames that describe nothing (985.jpg, 4445.jpg, Picture3-2.png …).
const MEANINGLESS = /^(picture|placeholder|img|image|dsc|screenshot)?[\d\-_.]*$/i;

/**
 * Best alt text for an image, in order of how much it actually tells a reader:
 *   1. a Persian filename ("تعویض-گلس-فنی.webp" → "تعویض گلس فنی")
 *   2. a known brand logo
 *   3. the page title, as a last resort
 * Never invents detail the filename does not carry.
 */
function altFromSrc(src: string, title: string): string {
  let base = "";
  try {
    base = decodeURIComponent(src.split("/").pop() || "");
  } catch {
    base = src.split("/").pop() || "";
  }
  base = base.replace(/\.[a-z0-9]+$/i, "").replace(/-\d+x\d+$/, "");

  for (const [re, label] of LOGO_ALT) if (re.test(base)) return label;

  // Persian filenames are descriptive — turn the slug back into a phrase.
  if (/[؀-ۿ]/.test(base)) {
    const phrase = base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    if (phrase.length > 2) return phrase;
  }

  if (MEANINGLESS.test(base)) return title;

  // Latin but descriptive (samsung-s8-repair, tamirat-loptop …).
  const words = base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return words.length > 3 && /[a-z]{3}/i.test(words) ? `${title} — ${words}` : title;
}

// Fill alt on images that have none AND on images carrying an empty alt="".
// The WordPress export left 552 images with alt="" — an empty attribute reads
// as "decorative" to screen readers, which these content images are not.
function addAltText(html: string, title: string): string {
  return html.replace(/<img\b([^>]*)>/gi, (full, attrs: string) => {
    const hasReal = /\balt="[^"]+"/i.test(attrs);
    if (hasReal) return full;
    const src = (attrs.match(/\bsrc="([^"]*)"/i) || [])[1] || "";
    const alt = escAttr(altFromSrc(src, title));
    const cleaned = attrs.replace(/\s*\balt="[^"]*"/gi, "");
    return `<img${cleaned} alt="${alt}">`;
  });
}
function firstParagraph(html: string): string {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function clampDesc(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= 160) return t;
  const cut = t.slice(0, 160);
  const i = cut.lastIndexOf(" ");
  return (i > 120 ? cut.slice(0, i) : cut).trim() + "…";
}
// Resolve Yoast SEO template variables (%%title%%, %%sep%%, %%sitename%% …)
// that are stored raw in the database.
function resolveTitle(seo: string, title: string): string {
  if (!seo || !seo.includes("%%")) return (seo || title).trim();
  let t = seo
    .replace(/%%title%%/gi, title)
    .replace(/%%sitename%%/gi, "")
    .replace(/%%sitedesc%%/gi, "")
    .replace(/%%sep%%/gi, "|")
    .replace(/%%page%%/gi, "")
    .replace(/%%currentyear%%/gi, String(new Date().getFullYear()))
    .replace(/%%[a-z0-9_().]+%%/gi, ""); // any other Yoast variable
  t = t
    .replace(/\s+/g, " ")
    .replace(/(\s*\|\s*)+/g, " | ") // collapse repeated separators
    .replace(/^[\s|–—-]+|[\s|–—-]+$/g, "") // trim stray separators
    .trim();
  return t || title;
}

// ---- Meta TITLE refinement (every page WITHOUT a hand override) ----
// The WordPress/Yoast export left long, repetitive tails on most titles
// ("… | نمایندگی تعمیرات فوق تخصصی huawei", "… - برتر سرویس"). Google truncates
// past ~60 chars, so those tails only burn the SERP snippet. refineTitle trims
// generic tails, keeps trust/CTR tails (گارانتی/قیمت/رایگان), and reframes a
// retail-sounding "نمایندگی X" as the owner's preferred "نمایندگی تعمیرات X".
// Only the <title>/OG string is touched — the visible H1 uses post.title and
// stays byte-identical to the database (same policy as TITLE_OVERRIDES).
const TITLE_MAXLEN = 65;
// Generic trailing segments that add no click value.
const TITLE_FILLER =
  /^(?:نمایندگی\s+)?(?:تعمیرات\s+)?(?:فوق\s*تخصصی|حرفه\s*ای)|^نمایندگی تعمیرات$|^مرکز تعمیرات|^مرکز تخصصی تعمیرات|^تعمیرات (?:نرم افزاری|سخت افزاری|نرم افزرای)|^انواع تعمیرات|^خدمات پس از فروش و|^با گارانتی$|^برتر سرویس$|^سرویس$/;
// A trailing segment that is essentially a bare latin brand token.
const TITLE_LATIN_TAIL =
  /^(?:تعمیر(?:ات)?\s+)?(?:نرم افزاری|سخت افزاری|و|های|گوشی|لپ تاپ|محصولات|برند|موبایل|تبلت)?[\s\S]{0,40}?\b(huawei|samsung|acer|hp|lenovo|sony|asus|htc|dell|xiaomi|apple|msi|nokia|vaio)\b[\s\S]{0,12}$/i;
// Words that make a trailing segment worth keeping (trust / CTR signals).
const TITLE_VALUE =
  /گارانتی|ضمانت|قیمت|هزینه|همان روز|پیک|اصل|اورجینال|رایگان|روزه|شفاف|فوری/;

function refineTitle(t: string): string {
  const parts = t.split("|").map((x) => x.trim()).filter(Boolean);
  // Drop generic filler / bare-latin-brand tails (never the first segment).
  while (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (TITLE_FILLER.test(last) || TITLE_LATIN_TAIL.test(last)) {
      parts.pop();
      continue;
    }
    break;
  }
  // Value-aware length trim: drop the last NON-value segment first so a
  // گارانتی/قیمت/رایگان tail survives; fall back to the last segment otherwise.
  while (parts.length > 1 && [...parts.join(" | ")].length > TITLE_MAXLEN) {
    let idx = -1;
    for (let i = parts.length - 1; i >= 1; i--) {
      if (!TITLE_VALUE.test(parts[i])) {
        idx = i;
        break;
      }
    }
    parts.splice(idx === -1 ? parts.length - 1 : idx, 1);
  }
  let s = parts.join(" | ");
  // Reframe retail "نمایندگی X" (no تعمیر anywhere) → "نمایندگی تعمیرات X".
  // Runs last so trimming a تعمیرات tail cannot leave a bare retail title.
  if (/نمایندگی/.test(s) && !/تعمیر/.test(s)) {
    s = s.replace(/نمایندگی/g, "نمایندگی تعمیرات");
  }
  return s.trim();
}

// ---- build posts with hierarchical paths ----
// Hand-authored SEO articles (added on top of the WordPress export) live in a
// separate file so the original database stays untouched.
let extraPosts: RawPost[] = [];
try {
  extraPosts = readJson("extra-posts.json") as RawPost[];
} catch {
  extraPosts = [];
}
const raw = [...(postsJson as RawPost[]), ...extraPosts];
const rawById = new Map(raw.map((p) => [p.id, p]));

function decodeSeg(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
// The one sanctioned way to change a published URL. Used only where the slug
// contradicted the page's own content — /a57-lcd-replacement/ was entirely
// about the A56 — since a wrong model in the URL costs more than the redirect.
// Every entry needs a matching `RedirectMatch 301` in .htaccess.
const PATH_RENAMES: Record<string, string> = {
  "/a57-lcd-replacement/": "/a56-lcd-replacement/",
};

// Segments are DECODED (Persian) so the exported folders/URLs read as
// "/مشکل-گالری-گوشی-سامسونگ/" instead of percent-encoded gibberish.
function buildSegments(p: RawPost): string[] {
  const segs: string[] = [];
  const seen = new Set<number>();
  let cur: RawPost | undefined = p;
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    segs.unshift(decodeSeg(cur.slug));
    cur = cur.parent ? rawById.get(cur.parent) : undefined;
  }
  return segs;
}

// ---- Contextual internal linking (build-time) ----
// Links the first mention of a brand/service phrase inside ARTICLE bodies to
// the matching hub page. This funnels internal authority + relevant anchors to
// the commercial pages (e.g. /samsung/) without altering any visible text —
// only <a> wrappers are added. Phrases are ordered most-specific first.
const INTERNAL_LINKS: [string, string][] = [
  // Samsung
  ["نمایندگی تعمیرات سامسونگ", "/samsung/"],
  ["تعمیر گوشی سامسونگ", "/samsung/mobile/"],
  ["تعمیر تبلت سامسونگ", "/samsung/tablet/"],
  ["تعمیر ساعت هوشمند سامسونگ", "/samsung/smart-watch/"],
  ["تعمیر تلویزیون سامسونگ", "/samsung/tv/"],
  ["تعمیر لپ تاپ سامسونگ", "/samsung/lap-top/"],
  ["تعمیرات سامسونگ", "/samsung/"],
  ["نمایندگی سامسونگ", "/samsung/"],
  ["تعمیر سامسونگ", "/samsung/"],
  // Xiaomi
  ["تعمیر گوشی شیائومی", "/xiaomi/mobile/"],
  ["تعمیر تبلت شیائومی", "/xiaomi/tablet/"],
  ["تعمیر ساعت هوشمند شیائومی", "/xiaomi/smart-watch/"],
  ["تعمیر تلویزیون شیائومی", "/xiaomi/tv/"],
  ["تعمیر لپ تاپ شیائومی", "/xiaomi/lap-top/"],
  ["نمایندگی تعمیرات شیائومی", "/xiaomi/"],
  ["تعمیرات شیائومی", "/xiaomi/"],
  ["نمایندگی شیائومی", "/xiaomi/"],
  ["تعمیر شیائومی", "/xiaomi/"],
  // Apple
  ["تعمیر گوشی آیفون", "/apple/mobile-2/"],
  ["تعمیر آیفون", "/apple/mobile-2/"],
  ["تعمیر آیپد", "/apple/ipad/"],
  ["تعمیر اپل واچ", "/apple/apple-watch/"],
  ["تعمیر لپ تاپ اپل", "/apple/macbook/"],
  ["تعمیر مک بوک", "/apple/macbook/"],
  ["تعمیر مک بوک", "/apple/macbook/"],
  ["نمایندگی تعمیرات اپل", "/apple/"],
  ["تعمیرات اپل", "/apple/"],
  ["نمایندگی اپل", "/apple/"],
  ["تعمیر اپل", "/apple/"],
  // Huawei (هواوی / هوآوی spelling variants)
  ["تعمیر گوشی هواوی", "/huawei/mobile/"],
  ["تعمیر گوشی هوآوی", "/huawei/mobile/"],
  ["تعمیر تبلت هواوی", "/huawei/tablet/"],
  ["تعمیر تبلت هوآوی", "/huawei/tablet/"],
  ["تعمیر ساعت هوشمند هواوی", "/huawei/smart-watch/"],
  ["تعمیر ساعت هوشمند هوآوی", "/huawei/smart-watch/"],
  ["نمایندگی تعمیرات هواوی", "/huawei/"],
  ["نمایندگی هواوی", "/huawei/"],
  ["نمایندگی هوآوی", "/huawei/"],
  ["تعمیرات هواوی", "/huawei/"],
  ["تعمیرات هوآوی", "/huawei/"],
  ["تعمیر هواوی", "/huawei/"],
  ["تعمیر هوآوی", "/huawei/"],
  // HP
  ["تعمیر لپ تاپ اچ پی", "/hp/lap-top/"],
  ["نمایندگی تعمیرات اچ پی", "/hp/"],
  ["نمایندگی اچ پی", "/hp/"],
  ["تعمیرات اچ پی", "/hp/"],
  ["تعمیر اچ پی", "/hp/"],
  // Asus
  ["تعمیر لپ تاپ ایسوس", "/asus/lap-top-2/"],
  ["تعمیر گوشی ایسوس", "/asus/mobile/"],
  ["تعمیر تبلت ایسوس", "/asus/tablet-2/"],
  ["نمایندگی تعمیرات ایسوس", "/asus/"],
  ["نمایندگی ایسوس", "/asus/"],
  ["تعمیرات ایسوس", "/asus/"],
  ["تعمیر ایسوس", "/asus/"],
  // Acer: /acer/ is the brand landing page, /lap-top-acer/ the laptop hub
  // that carries the model list and prices — which is what these phrases mean.
  ["نمایندگی تعمیرات ایسر", "/lap-top-acer/"],
  ["تعمیر لپ تاپ ایسر", "/lap-top-acer/"],
  ["نمایندگی ایسر", "/lap-top-acer/"],
  ["تعمیرات ایسر", "/lap-top-acer/"],
  ["تعمیر ایسر", "/lap-top-acer/"],
  // Sony
  ["تعمیر لپ تاپ سونی", "/sony/lap-top/"],
  ["تعمیر تلویزیون سونی", "/sony/tv/"],
  ["نمایندگی تعمیرات سونی", "/sony/"],
  ["نمایندگی سونی", "/sony/"],
  ["تعمیرات سونی", "/sony/"],
  // Lenovo
  ["تعمیر لپ تاپ لنوو", "/lenovo/lap-top/"],
  ["تعمیر تبلت لنوو", "/lenovo/tablet/"],
  ["نمایندگی تعمیرات لنوو", "/lenovo/"],
  ["نمایندگی لنوو", "/lenovo/"],
  ["تعمیرات لنوو", "/lenovo/"],
  // Dell
  ["تعمیر لپ تاپ دل", "/dell/lap-top/"],
  ["نمایندگی تعمیرات دل", "/dell/"],
  ["نمایندگی دل", "/dell/"],
  ["تعمیرات دل", "/dell/"],
  // Nokia
  ["تعمیر گوشی نوکیا", "/nokia/"],
  ["نمایندگی تعمیرات نوکیا", "/nokia/"],
  ["نمایندگی نوکیا", "/nokia/"],
  ["تعمیرات نوکیا", "/nokia/"],
  // HTC
  ["تعمیر گوشی اچ تی سی", "/htc/mobile/"],
  ["تعمیر تبلت اچ تی سی", "/htc/tablet-repair/"],
  ["تعمیر ساعت هوشمند اچ تی سی", "/htc/smart-watch/"],
  ["نمایندگی تعمیرات اچ تی سی", "/htc/"],
  ["نمایندگی اچ تی سی", "/htc/"],
  ["تعمیرات اچ تی سی", "/htc/"],
  // Motorola
  ["نمایندگی موتورولا", "/motorola-mobile-repair-center/"],
  ["تعمیر گوشی موتورولا", "/motorola-mobile-repair-center/"],
  ["تعمیر موتورولا", "/motorola-mobile-repair-center/"],
  // Nothing Phone
  ["تعمیر گوشی ناتینگ فون", "/nothingphone-repair/"],
  ["تعمیر ناتینگ فون", "/nothingphone-repair/"],
  ["ناتینگ فون", "/nothingphone-repair/"],
  // Google Pixel
  ["تعمیر گوشی گوگل پیکسل", "/google-pixel-mobile-phone-repair/"],
  ["تعمیر گوشی پیکسل", "/google-pixel-mobile-phone-repair/"],
  ["گوگل پیکسل", "/google-pixel-mobile-phone-repair/"],
  // Broad device hubs
  ["تعمیر ساعت هوشمند", "/smart-watch-repair/"],
  ["تعمیر تبلت", "/services/category-mobile-phone-repair/"],
  ["تعمیر تلویزیون", "/home-appliances/tv-repair-in-tehran/"],
];

// ---- Duplicate-title consolidation ----
// The WordPress export contains pages with byte-identical titles competing for
// the same query ("تعمیر کیبورد لپ تاپ ایسوس" exists twice). Google splits the
// signals and ranks neither well. Each entry below points a weaker duplicate at
// the version that keeps the ranking; the URL itself stays live and reachable
// (a rel=canonical, not a redirect), so no existing link ever breaks.
//
// The keeper was chosen by inbound internal links first, then content depth.
// Groups whose titles differ in SEARCH INTENT are deliberately absent — e.g.
// "هزینه آموزش تعمیرات موبایل" is a different query from "آموزش تخصصی تعمیر
// موبایل", and consolidating them would throw away a ranking page.
export const CANONICAL_TO: Record<string, string> = {
  // تعویض باتری لپ تاپ ایسوس — same pairing as the keyboard/fan duplicates
  // below; recovered from the live build, where it already canonicalises.
  "/asus-laptop-batteryreplacement/": "/asus-laptop-battery/",
  // تعمیر کیبورد لپ تاپ ایسوس
  "/asus-laptop-keyboardrepair/": "/asus-laptop-keyboard/",
  // تعمیر فن لپ تاپ ایسوس
  "/asus-laptop-fan-repair/": "/asus-laptop-fan/",
  // تعویض باتری مک بوک
  "/macbook-batteryreplacement/": "/macbook-battery-replacements/",
  // تعویض ال سی دی مک بوک
  "/macbook-lcdreplacement/": "/macbook-lcd-replacements1/",
  // تعویض باتری گوشی هواوی — keep the English slug: 58% more content and it
  // matches its siblings (/huawei-phone-lcd-replacement/ …).
  "/تعویض-باتری-موبایل-هوآوی/": "/huawei-phone-battery-replacement/",
  // تعمیر ال سی دی لپ تاپ ایسوس — same Persian/English duplicate pattern;
  // the English slug is the one that ranks.
  "/تعمیر-ال-سی-دی-لپتاپ-ایسوس/": "/asus-laptop-lcd/",
  // تعویض باتری گوشی شیائومی
  "/xiaomi-phone-batteryreplacement/": "/repair-xiaomi-battery/",
  // تعویض ال سی دی لپ تاپ ایسر (three copies)
  "/acer-laptop-lcd-replacement2/": "/acer-laptop-lcdreplacement/",
  "/aser-laptop-lcd-replacement/": "/acer-laptop-lcdreplacement/",
  // تعویض ال سی دی لپ تاپ اچ پی
  "/replacement-of-hp-laptoplcd/": "/replacement-of-hp-laptop-lcd2/",
  // تعویض ال سی دی لپ تاپ سامسونگ
  "/samsung-laptop-lcdreplacement/": "/samsung-laptop-lcd-replacement2/",
  // تعویض باتری تبلت لنوو
  "/replace-the-battery-of-the-lenovo-tablet/":
    "/lenovo-tablet-batteryreplacement/",
  // تعمیر لپ تاپ ایسر در شمال تهران
  "/acer-laptop-repair-in-the-north-of-tehran/":
    "/acer-laptop-repair-agency-in-the-north-oftehran/",
  // لپ تاپ گیمینگ ایسوس
  "/asus-gaminglaptop/": "/asus-gaming-laptop-repair/",
  // تعمیر لپ تاپ شیائومی — the hub carries 916 inbound links.
  "/xiaomi-laptop-repair-intehran/": "/xiaomi/lap-top/",
  // ویژگی های بهترین مرکز تعمیرات اپل در تهران
  "/2the-best-apple-repair-center/": "/best-apple-repair-center-in-tehran/",
};

// ---- CTR-focused meta TITLE overrides ----
// Hand-written titles for the commercial (money) pages. Keyword stays first,
// followed by a concrete USP so the SERP snippet earns the click. Only the
// <title> meta is replaced — page URLs, H1s and body content stay untouched.
// ---- Titles rewritten AFTER the 2026-08-16 deploy ----
// TITLE_OVERRIDES_RECOVERED is a record of what the deployed site says, read
// back out of its HTML, so it must not be edited to change a title — that
// would destroy the only copy of the deployed value. Deliberate rewrites go
// here instead and win over it. Each of these three was a two-or-three-word
// title that spent a whole SERP line saying nothing: "خدمات" (18 characters),
// "قطعات اپل" (22), "درباره ی ما" (24).
const TITLE_REWRITES: Record<string, string> = {
  "/about/": "درباره برتر سرویس | ۱۵ سال تعمیر تخصصی موبایل و لپ تاپ در تهران",
  "/services/": "خدمات تعمیرات برتر سرویس | موبایل، لپ تاپ، تبلت و لوازم خانگی",
  "/apple-mobile-part/": "قطعات اصل موبایل اپل | تشخیص قطعه اورجینال و گارانتی تعویض",
};

const TITLE_OVERRIDES: Record<string, string> = {
  // Keyed by the post-rename URL (see PATH_RENAMES) so it is not silently
  // orphaned: the recovered tables never saw this path because the July build
  // still published it as /a57-lcd-replacement/.
  "/a56-lcd-replacement/": "تعویض ال سی دی A56 سامسونگ | برتر سرویس",
  "/services/category-mobile-phone-repair/":
    "تعمیر موبایل در تهران | تعمیر همان روز با قطعات اصل و ۶ ماه گارانتی",
  "/services/laptop-repair/":
    "تعمیر لپ تاپ در تهران | عیب یابی رایگان، قطعات اصل و ۶ ماه گارانتی",
  "/samsung/mobile/":
    "تعمیر گوشی سامسونگ در تهران | تعویض ال سی دی و باتری همان روز + گارانتی",
  "/xiaomi/mobile/":
    "تعمیر گوشی شیائومی در تهران | تعمیر همان روز با قطعات اصل و گارانتی",
  "/apple/mobile-2/":
    "تعمیر گوشی آیفون در تهران | قطعات اصل، پیک رایگان و ۶ ماه گارانتی",
  "/huawei/mobile/":
    "تعمیر گوشی هواوی در تهران | عیب یابی رایگان و ۶ ماه گارانتی تعمیر",
  "/asus/mobile/":
    "تعمیر گوشی ایسوس در تهران | تعمیر تخصصی با قطعات اصل و گارانتی معتبر",
  "/htc/mobile/":
    "تعمیر گوشی اچ تی سی در تهران | قطعات اورجینال و ۶ ماه گارانتی کتبی",
  "/samsung/":
    "نمایندگی تعمیرات سامسونگ در تهران | قیمت ۷۹ مدل و ۶ ماه گارانتی",
  // Was the single word "تماس" (4 chars) — a wasted SERP slot for a business
  // with two walk-in branches.
  "/contact/":
    "آدرس و شماره تعمیرات برتر | شعبه مطهری و سعادت آباد تهران",
  // Emoji stripped (CLAUDE.md forbids them and Google usually drops them).
  "/nothingphone-repair/":
    "نمایندگی ناتینگ فون در تهران | تعمیر گوشی با قطعه اصل و گارانتی",
  // Removed the duplicated "نمایندگی". This page ranks 3rd at 20.59% CTR, so
  // only the repetition is touched — the structure stays as-is.
  "/motorola-mobile-repair-center/":
    "نمایندگی تعمیرات گوشی موتورولا در تهران | قطعه موجود و ۶ ماه گارانتی",
  // "کولر گازی" (با فاصله) ۱۷۱ ایمپرشن دارد و "کولرگازی" سرهم عملاً هیچ.
  "/home-appliances/hisense-air-conditioner-repair/":
    "تعمیر کولر گازی هایسنس در تهران | نشت یابی، شارژ گاز و تعمیر برد",
  "/apple/":
    "نمایندگی تعمیرات اپل در تهران | پیک رایگان دستگاه و گارانتی ۶ ماهه",
  "/xiaomi/":
    "نمایندگی تعمیرات شیائومی در تهران | قطعات اصل و ۶ ماه گارانتی کتبی",
  "/huawei/":
    "نمایندگی تعمیرات هواوی در تهران | عیب یابی رایگان و گارانتی معتبر",
  "/iphone-battery-replacement/":
    "تعویض باتری آیفون با باتری اصلی | نصب همان روز و گارانتی ۶ ماهه",
  "/replacing-the-iphone-lcd/":
    "تعویض ال سی دی آیفون با قطعه اصل | اعلام قیمت قبل از تعمیر + گارانتی",
  "/samsung-phone-lcd-replacement/":
    "تعویض ال سی دی گوشی سامسونگ | قیمت شفاف، نصب همان روز و ۶ ماه گارانتی",
  "/samsung-mobile-phone-battery-replacement/":
    "تعویض باتری گوشی سامسونگ با قطعه اصل | همان روز و با گارانتی کتبی",
  "/smart-watch-repair/":
    "تعمیر ساعت هوشمند در تهران | همه برندها با پیک رایگان و گارانتی",
  "/asus/lap-top-2/":
    "تعمیر لپ تاپ ایسوس در تهران | عیب یابی رایگان و ۶ ماه گارانتی کتبی",
  "/lenovo/lap-top/":
    "تعمیر لپ تاپ لنوو در تهران | تعمیر مادربرد و تعویض قطعات با گارانتی",
  "/hp/lap-top/":
    "تعمیر لپ تاپ اچ پی در تهران | قطعات اصل، هزینه شفاف و ۶ ماه گارانتی",
  "/dell/lap-top/":
    "تعمیر لپ تاپ دل در تهران | عیب یابی رایگان و تعمیر تخصصی با گارانتی",
  "/lap-top-acer/":
    "تعمیر لپ تاپ ایسر در تهران | تعمیر مادربرد و ال سی دی با ۶ ماه گارانتی",
  "/online-repair-request/":
    "ثبت آنلاین درخواست تعمیر | اعلام هزینه پیش از تعمیر، بدون هیچ هزینه ثبت",
  // Titles that ran past ~75 characters and were cut off mid-word in the SERP.
  // Shortened with the primary keyword kept first.
  "/apple/mobile-2/iphone-11-promax/":
    "تعمیر گوشی آیفون 11 پرو مکس | قطعات اصل و ۶ ماه گارانتی",
  "/connecting-xiaomi-phone-to-tv/":
    "اتصال گوشی شیائومی به تلویزیون | راهنمای کامل و تصویری",
  "/dell-laptop-troubleshootingtutorial/":
    "عیب یابی لپ تاپ دل | ۱۰ روش تشخیص و رفع مشکلات سخت افزاری",
  "/enter-and-exit-safe-mode/":
    "حالت ایمن گوشی چیست؟ ورود و خروج از Safe Mode گام به گام",
  "/huawei/mobile/mate-40pro/":
    "تعمیر گوشی هواوی Mate 40 Pro | قطعات اصل و ۶ ماه گارانتی",
  "/iphone-16-pro-max-lcd-replacement/":
    "تعویض ال سی دی آیفون 16 پرو مکس | استعلام هزینه و گارانتی",
  "/repairing-a-worn-samsungphone/":
    "تعمیر گوشی آب خورده سامسونگ | عیب یابی، مراحل و هزینه ها",
  "/samsung-mobile-software-repairs/":
    "تعمیرات نرم افزاری موبایل سامسونگ | رفع هنگ، بوت لوپ و فلش",
  "/samsung-phone-repair-agency-in-the-west-oftehran/":
    "نمایندگی تعمیرات سامسونگ غرب تهران | پیک رایگان و گارانتی",
  "/symptoms-of-iphone-batteryfailure/":
    "علائم خرابی باتری آیفون | از کجا بفهمیم باتری خراب است؟",
  "/xiaomi-mobile-software-repair/":
    "تعمیر نرم افزاری شیائومی | آپدیت MIUI و رفع مشکلات سیستمی",
  // --- Brand hubs that still shipped retail-sounding Yoast titles ("نمایندگی
  // اچ پی | فروش…"). Reframed to the owner's "نمایندگی تعمیرات …" + a USP. ---
  "/hp/":
    "نمایندگی تعمیرات اچ پی در تهران | قطعات اصل و ۶ ماه گارانتی",
  "/dell/":
    "نمایندگی تعمیرات دل در تهران | عیب یابی رایگان و ۶ ماه گارانتی",
  "/lenovo/":
    "نمایندگی تعمیرات لنوو در تهران | لپ تاپ و تبلت با ۶ ماه گارانتی",
  "/sony/":
    "نمایندگی تعمیرات سونی در تهران | لپ تاپ و تلویزیون با گارانتی",
  "/htc/":
    "نمایندگی تعمیرات اچ تی سی در تهران | قطعات اصل و گارانتی کتبی",
  "/nokia/":
    "نمایندگی تعمیرات نوکیا در تهران | قطعات اصل و گارانتی معتبر تعمیر",
  "/asus/":
    "نمایندگی تعمیرات ایسوس در تهران | لپ تاپ و گوشی با ۶ ماه گارانتی",
  // Branch/agency listing — was the broken auto title "نمایندگی تعمیرات ها".
  "/agency/":
    "نمایندگی تعمیرات برتر سرویس در تهران | آدرس و تلفن دو شعبه",
  // --- Device / appliance hubs and top money pages ---
  "/home-appliances/":
    "تعمیر لوازم خانگی در تهران | تعمیر در محل با گارانتی و قیمت مناسب",
  "/home-appliances/tv-repair-in-tehran/":
    "تعمیر تلویزیون در تهران در محل شما | همه برندها با گارانتی کیفیت",
  "/game-console-repair/":
    "تعمیر کنسول بازی در تهران | PS4، PS5 و Xbox با گارانتی",
  "/change-gorilla-glass/":
    "ترمیم شیشه شکسته گوشی و تعویض گلس فنی | قیمت مناسب و گارانتی",
  "/services/laptop-repair/repair-msi-laptop/":
    "تعمیر لپ تاپ MSI در تهران | تعمیر تخصصی گیمینگ با ۶ ماه گارانتی",
  "/services/laptop-repair/surface-laptop-repair/":
    "تعمیر سرفیس مایکروسافت | تعمیر تخصصی Surface با قطعات اصل",
  "/services/mobile-tablet-subspecialty-courses/":
    "آموزش تعمیرات موبایل در تهران | دوره تخصصی صفر تا صد با مدرک",
  "/apple/macbook/":
    "تعمیر مک بوک در تهران | تعمیر برد، باتری و ال سی دی با گارانتی",
  // --- High-demand model / part pages with long or retail titles ---
  "/repair-iphone-7plus/":
    "تعمیر آیفون 7 پلاس در تهران | قطعات اصل و ۶ ماه گارانتی",
  "/apple/mobile-2/iphone-7/":
    "تعمیر آیفون 7 در تهران | قطعات اصل و ۶ ماه گارانتی کتبی",
  "/apple/mobile-2/iphonex/":
    "تعمیر آیفون X در تهران | قطعات اصل و ۶ ماه گارانتی",
  "/apple/mobile-2/iphone-8plus/":
    "تعمیر آیفون 8 پلاس در تهران | قطعات اصل و ۶ ماه گارانتی",
  "/iphone-xs-repairs/":
    "تعمیر آیفون XS در تهران | قطعات اصل و ۶ ماه گارانتی کتبی",
  "/iphone-16-pro-max-battery-replacement/":
    "تعویض باتری آیفون 16 پرو مکس | باتری اصل و ۶ ماه گارانتی",
  "/huawei-phone-case-replacement/":
    "تعویض قاب گوشی هواوی | قطعات اورجینال، اعلام قیمت و گارانتی",
  // Auto-refine left a long, doubled "نمایندگی تعمیرات … نمایندگی تعمیرات" here.
  "/xiaomi-repairs-in-sadeghieh2/":
    "نمایندگی تعمیرات شیائومی در صادقیه | گارانتی رسمی و خدمات VIP",
};

// ---- CTR-focused meta description overrides ----
// Hand-written, click-worthy descriptions for high-impression / low-CTR pages
// (from Search Console). Titles are left untouched; only the description meta
// is replaced to lift SERP click-through.
const META_OVERRIDES: Record<string, string> = {
  // Post-rename URL — the database excerpt still describes the A57.
  "/a56-lcd-replacement/":
    "تعویض ال سی دی A56 سامسونگ؛ صفحه Super AMOLED یکپارچه، پس اگر تصویر و لمس سالم است تعویض گلس کافی است. عیب یابی رایگان و ۶ ماه گارانتی کتبی.",
  "/why-isnt-google-play-working/":
    "گوگل پلی باز نمی شود یا دانلود نمی کند؟ علت کار نکردن Google Play و ۹ راه حل قطعی برای رفع خطا و توقف برنامه در گوشی اندروید را گام به گام بخوانید.",
  "/fix-4g-phone-internet/":
    "اینترنت گوشی روی E یا H گیر کرده؟ آموزش تبدیل اینترنت به ۴G در ایرانسل و همراه اول با تنظیم شبکه و APN برای سرعت بالاتر، به صورت گام به گام.",
  "/fixing-the-problem-of-deleting-the-message-icon-in-xiaomi/":
    "آیکون پیام در گوشی شیائومی حذف شده؟ علت ناپدید شدن آیکون پیامک و ۵ راه حل گام به گام برای بازگرداندن آن در MIUI و HyperOS را اینجا ببینید.",
  "/persian-keyboard-problem-in-samsung-phone/":
    "کیبورد گوشی سامسونگ فارسی نمی شود؟ علت فارسی نشدن صفحه کلید و آموزش افزودن و فعال سازی زبان فارسی در گوشی سامسونگ به صورت تصویری و ساده.",
  "/two-way-conversation-recording-on-xiaomi-phone/":
    "آموزش فعال سازی ضبط مکالمه دوطرفه در گوشی شیائومی؛ روش ضبط خودکار تماس در MIUI، رفع محدودیت و تنظیمات لازم به زبان ساده و گام به گام.",
  "/fix-xiaomi-internet-problem/":
    "اینترنت گوشی شیائومی وصل است ولی کار نمی کند؟ ۷ علت قطعی دیتا و وای فای در شیائومی و راه حل سریع تنظیمات APN، DNS و شبکه را ببینید.",
  "/iphone-battery-draining-fast/":
    "باتری آیفون زود خالی می شود؟ ۸ علت رایج افت سریع شارژ آیفون و راهکار عملی برای افزایش عمر باتری و کاهش مصرف، بدون تعویض باتری.",
  "/fixing-the-problem-of-the-iphone-being-silent/":
    "آیفون در حالت سایلنت گیر کرده یا صدا ندارد؟ علت بی صدا شدن آیفون و راه خارج کردن از حالت سکوت با کلید کناری و تنظیمات، گام به گام.",
  "/samsung/":
    "نمایندگی تعمیرات سامسونگ در تهران؛ قیمت تعمیر ۷۹ مدل سامسونگ را ببینید. تعمیر گوشی، تبلت، تلویزیون و لپ تاپ با عیب یابی رایگان و ۶ ماه گارانتی کتبی.",
  "/motorola-mobile-repair-center/":
    "نمایندگی تعمیرات گوشی موتورولا در تهران؛ تعویض ال سی دی و باتری سری Moto G و Edge با قطعه موجود، عیب یابی رایگان و ۶ ماه گارانتی کتبی.",
  "/contact/":
    "آدرس دو شعبه تعمیرات برتر در تهران: شعبه مرکزی خیابان مطهری و شعبه غرب سعادت آباد میدان کاج. شماره تماس مستقیم هر شعبه و ساعت کاری.",
  "/home-appliances/hisense-air-conditioner-repair/":
    "تعمیر کولر گازی هایسنس در محل؛ نشت یابی پیش از شارژ گاز، تعمیر برد و رفع مشکل کنترل. بازدید با هماهنگی تلفنی و ۶ ماه گارانتی روی قطعه و اجرت.",
  "/apple/":
    "نمایندگی تعمیرات اپل در تهران؛ تعمیر تخصصی آیفون، آیپد، مک بوک و اپل واچ با قطعات اصل و ۶ ماه گارانتی، عیب یابی رایگان و دریافت پیک رایگان.",
  "/huawei/":
    "نمایندگی تعمیرات هواوی در تهران؛ تعمیر گوشی، تبلت و لپ تاپ هواوی و آنر با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی همراه پیک رایگان.",
  "/xiaomi/":
    "نمایندگی تعمیرات شیائومی در تهران؛ تعمیر گوشی، تبلت، لپ تاپ و ساعت شیائومی با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی همراه پیک رایگان.",
  "/asus/":
    "نمایندگی تعمیرات ایسوس در تهران؛ تعمیر لپ تاپ، گوشی و تبلت ایسوس با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی به همراه پیک رایگان.",
  "/lenovo/":
    "نمایندگی تعمیرات لنوو در تهران؛ تعمیر لپ تاپ و تبلت لنوو با قطعات اصل، عیب یابی رایگان، اعلام هزینه قبل از تعمیر و ۶ ماه گارانتی.",
  "/hp/":
    "نمایندگی تعمیرات اچ پی در تهران؛ تعمیر تخصصی لپ تاپ HP با قطعات اصل، عیب یابی رایگان، اعلام هزینه شفاف و ۶ ماه گارانتی همراه پیک رایگان.",
  "/dell/":
    "نمایندگی تعمیرات دل در تهران؛ تعمیر تخصصی لپ تاپ Dell با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی. دریافت و تحویل با پیک رایگان.",
  "/sony/":
    "نمایندگی تعمیرات سونی در تهران؛ تعمیر لپ تاپ و تلویزیون سونی با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی به همراه پیک رایگان.",
  "/htc/":
    "نمایندگی تعمیرات اچ تی سی در تهران؛ تعمیر گوشی، تبلت و ساعت هوشمند HTC با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی تعمیرات.",
  "/nokia/":
    "نمایندگی تعمیرات نوکیا در تهران؛ تعمیر تخصصی گوشی نوکیا با قطعات اصل، عیب یابی رایگان، اعلام هزینه قبل از تعمیر و ۶ ماه گارانتی.",
  "/samsung/mobile/":
    "تعمیر گوشی سامسونگ در تهران با قطعات اصل و ۶ ماه گارانتی؛ تعویض ال سی دی، باتری و تعمیر برد همه مدل های گلکسی با عیب یابی رایگان.",
  "/xiaomi/mobile/":
    "تعمیر گوشی شیائومی در تهران؛ تعویض ال سی دی، باتری و تعمیر برد همه مدل های شیائومی، ردمی و پوکو با قطعات اصل و ۶ ماه گارانتی.",
  "/apple/mobile-2/":
    "تعمیر گوشی آیفون در تهران با قطعات اصل و ۶ ماه گارانتی؛ تعویض ال سی دی، باتری، گلس پشت و تعمیر برد همه مدل های آیفون با عیب یابی رایگان.",
  "/huawei/mobile/":
    "تعمیر گوشی هواوی در تهران؛ تعویض ال سی دی، باتری و تعمیر برد همه مدل های هواوی و آنر با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی.",
  "/asus/lap-top-2/":
    "تعمیر لپ تاپ ایسوس در تهران؛ تعمیر مادربرد، تعویض ال سی دی و باتری، رفع آب خوردگی و سرویس فن با قطعات اصل و ۶ ماه گارانتی.",
  "/lenovo/lap-top/":
    "تعمیر لپ تاپ لنوو در تهران؛ تعمیر مادربرد، تعویض ال سی دی، باتری و کیبورد با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی تعمیرات.",
  "/hp/lap-top/":
    "تعمیر لپ تاپ اچ پی در تهران؛ تعمیر مادربرد، تعویض ال سی دی، باتری و کیبورد HP با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی.",
  "/dell/lap-top/":
    "تعمیر لپ تاپ دل در تهران؛ تعمیر مادربرد، تعویض ال سی دی و باتری لپ تاپ Dell با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی.",
  "/lap-top-acer/":
    "تعمیر لپ تاپ ایسر در تهران؛ تعمیر مادربرد، تعویض ال سی دی و باتری لپ تاپ Acer با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی.",
  "/apple/macbook/":
    "تعمیر مک بوک در تهران؛ تعمیر برد، تعویض ال سی دی، باتری و کیبورد مک بوک ایر و پرو با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی.",
  "/services/category-mobile-phone-repair/":
    "تعمیرات موبایل در تهران برای همه برندها؛ تعویض ال سی دی، باتری، تعمیر برد و رفع آب خوردگی با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی.",
  "/services/laptop-repair/":
    "تعمیرات لپ تاپ در تهران برای همه برندها؛ تعمیر مادربرد، تعویض ال سی دی و باتری، رفع آب خوردگی و سرویس فن با ۶ ماه گارانتی و عیب یابی رایگان.",
  "/silence-of-the-phone-after-water-damage/":
    "گوشی بعد از آب خوردگی بی صدا شده؟ علت قطع شدن صدای اسپیکر و میکروفون پس از خیس شدن گوشی و راهکار خشک کردن و تعمیر، به صورت گام به گام.",
  "/the-screen-does-not-turn-on-during-a-call/":
    "صفحه گوشی هنگام تماس روشن نمی شود؟ علت کار نکردن سنسور مجاورت و خاموش ماندن نمایشگر در تماس و ۵ راه حل قطعی برای رفع آن را بخوانید.",
  "/calibrating-the-xiaomi-phone-battery/":
    "آموزش کالیبره کردن باتری گوشی شیائومی برای رفع پرش درصد شارژ و خاموش شدن ناگهانی؛ روش درست کالیبراسیون باتری در MIUI به زبان ساده.",
  "/enter-and-exit-safe-mode/":
    "آموزش ورود و خروج از حالت ایمن (Safe Mode) در گوشی اندروید؛ روش فعال و غیرفعال کردن سیف مود سامسونگ و شیائومی برای رفع هنگ و مشکل برنامه ها.",
  "/what-is-the-second-space-of-the-phone-activation-guide-on-android-phones/":
    "فضای دوم (Second Space) گوشی چیست و چه کاربردی دارد؟ آموزش فعال سازی و استفاده از اسپیس دوم اندروید برای جداسازی حساب ها و حفظ حریم خصوصی.",
  "/touch-phone-problem-while-charging/":
    "تاچ گوشی هنگام شارژ پرش می کند یا کار نمی کند؟ علت به هم ریختن لمس صفحه هنگام اتصال شارژر و ۶ راه حل از تعویض شارژر تا تعمیر، گام به گام.",
  "/htc/mobile/":
    "تعمیر گوشی اچ تی سی در تهران؛ تعویض ال سی دی، باتری و تعمیر برد همه مدل های HTC با قطعات اورجینال، عیب یابی رایگان و ۶ ماه گارانتی کتبی.",
  "/asus/mobile/":
    "تعمیر گوشی ایسوس در تهران؛ تعویض ال سی دی، باتری و تعمیر برد انواع Zenfone و ROG Phone با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی.",
  "/iphone-battery-replacement/":
    "تعویض باتری آیفون با باتری اصلی و نمایش سلامت ۱۰۰٪؛ نصب همان روز در حضور شما، اعلام قیمت قبل از تعویض و ۶ ماه گارانتی کتبی. پیک رایگان در تهران.",
  "/replacing-the-iphone-lcd/":
    "تعویض ال سی دی آیفون با پنل اصل و تست کامل تاچ و True Tone؛ اعلام هزینه قبل از تعمیر، نصب همان روز و ۶ ماه گارانتی. پیک رایگان در سراسر تهران.",
  "/samsung-phone-lcd-replacement/":
    "تعویض ال سی دی گوشی سامسونگ با پنل اورجینال؛ قیمت شفاف قبل از تعمیر، نصب همان روز و ۶ ماه گارانتی کتبی. راهنمای تشخیص خرابی تاچ و LCD را بخوانید.",
  "/samsung-mobile-phone-battery-replacement/":
    "تعویض باتری گوشی سامسونگ با قطعه اصل در کمتر از یک ساعت؛ رفع خاموشی ناگهانی و افت شارژ با اعلام هزینه قبل از تعویض و ۶ ماه گارانتی کتبی.",
  "/smart-watch-repair/":
    "تعمیر ساعت هوشمند اپل واچ، سامسونگ، شیائومی و هواوی در تهران؛ تعویض باتری و صفحه با قطعات اورجینال، پیک رایگان و ۶ ماه گارانتی کتبی.",
  "/iphone-technical-glass-replacement/":
    "تعویض گلس آیفون با دستگاه لمینت و OCA بدون آسیب به تاچ و ال سی دی اصلی؛ اعلام قیمت قبل از تعمیر، تحویل همان روز و گارانتی کتبی خدمات.",
  "/xiaomi-phone-glass-replacement/":
    "تعویض گلس گوشی شیائومی بدون تعویض ال سی دی؛ ترمیم شیشه شکسته با دستگاه لمینت، قیمت مناسب، تحویل همان روز و گارانتی کتبی در تهران.",
  "/online-repair-request/":
    "درخواست تعمیر موبایل، لپ تاپ و تبلت را آنلاین ثبت کنید؛ کارشناس ما تماس می گیرد و بازه هزینه را پیش از تعمیر اعلام می کند. ثبت درخواست رایگان است.",
};

const ARTICLE_UPDATES: Record<string, string> = {
  "/two-way-conversation-recording-on-xiaomi-phone/":
    "در گوشی های جدید شیائومی، فعال بودن ضبط مکالمه به نسخه MIUI یا HyperOS، منطقه رام و قوانین نرم افزاری گوگل وابسته است. قبل از نصب برنامه های ناشناس، مسیر Phone > Settings > Call recording را بررسی کنید و اگر گزینه ضبط وجود ندارد، از تغییر رام یا روت کردن گوشی فقط برای این قابلیت استفاده نکنید، چون احتمال از دست رفتن گارانتی و اطلاعات وجود دارد.",
  "/repair-of-hp-laptopkeyboard/":
    "در تعمیر کیبورد لپ تاپ اچ پی، تشخیص تفاوت خرابی خود کیبورد با ایراد فلت، سوکت یا کنترلر مادربرد مهم است. اگر فقط چند کلید کار نمی کند یا بعد از آب خوردگی کلیدها چسبنده شده اند، تعویض کامل همیشه اولین گزینه نیست و باید قبل از هزینه قطعه، مسیر اتصال و آثار سولفاته شدن بررسی شود.",
  "/the-problem-of-not-working-the-asus-laptop-touchpad/":
    "اگر تاچ پد لپ تاپ ایسوس بعد از آپدیت ویندوز از کار افتاده، ابتدا کلیدهای میانبر، Device Manager و درایور ASUS Precision Touchpad را بررسی کنید. زمانی که تاچ پد در BIOS هم واکنشی ندارد یا همراه با ضربه و آب خوردگی از کار افتاده، مشکل به احتمال زیاد سخت افزاری است و ادامه استفاده با فشار زیاد روی پد می تواند فلت یا سوکت را بدتر کند.",
  "/persian-keyboard-problem-in-samsung-phone/":
    "در نسخه های جدید One UI، زبان فارسی معمولا از مسیر Samsung Keyboard > Languages and types اضافه می شود و نیازی به نصب کیبوردهای متفرقه نیست. اگر زبان فارسی پس از دانلود هم فعال نمی شود، پاک کردن کش کیبورد سامسونگ و بررسی به روز بودن برنامه از Galaxy Store معمولا قبل از ریست فکتوری باید انجام شود.",
  "/samsung-mobile-phone-battery-replacement/":
    "برای تعویض باتری گوشی سامسونگ فقط درصد سلامت باتری معیار کافی نیست؛ بادکردگی، خاموشی ناگهانی، داغی غیرعادی و افت شارژ زیر فشار پردازشی هم باید بررسی شود. اگر بدنه گوشی باز شده یا باتری متورم است، گوشی را شارژ طولانی نکنید و از فشار دادن قاب پشت خودداری کنید.",
  "/entering-and-exiting-xiaomi-main-menu-mode/":
    "Main Menu در گوشی های شیائومی معمولا بعد از خطای نرم افزاری، گیر کردن کلید پاور یا ولوم، یا آپدیت ناقص دیده می شود. اگر گوشی مدام به این صفحه برمی گردد، انتخاب گزینه های پاک کردن اطلاعات را بدون بکاپ انجام ندهید و قبل از ریست، سلامت کلیدها و فضای ذخیره سازی را بررسی کنید.",
  "/the-problem-of-not-turning-off-airplane-mode-on-the-phone/":
    "خاموش نشدن حالت هواپیما همیشه نرم افزاری نیست و گاهی از خرابی ماژول شبکه، آی سی بیس باند یا اختلال بعد از ضربه می آید. اگر گزینه Airplane Mode خاکستری شده یا با ریستارت هم فعال می ماند، تعویض سیم کارت راه حل قطعی نیست و باید قبل از فلش کردن، وضعیت آنتن دهی و IMEI بررسی شود.",
  "/fix-iphone-unavailable-problem/":
    "پیغام iPhone Unavailable معمولا بعد از وارد کردن چندباره رمز اشتباه ظاهر می شود و در بسیاری از حالت ها بدون Apple ID و رمز حساب، بازیابی کامل ممکن نیست. اگر اطلاعات داخل گوشی بکاپ ندارد، قبل از هر ریستور یا پاک سازی، وضعیت iCloud و امکان بازیابی داده ها را بررسی کنید.",
  "/hide-apps-on-your-phone/":
    "مخفی کردن برنامه ها برای نظم دادن به صفحه اصلی مناسب است، اما جایگزین قفل برنامه یا مدیریت دسترسی ها نیست. اگر هدف شما محافظت از اطلاعات بانکی، پیام ها یا عکس هاست، علاوه بر مخفی سازی، از قفل صفحه قوی، App Lock و بررسی مجوزهای برنامه ها استفاده کنید.",
  "/not-registered-on-the-network/":
    "خطای ثبت نشدن روی شبکه می تواند از سیم کارت، تنظیمات اپراتور، رجیستری، IMEI یا خرابی مدار آنتن باشد. اگر همین سیم کارت روی گوشی دیگر آنتن دارد و گوشی شما بعد از ضربه یا آب خوردگی این خطا را نشان می دهد، ریست شبکه را انجام دهید اما فلش یا تعمیر نرم افزاری سنگین را بدون بررسی سخت افزار شروع نکنید.",
  "/what-is-a-factory-reset/":
    "ریست فکتوری همه چیز را حل نمی کند و اگر مشکل از باتری، حافظه خراب، آی سی شارژ یا ضربه باشد، فقط اطلاعات شما را پاک می کند. قبل از ریست، از مخاطبین، عکس ها، کدهای تایید دومرحله ای و حساب های بانکی بکاپ بگیرید و مطمئن شوید رمز حساب گوگل یا اپل را می دانید.",
  "/not-displaying-contacts-on-xiaomi-phones/":
    "در گوشی های شیائومی، نمایش ندادن مخاطبین اغلب به مجوزهای برنامه Contacts، همگام سازی حساب گوگل یا فیلتر اشتباه لیست مخاطبین مربوط است. اگر مخاطبین در سایت Google Contacts دیده می شوند، حذف و نصب برنامه مخاطبین لازم نیست و بهتر است ابتدا Sync و Display preferences بررسی شود.",
  "/replacing-the-iphone-lcd/":
    "در تعویض ال سی دی آیفون، کیفیت پنل و انتقال صحیح قطعاتی مثل سنسور نور و فلت های مرتبط روی نتیجه نهایی اثر مستقیم دارد. اگر بعد از ضربه فقط شیشه ترک خورده اما تصویر و تاچ سالم است، قبل از تعویض کامل نمایشگر باید امکان تعمیر گلس بررسی شود.",
  "/asus-gaming-laptop-repair/":
    "لپ تاپ گیمینگ ایسوس به دلیل توان مصرفی بالا، به سرویس حرارتی دقیق تر از مدل های اداری نیاز دارد. افت فریم، خاموشی زیر بار بازی و داغ شدن سریع همیشه به کارت گرافیک مربوط نیست و قبل از تعویض قطعه، وضعیت فن، خمیر حرارتی، مسیر هوا و آداپتور باید تست شود.",
  "/iphone-no-signal/":
    "پرش آنتن آیفون اگر بعد از آپدیت رخ داده باشد می تواند نرم افزاری باشد، اما اگر همراه با ضربه، تعمیر قبلی یا آب خوردگی دیده می شود باید مدار آنتن و بیس باند بررسی شود. تا وقتی IMEI و وضعیت رجیستری مشخص نشده، تعویض سیم کارت یا ریستور کامل فقط بخشی از تشخیص است.",
  "/enter-and-exit-safe-mode/":
    "Safe Mode برای پیدا کردن برنامه مشکل ساز کاربرد دارد و نباید به عنوان حالت استفاده روزمره باقی بماند. اگر گوشی بعد از هر ریستارت دوباره وارد حالت ایمن می شود، کلید ولوم، قاب محافظ، برنامه های تازه نصب شده و خطاهای لانچر را به ترتیب بررسی کنید.",
  "/enter-and-exit-from-fastboot-mode/":
    "Fastboot در گوشی شیائومی معمولا با نگه داشتن پاور و ولوم پایین فعال می شود، اما گیر کردن طولانی در این صفحه می تواند نشانه گیر کردن کلید یا مشکل بوت باشد. اگر گوشی با نگه داشتن پاور خارج نمی شود، از اجرای دستورهای ناشناس فلش خودداری کنید چون انتخاب فایل اشتباه می تواند اطلاعات را حذف کند.",
  "/samsung-mobile-software-repairs/":
    "تعمیر نرم افزاری موبایل سامسونگ باید با حفظ اطلاعات شروع شود، نه با فلش فوری. برای خطاهای بوت، کندی شدید یا توقف برنامه ها، ابتدا بکاپ، فضای خالی، نسخه One UI و سلامت حافظه بررسی می شود و فقط وقتی راه های کم ریسک جواب ندهد، نصب رام رسمی پیشنهاد می شود.",
  "/solve-the-problem-of-slow-laptop/":
    "کندی لپ تاپ همیشه با نصب دوباره ویندوز حل نمی شود. اگر هارد سلامت پایینی دارد، رم کم است یا دما زیر فشار بالا می رود، نصب ویندوز فقط موقت کمک می کند و بهتر است قبل از هر کار، سلامت SSD یا HDD، مصرف RAM و دمای پردازنده بررسی شود.",
  "/iphone-12-pro-max-glass-replacement/":
    "برای آیفون 12 پرو مکس، تعویض گلس فقط زمانی منطقی است که تصویر، تاچ و پنل OLED سالم باشند. اگر لکه، خط سبز، پرش تصویر یا ناحیه بدون لمس وجود دارد، مشکل از خود نمایشگر است و گلس تنها نمی تواند کیفیت صفحه را برگرداند.",
  "/iphone-board-repair/":
    "تعمیر برد آیفون زمانی ارزش دارد که عیب دقیق، سابقه آب خوردگی و هزینه قطعات با ارزش دستگاه مقایسه شود. اگر برد چندبار تعمیر شده یا مسیرهای اصلی آسیب شدید دارند، ممکن است تعمیر دوباره پایدار نباشد و باید قبل از شروع، احتمال بازگشت ایراد به شما اعلام شود.",
  "/samsung-note-20-ultra-lcd-replacement/":
    "در نوت 20 اولترا، نمایشگر خمیده و نرخ نوسازی بالا باعث می شود کیفیت قطعه جایگزین بسیار مهم باشد. اگر فقط گلس شکسته و تصویر بدون خط، لکه و پرش است، تعمیر گلس می تواند بررسی شود؛ اما سوختگی OLED یا خرابی تاچ معمولا نیاز به تعویض کامل دارد.",
  "/samsung-laptop-board-repair/":
    "در تعمیر برد لپ تاپ سامسونگ، علائم شارژ نشدن، تصویر ندادن یا خاموشی کامل باید جداگانه تست شوند. تعویض آداپتور یا باتری بدون اندازه گیری مسیر ورودی، مدار شارژ و چیپ های تغذیه می تواند هزینه اضافی بسازد و ایراد اصلی را پنهان کند.",
  "/redmi-note-13-back-cover-replacement/":
    "تعویض درب پشت ردمی نوت 13 فقط ظاهر گوشی را ترمیم نمی کند؛ چسب کاری درست روی مقاومت دستگاه در برابر گرد و غبار و لق نزدن فریم اثر دارد. اگر بعد از ضربه دوربین هم تار شده یا فوکوس مشکل دارد، قبل از بستن قاب جدید باید ماژول دوربین بررسی شود.",
  "/asus-laptop-webcam-problem/":
    "مشکل وب کم لپ تاپ ایسوس می تواند از مجوزهای ویندوز، درایور، کلید میانبر یا قطع شدن فلت نمایشگر باشد. اگر دوربین در Device Manager دیده نمی شود و همزمان تصویر صفحه یا میکروفون هم اختلال دارد، احتمال ایراد فلت بالاتر است.",
  "/iphone-back-door/":
    "تعویض درب پشت آیفون باید با کنترل فریم، لنز دوربین و چسب آب بندی انجام شود. اگر شکستگی پشت گوشی نزدیک دوربین یا لبه هاست، استفاده طولانی با قاب ترک خورده می تواند رطوبت و گرد و غبار را وارد دستگاه کند.",
  "/s23-ultra-lcd-replacement/":
    "برای S23 Ultra، قبل از تعویض ال سی دی باید تفاوت ترک گلس، خرابی تاچ و آسیب پنل AMOLED مشخص شود. اگر صفحه خط سبز، لکه مشکی یا سوختگی دارد، تعویض کامل نمایشگر لازم است و تعمیر سطحی گلس مشکل تصویر را حل نمی کند.",
  "/samsung-tab-a9-repair/":
    "در تعمیرات Tab A9 سامسونگ، ایراد شارژ، شکستگی صفحه و کندی دستگاه باید جداگانه عیب یابی شود چون هرکدام مسیر تعمیر متفاوتی دارد. اگر تبلت برای کودک استفاده می شود، بعد از تعمیر قاب محافظ و کنترل سلامت سوکت شارژ اهمیت بیشتری دارد.",
  "/samsung-a24repair/":
    "سامسونگ A24 در ایرادهای رایج مثل شکستگی ال سی دی، ضعف باتری و مشکل شارژ باید با قطعه سازگار با همان مدل بررسی شود. قبل از تعویض قطعه، شماره مدل و نسخه دستگاه را کنترل کنید چون استفاده از قطعه ناسازگار می تواند روی روشنایی، تاچ یا شارژ اثر بگذارد.",
  "/repair-honor9x/":
    "در تعمیر Honor 9X، چون برخی قطعات با مدل های نزدیک اشتباه گرفته می شوند، تطبیق شماره مدل قبل از سفارش قطعه ضروری است. اگر گوشی بعد از ضربه روشن می شود اما تصویر ندارد، فقط ال سی دی مقصر نیست و فلت، کانکتور و مدار تصویر هم باید بررسی شوند.",
  "/hide-number-on-whatsapp-for-contacts/":
    "مخفی کردن شماره در واتساپ برای همه مخاطبین به شکل کامل همیشه ممکن نیست و به تنظیمات حریم خصوصی حساب، نسخه برنامه و نوع ذخیره مخاطب بستگی دارد. اگر هدف شما جلوگیری از دیده شدن شماره توسط افراد ناشناس است، تنظیمات Privacy و قابلیت های مربوط به Groups و Profile photo را هم همراه این آموزش بررسی کنید.",
  "/why-isnt-google-play-working/":
    "اگر گوگل پلی باز نمی شود، قبل از حذف حساب گوگل یا ریست فکتوری، تاریخ و ساعت گوشی، فضای خالی، کش Google Play Services و اتصال VPN را بررسی کنید. بسیاری از خطاهای دانلود با همین موارد حل می شوند و نصب فایل های ناشناس Play Store می تواند امنیت گوشی را پایین بیاورد.",
  "/what-is-the-second-space-of-the-phone-activation-guide-on-android-phones/":
    "فضای دوم برای جدا کردن حساب ها و برنامه ها کاربردی است، اما جایگزین بکاپ و رمز قوی نیست. اگر گوشی حافظه کمی دارد یا مرتب کند می شود، فعال کردن Second Space ممکن است فشار بیشتری به ذخیره سازی وارد کند و بهتر است قبل از استفاده، فضای آزاد دستگاه را بررسی کنید.",
  "/cause-and-solution-to-the-problem-of-samsung-phone-overheating/":
    "داغ شدن گوشی سامسونگ اگر هنگام شارژ، بازی یا استفاده از اینترنت 5G رخ دهد می تواند طبیعی باشد، اما داغی در حالت آماده به کار نشانه مصرف پس زمینه، باتری ضعیف یا ایراد سخت افزاری است. اگر بدنه نزدیک دوربین یا فریم بدون استفاده سنگین داغ می شود، ادامه شارژ طولانی توصیه نمی شود.",
  "/complete-guide-to-fixing-the-problem-of-iphone-not-connecting-to-wi-fi/":
    "وصل نشدن آیفون به وای فای همیشه از مودم نیست؛ گاهی تنظیمات Private Wi-Fi Address، VPN، DNS یا خرابی آنتن Wi-Fi نقش دارد. قبل از Reset Network Settings، رمزهای وای فای و تنظیمات VPN را یادداشت کنید چون با ریست شبکه پاک می شوند.",
  "/samsung-flashing-instructions/":
    "فلش کردن گوشی سامسونگ باید فقط با رام رسمی و مدل دقیق دستگاه انجام شود. اگر شماره مدل، منطقه رام یا فایل CSC اشتباه انتخاب شود، احتمال پاک شدن اطلاعات، بوت لوپ یا از کار افتادن برخی سرویس ها وجود دارد.",
  "/samsung-lcd-test-code/":
    "کد تست ال سی دی سامسونگ برای تشخیص اولیه لکه، پیکسل سوخته و لمس کاربرد دارد، اما نتیجه آن جای تست سخت افزاری کامل را نمی گیرد. اگر صفحه بعد از ضربه خط رنگی یا پرش تصویر دارد، حتی پاس شدن بعضی تست ها هم به معنی سالم بودن پنل نیست.",
  "/samsung-5g-problem-in-iran/":
    "مشکل 5G در گوشی های سامسونگ در ایران می تواند به پوشش اپراتور، فعال بودن باندهای شبکه، رجیستری و تنظیمات سیم کارت مربوط باشد. اگر فقط در یک منطقه خاص 5G ندارید، قبل از تعمیر گوشی، همان سیم کارت را در نقطه دیگر و با حالت Network Mode مناسب تست کنید.",
  "/laptop-freezes/":
    "هنگ کردن لپ تاپ اگر همراه با صدای فن زیاد، دمای بالا یا استفاده 100 درصدی از دیسک باشد، بیشتر از یک مشکل نرم افزاری ساده است. قبل از نصب دوباره ویندوز، سلامت هارد یا SSD، دمای پردازنده و خطاهای RAM را بررسی کنید تا علت اصلی پنهان نماند.",
};

function appendArticleUpdate(path: string, html: string): string {
  const update = ARTICLE_UPDATES[path];
  if (!update || !html) return html;
  return `${html}<section class="article-update"><h2>به روزرسانی کاربردی</h2><p>${update}</p></section>`;
}

const ANCHOR = new RegExp("<a\\b", "i");
const SPLIT_TAGS = /(<[^>]+>)/g;
const OPEN_ANCHORS = /<a\b/gi;
const CLOSE_ANCHORS = /<\/a>/gi;

/** A paragraph's visible text, normalised the way the recovered map records it. */
const plainText = (inner: string): string =>
  inner
    .replace(/<[^>]+>/g, "")
    .replace(/‌/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const paraNamed = (inner: string, para: string): boolean =>
  plainText(inner).startsWith(para);

function linkifyInternal(html: string, selfPath: string): string {
  // A page that the deployed site linked by hand keeps exactly those links:
  // the map below is what it carried, phrase for phrase. Pages with no recorded
  // list fall back to the general brand/device map.
  const recovered = INJECTED_LINKS[selfPath];
  const targets: [string, string, string?][] = (
    recovered ?? INTERNAL_LINKS
  ).filter(([, path]) => path !== selfPath);
  const linked = new Set<string>();
  const used = new Set<number>();
  let added = 0;
  const MAX = recovered ? recovered.length : 8;
  return html.replace(
    /(<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (m, open: string, inner: string, close: string, offset: number) => {
      if (added >= MAX) return m;
      // Some WordPress blocks wrap a whole paragraph in a link. That <a> sits
      // outside the <p>, so the test below does not see it; injecting here
      // would nest one link inside another and split the sentence in two.
      const before = html.slice(0, offset);
      const opened = (before.match(OPEN_ANCHORS) || []).length;
      const closed = (before.match(CLOSE_ANCHORS) || []).length;
      if (opened > closed) return m;
      // A paragraph that already links is left alone, unless the recovered
      // list names it: the deployed page put a second link there on purpose.
      const named =
        recovered !== undefined &&
        targets.some(([, , para]) => !!para && paraNamed(inner, para));
      if (!named && ANCHOR.test(inner)) return m;
      // Search only text nodes. Replacing inside raw `inner` can corrupt an
      // image alt/title attribute when it contains a target phrase.
      const parts = inner.split(SPLIT_TAGS);
      const paraText = plainText(inner);
      for (let i = 0; i < targets.length; i++) {
        const [phrase, path, para] = targets[i];
        // A recovered entry is used once each; the general map links a page
        // once per document, whichever paragraph mentions it first.
        if (recovered ? used.has(i) : linked.has(path)) continue;
        if (para && !paraText.startsWith(para)) continue;
        // The database copy sometimes links the same page in the same
        // paragraph already; a second <a> would nest inside the first.
        if (inner.includes(`href="${path}"`)) continue;
        const textIndex = parts.findIndex(
          (part, index) => index % 2 === 0 && part.includes(phrase),
        );
        if (textIndex < 0) continue;
        const text = parts[textIndex];
        const idx = text.indexOf(phrase);
        parts[textIndex] =
          text.slice(0, idx) +
          `<a href="${path}">${phrase}</a>` +
          text.slice(idx + phrase.length);
        used.add(i);
        linked.add(path);
        added++;
        // The deployed pages put two links in one paragraph where the copy
        // named two pages; the general map keeps to one so a paragraph written
        // without links does not turn into a list of them.
        if (!recovered) break;
      }
      return open + parts.join("") + close;
    },
  );
}

// Body-text corrections made on the live site after the WordPress export was
// taken, replayed here so the rebuild matches what is deployed. Keyed by URL,
// each entry is an exact find/replace — posts.json stays the untouched source
// of truth. Keep this table tiny; anything larger belongs in the database.
const CONTENT_FIXES: Record<string, [string, string][]> = {
  // Founding year corrected on the deployed pages (1382 → 1383).
  "/xiaomi/mobile/": [["از سال 1382 تا کنون", "از سال 1383 تا کنون"]],
  "/about/": [["های سال 1382", "های سال 1383"]],
  "/home/": [
    ["از سال 1382 تاکنون", "از سال 1383 تاکنون"],
    ["از سال 1382 تا به امروز", "از سال 1383 تا به امروز"],
  ],
};

function applyContentFixes(path: string, html: string): string {
  const fixes = CONTENT_FIXES[path];
  if (!fixes) return html;
  let out = html;
  for (const [from, to] of fixes) out = out.split(from).join(to);
  return out;
}

// Several hundred WordPress bodies start their sections below <h2>: the editor
// picked the size that looked right, not the level. With nothing at level two,
// the outline a crawler reads jumps from the h1 straight to level three or
// four, and the on-page table of contents (which collects h2s) comes out empty.
// Shifting every heading up by the same amount restores the hierarchy without
// flattening it — a body whose sections are h3 with h4 sub-headings keeps that
// relationship, one step higher. Bodies that already use <h2> are left alone.
function promoteHeadings(html: string): string {
  const levels = [...html.matchAll(/<h([2-6])\b/gi)].map((m) => Number(m[1]));
  if (!levels.length) return html;
  const shift = Math.min(...levels) - 2;
  if (shift <= 0) return html;
  return html.replace(
    /<(\/?)h([2-6])\b/gi,
    (_m, slash, level) => `<${slash}h${Number(level) - shift}`,
  );
}

// promoteHeadings fixes a body that starts too deep; this fixes one that skips
// a level on the way down — an <h2> section whose sub-headings are <h4>,
// which is what WordPress bodies look like when the editor picked heading
// sizes by eye. The outline a crawler and a screen reader read then disagrees
// with the one a person sees.
//
// The walk keeps a stack of (original level → level emitted). A heading comes
// out one below its nearest surviving ancestor and never deeper than it
// already was, so nothing is pushed down and siblings stay siblings. A body
// with no gaps maps to itself, which is why this can run over every page and
// only move the ones that are malformed.
//
// The stack is SEEDED WITH ONE LEVEL ABOVE THE BODY'S FIRST HEADING, which is
// deliberate and load-bearing: seeding with the page <h1> instead would pull a
// leading <h3> up to <h2>, and the article table of contents is built from the
// <h2>s. That version rewrote the visible contents list on 60 pages and moved
// their body text — a much bigger change than the one being made here. This
// version can never create a new shallowest heading, so the contents list is
// untouched and only genuinely skipped levels close up.
function levelHeadings(html: string): string {
  const first = html.match(/<h([1-6])\b/i);
  if (!first) return html;
  const base = Number(first[1]) - 1;
  const stack: { orig: number; mapped: number }[] = [{ orig: base, mapped: base }];
  return html.replace(
    /<(\/?)h([1-6])\b([^>]*)>/gi,
    (full, slash: string, level: string, attrs: string) => {
      const orig = Number(level);
      if (slash) {
        const open = stack[stack.length - 1];
        return open && open.orig === orig ? `</h${open.mapped}>` : full;
      }
      while (stack.length > 1 && stack[stack.length - 1].orig >= orig) stack.pop();
      const mapped = Math.min(orig, stack[stack.length - 1].mapped + 1);
      stack.push({ orig, mapped });
      return `<h${mapped}${attrs}>`;
    },
  );
}

export const POSTS: Post[] = raw.map((p) => {
  const rawSegments = buildSegments(p);
  const rawPath = "/" + rawSegments.join("/") + "/";
  const renamedPath = PATH_RENAMES[rawPath];
  const selfPath = renamedPath ?? rawPath;
  const segments = renamedPath
    ? renamedPath.split("/").filter(Boolean)
    : rawSegments;
  let content = applyContentFixes(
    selfPath,
    levelHeadings(promoteHeadings(addAltText(cleanContent(p.content), p.title))),
  );
  // Inject contextual in-body links to the commercial hubs. Runs on BOTH article
  // and service/model pages so every cluster page funnels in-body link equity up
  // to its brand/device hub (e.g. a Samsung model page links the phrase
  // "تعمیر گوشی سامسونگ" → /samsung/mobile/, "تعمیرات سامسونگ" → /samsung/). The
  // landing components render this HTML verbatim and only parse <h2>, so an <a>
  // injected inside a <p> is safe. Self-links are already excluded by selfPath.
  content = linkifyInternal(content, selfPath);
  if (p.type === "post") content = appendArticleUpdate(selfPath, content);
  // Ignore Yoast description templates (e.g. %%excerpt%%) — fall back to real text.
  const cleanSeoDesc = p.seoDesc && !p.seoDesc.includes("%%") ? p.seoDesc : "";
  const metaDesc = clampDesc(
    META_OVERRIDES_RECOVERED[selfPath] ||
      META_OVERRIDES[selfPath] ||
      cleanSeoDesc ||
      p.excerpt ||
      firstParagraph(content) ||
      p.title,
  );
  const featured = localizeUrls(p.image);
  return {
    ...p,
    // ZWNJ (نیم‌فاصله) → space across all rendered DB text per site convention.
    title: deZwnj(p.title),
    // Drop featured images whose file was never migrated (would 404). The page
    // layouts already render the hero image conditionally. Surviving images are
    // upgraded to their webp sibling for a faster LCP.
    image: uploadExists(featured) ? toWebp(featured) : "",
    content: deZwnjHtml(content),
    excerpt: deZwnjHtml(localizeUrls(p.excerpt)),
    segments,
    path: selfPath,
    metaTitle: deZwnj(
      TITLE_REWRITES[selfPath] ||
        TITLE_OVERRIDES_RECOVERED[selfPath] ||
        TITLE_OVERRIDES[selfPath] ||
        refineTitle(deZwnj(resolveTitle(p.seoTitle, p.title))),
    ),
    metaDesc: deZwnj(metaDesc),
  };
});

// Guarantee unique <title> values (disambiguate with parent brand, then city,
// then a counter as a last resort). Two records that resolve to the SAME URL
// (the export has a few slug duplicates, e.g. a page + a post both at
// /repair-iphone-7plus/) keep an identical title — only one is ever rendered,
// so appending "| تهران" to the phantom would just uglify the live page.
{
  const usedBy = new Map<string, string>(); // title -> first path that claimed it
  for (const p of POSTS) {
    let t = p.metaTitle;
    const owner = usedBy.get(t);
    if (owner !== undefined && owner !== p.path) {
      const parent = p.parent ? rawById.get(p.parent) : undefined;
      const brand = parent
        ? deZwnj(parent.title).split(/[|\-–—]/)[0].trim().split(/\s+/).slice(0, 3).join(" ")
        : "";
      const candidates = [
        brand ? `${t} | ${brand}` : "",
        // Skip the city suffix when the title already names تهران (avoids the
        // redundant "… در تهران | تهران").
        t.includes(SITE.city) ? "" : `${t} | ${SITE.city}`,
      ].filter(Boolean);
      let chosen = candidates.find((c) => !usedBy.has(c));
      if (!chosen) {
        let n = 2;
        while (usedBy.has(`${t} (${n})`)) n++;
        chosen = `${t} (${n})`;
      }
      t = chosen;
    }
    if (!usedBy.has(t)) usedBy.set(t, p.path);
    p.metaTitle = t;
  }
}

// Visible H1 override. Deliberately NOT applied to post.title: that string also
// drives the breadcrumb label, internal-link anchors and /repairs/* + /areas/*
// hub membership, so rewriting it would silently reshape the link graph. The
// landing components call this at render time instead.
export function h1For(pathname: string, fallback: string): string {
  return H1_OVERRIDES_RECOVERED[pathname] || fallback;
}


/** Longest link label before it is cut back to the last whole word. */
const LABEL_MAX = 45;

/**
 * What to call a page inside a card or a list: its database title with the SEO
 * tail removed. Titles are written for the SERP ("نمایندگی ZTE | تعمیرات گوشی
 * زد تی ای در تهران"); everything after the first separator is noise once the
 * reader is already on the site, and the cards clamp to one line anyway.
 *
 * A parenthesis is only a separator when it opens a clause too long to fit —
 * "(اپل)" is part of the name, "(خروج آب و گردوغبار …)" is a subtitle.
 */
/** The database title of a page, by URL — for lists that carry only hrefs. */
export function titleOf(pathname: string): string | undefined {
  return postByPath.get(pathname)?.title;
}

export function linkLabel(title: string): string {
  let head = title.split(/\s*[|:+]\s*/)[0].trim() || title;
  // A parenthesis at the END is a subtitle ("… (ترفندهای ۲۰۲۵)"); one in the
  // middle is part of the name ("تعمیر گوشی آیفون (اپل) در تهران").
  head = head.replace(/\s*\([^()]*\)?\s*$/, "").trim() || head;
  // A title that asks a question ends at the question mark; what follows is a
  // subtitle ("… چیست؟ راهنمای عیب یابی"), and the question alone is the name.
  const question = head.indexOf("؟");
  if (question >= 0 && question < LABEL_MAX) return head.slice(0, question + 1);
  if (head.length <= LABEL_MAX) return head || title;
  const clipped = head.slice(0, LABEL_MAX);
  const lastSpace = clipped.lastIndexOf(" ");
  return (lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trim();
}

/**
 * The name a hub page is introduced by when a child page links up to it
 * ("سایر خدمات …", "مشاهده صفحه نمایندگی: …"). These were chosen by hand and do
 * not follow from the title — /hp/ keeps its parenthesis, /lap-top-acer/ drops
 * everything from "با" on — so the deployed names live in
 * lib/recovered-hub-labels.ts and only unlisted hubs fall back to trimming.
 */
export function hubLabel(pathname: string, title: string): string {
  return HUB_LABELS[pathname] ?? linkLabel(title);
}

/**
 * The same hub, as the related-links HEADING names it. The deployed pages do
 * not always use the up-link's wording there ("سایر خدمات تعمیرات لپ تاپ" over
 * "مشاهده صفحه اصلی: تعمیر لپ تاپ"), so both names are kept.
 */
export function headingLabel(pathname: string, title: string): string {
  return HEADING_LABELS[pathname] ?? hubLabel(pathname, title);
}

export const CATEGORIES = categoriesJson as Category[];
export const DB_SITE = siteJson as {
  blogname: string;
  blogdescription: string;
  home: string;
  siteurl: string;
};

export const ARTICLE_POSTS = POSTS.filter((p) => p.type === "post");

const postByPath = new Map<string, Post>();
for (const p of POSTS) {
  postByPath.set(p.path, p); // decoded (Persian)
  postByPath.set(safeDecode(p.path), p);
  try {
    postByPath.set(encodeURI(p.path), p); // percent-encoded variant
  } catch {
    /* ignore */
  }
}
const postById = new Map(POSTS.map((p) => [p.id, p]));

// ---------- Pillar / cluster topical structure ----------
// Hub-and-spoke model: broad "pillar" pages (brand hubs, brand+device hubs and
// the two service hubs) collect the many specific "cluster" articles that share
// their topic. Each cluster article links up to its pillar (and to topical
// siblings); each pillar lists its clusters. Built entirely at build time from
// the existing pages — posts.json is never modified.
type PillarDef = { path: string; label: string; brand?: string; device?: string };
const PILLAR_DEFS: PillarDef[] = [
  // brand + device hubs (most specific — preferred)
  { path: "/samsung/mobile/", label: "تعمیر گوشی سامسونگ", brand: "samsung", device: "mobile" },
  { path: "/samsung/tablet/", label: "تعمیر تبلت سامسونگ", brand: "samsung", device: "tablet" },
  { path: "/samsung/smart-watch/", label: "تعمیر ساعت هوشمند سامسونگ", brand: "samsung", device: "watch" },
  { path: "/samsung/tv/", label: "تعمیر تلویزیون سامسونگ", brand: "samsung", device: "tv" },
  { path: "/samsung/lap-top/", label: "تعمیر لپ تاپ سامسونگ", brand: "samsung", device: "laptop" },
  { path: "/xiaomi/mobile/", label: "تعمیر گوشی شیائومی", brand: "xiaomi", device: "mobile" },
  { path: "/xiaomi/tablet/", label: "تعمیر تبلت شیائومی", brand: "xiaomi", device: "tablet" },
  { path: "/xiaomi/smart-watch/", label: "تعمیر ساعت هوشمند شیائومی", brand: "xiaomi", device: "watch" },
  { path: "/xiaomi/tv/", label: "تعمیر تلویزیون شیائومی", brand: "xiaomi", device: "tv" },
  { path: "/xiaomi/lap-top/", label: "تعمیر لپ تاپ شیائومی", brand: "xiaomi", device: "laptop" },
  { path: "/apple/mobile-2/", label: "تعمیر گوشی آیفون", brand: "apple", device: "mobile" },
  { path: "/apple/ipad/", label: "تعمیر آیپد", brand: "apple", device: "tablet" },
  { path: "/apple/apple-watch/", label: "تعمیر اپل واچ", brand: "apple", device: "watch" },
  { path: "/apple/apple-tv2/", label: "تعمیر تلویزیون اپل", brand: "apple", device: "tv" },
  { path: "/apple/macbook/", label: "تعمیر مک بوک", brand: "apple", device: "laptop" },
  { path: "/huawei/mobile/", label: "تعمیر گوشی هواوی", brand: "huawei", device: "mobile" },
  { path: "/huawei/tablet/", label: "تعمیر تبلت هواوی", brand: "huawei", device: "tablet" },
  { path: "/huawei/smart-watch/", label: "تعمیر ساعت هوشمند هواوی", brand: "huawei", device: "watch" },
  { path: "/htc/mobile/", label: "تعمیر گوشی اچ تی سی", brand: "htc", device: "mobile" },
  { path: "/htc/tablet-repair/", label: "تعمیر تبلت اچ تی سی", brand: "htc", device: "tablet" },
  { path: "/htc/smart-watch/", label: "تعمیر ساعت هوشمند اچ تی سی", brand: "htc", device: "watch" },
  { path: "/asus/mobile/", label: "تعمیر گوشی ایسوس", brand: "asus", device: "mobile" },
  { path: "/asus/tablet-2/", label: "تعمیر تبلت ایسوس", brand: "asus", device: "tablet" },
  { path: "/asus/lap-top-2/", label: "تعمیر لپ تاپ ایسوس", brand: "asus", device: "laptop" },
  { path: "/lenovo/lap-top/", label: "تعمیر لپ تاپ لنوو", brand: "lenovo", device: "laptop" },
  { path: "/lenovo/tablet/", label: "تعمیر تبلت لنوو", brand: "lenovo", device: "tablet" },
  { path: "/hp/lap-top/", label: "تعمیر لپ تاپ اچ پی", brand: "hp", device: "laptop" },
  { path: "/hp/tablet/", label: "تعمیر تبلت اچ پی", brand: "hp", device: "tablet" },
  { path: "/dell/lap-top/", label: "تعمیر لپ تاپ دل", brand: "dell", device: "laptop" },
  { path: "/sony/tablet/", label: "تعمیر تبلت سونی", brand: "sony", device: "tablet" },
  { path: "/sony/lap-top/", label: "تعمیر لپ تاپ سونی", brand: "sony", device: "laptop" },
  { path: "/sony/tv/", label: "تعمیر تلویزیون سونی", brand: "sony", device: "tv" },
  { path: "/lap-top-acer/", label: "تعمیر لپ تاپ ایسر", brand: "acer", device: "laptop" },
  // brand hubs
  { path: "/samsung/", label: "نمایندگی سامسونگ", brand: "samsung" },
  { path: "/xiaomi/", label: "نمایندگی شیائومی", brand: "xiaomi" },
  { path: "/apple/", label: "نمایندگی اپل", brand: "apple" },
  { path: "/huawei/", label: "نمایندگی هواوی", brand: "huawei" },
  { path: "/asus/", label: "نمایندگی ایسوس", brand: "asus" },
  { path: "/lenovo/", label: "نمایندگی لنوو", brand: "lenovo" },
  { path: "/hp/", label: "نمایندگی اچ پی", brand: "hp" },
  { path: "/sony/", label: "نمایندگی سونی", brand: "sony" },
  { path: "/dell/", label: "نمایندگی دل", brand: "dell" },
  { path: "/htc/", label: "نمایندگی اچ تی سی", brand: "htc" },
  { path: "/nokia/", label: "نمایندگی نوکیا", brand: "nokia" },
  { path: "/motorola-mobile-repair-center/", label: "تعمیر موتورولا", brand: "motorola" },
  // Acer has no separate brand hub — the laptop page is the brand page, so it
  // serves as both the device pillar above and the brand-wide one here. Without
  // this, an Acer article that names no device ("خدمات پس از فروش ایسر") lands
  // in no cluster at all and falls back to the generic recent-posts list.
  { path: "/lap-top-acer/", label: "تعمیر ایسر", brand: "acer" },
  // service hubs (device only — broadest fallback)
  { path: "/services/category-mobile-phone-repair/", label: "تعمیر موبایل", device: "mobile" },
  { path: "/services/laptop-repair/", label: "تعمیر لپ تاپ", device: "laptop" },
  { path: "/smart-watch-repair/", label: "تعمیر ساعت هوشمند", device: "watch" },
  { path: "/home-appliances/tv-repair-in-tehran/", label: "تعمیر تلویزیون", device: "tv" },
];

// Brand keywords ordered most-specific first.
const BRAND_KW: [string, string[]][] = [
  ["samsung", ["سامسونگ", "samsung", "گلکسی", "galaxy"]],
  ["xiaomi", ["شیائومی", "xiaomi", "poco", "redmi", "پوکو", "ردمی"]],
  ["apple", ["اپل", "آیفون", "ایفون", "iphone", "apple", "مک بوک", "مک بوک", "macbook", "imac", "آیمک", "ایمک", "ipad", "آیپد", "ایپد", "imessage", "آیمسیج", "airpod", "ایرپاد", "اپل واچ"]],
  ["huawei", ["هواوی", "huawei", "honor", "آنر", "nova", "نوا"]],
  ["asus", ["ایسوس", "asus", "zenfone"]],
  ["lenovo", ["لنوو", "lenovo", "thinkpad"]],
  ["hp", ["اچ پی", "اچ پی", "hp ", "pavilion", "probook", "elitebook"]],
  ["sony", ["سونی", "sony", "xperia", "اکسپریا"]],
  ["dell", ["دل ", " دل", "dell", "inspiron", "latitude"]],
  ["htc", ["اچ تی سی", "htc"]],
  ["nokia", ["نوکیا", "nokia"]],
  ["motorola", ["موتورولا", "motorola", "moto "]],
  ["acer", ["ایسر", "acer", "nitro", "نیترو"]],
];
// Device keywords — specific types before the generic "mobile".
const DEVICE_KW: [string, string[]][] = [
  ["laptop", ["لپ تاپ", "لپ تاپ", "لپتاپ", "laptop", "نوت بوک", "notebook", "مک بوک", "macbook"]],
  ["tablet", ["تبلت", "tablet", "ipad", "آیپد", "ایپد"]],
  ["tv", ["تلویزیون", "تلوزیون", "led tv", " tv"]],
  ["watch", ["ساعت هوشمند", "smartwatch", "اسمارت واچ", " watch"]],
  ["mobile", ["گوشی", "موبایل", "mobile", "phone"]],
];

function classify(p: Post): { brand?: string; device?: string } {
  const t = `${p.title} ${p.slugDecoded} ${p.slug}`.toLowerCase();
  let brand: string | undefined;
  let device: string | undefined;
  for (const [b, kws] of BRAND_KW)
    if (kws.some((k) => t.includes(k.toLowerCase()))) {
      brand = b;
      break;
    }
  for (const [d, kws] of DEVICE_KW)
    if (kws.some((k) => t.includes(k.toLowerCase()))) {
      device = d;
      break;
    }
  return { brand, device };
}

// ---------- Mobile repair landing detection ----------
// Every service PAGE whose topic is mobile-phone repair renders with the
// premium MobileRepairLanding layout (ui/Mobile Repair.dc.html). The Persian
// brand label drives the hero copy ("تعمیر تخصصی موبایل {برند}").
const MOBILE_BRAND_FA: [string, string[]][] = [
  ["سامسونگ", ["سامسونگ", "samsung", "گلکسی", "galaxy"]],
  ["آیفون", ["آیفون", "ایفون", "iphone", "اپل", "apple"]],
  ["شیائومی", ["شیائومی", "xiaomi", "پوکو", "poco", "ردمی", "redmi"]],
  ["هواوی", ["هواوی", "هوآوی", "huawei", "آنر", "honor"]],
  ["ناتینگ فون", ["ناتینگ", "nothing"]],
  ["گوگل پیکسل", ["پیکسل", "pixel"]],
  ["نوکیا", ["نوکیا", "nokia"]],
  ["موتورولا", ["موتورولا", "motorola"]],
  ["ایسوس", ["ایسوس", "asus", "zenfone"]],
  ["اچ تی سی", ["اچ تی سی", "htc"]],
  ["اوپو", ["اوپو", "oppo"]],
  ["وان پلاس", ["وان پلاس", "oneplus"]],
  ["ریلمی", ["ریلمی", "realme"]],
  ["سونی", ["سونی", "sony", "اکسپریا", "xperia"]],
  ["زد تی ای", ["زد تی ای", "zte"]],
  ["ورتو", ["ورتو", "vertu"]],
  ["لنوو", ["لنوو", "lenovo"]],
  ["ال جی", ["ال جی", "lg "]],
];

export type MobileRepairInfo = { brandFa: string | null };

/** Non-null when a service PAGE should render the mobile-repair landing. */
export function mobileRepairInfo(post: Post): MobileRepairInfo | null {
  if (post.type !== "page") return null;
  if (classify(post).device !== "mobile") return null;
  const t = `${post.title} ${post.slugDecoded} ${post.slug}`.toLowerCase();
  const hit = MOBILE_BRAND_FA.find(([, kws]) =>
    kws.some((k) => t.includes(k.toLowerCase())),
  );
  return { brandFa: hit ? hit[0] : null };
}

const existingPillars = PILLAR_DEFS.filter((d) => postByPath.has(d.path));
function matchingPillar(p: Post): PillarDef | null {
  const { brand, device } = classify(p);
  if (!brand && !device) return null;
  const find = (pred: (d: PillarDef) => boolean) => existingPillars.find(pred);
  return (
    (brand && device
      ? find((d) => d.brand === brand && d.device === device)
      : undefined) ||
    (brand ? find((d) => d.brand === brand && !d.device) : undefined) ||
    (device ? find((d) => !d.brand && d.device === device) : undefined) ||
    null
  );
}

function pillarForPost(p: Post): PillarDef | null {
  return p.type === "post" ? matchingPillar(p) : null;
}

function pillarForServicePage(p: Post): PillarDef | null {
  if (p.type !== "page" || existingPillars.some((d) => d.path === p.path))
    return null;
  return matchingPillar(p);
}

const pillarByPostId = new Map<number, PillarDef>();
const clusterIndex = new Map<string, Post[]>();
for (const p of POSTS) {
  if (p.type !== "post") continue;
  const pl = pillarForPost(p);
  if (!pl) continue;
  pillarByPostId.set(p.id, pl);
  const arr = clusterIndex.get(pl.path);
  if (arr) arr.push(p);
  else clusterIndex.set(pl.path, [p]);
}

// Root-level WordPress service pages often have no parent even though their
// title/slug clearly belongs to a brand or device hub. Build a second index so
// those pages receive both an inbound hub link and a contextual up-link without
// altering the database content or URL.
const servicePillarByPageId = new Map<number, PillarDef>();
const serviceClusterIndex = new Map<string, Post[]>();
for (const p of POSTS) {
  const pl = pillarForServicePage(p);
  if (!pl) continue;
  servicePillarByPageId.set(p.id, pl);
  const arr = serviceClusterIndex.get(pl.path);
  if (arr) arr.push(p);
  else serviceClusterIndex.set(pl.path, [p]);
}

/** The topical pillar a cluster article belongs to (or null for general posts). */
export function pillarFor(post: Post): { path: string; label: string } | null {
  const pl = pillarByPostId.get(post.id);
  return pl ? { path: pl.path, label: pl.label } : null;
}
/** Cluster articles assigned to a pillar page (newest first), optionally excluding one. */
export function clusterArticles(
  pillarPath: string,
  limit = 12,
  excludeId?: number,
): Post[] {
  const arr = clusterIndex.get(pillarPath) ?? [];
  return (excludeId ? arr.filter((p) => p.id !== excludeId) : arr).slice(0, limit);
}
/** Other cluster articles that share this article's pillar. */
export function clusterSiblings(post: Post, limit = 6): Post[] {
  const pl = pillarByPostId.get(post.id);
  if (!pl) return [];
  return (clusterIndex.get(pl.path) ?? [])
    .filter((p) => p.id !== post.id)
    .slice(0, limit);
}

/** Service/detail pages assigned to a commercial hub (newest first). */
export function clusterServices(pillarPath: string, limit = 60): Post[] {
  return (serviceClusterIndex.get(pillarPath) ?? []).slice(0, limit);
}

/** Commercial hub assigned to a flat service page. */
export function servicePillarFor(
  post: Post,
): { path: string; label: string } | null {
  const pl = servicePillarByPageId.get(post.id);
  return pl ? { path: pl.path, label: pl.label } : null;
}

/** Other service pages that share the same commercial hub. */
export function serviceSiblings(post: Post, limit = 8): Post[] {
  const pl = servicePillarByPageId.get(post.id);
  if (!pl) return [];
  return (serviceClusterIndex.get(pl.path) ?? [])
    .filter((p) => p.id !== post.id)
    // A brand hub's own children are its device hubs and appliance pages, all
    // already listed in its services grid; repeating them here would crowd out
    // the root-level pages that have no other route in. Under a device hub the
    // children ARE the models a reader of a model page wants next, so they stay.
    .filter(
      (p) => pl.device || !p.parent || postById.get(p.parent)?.path !== pl.path,
    )
    .slice(0, limit);
}



export function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function postBySegments(segments: string[]): Post | undefined {
  const p = "/" + segments.join("/") + "/";
  return postByPath.get(p) ?? postByPath.get(safeDecode(p));
}

export function breadcrumbs(post: Post): { title: string; path: string }[] {
  const chain: { title: string; path: string }[] = [];
  const seen = new Set<number>();
  let cur: Post | undefined = post;
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    // Breadcrumbs name each page the way the page names itself — its H1, not
    // the database title, which is written for the SERP.
    chain.unshift({ title: h1For(cur.path, cur.title), path: cur.path });
    cur = cur.parent ? postById.get(cur.parent) : undefined;
  }
  // Flat cluster articles have no parent chain — give them a topical path
  // (خانه › [pillar] › [article]) so the breadcrumb + schema reflect the
  // pillar/cluster structure.
  if (post.type === "post" && chain.length <= 1) {
    const pl = pillarByPostId.get(post.id);
    if (pl && pl.path !== post.path) {
      chain.unshift({ title: pl.label, path: pl.path });
    }
  }
  return chain;
}

export function recentPosts(n: number, withImage = false): Post[] {
  const base = withImage ? ARTICLE_POSTS.filter((p) => p.image) : ARTICLE_POSTS;
  return base.slice(0, n);
}

export function readingMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}

// Related internal links: sibling items from the same nav group (for strong,
// contextual internal linking with descriptive anchor text).
export function relatedNavLinks(
  path: string,
): { title: string; slug: string; items: NavChild[] } | null {
  for (const g of NAV) {
    if (g.children.length && g.children.some((c) => c.slug === path)) {
      const items = g.children.filter((c) => c.slug !== path);
      if (items.length) return { title: hubLabel(g.slug, g.title), slug: g.slug, items };
    }
  }
  return null;
}

// Same-brand device cluster for a hub PAGE (e.g. /samsung/mobile/): its parent
// brand hub plus the sibling device hubs under that brand (/samsung/tv/,
// /samsung/lap-top/ …). This interlinks a brand's device pages horizontally and
// links each up to the brand pillar, completing the brand cluster.
export function pageCluster(
  post: Post,
): { parent: { title: string; path: string } | null; siblings: NavChild[] } {
  if (post.type !== "page" || !post.parent)
    return { parent: null, siblings: [] };
  const parent = postById.get(post.parent);
  if (!parent) return { parent: null, siblings: [] };
  const siblings = POSTS.filter(
    (p) => p.type === "page" && p.parent === parent.id && p.id !== post.id,
  )
    // Cross-brand service hubs (تعمیر تلویزیون, تعمیر لپ تاپ …) are reached from
    // the service nav and the pillar links, not from a sibling list: they are
    // not siblings of a page about one brand's appliance, they are its parent
    // subject. Brand device hubs stay — they really are siblings.
    .filter(
      (p) => !existingPillars.some((d) => d.path === p.path && !d.brand),
    )
    .map((p) => ({ title: linkLabel(p.title), slug: p.path }));
  return {
    parent: { title: hubLabel(parent.path, parent.title), path: parent.path },
    siblings,
  };
}

// Extract FAQ Q&A from content for FAQPage schema (handles native <details>
// and the bare-text WordPress accordion format).
export function extractFaq(html: string): { q: string; a: string }[] {
  const items: { q: string; a: string }[] = [];
  const strip = (s: string) =>
    s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const dre =
    /<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  let m: RegExpExecArray | null;
  while ((m = dre.exec(html))) {
    const q = strip(m[1]);
    const a = strip(m[2]);
    if (q && a) items.push({ q, a });
  }
  // Accordion built as <a ...>question؟</a> followed by <p> answers. The old
  // theme left those triggers without an href, so cleanContent now renders
  // them as <span>; match either shape, or the FAQPage schema vanishes from
  // the brand hubs (it did — dell, hp, htc, lenovo and sony lost it).
  if (items.length === 0) {
    const are =
      /<(?:a|span)[^>]*>([^<]*؟)<\/(?:a|span)>\s*((?:<p>[\s\S]*?<\/p>\s*)+)/gi;
    while ((m = are.exec(html))) {
      const q = strip(m[1]);
      const a = strip(m[2]);
      if (q && a) items.push({ q, a });
    }
  }
  if (items.length === 0) {
    const fi = html.search(/سوالات متداول/);
    if (fi >= 0) {
      const inner = html.slice(fi).replace(/^[\s\S]*?<\/h2>/i, "");
      const re = /([^<]*?؟)\s*((?:<p>[\s\S]*?<\/p>\s*)+)/g;
      let mm: RegExpExecArray | null;
      while ((mm = re.exec(inner))) {
        const q = mm[1].split("\n").map((s) => s.trim()).filter(Boolean).pop();
        if (q) items.push({ q, a: strip(mm[2]) });
      }
    }
  }
  return items;
}

// ---------- Navigation ----------
// Links point to the EXACT WordPress page URLs (verified to exist).
export type NavChild = { title: string; slug: string };
export type NavItem = {
  title: string;
  slug: string;
  icon: string;
  blurb?: string;
  children: NavChild[];
  /**
   * Hide from the desktop nav bar. Ten top-level links wrapped onto two lines
   * and broke words apart; secondary destinations move to the utility bar,
   * mega menus and footer instead, while staying in the mobile menu.
   */
  secondary?: boolean;
};

export const NAV: NavItem[] = [
  // The logo already links home, so this stays out of the desktop bar.
  { title: "خانه", slug: "/", icon: "Home", children: [], secondary: true },
  {
    title: "تعمیرات موبایل",
    slug: "/services/category-mobile-phone-repair/",
    icon: "Smartphone",
    blurb: "تعمیر تخصصی گوشی همه برندها با قطعات اصل",
    children: [
      { title: "تعمیرات موبایل (همه برندها)", slug: "/services/category-mobile-phone-repair/" },
      { title: "تعمیر گوشی سامسونگ", slug: "/samsung/mobile/" },
      { title: "تعمیر گوشی شیائومی", slug: "/xiaomi/mobile/" },
      { title: "تعمیر گوشی آیفون", slug: "/apple/mobile-2/" },
      { title: "تعمیر گوشی هواوی", slug: "/huawei/mobile/" },
      { title: "تعمیر گوشی اچ تی سی", slug: "/htc/mobile/" },
      { title: "تعمیر گوشی ایسوس", slug: "/asus/mobile/" },
      { title: "تعمیر گوشی نوکیا", slug: "/nokia/" },
      { title: "تعمیر گوشی ناتینگ فون", slug: "/nothingphone-repair/" },
      { title: "تعمیر گوشی گوگل پیکسل", slug: "/google-pixel-mobile-phone-repair/" },
      { title: "تعمیر گوشی موتورولا", slug: "/motorola-mobile-repair-center/" },
    ],
  },
  {
    title: "تعمیرات لپ تاپ",
    slug: "/services/laptop-repair/",
    icon: "Laptop",
    blurb: "تعمیر مادربرد، صفحه نمایش و آب خوردگی همه برندها",
    children: [
      { title: "تعمیرات لپ تاپ (همه برندها)", slug: "/services/laptop-repair/" },
      { title: "تعمیر لپ تاپ ایسوس", slug: "/asus/lap-top-2/" },
      { title: "تعمیر لپ تاپ لنوو", slug: "/lenovo/lap-top/" },
      { title: "تعمیر لپ تاپ اچ پی", slug: "/hp/lap-top/" },
      { title: "تعمیر لپ تاپ دل", slug: "/dell/lap-top/" },
      { title: "تعمیر لپ تاپ ایسر", slug: "/lap-top-acer/" },
      { title: "تعمیر لپ تاپ سونی", slug: "/sony/lap-top/" },
      { title: "تعمیر لپ تاپ سامسونگ", slug: "/samsung/lap-top/" },
      { title: "تعمیر لپ تاپ شیائومی", slug: "/xiaomi/lap-top/" },
      { title: "تعمیر مک بوک", slug: "/apple/macbook/" },
    ],
  },
  {
    title: "نمایندگی ها",
    slug: "/agency/",
    icon: "Building2",
    blurb: "نمایندگی تخصصی تعمیرات برندهای معتبر",
    children: [
      { title: "سایر نمایندگی ها", slug: "/agency/" },
      { title: "نمایندگی سامسونگ", slug: "/samsung/" },
      { title: "نمایندگی شیائومی", slug: "/xiaomi/" },
      { title: "نمایندگی اپل", slug: "/apple/" },
      { title: "نمایندگی ایسوس", slug: "/asus/" },
      { title: "نمایندگی لنوو", slug: "/lenovo/" },
      { title: "نمایندگی اچ پی", slug: "/hp/" },
      { title: "نمایندگی هوآوی", slug: "/huawei/" },
      { title: "نمایندگی سونی", slug: "/sony/" },
      { title: "نمایندگی دل", slug: "/dell/" },
      { title: "نمایندگی اچ تی سی", slug: "/htc/" },
      { title: "نمایندگی نوکیا", slug: "/nokia/" },
    ],
  },
  {
    title: "خدمات تعمیر",
    slug: "/repairs/",
    icon: "Wrench",
    blurb: "همه خدمات بر اساس نوع ایراد دستگاه",
    children: [
      { title: "همه خدمات تعمیر", slug: "/repairs/" },
      { title: "تعویض ال سی دی و تاچ", slug: "/repairs/lcd-replacement/" },
      { title: "تعویض باتری", slug: "/repairs/battery-replacement/" },
      { title: "تعمیر برد و مادربرد", slug: "/repairs/board-repair/" },
      { title: "تعمیر آب خوردگی", slug: "/repairs/water-damage/" },
      { title: "تعویض درب پشت و قاب", slug: "/repairs/back-cover-replacement/" },
      { title: "تعمیر دوربین", slug: "/repairs/camera-repair/" },
      // NOTE: every slug here must be a route that actually builds. Repair-type
      // hubs only render above the LIVE_REPAIR_TYPES threshold (6+ collected
      // pages), so "تعمیر سوکت شارژ" is deliberately absent — only 2 articles
      // match it, so /repairs/charging-port-repair/ is never generated and the
      // menu link 404'd. Re-add it once enough charging-port pages exist.
      { title: "تعمیر اسپیکر و میکروفون", slug: "/repairs/speaker-microphone-repair/" },
      { title: "تعمیر نرم افزاری و فلش", slug: "/repairs/software-repair/" },
      { title: "تعمیر کیبورد لپ تاپ", slug: "/repairs/keyboard-repair/" },
      { title: "رفع داغ شدن و سرویس فن", slug: "/repairs/overheating-fan-repair/" },
    ],
  },
  // Conversion tools live in the dark utility bar above the nav.
  {
    title: "عیب یابی آنلاین",
    slug: "/online-diagnosis/",
    icon: "Stethoscope",
    children: [],
    secondary: true,
  },
  {
    title: "ثبت درخواست",
    slug: "/online-repair-request/",
    icon: "Wrench",
    children: [],
    secondary: true,
  },
  { title: "مقالات", slug: "/blog", icon: "Newspaper", children: [] },
  { title: "درباره ما", slug: "/about/", icon: "Info", children: [], secondary: true },
  { title: "تماس با ما", slug: "/contact/", icon: "Phone", children: [] },
];
