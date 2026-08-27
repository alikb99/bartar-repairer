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
export type DirGroup = { slug: string; title: string; items: DirLink[] };

// Brand / category buckets for SERVICE pages. First match wins, so the order is
// most-specific first. `re` is tested against the path + title together.
// `slug` is the URL segment of the group's own /directory/{slug}/ page.
const SERVICE_BUCKETS: { slug: string; title: string; re: RegExp }[] = [
  { slug: "samsung", title: "سامسونگ", re: /\/samsung\/|سامسونگ|\bsamsung\b|گلکسی|\bgalaxy\b/i },
  { slug: "apple", title: "اپل و آیفون", re: /\/apple\/|آیفون|اپل|\bapple\b|\biphone\b|مک ?بوک|\bmacbook\b|آیپد|\bipad\b|اپل ?واچ/i },
  { slug: "xiaomi", title: "شیائومی", re: /\/xiaomi\/|شیائومی|\bxiaomi\b|redmi|ردمی|poco|\bmi ?\d/i },
  { slug: "huawei", title: "هواوی", re: /\/huawei\/|هواوی|هوآوی|\bhuawei\b|آنر|\bhonor\b/i },
  { slug: "asus", title: "ایسوس", re: /\/asus\/|ایسوس|\basus\b|zenfone|\brog\b|\btuf\b/i },
  { slug: "lenovo", title: "لنوو", re: /\/lenovo\/|لنوو|\blenovo\b/i },
  { slug: "hp", title: "اچ پی", re: /\/hp\/|اچ ?پی|\bhp\b|\bomen\b|پاویون|probook|elitebook/i },
  { slug: "dell", title: "دل", re: /\/dell\/|\bdell\b|(^|[^ی])دل(\b| )/i },
  { slug: "sony", title: "سونی", re: /\/sony\/|سونی|\bsony\b|vaio|وایو/i },
  { slug: "acer", title: "ایسر", re: /acer|ایسر|nitro|aspire|predator/i },
  { slug: "htc", title: "اچ تی سی", re: /\/htc\/|اچ ?تی ?سی|\bhtc\b|desire|wildfire/i },
  { slug: "nokia", title: "نوکیا", re: /\/nokia\/|نوکیا|\bnokia\b/i },
  { slug: "motorola", title: "موتورولا", re: /موتورولا|motorola|\bmoto\b/i },
  { slug: "google-pixel", title: "گوگل پیکسل", re: /پیکسل|\bpixel\b/i },
  { slug: "nothing-phone", title: "ناتینگ فون", re: /ناتینگ|nothing/i },
  { slug: "home-appliances", title: "لوازم خانگی و سایر دستگاه ها", re: /\/home-appliances\/|کولر|تلویزیون|\btv\b|کنسول|console|لوازم خانگی|ماشین لباسشویی|یخچال|جاروبرقی/i },
];

const SERVICE_OTHER = { slug: "other-services", title: "سایر خدمات و مدل ها" };
const ARTICLE_OTHER = {
  slug: "guides-general",
  title: "راهنماهای عمومی و سایر مقالات",
};

function serviceBucket(p: Post): string {
  const hay = `${p.path} ${p.title}`;
  for (const b of SERVICE_BUCKETS) if (b.re.test(hay)) return b.slug;
  return SERVICE_OTHER.slug;
}

// Stable display order: named brand buckets first (in declared order), then the
// two catch-alls last. Keyed by slug so a group and its page always agree.
const SERVICE_ORDER = [
  ...SERVICE_BUCKETS.map((b) => b.slug),
  SERVICE_OTHER.slug,
];
const SERVICE_TITLE = new Map<string, string>([
  ...SERVICE_BUCKETS.map((b) => [b.slug, b.title] as [string, string]),
  [SERVICE_OTHER.slug, SERVICE_OTHER.title],
]);

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
  const serviceGroups: DirGroup[] = SERVICE_ORDER.filter((s) =>
    svcMap.has(s),
  ).map((s) => ({
    slug: s,
    title: SERVICE_TITLE.get(s)!,
    items: svcMap
      .get(s)!
      .sort(sortByTitle)
      .map((p) => ({ path: p.path, label: p.title })),
  }));

  // ----- articles grouped by repair type, with a catch-all -----
  // Article group slugs are prefixed so they can never collide with a brand
  // bucket that happens to share a name.
  const artMap = new Map<string, Post[]>();
  for (const t of REPAIR_TYPES) artMap.set(`guides-${t.slug}`, []);
  artMap.set(ARTICLE_OTHER.slug, []);
  const artTitle = new Map<string, string>([
    ...REPAIR_TYPES.map((t) => [`guides-${t.slug}`, t.title] as [string, string]),
    [ARTICLE_OTHER.slug, ARTICLE_OTHER.title],
  ]);
  for (const p of articles) {
    const t = repairTypesFor(p)[0];
    artMap.get(t ? `guides-${t.slug}` : ARTICLE_OTHER.slug)!.push(p);
  }
  const artOrder = [
    ...REPAIR_TYPES.map((t) => `guides-${t.slug}`),
    ARTICLE_OTHER.slug,
  ];
  const articleGroups: DirGroup[] = artOrder
    .filter((s) => (artMap.get(s)?.length ?? 0) > 0)
    .map((s) => ({
      slug: s,
      title: artTitle.get(s)!,
      items: artMap
        .get(s)!
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

/** Every directory group, services first — one per /directory/{slug}/ page. */
export function directoryGroups(): DirGroup[] {
  const { serviceGroups, articleGroups } = buildDirectory();
  return [...serviceGroups, ...articleGroups];
}

/** One directory group by its URL segment. */
export function directoryGroupBy(slug: string): DirGroup | undefined {
  return directoryGroups().find((g) => g.slug === slug);
}
