import type { Metadata } from "next";
import { ARTICLE_POSTS } from "@/lib/content";
import BlogListing, { PER_PAGE } from "@/components/BlogListing";

export const metadata: Metadata = {
  title: "مقالات و راهنماهای تعمیرات",
  description:
    "راهنماها و مقالات تخصصی تعمیر موبایل، لپ تاپ، تبلت و سایر دستگاه های الکترونیکی.",
  alternates: { canonical: "/blog/" },
};

export default function BlogPage() {
  const totalPages = Math.max(1, Math.ceil(ARTICLE_POSTS.length / PER_PAGE));
  const posts = ARTICLE_POSTS.slice(0, PER_PAGE);

  return (
    <BlogListing
      posts={posts}
      page={1}
      totalPages={totalPages}
      totalCount={ARTICLE_POSTS.length}
    />
  );
}
