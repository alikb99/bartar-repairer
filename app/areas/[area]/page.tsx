import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpLeft, ChevronLeft, Clock3, MapPin, Phone } from "lucide-react";
import {
  LIVE_SERVICE_AREAS,
  serviceAreaBy,
  serviceAreaContent,
} from "@/lib/service-areas";
import { SITE } from "@/lib/data";
import AreaGuide from "@/components/AreaGuide";

export function generateStaticParams() {
  return LIVE_SERVICE_AREAS.map((a) => ({ area: a.slug }));
}

function branchOf(kind: "central" | "west") {
  return kind === "west"
    ? {
        name: "شعبه غرب",
        addr: SITE.addressWest,
        phone: SITE.phoneWest,
        href: SITE.phoneWestHref,
        geo: SITE.geoWest,
      }
    : {
        name: "شعبه مرکزی",
        addr: SITE.address,
        phone: SITE.phone,
        href: SITE.phoneHref,
        geo: { lat: 35.7231, lng: 51.4222 },
      };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>;
}): Promise<Metadata> {
  const { area } = await params;
  const a = serviceAreaBy(area);
  if (!a) return {};
  const title = `تعمیرات موبایل و لپ تاپ در ${a.name} | مرکز تعمیرات برتر`;
  const desc = `تعمیر تخصصی موبایل، لپ تاپ و تبلت در ${a.name}؛ عیب یابی رایگان، قطعات اصل و ۶ ماه گارانتی کتبی. نزدیک ترین شعبه و شماره تماس مستقیم.`;
  return {
    title: { absolute: title },
    description: desc,
    alternates: { canonical: `/areas/${a.slug}/` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title,
      description: desc,
      url: `${SITE.domain}/areas/${a.slug}/`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

export default async function AreaHub({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area } = await params;
  const a = serviceAreaBy(area);
  if (!a || !LIVE_SERVICE_AREAS.some((x) => x.slug === a.slug)) notFound();

  const pages = serviceAreaContent(a.slug);
  const branch = branchOf(a.branch);
  const others = LIVE_SERVICE_AREAS.filter((x) => x.slug !== a.slug);
  const url = `${SITE.domain}/areas/${a.slug}/`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      {
        "@type": "ListItem",
        position: 2,
        name: "مناطق تحت پوشش",
        item: `${SITE.domain}/areas/`,
      },
      { "@type": "ListItem", position: 3, name: a.name, item: url },
    ],
  };
  // Local landing: the business node with the area as its explicit service area.
  const localSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#localbusiness`,
    name: `${SITE.name} — خدمات ${a.name}`,
    parentOrganization: { "@id": SITE.organizationId },
    branchOf: { "@id": SITE.localBusinessId },
    url,
    telephone: a.branch === "west" ? SITE.phoneWestIntl : SITE.phoneIntl,
    priceRange: "$$",
    image: `${SITE.domain}/logo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.addr,
      addressLocality: SITE.city,
      addressCountry: "IR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: branch.geo.lat,
      longitude: branch.geo.lng,
    },
    areaServed: { "@type": "Place", name: `${a.name}، ${SITE.city}` },
  };
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name: `تعمیرات در ${a.name}`,
    inLanguage: "fa-IR",
    isPartOf: { "@id": SITE.websiteId },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: pages.length,
      itemListElement: pages.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.title,
        url: `${SITE.domain}${encodeURI(p.path)}`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <header className="relative overflow-hidden bg-[radial-gradient(900px_460px_at_88%_-10%,rgba(218,37,28,.12),transparent_60%),linear-gradient(180deg,#FFFFFF,#F5F6F8)]">
        <div className="mx-auto max-w-[1240px] px-4 pb-12 pt-7 sm:px-6 lg:px-8 lg:pb-16">
          <nav
            className="mb-7 flex flex-wrap items-center gap-1 text-[13px] text-ink-300"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-accent">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <Link href="/areas/" className="hover:text-accent">
              مناطق تحت پوشش
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="font-bold text-ink-900">{a.name}</span>
          </nav>

          <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 shadow-[0_4px_14px_rgba(20,24,31,.05)]">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="text-[13px] font-bold text-ink-700">
                  {branch.name} — نزدیک ترین شعبه به {a.name}
                </span>
              </div>
              <h1 className="text-[29px] font-extrabold leading-[1.4] tracking-tight text-ink-900 sm:text-[38px] lg:text-[44px] lg:leading-[1.3]">
                تعمیرات موبایل و لپ تاپ در{" "}
                <span className="text-accent">{a.name}</span>
              </h1>
              <p className="mt-4 max-w-[600px] text-[16px] leading-9 text-ink-500 sm:text-[17px]">
                اگر در {a.name} یا محله های اطراف آن هستید، دستگاه خود را به{" "}
                {branch.name} بسپارید. عیب یابی رایگان است و هزینه پیش از شروع
                تعمیر اعلام می شود.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={branch.href}
                  dir="ltr"
                  className="flex items-center gap-2.5 rounded-[14px] bg-accent px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_26px_rgba(218,37,28,.30)] transition hover:-translate-y-0.5 hover:bg-accent-deep"
                >
                  <Phone className="h-[19px] w-[19px]" />
                  {branch.phone}
                </a>
                <Link
                  href="/contact/"
                  className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-hairline bg-white px-6 py-3.5 text-base font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                >
                  مسیریابی و آدرس شعب
                </Link>
              </div>
            </div>

            <div className="rounded-[22px] border border-line bg-white p-5 shadow-card sm:p-6">
              <p className="text-sm font-extrabold text-ink-900">{branch.name}</p>
              <div className="mt-4 space-y-3.5 text-sm leading-8 text-ink-700">
                <div className="flex gap-2.5">
                  <MapPin className="mt-1.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{branch.addr}</span>
                </div>
                <div className="flex gap-2.5">
                  <Clock3 className="mt-1.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{SITE.hours}</span>
                </div>
                <div className="flex gap-2.5">
                  <Phone className="mt-1.5 h-4 w-4 shrink-0 text-accent" />
                  <span dir="ltr">{branch.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <AreaGuide area={a} />
      </div>

      {pages.length > 0 && (
        <section className="border-y border-line bg-white py-12 lg:py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <h2 className="heading-accent text-xl font-extrabold text-ink-900 sm:text-2xl">
              خدمات ما در {a.name}
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((p) => (
                <Link
                  key={p.id}
                  href={p.path}
                  className="card-hover group flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3.5 transition hover:bg-white"
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
      )}

      <section className="bg-paper py-12 lg:py-14">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-xl font-extrabold text-ink-900 sm:text-2xl">
            سایر مناطق تحت پوشش
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/areas/${o.slug}/`}
                className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-800 transition hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                {o.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
