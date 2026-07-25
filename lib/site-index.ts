// ---------- HTML directory (crawlable full-site index) ----------
// A single page that links EVERY indexable service page and article, grouped
// for readability. It exists because the reverse-chronological blog pagination
// left ~150 pages reachable only from a deep /blog/page/N/ that Google rarely
// crawls; a directory linked from the sitewide footer gives every URL one
// shallow, crawlable inbound link so nothing depends on pagination depth.
//
// Built entirely from POSTS at build time — no database content is modified and
// no URL changes. Grouping is for humans only; the invariant that matters is
// that every indexable post appears exactly once.
import { POSTS, CANONICAL_TO, type Post } from "./content";
import { REPAIR_TYPES, repairTypesFor } from "./repair-types";

// Mirrors the exclusions in app/sitemap.ts / app/[...slug]/page.tsx: noindex
// placeholders, canonicalised duplicates and the empty /blog/ WordPress stub
// (served by the real archive route) never earn a directory link.
const EXCLUDE = new Set([
  "/home/",
  "/تست-المنتور/",
  "/blog/",
  "/home-appliances/air-conditioner-repair-agency/",
]);

export type DirLink = { path: string; label: string };
export type DirGroup = { title: string; items: DirLink[] };

// Brand / category buckets for SERVICE pages. First match wins, so the order is
// most-specific first. `re` is tested against the path + title together.
const SERVICE_BUCKETS: { title: string; re: RegExp }[] = [
  { title: "سامسونگ", re: /\/samsung\/|سامسونگ|\bsamsung\b|گلکسی|\bgalaxy\b/i },
  { title: "اپل و آیفون", re: /\/apple\/|آیفون|اپل|\bapple\b|\biphone\b|مک ?بوک|\bmacbook\b|آیپد|\bipad\b|اپل ?واچ/i },
  { title: "شیائومی", re: /\/xiaomi\/|شیائومی|\bxiaomi\b|redmi|ردمی|poco|\bmi ?\d/i },
  { title: "هواوی", re: /\/huawei\/|هواوی|هوآوی|\bhuawei\b|آنر|\bhonor\b/i },
  { title: "ایسوس", re: /\/asus\/|ایسوس|\basus\b|zenfone|\brog\b|\btuf\b/i },
  { title: "لنوو", re: /\/lenovo\/|لنوو|\blenovo\b/i },
  { title: "اچ پی", re: /\/hp\/|اچ ?پی|\bhp\b|\bomen\b|پاویون|probook|elitebook/i },
  { title: "دل", re: /\/dell\/|\bdell\b|(^|[^ی])دل(\b| )/i },
  { title: "سونی", re: /\/sony\/|سونی|\bsony\b|vaio|وایو/i },
  { title: "ایسر", re: /acer|ایسر|nitro|aspire|predator/i },
  { title: "اچ تی سی", re: /\/htc\/|اچ ?تی ?سی|\bhtc\b|desire|wildfire/i },
  { title: "نوکیا", re: /\/nokia\/|نوکیا|\bnokia\b/i },
  { title: "موتورولا", re: /موتورولا|motorola|\bmoto\b/i },
  { title: "گوگل پیکسل", re: /پیکسل|\bpixel\b/i },
  { title: "ناتینگ فون", re: /ناتینگ|nothing/i },
  { title: "لوازم خانگی و سایر دستگاه ها", re: /\/home-appliances\/|کولر|تلویزیون|\btv\b|کنسول|console|لوازم خانگی|ماشین لباسشویی|یخچال|جاروبرقی/i },
];

function serviceBucket(p: Post): string {
  const hay = `${p.path} ${p.title}`;
  for (const b of SERVICE_BUCKETS) if (b.re.test(hay)) return b.title;
  return "سایر خدمات و مدل ها";
}

// Stable display order: named brand buckets first (in declared order), then the
// two catch-alls last.
const SERVICE_ORDER = [
  ...SERVICE_BUCKETS.map((b) => b.title),
  "سایر خدمات و مدل ها",
];

function sortByTitle(a: Post, b: Post) {
  return a.title.localeCompare(b.title, "fa");
}

export function buildDirectory(): {
  serviceGroups: DirGroup[];
  articleGroups: DirGroup[];
  totalServices: number;
  totalArticles: number;
} {
  const indexable = POSTS.filter(
    (p) => !EXCLUDE.has(p.path) && !CANONICAL_TO[p.path],
  );

  const services = indexable.filter((p) => p.type === "page");
  const articles = indexable.filter((p) => p.type === "post");

  // ----- services grouped by brand/category -----
  const svcMap = new Map<string, Post[]>();
  for (const p of services) {
    const k = serviceBucket(p);
    (svcMap.get(k) ?? svcMap.set(k, []).get(k)!).push(p);
  }
  const serviceGroups: DirGroup[] = SERVICE_ORDER.filter((t) => svcMap.has(t)).map(
    (t) => ({
      title: t,
      items: svcMap
        .get(t)!
        .sort(sortByTitle)
        .map((p) => ({ path: p.path, label: p.title })),
    }),
  );

  // ----- articles grouped by repair type, with a catch-all -----
  const OTHER = "راهنماهای عمومی و سایر مقالات";
  const artMap = new Map<string, Post[]>();
  for (const t of REPAIR_TYPES) artMap.set(t.title, []);
  artMap.set(OTHER, []);
  for (const p of articles) {
    const t = repairTypesFor(p)[0];
    artMap.get(t ? t.title : OTHER)!.push(p);
  }
  const artOrder = [...REPAIR_TYPES.map((t) => t.title), OTHER];
  const articleGroups: DirGroup[] = artOrder
    .filter((t) => (artMap.get(t)?.length ?? 0) > 0)
    .map((t) => ({
      title: t,
      items: artMap
        .get(t)!
        .sort(sortByTitle)
        .map((p) => ({ path: p.path, label: p.title })),
    }));

  return {
    serviceGroups,
    articleGroups,
    totalServices: services.length,
    totalArticles: articles.length,
  };
}
