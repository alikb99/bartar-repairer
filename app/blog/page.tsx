import type { Metadata } from "next";
import { ARTICLE_POSTS } from "@/lib/content";
import BlogListing, { PER_PAGE } from "@/components/BlogListing";
import { SITE } from "@/lib/data";

export const metadata: Metadata = {
  title: "مقالات و راهنماهای تعمیرات",
  description:
    "راهنماها و مقالات تخصصی تعمیر موبایل، لپ تاپ، تبلت و سایر دستگاه های الکترونیکی.",
  alternates: { canonical: "/blog/" },
};

export default function BlogPage() {
  const totalPages = Math.max(1, Math.ceil(ARTICLE_POSTS.length / PER_PAGE));
  const posts = ARTICLE_POSTS.slice(0, PER_PAGE);

  // Every other indexable page carries a BreadcrumbList; the articles index was
  // the one that did not, because it is a route of its own rather than a post
  // going through [...slug]. Two levels is the whole trail here. The paginated
  // /blog/page/N/ pages are noindex, so they neither need it nor get it.
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      {
        "@type": "ListItem",
        position: 2,
        name: "مقالات و راهنماهای تعمیرات",
        item: `${SITE.domain}/blog/`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <BlogListing
        posts={posts}
        page={1}
        totalPages={totalPages}
        totalCount={ARTICLE_POSTS.length}
      />
    </>
  );
}
