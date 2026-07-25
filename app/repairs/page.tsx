import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, ChevronLeft, Phone } from "lucide-react";
import { LIVE_REPAIR_TYPES, repairTypeContent } from "@/lib/repair-types";
import { SITE } from "@/lib/data";
import Icon from "@/components/Icon";

export const dynamic = "force-static";

const TITLE = "خدمات تعمیر بر اساس نوع ایراد | مرکز تعمیرات برتر";
const DESC =
  "همه خدمات تعمیر را بر اساس نوع ایراد ببینید؛ از تعویض ال سی دی و باتری تا تعمیر برد، آب خوردگی و سوکت شارژ برای تمام برندهای موبایل و لپ تاپ.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: "/repairs/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESC,
    url: `${SITE.domain}/repairs/`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function RepairsIndex() {
  const url = `${SITE.domain}/repairs/`;
  const cards = LIVE_REPAIR_TYPES.map((t) => {
    const c = repairTypeContent(t.slug);
    return { ...t, count: c.services.length + c.articles.length };
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      { "@type": "ListItem", position: 2, name: "خدمات تعمیر", item: url },
    ],
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name: "خدمات تعمیر بر اساس نوع ایراد",
    description: DESC,
    inLanguage: "fa-IR",
    isPartOf: { "@id": SITE.websiteId },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: cards.length,
      itemListElement: cards.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.title,
        url: `${SITE.domain}/repairs/${t.slug}/`,
      })),
    },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <header className="relative overflow-hidden bg-[radial-gradient(900px_460px_at_88%_-10%,rgba(218,37,28,.12),transparent_60%),linear-gradient(180deg,#FFFFFF,#F5F6F8)]">
        <div className="mx-auto max-w-[1240px] px-4 pb-12 pt-7 sm:px-6 lg:px-8 lg:pb-16">
          <nav
            className="mb-7 flex items-center gap-1 text-[13px] text-ink-300"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-accent">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="font-bold text-ink-900">خدمات تعمیر</span>
          </nav>
          <h1 className="max-w-3xl text-[29px] font-extrabold leading-[1.4] tracking-tight text-ink-900 sm:text-[38px] lg:text-[44px] lg:leading-[1.3]">
            خدمات تعمیر بر اساس <span className="text-accent">نوع ایراد</span>
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] leading-9 text-ink-500 sm:text-[17px]">
            اگر می دانید دستگاه شما دقیقا چه ایرادی دارد، از این صفحه مستقیم سراغ
            همان خدمت بروید. هر بخش صفحات تخصصی همه برندها و راهنماهای مرتبط را
            یکجا نشان می دهد.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={SITE.phoneHref}
              className="flex items-center gap-2.5 rounded-[14px] bg-accent px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_26px_rgba(218,37,28,.30)] transition hover:-translate-y-0.5 hover:bg-accent-deep"
            >
              <Phone className="h-[19px] w-[19px]" />
              تماس و رزرو نوبت
            </a>
            <Link
              href="/online-diagnosis/"
              className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-hairline bg-white px-6 py-3.5 text-base font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
            >
              نمی دانم ایراد چیست
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-paper py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((t) => (
              <Link
                key={t.slug}
                href={`/repairs/${t.slug}/`}
                className="group rounded-[18px] border border-line bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-white hover:shadow-[0_22px_44px_rgba(20,24,31,.12)]"
              >
                <div className="mb-4 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-accent/10 text-accent transition duration-200 group-hover:bg-accent group-hover:text-white">
                  <Icon name={t.icon} className="h-[22px] w-[22px]" />
                </div>
                <h2 className="mb-2 text-[16.5px] font-extrabold text-ink-900">
                  {t.title}
                </h2>
                <p className="line-clamp-2 text-[13px] leading-7 text-ink-500">
                  {t.lead}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent">
                  {t.count.toLocaleString("fa-IR")} صفحه و راهنما
                  <ArrowUpLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
