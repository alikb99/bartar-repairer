import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Wrench, BookOpen } from "lucide-react";
import { SITE } from "@/lib/data";
import { buildDirectory } from "@/lib/site-index";

const TITLE = "فهرست کامل صفحات سایت | خدمات تعمیر و راهنماها";
const DESC =
  "فهرست کامل خدمات تعمیر و راهنماهای برتر سرویس در یک صفحه؛ همه صفحات تعمیر گوشی، لپ تاپ، تبلت و مقالات تخصصی به تفکیک برند و نوع خرابی.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: "/directory/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESC,
    url: `${SITE.domain}/directory/`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
    {
      "@type": "ListItem",
      position: 2,
      name: "فهرست کامل صفحات",
      item: `${SITE.domain}/directory/`,
    },
  ],
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE.domain}/directory/#webpage`,
  url: `${SITE.domain}/directory/`,
  name: TITLE,
  description: DESC,
  inLanguage: "fa-IR",
  isPartOf: { "@id": SITE.websiteId },
  about: { "@id": SITE.localBusinessId },
};

function Group({
  title,
  items,
}: {
  title: string;
  items: { path: string; label: string }[];
}) {
  return (
    <section className="break-inside-avoid rounded-2xl border border-line bg-white p-5 shadow-card">
      <h3 className="flex items-center justify-between gap-2 text-[15px] font-extrabold text-ink-900">
        <span>{title}</span>
        <span className="shrink-0 text-[12px] font-bold text-accent">
          {items.length.toLocaleString("fa-IR")}
        </span>
      </h3>
      <ul className="mt-4 flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.path}>
            <Link
              href={it.path}
              className="flex items-start gap-1.5 text-[13.5px] leading-7 text-ink-600 transition hover:text-accent"
            >
              <ChevronLeft className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-300" />
              <span className="line-clamp-1">{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DirectoryPage() {
  const { serviceGroups, articleGroups, totalServices, totalArticles } =
    buildDirectory();

  return (
    <div className="pt-24 lg:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />

      {/* Header */}
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
            <span className="text-ink-700">فهرست کامل صفحات</span>
          </nav>
          <h1 className="display mt-4 text-4xl font-extrabold text-ink-900 sm:text-5xl">
            فهرست کامل صفحات سایت
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ink-500">
            همه خدمات تعمیر و راهنماهای {SITE.shortName} در یک صفحه. برای رسیدن
            سریع به هر صفحه، از فهرست زیر استفاده کنید.
          </p>
          <p className="mt-4 text-sm font-semibold text-accent">
            {totalServices.toLocaleString("fa-IR")} صفحه خدمات ·{" "}
            {totalArticles.toLocaleString("fa-IR")} مقاله و راهنما
          </p>
        </div>
      </div>

      {/* Services */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
        <h2 className="flex items-center gap-2.5 text-2xl font-extrabold text-ink-900 sm:text-[30px]">
          <Wrench className="h-6 w-6 text-accent" />
          خدمات تعمیر
        </h2>
        <div className="mt-7 gap-5 [column-gap:1.25rem] sm:columns-2 lg:columns-3 xl:columns-4">
          {serviceGroups.map((g) => (
            <div key={g.title} className="mb-5">
              <Group title={g.title} items={g.items} />
            </div>
          ))}
        </div>
      </section>

      {/* Articles */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-10">
          <h2 className="flex items-center gap-2.5 text-2xl font-extrabold text-ink-900 sm:text-[30px]">
            <BookOpen className="h-6 w-6 text-accent" />
            مقالات و راهنماها
          </h2>
          <div className="mt-7 gap-5 [column-gap:1.25rem] sm:columns-2 lg:columns-3 xl:columns-4">
            {articleGroups.map((g) => (
              <div key={g.title} className="mb-5">
                <Group title={g.title} items={g.items} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
