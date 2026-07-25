// ---------- Service-area hubs (third internal-linking axis) ----------
// The site has ~83 neighbourhood pages ("تعمیر لپ تاپ ایسر در صادقیه") that
// each received a single inbound link, leaving them nearly orphaned. Local
// intent ("تعمیر موبایل در ستارخان") is core to this business, so these hubs
// group the pages by area, give every one of them a second inbound link, and
// give the two physical branches a proper local landing surface.
import { POSTS, type Post } from "./content";

export type ServiceArea = {
  /** URL segment under /areas/ */
  slug: string;
  /** Display name */
  name: string;
  /** Title/body phrases that identify a page as serving this area. */
  aliases: string[];
  /** Which branch serves this area — drives the address shown on the hub. */
  branch: "central" | "west";
};

const EXCLUDED = new Set(["/home/", "/تست-المنتور/", "/blog/"]);

export const SERVICE_AREAS: ServiceArea[] = [
  { slug: "sattarkhan", name: "ستارخان", aliases: ["ستارخان"], branch: "west" },
  { slug: "west-tehran", name: "غرب تهران", aliases: ["غرب تهران"], branch: "west" },
  { slug: "niavaran", name: "نیاوران", aliases: ["نیاوران"], branch: "central" },
  { slug: "jomhouri", name: "خیابان جمهوری", aliases: ["جمهوری"], branch: "central" },
  { slug: "east-tehran", name: "شرق تهران", aliases: ["شرق تهران"], branch: "central" },
  { slug: "north-tehran", name: "شمال تهران", aliases: ["شمال تهران"], branch: "central" },
  { slug: "shahrak-gharb", name: "شهرک غرب", aliases: ["شهرک غرب"], branch: "west" },
  { slug: "sadeghieh", name: "صادقیه", aliases: ["صادقیه"], branch: "west" },
  { slug: "tehranpars", name: "تهرانپارس", aliases: ["تهرانپارس", "تهران پارس"], branch: "central" },
  { slug: "golbarg", name: "خیابان گلبرگ", aliases: ["گلبرگ"], branch: "central" },
  { slug: "south-tehran", name: "جنوب تهران", aliases: ["جنوب تهران"], branch: "central" },
  {
    slug: "saadat-abad",
    name: "سعادت آباد",
    aliases: ["سعادت آباد", "سعادت‌آباد"],
    branch: "west",
  },
  { slug: "punak", name: "پونک", aliases: ["پونک"], branch: "west" },
  {
    slug: "ayatollah-kashani",
    name: "آیت الله کاشانی",
    aliases: ["آیت الله کاشانی", "کاشانی"],
    branch: "west",
  },
  { slug: "vanak", name: "ونک", aliases: ["ونک"], branch: "central" },
  { slug: "charsou", name: "چارسو", aliases: ["چارسو"], branch: "central" },
];

const bySlug = new Map(SERVICE_AREAS.map((a) => [a.slug, a]));
const itemsBySlug = new Map<string, Post[]>();
const areasByPostId = new Map<number, ServiceArea[]>();

for (const a of SERVICE_AREAS) itemsBySlug.set(a.slug, []);
for (const p of POSTS) {
  if (EXCLUDED.has(p.path)) continue;
  const matched: ServiceArea[] = [];
  for (const a of SERVICE_AREAS) {
    if (!a.aliases.some((alias) => p.title.includes(alias))) continue;
    matched.push(a);
    itemsBySlug.get(a.slug)!.push(p);
  }
  if (matched.length) areasByPostId.set(p.id, matched.slice(0, 2));
}

/** Service area by URL segment. */
export function serviceAreaBy(slug: string): ServiceArea | undefined {
  return bySlug.get(slug);
}
/** Pages that serve a given area. */
export function serviceAreaContent(slug: string): Post[] {
  return itemsBySlug.get(slug) ?? [];
}
/** Areas a page serves (used for up-links). */
export function serviceAreasFor(post: Post): ServiceArea[] {
  return areasByPostId.get(post.id) ?? [];
}
/** Areas with enough pages to publish as their own hub. */
export const LIVE_SERVICE_AREAS = SERVICE_AREAS.filter(
  (a) => (itemsBySlug.get(a.slug) ?? []).length >= 3,
);
