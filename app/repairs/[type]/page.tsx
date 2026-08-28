import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpLeft,
  BookOpen,
  ChevronLeft,
  Info,
  MapPin,
  Phone,
  Wrench,
} from "lucide-react";
import {
  LIVE_REPAIR_TYPES,
  repairTypeBy,
  repairTypeContent,
} from "@/lib/repair-types";
import { SCHEMA_CURRENCY, pricesFor, rial } from "@/lib/pricing";
import { SITE } from "@/lib/data";
import ClusterContent from "@/components/ClusterContent";
import Icon from "@/components/Icon";
import PriceTable from "@/components/PriceTable";
import Reviews from "@/components/Reviews";

export function generateStaticParams() {
  return LIVE_REPAIR_TYPES.map((t) => ({ type: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type } = await params;
  const t = repairTypeBy(type);
  if (!t) return {};
  const url = `${SITE.domain}/repairs/${t.slug}/`;
  return {
    title: { absolute: t.metaTitle },
    description: t.metaDesc,
    alternates: { canonical: `/repairs/${t.slug}/` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: t.metaTitle,
      description: t.metaDesc,
      url,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: t.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.metaTitle,
      description: t.metaDesc,
      images: ["/opengraph-image"],
    },
  };
}

export default async function RepairTypeHub({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const t = repairTypeBy(type);
  if (!t || !LIVE_REPAIR_TYPES.some((x) => x.slug === t.slug)) notFound();

  const { services, articles } = repairTypeContent(t.slug);
  const others = LIVE_REPAIR_TYPES.filter((x) => x.slug !== t.slug);
  const url = `${SITE.domain}/repairs/${t.slug}/`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      {
        "@type": "ListItem",
        position: 2,
        name: "خدمات تعمیر",
        item: `${SITE.domain}/repairs/`,
      },
      { "@type": "ListItem", position: 3, name: t.title, item: url },
    ],
  };
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name: t.title,
    description: t.metaDesc,
    inLanguage: "fa-IR",
    isPartOf: { "@id": SITE.websiteId },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: services.length + articles.length,
      itemListElement: [...services, ...articles]
        .slice(0, 60)
        .map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.title,
          url: `${SITE.domain}${encodeURI(p.path)}`,
        })),
    },
  };
  // Offer markup is emitted only when real prices exist in lib/pricing.ts.
  const prices = pricesFor(t.slug);
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: t.title,
    serviceType: t.title,
    areaServed: { "@type": "City", name: SITE.city },
    provider: { "@id": SITE.localBusinessId },
    url,
    description: t.metaDesc,
    image: `${SITE.domain}/logo.png`,
    // One AggregateOffer describing the whole range. This is the shape Google
    // documents for "prices from X to Y" — 150 individual Offer nodes would
    // add ~45KB per page for no extra eligibility.
    ...(prices.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: SCHEMA_CURRENCY,
            lowPrice: rial(Math.min(...prices.map((p) => p.from))),
            highPrice: rial(Math.max(...prices.map((p) => p.to ?? p.from))),
            offerCount: prices.length,
            availability: "https://schema.org/InStock",
            url,
          },
        }
      : {}),
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Hero */}
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
            <Link href="/repairs/" className="hover:text-accent">
              خدمات تعمیر
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="font-bold text-ink-900">{t.title}</span>
          </nav>

          <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 shadow-[0_4px_14px_rgba(20,24,31,.05)]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-accent/10 text-accent">
                  <Icon name={t.icon} className="h-4 w-4" />
                </span>
                <span className="text-[13px] font-bold text-ink-700">
                  خدمات تعمیر در {SITE.city}
                </span>
              </div>
              <h1 className="text-[29px] font-extrabold leading-[1.4] tracking-tight text-ink-900 sm:text-[38px] lg:text-[44px] lg:leading-[1.3]">
                {t.title} <span className="text-accent">همه برندها</span>
              </h1>
              <p className="mt-4 max-w-[600px] text-[16px] leading-9 text-ink-500 sm:text-[17px]">
                {t.lead}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={SITE.phoneHref}
                  className="flex items-center gap-2.5 rounded-[14px] bg-accent px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_26px_rgba(218,37,28,.30)] transition hover:-translate-y-0.5 hover:bg-accent-deep"
                >
                  <Phone className="h-[19px] w-[19px]" />
                  تماس و رزرو نوبت
                </a>
                {prices.length > 0 ? (
                  <a
                    href="#prices"
                    className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-hairline bg-white px-6 py-3.5 text-base font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                  >
                    مشاهده هزینه {prices.length.toLocaleString("fa-IR")} مدل
                  </a>
                ) : (
                  <Link
                    href="/online-diagnosis/"
                    className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-hairline bg-white px-6 py-3.5 text-base font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                  >
                    عیب یابی آنلاین رایگان
                  </Link>
                )}
              </div>
            </div>

            {/* Honest "when not to" note — voice.md requires stating when the
                customer should NOT buy the service. */}
            <div className="rounded-[22px] border border-line bg-white p-5 shadow-card sm:p-6">
              <p className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
                <Info className="h-4 w-4 text-accent" />
                چه زمانی این تعمیر لازم نیست
              </p>
              <p className="mt-3 text-[14.5px] leading-8 text-ink-500">{t.notFor}</p>
              <div className="mt-5 flex gap-2.5 rounded-2xl bg-paper p-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-[12.5px] leading-7 text-ink-700">
                  عیب یابی در هر دو شعبه رایگان است و هزینه پیش از شروع تعمیر
                  اعلام می شود.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6 lg:px-8">
        <ClusterContent path={`/repairs/${t.slug}/`} />
      </div>

      <PriceTable repairType={t.slug} repairTitle={t.title} />

      {/* Service pages */}
      {services.length > 0 && (
        <section className="border-y border-line bg-white py-12 lg:py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <h2 className="heading-accent flex items-center gap-2 text-xl font-extrabold text-ink-900 sm:text-2xl">
              <Wrench className="h-5 w-5 text-accent" />
              صفحات تخصصی {t.title}
            </h2>
            <p className="mt-3 text-sm leading-8 text-ink-500">
              {services.length.toLocaleString("fa-IR")} صفحه خدمات برای برندها و
              مدل های مختلف.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((p) => (
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

      {/* Articles */}
      {articles.length > 0 && (
        <section className="bg-paper py-12 lg:py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <h2 className="heading-accent flex items-center gap-2 text-xl font-extrabold text-ink-900 sm:text-2xl">
              <BookOpen className="h-5 w-5 text-accent" />
              راهنماهای {t.title}
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((p) => (
                <Link
                  key={p.id}
                  href={p.path}
                  className="card-hover group flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3.5"
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

      <Reviews />

      {/* Other repair types */}
      <section className="border-t border-line bg-white py-12 lg:py-14">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-xl font-extrabold text-ink-900 sm:text-2xl">
            سایر خدمات تعمیر
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/repairs/${o.slug}/`}
                className="card-hover group flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3.5 transition hover:bg-white"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-accent shadow-card transition group-hover:bg-accent group-hover:text-white">
                  <Icon name={o.icon} className="h-4 w-4" />
                </span>
                <span className="text-sm font-bold text-ink-800 transition group-hover:text-accent">
                  {o.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#22262F] to-ink-950 p-8 sm:p-11 lg:grid-cols-[1.3fr_1fr]">
          <div className="text-white">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-[30px]">
              برای {t.title} تماس بگیرید
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-8 text-ink-300">
              عیب یابی رایگان است و هزینه دقیق پیش از شروع کار به شما اعلام می شود.
            </p>
            <a
              href={SITE.phoneHref}
              dir="ltr"
              className="mt-6 inline-flex items-center gap-2.5 rounded-[14px] bg-accent px-7 py-3.5 text-base font-extrabold text-white shadow-[0_10px_26px_rgba(218,37,28,.34)] transition hover:-translate-y-0.5 hover:bg-accent-deep"
            >
              <Phone className="h-[19px] w-[19px]" />
              {SITE.phone}
            </a>
          </div>
          <div className="flex flex-col gap-3.5">
            {[
              { name: "شعبه مرکزی", addr: SITE.address },
              { name: "شعبه غرب", addr: SITE.addressWest },
            ].map((b) => (
              <div
                key={b.name}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4"
              >
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <div className="mb-1 text-sm font-extrabold text-white">{b.name}</div>
                  <div className="text-[12.5px] leading-7 text-ink-300">{b.addr}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </article>
  );
}
