import Link from "next/link";
import { ArrowUpLeft, Layers } from "lucide-react";
import {
  NAV,
  relatedNavLinks,
  recentPosts,
  clusterSiblings,
  pillarFor,
  pageCluster,
  servicePillarFor,
  serviceSiblings,
  type Post,
} from "@/lib/content";

// Contextual internal links: sibling brand/service pages from the same nav
// group, or — for cluster articles — the topical siblings that share their
// pillar plus an explicit up-link to that pillar. Strong topical interlinking.
export default function RelatedLinks({ post }: { post: Post }) {
  const related = relatedNavLinks(post.path);
  const pillar = post.type === "post" ? pillarFor(post) : null;
  // Same-brand cluster for hub pages: up-link to the brand hub + sibling
  // device hubs (e.g. /samsung/mobile/ → /samsung/, /samsung/tv/ …).
  const cluster = post.type === "page" ? pageCluster(post) : { parent: null, siblings: [] };
  const servicePillar = post.type === "page" ? servicePillarFor(post) : null;

  let title = "خدمات مرتبط";
  let items: { title: string; slug: string }[] = [];
  // Optional "view the hub" up-link shown above the grid.
  let upLink: { title: string; path: string } | null =
    pillar && pillar.path !== post.path
      ? { title: `مشاهده صفحه اصلی: ${pillar.label}`, path: pillar.path }
      : null;

  if (cluster.siblings.length > 0) {
    // Brand hub page: lead with the brand's other device hubs, then fill with
    // cross-brand nav siblings; up-link points to the brand pillar.
    const sib = cluster.siblings.slice(0, 6);
    const navSib = related ? related.items.filter((c) => c.slug !== post.path) : [];
    const merged = [...sib];
    for (const c of navSib) {
      if (merged.length >= 8) break;
      if (!merged.some((m) => m.slug === c.slug)) merged.push(c);
    }
    title = cluster.parent ? `سایر خدمات ${cluster.parent.title}` : "خدمات مرتبط";
    items = merged;
    if (cluster.parent)
      upLink = {
        title: `مشاهده صفحه نمایندگی: ${cluster.parent.title}`,
        path: cluster.parent.path,
      };
  } else if (servicePillar) {
    title = `سایر خدمات ${servicePillar.label}`;
    items = serviceSiblings(post, 8).map((p) => ({
      title: p.title,
      slug: p.path,
    }));
    upLink = {
      title: `مشاهده صفحه اصلی: ${servicePillar.label}`,
      path: servicePillar.path,
    };
  } else if (related) {
    title = `سایر خدمات ${related.title}`;
    items = related.items.slice(0, 8);
  } else if (post.type === "post") {
    const siblings = clusterSiblings(post, 6);
    if (siblings.length >= 2 && pillar) {
      title = `مقالات مرتبط ${pillar.label}`;
      items = siblings.map((p) => ({ title: p.title, slug: p.path }));
    } else {
      title = "مطالب بیشتر";
      items = recentPosts(6)
        .filter((p) => p.id !== post.id)
        .slice(0, 6)
        .map((p) => ({ title: p.title, slug: p.path }));
    }
  } else {
    title = "خدمات پرطرفدار";
    items = NAV.flatMap((g) => g.children)
      .filter((c) => c.slug !== post.path)
      .slice(0, 8);
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-14 border-t border-line pt-10">
      <h2 className="heading-accent text-xl font-extrabold text-ink-900">
        {title}
      </h2>
      {upLink && (
        <Link
          href={upLink.path}
          className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-accent/25 bg-accent/[0.04] px-4 py-3.5 transition hover:border-accent/50"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-accent-deep">
            <Layers className="h-4 w-4 text-accent" />
            {upLink.title}
          </span>
          <ArrowUpLeft className="h-4 w-4 shrink-0 text-accent" />
        </Link>
      )}
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.slug}
            href={it.slug}
            className="card-hover group flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3.5"
          >
            <span className="line-clamp-1 text-sm font-medium text-ink-800 transition group-hover:text-accent">
              {it.title}
            </span>
            <ArrowUpLeft className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-accent" />
          </Link>
        ))}
      </div>
    </section>
  );
}
