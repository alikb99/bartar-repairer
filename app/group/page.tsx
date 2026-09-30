import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ExternalLink, MapPin, Phone } from "lucide-react";
import { SITE, GROUP_SITES } from "@/lib/data";

// The human-readable half of the parent/child declaration. The machine-readable
// half is `subOrganization` on the Organization node in app/layout.tsx, and the
// per-brand half is components/BrandSiteCard.tsx; this page is where a reader —
// or a reviewer — can see the whole group in one place and check that the
// company saying it owns twelve domains is the company that answers the phone.
//
// It is deliberately plain. A page whose job is to be believed should read like
// a disclosure, not like a landing page.

const TITLE = "مجموعه برتر سرویس و سایت های تخصصی آن";
const DESC =
  "برتر سرویس علاوه بر این سایت، برای هر برند یک سایت تخصصی جداگانه دارد. فهرست کامل سایت های مجموعه، همراه با نشانی شعب و شماره تماس مشترک همه آنها.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | ${SITE.brandName}` },
  description: DESC,
  alternates: { canonical: "/group/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESC,
    url: `${SITE.domain}/group/`,
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
      name: "مجموعه برتر سرویس",
      item: `${SITE.domain}/group/`,
    },
  ],
};

// An ItemList rather than a second Organization node: the ownership claim is
// already made once, in the root layout, and repeating it here under the same
// @id with a different shape only gives a crawler two versions to reconcile.
const pageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE.domain}/group/#webpage`,
  url: `${SITE.domain}/group/`,
  name: TITLE,
  description: DESC,
  inLanguage: "fa-IR",
  isPartOf: { "@id": SITE.websiteId },
  about: { "@id": SITE.organizationId },
  mainEntity: {
    "@type": "ItemList",
    name: TITLE,
    numberOfItems: GROUP_SITES.length,
    itemListElement: GROUP_SITES.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
      url: s.url,
    })),
  },
};

const brandSites = GROUP_SITES.filter((s) => s.brand);
const otherSites = GROUP_SITES.filter((s) => !s.brand);

function SiteCard({ site }: { site: (typeof GROUP_SITES)[number] }) {
  const host = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <li className="rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-soft">
      <h3 className="text-[15px] font-extrabold text-ink-900">{site.name}</h3>
      <p className="mt-2 text-sm leading-7 text-ink-500">{site.blurb}</p>
      {site.path && (
        <Link
          href={site.path}
          className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-accent"
        >
          بخش {site.brand} در همین سایت
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      <a
        href={site.url}
        className="mt-3 flex items-center gap-1.5 break-all text-sm font-bold text-ink-900 underline decoration-accent/40 underline-offset-4 transition hover:text-accent"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        {host}
      </a>
    </li>
  );
}

export default function GroupPage() {
  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />

      <header className="border-b border-line bg-ink-900 py-12 text-white lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <nav
            className="flex flex-wrap items-center gap-1 text-sm text-white/62"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-white">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4 text-white/36" />
            <span className="text-white">مجموعه برتر سرویس</span>
          </nav>
          <h1 className="display mt-4 text-3xl font-extrabold sm:text-[2.5rem]">
            {TITLE}
          </h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-8 text-white/72">
            {SITE.brandName} یک مرکز تعمیر چند برندی است و همین سایت، سایت اصلی
            مجموعه است. در کنار آن برای هر برند یک سایت تخصصی جداگانه داریم، به
            علاوه یک آموزشگاه و یک فروشگاه لوازم جانبی. همه این سایت ها متعلق به
            یک شرکت هستند، یک کارگاه دارند و همان دو شعبه مطهری و سعادت آباد را
            سرویس می دهند.
          </p>
        </div>
      </header>

      <section className="border-b border-line bg-paper py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <span className="section-index">— سایت های تخصصی برند</span>
          <h2 className="mt-2 text-2xl font-extrabold text-ink-900 sm:text-[32px]">
            سایت تخصصی هر برند
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-ink-500">
            هر سایت برند، همان خدماتی را ارائه می دهد که در بخش آن برند در همین
            سایت می بینید، ولی با جزئیات بیشتر به تفکیک مدل. اگر دستگاه شما یکی
            از این برندهاست، سایت تخصصی همان برند معمولا پاسخ دقیق تری دارد.
          </p>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brandSites.map((s) => (
              <SiteCard key={s.url} site={s} />
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-line bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <span className="section-index">— سایر مجموعه ها</span>
          <h2 className="mt-2 text-2xl font-extrabold text-ink-900 sm:text-[32px]">
            آموزشگاه و فروشگاه
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherSites.map((s) => (
              <SiteCard key={s.url} site={s} />
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-ink-900">
              اطلاعات تماس مشترک همه سایت ها
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-8 text-ink-500">
              شماره تماس و نشانی هر کدام از سایت های بالا همین موارد است. اگر در
              یکی از آنها شماره یا نشانی متفاوتی دیدید، آن سایت متعلق به ما
              نیست.
            </p>
            <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <dt className="text-sm font-extrabold text-ink-900">تلفن</dt>
                  <dd className="mt-1 text-sm leading-7 text-ink-500">
                    <a href={SITE.phoneHref} className="hover:text-accent">
                      {SITE.phone}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <dt className="text-sm font-extrabold text-ink-900">
                    شعبه مرکزی
                  </dt>
                  <dd className="mt-1 text-sm leading-7 text-ink-500">
                    {SITE.address}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3 sm:col-start-2">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <dt className="text-sm font-extrabold text-ink-900">
                    شعبه غرب
                  </dt>
                  <dd className="mt-1 text-sm leading-7 text-ink-500">
                    {SITE.addressWest}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </article>
  );
}
