import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ARTICLE_POSTS } from "@/lib/content";
import BlogListing, { PER_PAGE } from "@/components/BlogListing";

const TOTAL_PAGES = Math.max(1, Math.ceil(ARTICLE_POSTS.length / PER_PAGE));
const LEGACY_BLOG_PAGES = [28, 38, 52, 58];

export function generateStaticParams() {
  // page 1 lives at /blog/ — generate 2..N here.
  const params = Array.from({ length: Math.max(0, TOTAL_PAGES - 1) }, (_, i) => ({
    n: String(i + 2),
  }));
  for (const n of LEGACY_BLOG_PAGES) {
    if (n > TOTAL_PAGES && !params.some((p) => p.n === String(n))) {
      params.push({ n: String(n) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  const page = Number(n);
  const resolvedPage = Math.min(Math.max(page || 1, 1), TOTAL_PAGES);
  const isLegacyOverflow = page > TOTAL_PAGES;
  return {
    title: `مقالات و راهنماهای تعمیرات — صفحه ${resolvedPage}`,
    description:
      "راهنماها و مقالات تخصصی تعمیر موبایل، لپ تاپ، تبلت و سایر دستگاه های الکترونیکی.",
    alternates: { canonical: resolvedPage <= 1 ? "/blog/" : `/blog/page/${resolvedPage}/` },
    // page 2+ are thin/duplicate-leaning listings — keep them crawlable but
    // signal the article links are what matter.
    robots: { index: !isLegacyOverflow, follow: true },
  };
}

export default async function BlogPagedPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const page = Number(n);
  const isLegacyOverflow = LEGACY_BLOG_PAGES.includes(page) && page > TOTAL_PAGES;
  if (!Number.isInteger(page) || page < 2 || (page > TOTAL_PAGES && !isLegacyOverflow)) notFound();

  const resolvedPage = Math.min(page, TOTAL_PAGES);
  const start = (resolvedPage - 1) * PER_PAGE;
  const posts = ARTICLE_POSTS.slice(start, start + PER_PAGE);

  return (
    <BlogListing
      posts={posts}
      page={resolvedPage}
      totalPages={TOTAL_PAGES}
      totalCount={ARTICLE_POSTS.length}
    />
  );
}
