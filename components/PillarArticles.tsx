import Link from "next/link";
import { ArrowUpLeft, BookOpen } from "lucide-react";
import { clusterArticles } from "@/lib/content";

// Pillar → cluster down-links: on a hub (pillar) page, list the topical cluster
// articles assigned to it. This completes the hub-and-spoke internal linking so
// authority flows both ways between pillar and cluster.
export default function PillarArticles({
  path,
  title = "راهنماها و مقالات مرتبط",
  limit = 12,
}: {
  path: string;
  title?: string;
  limit?: number;
}) {
  const items = clusterArticles(path, limit);
  if (items.length < 3) return null; // not a meaningful cluster

  return (
    <section className="border-t border-line bg-paper py-14 lg:py-16">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <h2 className="heading-accent flex items-center gap-2 text-xl font-extrabold text-ink-900 sm:text-2xl">
          <BookOpen className="h-5 w-5 text-accent" />
          {title}
        </h2>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Link
              key={p.id}
              href={p.path}
              className="card-hover group flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3.5"
            >
              <span className="line-clamp-2 text-sm font-medium text-ink-800 transition group-hover:text-accent">
                {p.title}
              </span>
              <ArrowUpLeft className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-accent" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
