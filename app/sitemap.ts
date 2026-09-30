import type { MetadataRoute } from "next";
import { POSTS, ARTICLE_POSTS, CANONICAL_TO } from "@/lib/content";
import { LIVE_REPAIR_TYPES } from "@/lib/repair-types";
import { LIVE_SERVICE_AREAS } from "@/lib/service-areas";
import { SITE } from "@/lib/data";
import { CLUSTER_REVISED } from "@/lib/recovered-revised";
import { PER_PAGE } from "@/components/BlogListing";
import { PEOPLE } from "@/lib/team";

export const dynamic = "force-static";

// High-value commercial pages (brand hubs, brand+device hubs, service hubs and
// flagship landings). They get a higher sitemap priority so crawl budget leans
// toward the pages that actually convert.
const MONEY_PAGES = new Set([
  "/samsung/", "/xiaomi/", "/apple/", "/huawei/", "/asus/", "/lenovo/",
  "/hp/", "/sony/", "/dell/", "/htc/", "/nokia/",
  "/samsung/mobile/", "/samsung/tv/", "/samsung/lap-top/",
  "/xiaomi/mobile/", "/xiaomi/lap-top/",
  "/apple/mobile-2/", "/apple/macbook/",
  "/huawei/mobile/", "/htc/mobile/", "/asus/mobile/", "/asus/lap-top-2/",
  "/lenovo/lap-top/", "/hp/lap-top/", "/dell/lap-top/",
  "/sony/lap-top/", "/sony/tv/", "/lap-top-acer/",
  "/motorola-mobile-repair-center/", "/nothingphone-repair/",
  "/google-pixel-mobile-phone-repair/",
  "/services/category-mobile-phone-repair/", "/services/laptop-repair/",
  "/agency/", "/contact/", "/online-repair-request/",
]);
// Mirrors NOINDEX_PAGES in app/[...slug]/page.tsx — a noindex page must not be
// advertised in the sitemap.
const NOINDEX_PATHS = new Set([
  "/home/",
  "/تست-المنتور/",
  "/home-appliances/air-conditioner-repair-agency/",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  // An enrichment batch rewrites the body without touching the WordPress
  // `modified` column, so the raw value understates when the page last changed
  // and Google stops re-crawling it. CLUSTER_REVISED carries the real date.
  const modifiedOf = (p: { path: string; modified: string }): Date => {
    const revised = CLUSTER_REVISED[p.path];
    return new Date(revised ?? p.modified.replace(" ", "T"));
  };
  // The /blog/ listing dates from when its newest ARTICLE was published, not
  // from when some article on it was later revised — deliberately the raw
  // column, so a body rewrite does not keep re-dating the archive.
  const latestModified = (posts: typeof ARTICLE_POSTS): Date | undefined => {
    const times = posts
      .map((p) => new Date(p.modified.replace(" ", "T")).getTime())
      .filter(Number.isFinite);
    return times.length ? new Date(Math.max(...times)) : undefined;
  };
  const firstPageModified = latestModified(ARTICLE_POSTS.slice(0, PER_PAGE));
  // Order matters: this list is emitted verbatim, and the deployed sitemap has
  // this exact sequence. Keep the frozen public/ pages where they are.
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE.domain}/`, priority: 1 },
    {
      url: `${SITE.domain}/blog/`,
      ...(firstPageModified ? { lastModified: firstPageModified } : {}),
      priority: 0.8,
    },
    {
      url: `${SITE.domain}/online-diagnosis/`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${SITE.domain}/app/`, changeFrequency: "monthly", priority: 0.7 },
    // Crawlable HTML directory: one shallow inbound link to every service page
    // and article, so no page depends on deep blog pagination for discovery.
    {
      url: `${SITE.domain}/directory/`,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    // Declares which other domains this company owns. Low priority as a
    // destination, but it needs to be crawlable: it is the page the schema's
    // subOrganization edge is asking a reviewer to verify.
    {
      url: `${SITE.domain}/group/`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    // Pages shipped as pre-rendered HTML from public/ rather than as routes
    // (see docs/frozen-pages.md). They are indexable and must appear
    // here, but nothing in POSTS knows about them.
    {
      url: `${SITE.domain}/acer/`,
      lastModified: new Date("2026-08-13"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${SITE.domain}/team/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.domain}/warranty/`, changeFrequency: "monthly", priority: 0.7 },
    ...PEOPLE.map((p) => ({
      url: `${SITE.domain}/team/${p.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE.domain}/prices/`, changeFrequency: "weekly", priority: 0.9 },
    {
      url: `${SITE.domain}/mobile-repair-online/`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Repair-type hubs: commercial cross-brand landing pages.
    { url: `${SITE.domain}/repairs/`, changeFrequency: "weekly", priority: 0.9 },
    ...LIVE_REPAIR_TYPES.map((t) => ({
      url: `${SITE.domain}/repairs/${t.slug}/`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    // Service-area hubs: local landing pages for each covered neighbourhood.
    { url: `${SITE.domain}/areas/`, changeFrequency: "monthly", priority: 0.8 },
    ...LIVE_SERVICE_AREAS.map((a) => ({
      url: `${SITE.domain}/areas/${a.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
  const seen = new Set(entries.map((entry) => entry.url));

  // Paginated blog listings (/blog/page/2… ) are deliberately absent: they are
  // noindex, and a sitemap must never advertise a URL that says noindex.
  // Google still reaches them by following /blog/, and every article they list
  // is in the sitemap under its own URL.

  for (const p of POSTS) {
    if (NOINDEX_PATHS.has(p.path)) continue;
    // Never advertise a URL that canonicalises to a different page.
    if (CANONICAL_TO[p.path]) continue;
    const url = `${SITE.domain}${encodeURI(p.path)}`;
    // /blog/ is served by the real archive route and the database contains a
    // duplicate /repair-iphone-7plus/ record. Keep one canonical URL each.
    if (seen.has(url)) continue;
    seen.add(url);
    const priority = MONEY_PAGES.has(p.path)
      ? 0.9
      : p.type === "page"
        ? 0.7
        : 0.6;
    entries.push({
      url,
      lastModified: modifiedOf(p),
      changeFrequency: p.type === "post" ? "monthly" : "weekly",
      priority,
    });
  }

  return entries;
}
