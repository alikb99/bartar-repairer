// Server-only content layer built from the extracted WordPress database.
// Loaded via fs at build time (SSG) so the dataset never reaches the client
// bundle. Pages keep their EXACT hierarchical WordPress URLs and content.
import fs from "node:fs";
import path from "node:path";
import { SITE } from "./data";

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
const deZwnj = (s: string): string => (s ? s.replace(/‌/g, " ") : s);
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
  if (!clean.startsWith("/wp-content/")) return true; // external / non-upload
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
  ["/acer/", "/lap-top-acer/"],
  ["/acer-tablet-board-repair/", "/acer-tablet-boardrepair/"],
  ["/repair-honor-9x/", "/repair-honor9x/"],
  [
    "/services/category-mobile-phone-repair/oppo-repair/oppo-reno-10-phone-repair/",
    "/services/category-mobile-phone-repair/oppo-repair/oppo-reno-10-phonerepair/",
  ],
  ["/xiaomi-mobile-lcd-replacement/", "/xiaomi-mobile-lcdreplacement/"],
  ["/xiaomi/mobile/repair-xiaomi-battery/", "/repair-xiaomi-battery/"],
  ["/xiaomi/mobile/xiaomi-phone-lcd-repair/", "/xiaomi-phone-lcd-repair/"],
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
  out = out.replace(/<figure\b[^>]*>\s*(?:<figcaption[^>]*>\s*<\/figcaption>)?\s*<\/figure>/gi, "");
  out = out.replace(/<img /gi, '<img loading="lazy" decoding="async" ');
  // Wrap tables so they scroll inside their box instead of overflowing the page.
  out = out
    .replace(/<table/gi, '<div class="table-wrap"><table')
    .replace(/<\/table>/gi, "</table></div>");
  return out;
}

const escAttr = (s: string) => s.replace(/"/g, "&quot;").trim();
// Add alt text (from the page title) to any image missing it.
function addAltText(html: string, title: string): string {
  return html.replace(
    /<img(?![^>]*\balt=)([^>]*?)>/gi,
    (_m, attrs) => `<img${attrs} alt="${escAttr(title)}">`,
  );
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
  // Acer (no standalone /acer/ page — the Acer hub is /lap-top-acer/)
  ["نمایندگی تعمیرات ایسر", "/lap-top-acer/"],
  ["تعمیر لپ تاپ ایسر", "/lap-top-acer/"],
  ["نمایندگی ایسر", "/lap-top-acer/"],
  ["تعمیرات ایسر", "/lap-top-acer/"],
  ["تعمیر ایسر", "/lap-top-acer/"],
  // Sony
  ["تعمیر لپ تاپ سونی", "/sony/lap-top/"],
  ["تعمیر تلویزیون سونی", "/sony/tv/"],
  ["نمایندگی سونی", "/sony/"],
  ["تعمیرات سونی", "/sony/"],
  // Lenovo
  ["تعمیر لپ تاپ لنوو", "/lenovo/lap-top/"],
  ["نمایندگی لنوو", "/lenovo/"],
  ["تعمیرات لنوو", "/lenovo/"],
  // Dell
  ["تعمیر لپ تاپ دل", "/dell/lap-top/"],
  ["نمایندگی دل", "/dell/"],
  ["تعمیرات دل", "/dell/"],
  // Nokia
  ["تعمیر گوشی نوکیا", "/nokia/"],
  ["نمایندگی نوکیا", "/nokia/"],
  ["تعمیرات نوکیا", "/nokia/"],
  // HTC
  ["تعمیر گوشی اچ تی سی", "/htc/mobile/"],
  ["تعمیر تبلت اچ تی سی", "/htc/tablet-repair/"],
  ["تعمیر ساعت هوشمند اچ تی سی", "/htc/smart-watch/"],
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

// ---- CTR-focused meta description overrides ----
// Hand-written, click-worthy descriptions for high-impression / low-CTR pages
// (from Search Console). Titles are left untouched; only the description meta
// is replaced to lift SERP click-through.
const META_OVERRIDES: Record<string, string> = {
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
    "نمایندگی تعمیرات سامسونگ در تهران؛ تعمیر گوشی، تبلت، تلویزیون و لپ تاپ سامسونگ با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی همراه پیک رایگان.",
  "/apple/":
    "نمایندگی تعمیرات اپل در تهران؛ تعمیر تخصصی آیفون، آیپد، مک بوک و اپل واچ با قطعات اصل و ۶ ماه گارانتی، عیب یابی رایگان و دریافت پیک رایگان.",
  "/huawei/":
    "نمایندگی تعمیرات هواوی در تهران؛ تعمیر گوشی، تبلت و لپ تاپ هواوی و آنر با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی همراه پیک رایگان.",
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

function linkifyInternal(html: string, selfPath: string): string {
  const targets = INTERNAL_LINKS.filter(([, path]) => path !== selfPath);
  const linked = new Set<string>();
  let added = 0;
  const MAX = 8;
  return html.replace(
    /(<p\b[^>]*>)([\s\S]*?)(<\/p>)/gi,
    (m, open: string, inner: string, close: string) => {
      if (added >= MAX) return m;
      if (/<a\b/i.test(inner)) return m; // never touch paragraphs that already link
      for (const [phrase, path] of targets) {
        if (linked.has(path)) continue;
        const idx = inner.indexOf(phrase);
        if (idx >= 0) {
          inner =
            inner.slice(0, idx) +
            `<a href="${path}">${phrase}</a>` +
            inner.slice(idx + phrase.length);
          linked.add(path);
          added++;
          break; // at most one injected link per paragraph
        }
      }
      return open + inner + close;
    },
  );
}

export const POSTS: Post[] = raw.map((p) => {
  const segments = buildSegments(p);
  const selfPath = "/" + segments.join("/") + "/";
  let content = addAltText(cleanContent(p.content), p.title);
  // Only enrich article bodies; brand landing pages are parsed structurally.
  if (p.type === "post") content = linkifyInternal(content, selfPath);
  if (p.type === "post") content = appendArticleUpdate(selfPath, content);
  // Ignore Yoast description templates (e.g. %%excerpt%%) — fall back to real text.
  const cleanSeoDesc = p.seoDesc && !p.seoDesc.includes("%%") ? p.seoDesc : "";
  const metaDesc = clampDesc(
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
    metaTitle: deZwnj(resolveTitle(p.seoTitle, p.title)),
    metaDesc: deZwnj(metaDesc),
  };
});

// Guarantee unique <title> values (disambiguate with parent brand, then city,
// then a counter as a last resort).
{
  const used = new Set<string>();
  for (const p of POSTS) {
    let t = p.metaTitle;
    if (used.has(t)) {
      const parent = p.parent ? rawById.get(p.parent) : undefined;
      const brand = parent
        ? deZwnj(parent.title).split(/[|\-–—]/)[0].trim().split(/\s+/).slice(0, 3).join(" ")
        : "";
      const candidates = [
        brand ? `${t} | ${brand}` : "",
        `${t} | ${SITE.city}`,
      ].filter(Boolean);
      let chosen = candidates.find((c) => !used.has(c));
      if (!chosen) {
        let n = 2;
        while (used.has(`${t} (${n})`)) n++;
        chosen = `${t} (${n})`;
      }
      t = chosen;
    }
    used.add(t);
    p.metaTitle = t;
  }
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

const existingPillars = PILLAR_DEFS.filter((d) => postByPath.has(d.path));
function pillarForPost(p: Post): PillarDef | null {
  if (p.type !== "post") return null;
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
    chain.unshift({ title: cur.title, path: cur.path });
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
): { title: string; items: NavChild[] } | null {
  for (const g of NAV) {
    if (g.children.length && g.children.some((c) => c.slug === path)) {
      const items = g.children.filter((c) => c.slug !== path);
      if (items.length) return { title: g.title, items };
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
  ).map((p) => ({ title: p.title, slug: p.path }));
  // Short brand label: drop trailing marketing clauses ("… با گارانتی معتبر")
  // and separators so headings/anchors stay concise.
  const label = parent.title
    .split(/\s+با\s+|\s*[|،–—-]\s*/)[0]
    .trim();
  return { parent: { title: label || parent.title, path: parent.path }, siblings };
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
  // accordion built as <a ...>question؟</a> followed by <p> answers
  if (items.length === 0) {
    const are = /<a[^>]*>([^<]*؟)<\/a>\s*((?:<p>[\s\S]*?<\/p>\s*)+)/gi;
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
};

export const NAV: NavItem[] = [
  { title: "خانه", slug: "/", icon: "Home", children: [] },
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
  { title: "مقالات", slug: "/blog", icon: "Newspaper", children: [] },
  { title: "درباره ما", slug: "/about/", icon: "Info", children: [] },
  { title: "تماس با ما", slug: "/contact/", icon: "Phone", children: [] },
];
