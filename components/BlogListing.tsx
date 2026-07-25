import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Post } from "@/lib/content";
import { LIVE_REPAIR_TYPES, repairTypeContent } from "@/lib/repair-types";
import { SITE } from "@/lib/data";
import Reveal from "@/components/Reveal";
import PostCard from "@/components/PostCard";

export const PER_PAGE = 24;

function pageHref(n: number) {
  return n <= 1 ? "/blog/" : `/blog/page/${n}/`;
}

// windowed page numbers: 1 … (p-1) p (p+1) … last
function pageWindow(page: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  const add = (n: number) => out.push(n);
  const lo = Math.max(2, page - 1);
  const hi = Math.min(total - 1, page + 1);
  add(1);
  if (lo > 2) out.push("…");
  for (let i = lo; i <= hi; i++) add(i);
  if (hi < total - 1) out.push("…");
  if (total > 1) add(total);
  return out;
}

export default function BlogListing({
  posts,
  page,
  totalPages,
  totalCount,
}: {
  posts: Post[];
  page: number;
  totalPages: number;
  totalCount: number;
}) {
  const items = pageWindow(page, totalPages);
  const url = pageHref(page);
  const pageTitle =
    page > 1 ? `مقالات و راهنماهای تعمیرات - صفحه ${page}` : "مقالات و راهنماهای تعمیرات";
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE.domain}${url}#webpage`,
    url: `${SITE.domain}${url}`,
    name: pageTitle,
    description:
      "راهنماها و مقالات تخصصی تعمیر موبایل، لپ تاپ، تبلت و سایر دستگاه های الکترونیکی.",
    inLanguage: "fa-IR",
    isPartOf: { "@id": SITE.websiteId },
    publisher: { "@id": SITE.organizationId },
  };
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE.domain}${url}#itemlist`,
    itemListElement: posts.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE.domain}${encodeURI(p.path)}`,
      name: p.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <div className="pb-24 pt-28 lg:pt-32">
      <div className="bg-finegrid border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
          <span className="section-index">مقالات</span>
          <h1 className="display mt-3 text-4xl font-extrabold text-ink-900 sm:text-5xl">
            مقالات و راهنماهای تعمیرات
            {page > 1 && (
              <span className="text-ink-300"> — صفحه {page.toLocaleString("fa-IR")}</span>
            )}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ink-500">
            راهنماهای کاربردی برای تشخیص ایراد، هزینه و نکات تعمیر دستگاه های
            الکترونیکی از کارشناسان {SITE.shortName}.
          </p>
          <p className="mt-4 text-sm font-semibold text-accent">
            {totalCount.toLocaleString("fa-IR")} مقاله تخصصی
          </p>
          {/* Topic entry points. Deep pagination alone left most guides 20+
              clicks from the first page — these hubs group them by subject so
              both readers and crawlers reach any article in two clicks. */}
          <div className="mt-7">
            <p className="mb-3 text-[13px] font-bold text-ink-700">
              جستجو بر اساس موضوع
            </p>
            <div className="flex flex-wrap gap-2">
              {LIVE_REPAIR_TYPES.map((t) => (
                <Link
                  key={t.slug}
                  href={`/repairs/${t.slug}/`}
                  className="rounded-full border border-line bg-white px-4 py-2 text-[13px] font-bold text-ink-800 transition hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                >
                  {t.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Page 1 only — keeps paginated pages from duplicating this copy. */}
      {page === 1 && (
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[32px]">
                این راهنماها به چه دردی می خورند
              </h2>
              <p className="mt-4 text-[15px] leading-9 text-ink-700">
                بخش زیادی از دستگاه هایی که به ما می رسند، ایرادی دارند که
                صاحبش می توانست خودش تشخیص بدهد و گاهی بدون هزینه رفع کند. این
                مقالات برای همان نوشته شده اند: اینکه بفهمید مشکل از کجاست،
                هزینه تقریبی چقدر است و آیا اصلاً ارزش تعمیر دارد یا نه.
              </p>
              <p className="mt-4 text-[15px] leading-9 text-ink-700">
                هرجا کاری خطرناک یا پرریسک بوده، صریح گفته ایم که خودتان انجام
                ندهید. باز کردن گوشی آب خورده یا دست زدن به باتری باد کرده در
                خانه، معمولاً هزینه را بیشتر می کند نه کمتر.
              </p>
            </div>

            <h2 className="mt-12 text-2xl font-extrabold text-ink-900 sm:text-[32px]">
              موضوع ها به تفکیک نوع خرابی
            </h2>
            <p className="mt-3 text-[15px] leading-9 text-ink-700">
              {totalCount.toLocaleString("fa-IR")} مقاله در{" "}
              {LIVE_REPAIR_TYPES.length.toLocaleString("fa-IR")} دسته. عدد جلوی
              هر دسته تعداد مقاله های همان موضوع است.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LIVE_REPAIR_TYPES.map((t) => {
                const n = repairTypeContent(t.slug).articles.length;
                return (
                  <li key={t.slug}>
                    <Link
                      href={`/repairs/${t.slug}/`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 transition hover:border-accent/40 hover:bg-white"
                    >
                      <span className="text-[15px] font-bold text-ink-900">
                        {t.title}
                      </span>
                      <span className="shrink-0 text-[13px] font-bold text-accent">
                        {n.toLocaleString("fa-IR")} مقاله
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
        {page === 1 && (
          <h2 className="mb-8 text-2xl font-extrabold text-ink-900 sm:text-[32px]">
            تازه ترین مقالات
          </h2>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.05}>
              <PostCard post={p} />
            </Reveal>
          ))}
        </div>

        {totalPages > 1 && (
          <nav
            className="mt-14 flex flex-wrap items-center justify-center gap-2"
            aria-label="صفحه بندی مقالات"
          >
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                rel="prev"
                className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-accent/40 hover:text-accent"
              >
                <ChevronRight className="h-4 w-4" />
                قبلی
              </Link>
            )}

            {items.map((it, i) =>
              it === "…" ? (
                <span key={`g${i}`} className="px-2 text-ink-300">
                  …
                </span>
              ) : (
                <Link
                  key={it}
                  href={pageHref(it)}
                  aria-current={it === page ? "page" : undefined}
                  className={`grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-bold transition ${
                    it === page
                      ? "bg-accent text-white"
                      : "border border-line bg-white text-ink-700 hover:border-accent/40 hover:text-accent"
                  }`}
                >
                  {it.toLocaleString("fa-IR")}
                </Link>
              ),
            )}

            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                rel="next"
                className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-accent/40 hover:text-accent"
              >
                بعدی
                <ChevronLeft className="h-4 w-4" />
              </Link>
            )}
          </nav>
        )}
      </div>
      </div>
    </>
  );
}
