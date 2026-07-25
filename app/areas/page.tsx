import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, ChevronLeft, MapPin, Phone } from "lucide-react";
import { LIVE_SERVICE_AREAS, serviceAreaContent } from "@/lib/service-areas";
import { SITE } from "@/lib/data";

export const dynamic = "force-static";

const TITLE = "مناطق تحت پوشش تعمیرات در تهران | مرکز تعمیرات برتر";
const DESC =
  "دو شعبه در مرکز و غرب تهران با پوشش ستارخان، صادقیه، شهرک غرب، نیاوران، تهرانپارس و سایر مناطق؛ عیب یابی رایگان و ۶ ماه گارانتی کتبی تعمیرات.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: "/areas/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESC,
    url: `${SITE.domain}/areas/`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function AreasIndex() {
  const url = `${SITE.domain}/areas/`;
  const central = LIVE_SERVICE_AREAS.filter((a) => a.branch === "central");
  const west = LIVE_SERVICE_AREAS.filter((a) => a.branch === "west");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      { "@type": "ListItem", position: 2, name: "مناطق تحت پوشش", item: url },
    ],
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name: "مناطق تحت پوشش",
    description: DESC,
    inLanguage: "fa-IR",
    isPartOf: { "@id": SITE.websiteId },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: LIVE_SERVICE_AREAS.length,
      itemListElement: LIVE_SERVICE_AREAS.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.name,
        url: `${SITE.domain}/areas/${a.slug}/`,
      })),
    },
  };

  const Group = ({
    title,
    addr,
    phone,
    href,
    areas,
  }: {
    title: string;
    addr: string;
    phone: string;
    href: string;
    areas: typeof LIVE_SERVICE_AREAS;
  }) => (
    <div className="rounded-[22px] border border-line bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink-900">{title}</h2>
          <p className="mt-2 flex gap-2 text-sm leading-7 text-ink-500">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" />
            {addr}
          </p>
        </div>
        <a
          href={href}
          dir="ltr"
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:bg-accent-deep"
        >
          <Phone className="h-4 w-4" />
          {phone}
        </a>
      </div>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {areas.map((a) => (
          <Link
            key={a.slug}
            href={`/areas/${a.slug}/`}
            className="card-hover group flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3"
          >
            <span className="text-sm font-bold text-ink-800 transition group-hover:text-accent">
              تعمیرات در {a.name}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-ink-300">
                {serviceAreaContent(a.slug).length.toLocaleString("fa-IR")}
              </span>
              <ArrowUpLeft className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-accent" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );

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
        <div className="mx-auto max-w-[1240px] px-4 pb-12 pt-7 sm:px-6 lg:px-8 lg:pb-14">
          <nav
            className="mb-7 flex items-center gap-1 text-[13px] text-ink-300"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-accent">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="font-bold text-ink-900">مناطق تحت پوشش</span>
          </nav>
          <h1 className="max-w-3xl text-[29px] font-extrabold leading-[1.4] tracking-tight text-ink-900 sm:text-[38px] lg:text-[44px] lg:leading-[1.3]">
            مناطق <span className="text-accent">تحت پوشش</span> تعمیرات
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] leading-9 text-ink-500 sm:text-[17px]">
            دو شعبه فعال در مرکز و غرب تهران داریم. منطقه خود را انتخاب کنید تا
            نزدیک ترین شعبه، شماره تماس مستقیم و خدمات همان منطقه را ببینید.
          </p>
        </div>
      </header>

      <section className="bg-paper py-12 lg:py-14">
        <div className="mx-auto grid max-w-[1240px] gap-5 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Group
            title="شعبه مرکزی"
            addr={SITE.address}
            phone={SITE.phone}
            href={SITE.phoneHref}
            areas={central}
          />
          <Group
            title="شعبه غرب"
            addr={SITE.addressWest}
            phone={SITE.phoneWest}
            href={SITE.phoneWestHref}
            areas={west}
          />
        </div>
      </section>
    </article>
  );
}
