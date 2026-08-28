import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ListChecks,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  POSTS,
  NAV,
  breadcrumbs,
  extractFaq,
  h1For,
  hubLabel,
  type Post,
} from "@/lib/content";
import { SITE } from "@/lib/data";
import { calloutFor } from "@/lib/recovered-callouts";
import { CARD_LABELS } from "@/lib/recovered-hub-labels";
import { clusterContentFor } from "@/lib/cluster-content";
import ContactCard from "@/components/ContactCard";
import ClusterContent from "@/components/ClusterContent";
import ContentEnhancer from "@/components/ContentEnhancer";
import PagePriceTable from "@/components/PagePriceTable";
import PillarArticles from "@/components/PillarArticles";
import PageCallout from "@/components/PageCallout";
import ReaderComments from "@/components/ReaderComments";
import RelatedLinks from "@/components/RelatedLinks";
import RepairRequestSection from "@/components/RepairRequestSection";
import RepairTypeLinks from "@/components/RepairTypeLinks";
import ServiceDeviceSceneLoader from "@/components/ServiceDeviceSceneLoader";
import ServiceCentersSlot from "@/components/ServiceCentersSlot";

type TocItem = { id: string; text: string };

const stripText = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function firstImage(html: string): { src: string; alt: string } | null {
  const tag = html.match(/<img[^>]*>/i)?.[0];
  if (!tag) return null;
  return {
    src: (tag.match(/\bsrc="([^"]*)"/i) || [])[1] || "",
    alt: (tag.match(/\balt="([^"]*)"/i) || [])[1] || "",
  };
}

function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let n = 0;
  const body = html.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_m, inner) => {
    const id = `brand-sec-${++n}`;
    const text = stripText(inner);
    if (text) toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: body, toc };
}

function Breadcrumb({ post }: { post: Post }) {
  const crumbs = breadcrumbs(post);
  return (
    <nav
      className="flex flex-wrap items-center gap-1 text-sm text-white/62"
      aria-label="مسیر"
    >
      <Link href="/" className="hover:text-white">
        خانه
      </Link>
      {crumbs.map((c, idx) => (
        <span key={c.path} className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4 text-white/36" />
          {idx === crumbs.length - 1 ? (
            <span className="line-clamp-1 text-white">{c.title}</span>
          ) : (
            <Link href={c.path} className="hover:text-white">
              {c.title}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function PhoneButton({
  children,
  light = false,
}: {
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <a
      href={SITE.phoneHref}
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] px-6 py-3.5 text-sm font-extrabold shadow-soft transition hover:-translate-y-0.5 ${
        light
          ? "bg-white text-accent hover:bg-paper"
          : "bg-accent text-white hover:bg-accent-deep"
      }`}
    >
      <Phone className="h-4 w-4" />
      {children}
    </a>
  );
}

function ServicesGrid({ post, children }: { post: Post; children: Post[] }) {
  if (children.length === 0) return null;
  return (
    <section id="brand-services" className="border-b border-line bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="section-index">خدمات نمایندگی</span>
            <h2 className="mt-2 text-2xl font-extrabold text-ink-900 sm:text-[32px]">
              دسته بندی خدمات {hubLabel(post.path, post.title)}
            </h2>
          </div>
          <PhoneButton>مشاوره تعمیر</PhoneButton>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="group relative min-h-[152px] overflow-hidden rounded-[22px] border border-line bg-paper p-5 shadow-card transition hover:-translate-y-1 hover:border-accent/35 hover:bg-white hover:shadow-soft"
            >
              <div className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-2xl bg-white text-accent shadow-card transition group-hover:bg-accent group-hover:text-white">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="pl-14">
                <h3 className="line-clamp-2 text-[15px] font-extrabold leading-7 text-ink-900">
                  {CARD_LABELS[item.path] ?? h1For(item.path, item.title)}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-ink-500">
                  {item.metaDesc}
                </p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-accent">
                مشاهده صفحه
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// The one hub whose legacy WordPress body is not rendered: on /apple/ it
// repeated the device cards, the cluster answer and the price table almost line
// for line, so the deployed site dropped it. Everything that page needs is
// above; keeping the duplicate would only feed thin, repeated copy to crawlers.
const HIDE_LEGACY_BODY = new Set(["/apple/"]);

export default function BrandLanding({ post }: { post: Post }) {
  const crumbs = breadcrumbs(post);
  const childPages = POSTS.filter((c) => c.parent === post.id);
  const cluster = clusterContentFor(post.path);
  // Hand-written cluster answers join the FAQs mined from the legacy body, so
  // both show up in the FAQPage schema.
  // Questions mined from a body that is not rendered would be schema for text
  // no reader can see, so the hidden-body hub answers only what it shows.
  const faqs = [
    ...(cluster?.faq ?? []),
    ...(HIDE_LEGACY_BODY.has(post.path) ? [] : extractFaq(post.content)),
  ];
  const heroImg = post.image ? { src: post.image, alt: post.title } : firstImage(post.content);
  const { html: bodyHtml, toc } = withHeadingIds(post.content);
  const brandName = hubLabel(post.path, post.title);

  const agencyGroup = NAV.find((n) => n.title.includes("نمایندگی"));
  const otherBrands = (agencyGroup?.children ?? [])
    .filter((c) => c.slug !== post.path && c.slug !== "/agency/")
    .slice(0, 11);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      ...crumbs.map((c, idx) => ({
        "@type": "ListItem",
        position: idx + 2,
        name: c.title,
        item: `${SITE.domain}${encodeURI(c.path)}`,
      })),
    ],
  };
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: h1For(post.path, post.title),
    serviceType: brandName || post.title,
    areaServed: { "@type": "City", name: SITE.city },
    provider: { "@type": "LocalBusiness", "@id": SITE.localBusinessId, name: SITE.name },
    image: heroImg?.src ? `${SITE.domain}${heroImg.src}` : `${SITE.domain}/logo.png`,
    url: `${SITE.domain}${encodeURI(post.path)}`,
    description: post.metaDesc,
    ...(childPages.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: brandName || post.title,
            itemListElement: childPages.map((c) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: CARD_LABELS[c.path] ?? h1For(c.path, c.title),
                url: `${SITE.domain}${encodeURI(c.path)}`,
              },
            })),
          },
        }
      : {}),
  };
  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <header className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-finegrid opacity-[.16]" />
        <div className="absolute inset-0 bg-[radial-gradient(720px_380px_at_18%_18%,rgba(218,37,28,.28),transparent_62%)]" />
        {heroImg?.src && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImg.src}
              alt={heroImg.alt || h1For(post.path, post.title)}
              width={1400}
              height={760}
              className="absolute inset-0 h-full w-full object-cover opacity-[.13]"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-ink-950 via-ink-950/86 to-ink-950/62" />
          </>
        )}

        <div className="relative mx-auto grid max-w-[1240px] gap-8 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(340px,.72fr)] lg:px-8 lg:pb-20">
          <div className="lg:col-span-2">
            <Breadcrumb post={post} />
          </div>

          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-4 py-2 text-xs font-bold text-white/86 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-accent-soft" />
              نمایندگی تخصصی تعمیرات در {SITE.city}
            </span>
            <h1 className="mt-6 text-[32px] font-extrabold leading-[1.35] tracking-tight text-white sm:text-[48px]">
              {h1For(post.path, post.title)}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-9 text-white/74 sm:text-[17px]">
              {post.metaDesc}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PhoneButton>تماس و رزرو نوبت</PhoneButton>
              {childPages.length > 0 && (
                <a
                  href="#brand-services"
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/18 bg-white/[.08] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-white/[.14]"
                >
                  مشاهده خدمات برند
                  <ArrowLeft className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {["قطعات اصل", "۶ ماه گارانتی", "عیب یابی رایگان", "پیک رایگان"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[.07] p-3 backdrop-blur"
                >
                  <BadgeCheck className="h-4 w-4 text-accent-soft" />
                  <div className="mt-2 text-xs font-bold leading-6 text-white/86">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[280px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[.05] shadow-float lg:min-h-[430px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_34%,rgba(218,37,28,.34),transparent_42%),linear-gradient(145deg,#242936,#13161C)]" />
            <ServiceDeviceSceneLoader />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-white/[.08] p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <Sparkles className="h-4 w-4 text-accent-soft" />
                مرکز عیب یابی تخصصی
              </div>
              <p className="mt-2 text-xs leading-6 text-white/68">
                هزینه و زمان تعمیر قبل از شروع کار اعلام می شود.
              </p>
            </div>
          </div>
        </div>
      </header>

      {calloutFor(post.path)?.slot === "top" && (
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <PageCallout path={post.path} slot="top" />
        </div>
      )}
      <RepairRequestSection
        heading={`ثبت آنلاین درخواست تعمیر ${brandName}`}
      />

      <ServicesGrid post={post} children={childPages} />

      <section id="content" className="bg-paper py-10 lg:py-14">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <main className="min-w-0">
            {!HIDE_LEGACY_BODY.has(post.path) && toc.length >= 3 && (
              <nav
                aria-label="فهرست مطالب"
                className="mb-7 rounded-[22px] border border-line bg-white p-5 shadow-card"
              >
                <p className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
                  <ListChecks className="h-4 w-4 text-accent" />
                  فهرست این صفحه
                </p>
                <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                  {toc.map((item, i) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="flex items-start gap-2 rounded-xl border border-transparent px-3 py-2 text-sm leading-7 text-ink-500 transition hover:border-accent/20 hover:bg-accent/[.04] hover:text-accent"
                      >
                        <span className="text-accent/70">
                          {(i + 1).toLocaleString("fa-IR")}.
                        </span>
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <ClusterContent path={post.path} />
            <PagePriceTable title={post.title} path={post.path} />
            {!HIDE_LEGACY_BODY.has(post.path) && (
              <>
                <div className="rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8 lg:p-10">
                  <div
                    id="post-content"
                    className="prose-fa brand-prose"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                </div>
                <ContentEnhancer targetId="post-content" />
              </>
            )}
            <ReaderComments path={post.path} />
            <RepairTypeLinks post={post} />
            <RelatedLinks post={post} />
          </main>

          <aside className="sticky-sidebar">
            <div className="sticky-sidebar-content space-y-5">
              <ContactCard />
              <div className="overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-card">
                <p className="text-sm font-extrabold text-ink-900">شعب فعال</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-ink-700">
                  <div className="flex gap-2">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" />
                    <span>{SITE.address}</span>
                  </div>
                  <div className="flex gap-2">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" />
                    <span>{SITE.addressWest}</span>
                  </div>
                </div>
              </div>
              {otherBrands.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-card">
                  <p className="text-sm font-extrabold text-ink-900">نمایندگی سایر برندها</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {otherBrands.map((brand) => (
                      <Link
                        key={brand.slug}
                        href={brand.slug}
                        className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink-700 transition hover:border-accent hover:text-accent"
                      >
                        {brand.title.replace(/^نمایندگی\s+/, "")}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-accent to-accent-deep px-6 py-11 text-center text-white sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-12 -top-24 h-[300px] w-[300px] rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-[32px]">
              دستگاه را قبل از تعمیر دقیق بررسی می کنیم
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-8 text-white/88">
              عیب یابی اولیه رایگان است و هزینه تعمیر پیش از شروع کار اعلام می شود.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={SITE.phoneHref}
                dir="ltr"
                className="inline-flex items-center gap-2.5 rounded-[14px] bg-white px-7 py-3.5 text-base font-extrabold text-accent shadow-[0_12px_30px_rgba(0,0,0,.18)]"
              >
                <Phone className="h-[19px] w-[19px]" />
                {SITE.phone}
              </a>
              <Link
                href="/contact/"
                className="inline-flex items-center gap-2 rounded-[14px] border border-white/35 bg-white/15 px-6 py-3.5 text-base font-bold text-white transition hover:bg-white/25"
              >
                آدرس شعب و مسیریابی
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PillarArticles path={post.path} />
      <ServiceCentersSlot path={post.path} />
    </article>
  );
}
