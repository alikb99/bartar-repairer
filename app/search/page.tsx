import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { POSTS } from "@/lib/content";
import { SITE } from "@/lib/data";
import PseSearch from "@/components/PseSearch";

export const metadata: Metadata = {
  title: "جستجو در سایت",
  description:
    "جستجو در خدمات تعمیرات و مقالات آموزشی مرکز تخصصی تعمیرات برتر؛ تعمیر موبایل، لپ تاپ، تبلت و تلویزیون در تهران.",
  alternates: { canonical: "/search/" },
  // Query-driven results — keep out of the index to avoid thin/duplicate URLs.
  robots: { index: false, follow: true },
};

// Only the count is still needed — PSE does the searching. /blog/ is the
// archive route rather than a page of its own, so it never counts.
const PAGE_COUNT = POSTS.filter((p) => p.path !== "/blog/").length;

export default function SearchPage() {
  return (
    <article className="pt-24 lg:pt-28">
      <header className="bg-finegrid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -left-24 top-0 h-60 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav
            className="flex flex-wrap items-center gap-1 text-sm text-ink-500"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-accent">
              خانه
            </Link>
            <span className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4 text-ink-300" />
              <span className="text-ink-700">جستجو</span>
            </span>
          </nav>
          <h1 className="display mt-6 text-3xl font-extrabold leading-tight text-ink-900 sm:text-[2.6rem]">
            جستجو در {SITE.shortName}
          </h1>
          <p className="mt-3 text-sm text-ink-500">
            میان {PAGE_COUNT.toLocaleString("fa-IR")} صفحه خدمات و مقاله جستجو
            کنید.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <PseSearch siteName={SITE.shortName} />
      </div>
    </article>
  );
}
