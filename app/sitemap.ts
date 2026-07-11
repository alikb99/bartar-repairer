import type { MetadataRoute } from "next";
import { POSTS, ARTICLE_POSTS } from "@/lib/content";
import { SITE } from "@/lib/data";
import { PER_PAGE } from "@/components/BlogListing";

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
  "/agency/", "/contact/",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE.domain}/`, lastModified: now, priority: 1 },
    { url: `${SITE.domain}/blog/`, lastModified: now, priority: 0.8 },
  ];

  // paginated blog listing pages (page 2 … N)
  const blogPages = Math.ceil(ARTICLE_POSTS.length / PER_PAGE);
  for (let n = 2; n <= blogPages; n++) {
    entries.push({
      url: `${SITE.domain}/blog/page/${n}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.3,
    });
  }

  for (const p of POSTS) {
    const priority = MONEY_PAGES.has(p.path)
      ? 0.9
      : p.type === "page"
        ? 0.7
        : 0.6;
    entries.push({
      url: `${SITE.domain}${encodeURI(p.path)}`,
      lastModified: new Date(p.modified.replace(" ", "T")),
      changeFrequency: p.type === "post" ? "monthly" : "weekly",
      priority,
    });
  }

  return entries;
}
