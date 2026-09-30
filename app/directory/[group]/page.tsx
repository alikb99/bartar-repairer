import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SITE } from "@/lib/data";
import { directoryGroupBy, directoryGroups } from "@/lib/site-index";

// One page per directory group. The parent /directory/ used to link all ~870
// URLs from a single 1.2 MB document, which is more links than Google reliably
// processes on one page; splitting the tail into these per-group pages keeps
// every URL one shallow hop from the footer without the payload.
//
// noindex, follow — these exist to pass crawl paths, not to rank. Indexing them
// would just add ~29 near-duplicate list pages to the index.

export const dynamic = "force-static";

export function generateStaticParams() {
  return directoryGroups().map((g) => ({ group: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const { group } = await params;
  const g = directoryGroupBy(group);
  if (!g) return {};
  const title = `فهرست صفحات ${g.title} | ${SITE.brandName}`;
  const desc = `فهرست ${g.items.length} صفحه ${g.title} در سایت ${SITE.brandName}؛ دسترسی سریع به همه خدمات تعمیر و راهنماهای این بخش.`;
  return {
    title: { absolute: title },
    description: desc,
    alternates: { canonical: `/directory/${g.slug}/` },
    robots: { index: false, follow: true },
  };
}

export default async function DirectoryGroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  const g = directoryGroupBy(group);
  if (!g) notFound();

  // No BreadcrumbList here on purpose: /directory/ is a crawl aid, not a
  // browsing path a visitor arrives on from search, and the visible trail above
  // already says where the page sits. Emitting one puts these index pages into
  // breadcrumb rich results in place of the service pages they exist to feed.

  return (
    <div className="pt-24 lg:pt-28">
      <div className="bg-finegrid border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
          <nav
            className="flex items-center gap-1 text-sm text-ink-500"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-accent">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4 text-ink-300" />
            <Link href="/directory/" className="hover:text-accent">
              فهرست کامل صفحات
            </Link>
            <ChevronLeft className="h-4 w-4 text-ink-300" />
            <span className="text-ink-700">{g.title}</span>
          </nav>
          <h1 className="display mt-4 text-4xl font-extrabold text-ink-900 sm:text-5xl">
            فهرست صفحات {g.title}
          </h1>
          <p className="mt-4 text-sm font-semibold text-accent">
            {g.items.length.toLocaleString("fa-IR")} صفحه
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
        <ul className="gap-x-5 sm:columns-2 lg:columns-3 xl:columns-4">
          {g.items.map((it) => (
            <li key={it.path} className="mb-2 break-inside-avoid">
              <Link
                href={it.path}
                className="flex items-start gap-1.5 text-[13.5px] leading-7 text-ink-600 transition hover:text-accent"
              >
                <ChevronLeft className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-300" />
                <span>{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>

      </section>
    </div>
  );
}
