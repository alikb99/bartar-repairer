import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Phone,
  ChevronLeft,
  ListChecks,
  Check,
  MapPin,
  Clock3,
  ShieldCheck,
  Wrench,
  ArrowLeft,
} from "lucide-react";
import {
  POSTS,
  postBySegments,
  breadcrumbs,
  readingMinutes,
  extractFaq,
  h1For,
  mobileRepairInfo,
  CANONICAL_TO,
  CATEGORIES,
} from "@/lib/content";
import { howToSchema } from "@/lib/howto";
import { SCHEMA_CURRENCY, pricesForPage, rial } from "@/lib/pricing";
import { SITE } from "@/lib/data";
import { authorFor } from "@/lib/authors";
import { personId } from "@/lib/team";
import { serviceAreasFor } from "@/lib/service-areas";
import { calloutFor } from "@/lib/recovered-callouts";
import { commentsFor } from "@/lib/recovered-comments";
import { clusterContentFor } from "@/lib/cluster-content";
import ContactCard from "@/components/ContactCard";
import ClusterContent from "@/components/ClusterContent";
import PageCallout from "@/components/PageCallout";
import PageNotes from "@/components/PageNotes";
import ReaderComments from "@/components/ReaderComments";
import PagePriceTable from "@/components/PagePriceTable";
import ContentEnhancer from "@/components/ContentEnhancer";
import ReadingProgress from "@/components/ReadingProgress";
import XiaomiLanding from "@/components/XiaomiLanding";
import BrandLanding from "@/components/BrandLanding";
import MobileRepairLanding from "@/components/MobileRepairLanding";
import RelatedLinks from "@/components/RelatedLinks";
import PillarArticles from "@/components/PillarArticles";
import RepairTypeLinks from "@/components/RepairTypeLinks";
import ContactPage from "@/components/ContactPage";
import RepairRequestPage from "@/components/RepairRequestPage";
import ServiceDeviceSceneLoader from "@/components/ServiceDeviceSceneLoader";
import ServiceCentersSlot from "@/components/ServiceCentersSlot";
import HotjarCallTracking from "@/components/HotjarCallTracking";
import LaptopProblems from "@/components/LaptopProblems";

// WordPress category id -> name, for the byline classifier in lib/authors.ts.
const CATEGORY_NAME = new Map(CATEGORIES.map((c) => [c.termId, c.name]));

// Brand "نمایندگی" pages rendered with the generic premium brand layout.
const BRAND_PAGES = new Set([
  "/nokia/",
  "/htc/",
  "/dell/",
  "/sony/",
  "/asus/",
  "/lenovo/",
  "/hp/",
  "/apple/",
  "/huawei/",
  "/samsung/",
]);

// Keep legacy URLs reachable as required, while keeping pages with no real
// content out of Google's index: a duplicate homepage and an empty service
// page that was never written. (The Elementor test page that used to be listed
// here is no longer exported at all — see UNBUILT_PAGES.)
const NOINDEX_PAGES = new Set([
  "/home/",
  "/home-appliances/air-conditioner-repair-agency/",
]);

// Paths in POSTS that are deliberately not exported.
//   /blog/            — an empty WordPress placeholder; the real articles
//                       listing is the app/blog route, which owns that URL.
//   /تست-المنتور/     — an Elementor test page: 11 words of body, "تست المنتور"
//                       for a title, no inbound link from anywhere on the site,
//                       and absent from the sitemap and llms.txt. It was
//                       noindex, so dropping it costs no ranking; .htaccess
//                       answers 410 so the URL is retired rather than left to
//                       look like a broken page.
const UNBUILT_PAGES = new Set(["/blog/", "/تست-المنتور/"]);

// The landing page of the paid laptop campaign. It gets Hotjar with call-tap
// events, a problems block under the hero and a hero tuned for a visitor who
// arrived ready to call. The database body below is unchanged.
const LAPTOP_AD_LANDING = "/services/laptop-repair/";

export function generateStaticParams() {
  return POSTS.filter((p) => !UNBUILT_PAGES.has(p.path)).map((p) => ({
    slug: p.segments,
  }));
}

// WordPress exported its timestamps as bare local time ("2026-02-23 15:59:13").
// Schema.org dates without an offset are ambiguous — Google reads them as UTC,
// which shifts every article's published and modified time by 3.5 hours. The
// shop and its whole audience are in Tehran, so the offset is Iran Standard
// Time. IRST has had no DST since 2022, which is what makes a fixed offset the
// right answer rather than a lookup.
const TEHRAN_OFFSET = "+03:30";
function isoDate(d: string): string {
  return `${d.replace(" ", "T")}${TEHRAN_OFFSET}`;
}

function faDate(d: string): string {
  const dt = new Date(d.replace(" ", "T"));
  if (isNaN(dt.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dt);
  } catch {
    return "";
  }
}

// Best social-preview image for a page: its featured image, else the first
// meaningful content image (skipping logos / decorative textures), else null
// so the page inherits the branded default OG card.
const DECORATIVE =
  /abstract|grunge|texture|stucco|relief|decorative|background|pattern|placeholder|spacer|blank|logo/i;
function ogImageFor(post: ReturnType<typeof postBySegments>): string | null {
  if (!post) return null;
  if (post.image) return post.image;
  const cands = [...post.content.matchAll(/<img[^>]*>/gi)]
    .map((t) => ({
      src: (t[0].match(/src="([^"]*)"/) || [])[1] || "",
      alt: (t[0].match(/alt="([^"]*)"/) || [])[1] || "",
    }))
    .filter((c) => c.src);
  const good = cands.find((c) => !DECORATIVE.test(c.src) && c.alt.trim());
  if (good) return good.src;
  const ok = cands.find((c) => !DECORATIVE.test(c.src));
  return ok ? ok.src : null;
}

function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE.domain}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySegments(slug);
  if (!post) return {};
  // Real content image when available, else the branded default OG card.
  // (Setting openGraph here prevents the file-convention default from being
  //  inherited automatically, so we reference it explicitly.)
  const img = ogImageFor(post) || "/opengraph-image";
  // Duplicate-title pages point at the version that should rank; the URL stays
  // live so no inbound link breaks.
  const canonicalPath =
    post.path === "/home/" ? "/" : CANONICAL_TO[post.path] ?? post.path;
  return {
    // Database/Yoast titles are already complete. `absolute` prevents the
    // root template from appending a second brand suffix to every legacy URL.
    title: { absolute: post.metaTitle },
    description: post.metaDesc,
    alternates: { canonical: encodeURI(canonicalPath) },
    robots: NOINDEX_PAGES.has(post.path)
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: post.type === "post" ? "article" : "website",
      title: post.metaTitle,
      description: post.metaDesc,
      images: [{ url: img, width: 1200, height: 630, alt: post.title }],
      url: `${SITE.domain}${encodeURI(canonicalPath)}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDesc,
      images: [img],
    },
  };
}

function Breadcrumb({
  crumbs,
}: {
  crumbs: { title: string; path: string }[];
}) {
  return (
    <nav
      className="flex flex-wrap items-center gap-1 text-sm text-ink-500"
      aria-label="مسیر"
    >
      <Link href="/" className="hover:text-accent">
        خانه
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4 text-ink-300" />
          {i === crumbs.length - 1 ? (
            <span className="line-clamp-1 text-ink-700">{c.title}</span>
          ) : (
            <Link href={c.path} className="line-clamp-1 hover:text-accent">
              {c.title}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const post = postBySegments(slug);
  if (!post) notFound();

  if (post.path === "/contact/") return <ContactPage post={post} />;
  if (post.path === "/online-repair-request/")
    return <RepairRequestPage post={post} />;
  if (post.path === "/xiaomi/") return <XiaomiLanding post={post} />;
  if (BRAND_PAGES.has(post.path)) return <BrandLanding post={post} />;
  // Every mobile-repair service page (hub, brand page or model page) renders
  // with the premium mobile landing (ui/Mobile Repair.dc.html).
  if (mobileRepairInfo(post)) return <MobileRepairLanding post={post} />;

  const crumbs = breadcrumbs(post);
  const mins = readingMinutes(post.content);
  const isArticle = post.type === "post";
  const date = isArticle ? faDate(post.date) : "";
  // The one technician whose owner-supplied specialty covers this article —
  // see lib/authors.ts. Only articles get a named byline; service pages keep
  // describing the shop's offer, not a person's writing.
  const author = isArticle
    ? authorFor({
        path: post.path,
        title: post.title,
        kind: "post",
        categoryNames: post.categories
          .map((id) => CATEGORY_NAME.get(id))
          .filter((n): n is string => !!n),
      })
    : null;

  // Table of contents for articles: id every H2 and collect headings so readers
  // (and SERP jump-links) can navigate long guides.
  const toc: { id: string; text: string }[] = [];
  let bodyHtml = post.content;
  {
    let n = 0;
    bodyHtml = post.content.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => {
      const id = "sec-" + ++n;
      const text = t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      toc.push({ id, text });
      return `<h2 id="${id}">${t}</h2>`;
    });
  }

  // A "body" callout sits between the intro and the first heading, so the
  // article body is rendered in two halves with the panel between them. Pages
  // without one keep a single block — the split must not change their markup.
  const callout = calloutFor(post.path);
  const splitAt = callout?.slot === "body" ? bodyHtml.search(/<h2\b/i) : -1;
  const bodyIntro = splitAt > 0 ? bodyHtml.slice(0, splitAt) : "";
  const bodyRest = splitAt > 0 ? bodyHtml.slice(splitAt) : "";

  // Service pages: split the long database HTML at every <h2> so each topic
  // renders as its own numbered card instead of one unbroken wall of text.
  // The markup inside each section is preserved byte-for-byte.
  const svcSections: { id: string; html: string }[] = [];
  let svcLead = "";
  if (!isArticle) {
    const parts = bodyHtml.split(/(?=<h2\b)/i);
    if (parts.length && !/^<h2\b/i.test(parts[0])) svcLead = parts.shift() || "";
    for (const part of parts) {
      const idm = part.match(/<h2\b[^>]*id="([^"]+)"/i);
      svcSections.push({
        id: idm ? idm[1] : `sec-x${svcSections.length}`,
        html: part,
      });
    }
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${SITE.domain}${encodeURI(post.path)}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.title,
        item: `${SITE.domain}${encodeURI(c.path)}`,
      })),
    ],
  };
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE.domain}${encodeURI(post.path)}#webpage`,
    url: `${SITE.domain}${encodeURI(post.path)}`,
    name: h1For(post.path, post.title),
    description: post.metaDesc,
    inLanguage: "fa-IR",
    isPartOf: { "@id": SITE.websiteId },
    about: { "@id": isArticle ? SITE.organizationId : SITE.localBusinessId },
    breadcrumb: { "@id": `${SITE.domain}${encodeURI(post.path)}#breadcrumb` },
    primaryImageOfPage: post.image
      ? { "@type": "ImageObject", url: absoluteUrl(post.image) }
      : undefined,
  };
  // Reader questions and the shop's answers, published as Comment nodes so the
  // page's real Q&A is machine readable. Pages whose deployed copy showed the
  // thread without the JSON-LD keep it that way (`schema: false`).
  const comments = commentsFor(post.path);
  const commentSchema =
    comments?.schema && comments.threads.length
      ? comments.threads.map((c) => ({
          "@type": "Comment",
          text: c.text,
          datePublished: isoDate(c.dateTime),
          author:
            c.schemaAuthor === SITE.brandName
              ? {
                  "@type": "Organization",
                  name: SITE.brandName,
                  url: `${SITE.domain}/team/`,
                }
              : { "@type": "Person", name: c.schemaAuthor ?? c.author },
          ...(c.reply
            ? {
                comment: [
                  {
                    "@type": "Comment",
                    text: c.reply.text,
                    datePublished: isoDate(c.reply.dateTime),
                    author: {
                      "@type": "Organization",
                      name: SITE.brandName,
                      url: `${SITE.domain}/team/`,
                    },
                  },
                ],
              }
            : {}),
          url: `${SITE.domain}${encodeURI(post.path)}#comment-${c.id}`,
        }))
      : null;

  const articleSchema = isArticle
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${SITE.domain}${encodeURI(post.path)}#article`,
        headline: post.title,
        ...(commentSchema
          ? { comment: commentSchema, commentCount: commentSchema.length }
          : {}),
        image: post.image ? [absoluteUrl(post.image)] : undefined,
        datePublished: isoDate(post.date),
        dateModified: isoDate(post.modified),
        // The technician whose specialty covers this article when one was
        // resolved (see lib/authors.ts); falls back to the sitewide editorial
        // team only for the rare topic nobody on the roster covers.
        author: {
          "@id": author ? personId(SITE.domain, author.slug) : SITE.authorId,
        },
        publisher: { "@id": SITE.organizationId },
        mainEntityOfPage: `${SITE.domain}${encodeURI(post.path)}`,
        description: post.metaDesc,
      }
    : null;

  // Real prices for this exact page (brand + repair type), when available.
  const pagePrices = !isArticle ? pricesForPage(post.title, post.path) : null;
  // Neighbourhood pages are a service offer wherever they live in the database:
  // "تعمیر لپ تاپ ایسر در آیت الله کاشانی" is a service in a named place, not
  // an article, so it gets the Service node and names the district it serves.
  const areas = serviceAreasFor(post);
  const serviceSchema =
    !isArticle || areas.length > 0
      ? {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${SITE.domain}${encodeURI(post.path)}#service`,
        name: h1For(post.path, post.title),
        serviceType: post.title.split("|")[0].trim(),
        areaServed: areas.length
          ? areas.map((a) => ({
              "@type": "Place",
              name: `${a.name}، ${SITE.city}`,
            }))
          : { "@type": "City", name: SITE.city },
        // Reference the sitewide LocalBusiness node instead of duplicating it.
        provider: { "@id": SITE.localBusinessId },
        image: post.image
          ? absoluteUrl(post.image)
          : `${SITE.domain}/logo.png`,
        url: `${SITE.domain}${encodeURI(post.path)}`,
        description: post.metaDesc,
        ...(pagePrices
          ? {
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: SCHEMA_CURRENCY,
                lowPrice: rial(Math.min(...pagePrices.rows.map((p) => p.from))),
                highPrice: rial(
                  Math.max(...pagePrices.rows.map((p) => p.to ?? p.from)),
                ),
                offerCount: pagePrices.rows.length,
                availability: "https://schema.org/InStock",
                url: `${SITE.domain}${encodeURI(post.path)}`,
              },
            }
          : {}),
      }
    : null;

  // HowTo markup for articles that genuinely describe a procedure. Steps come
  // from the article's own ordered list or step headings.
  const howTo = isArticle
    ? howToSchema(
        post,
        SITE.domain,
        author ? personId(SITE.domain, author.slug) : SITE.authorId,
      )
    : null;

  const faqs = [
    ...(clusterContentFor(post.path)?.faq ?? []),
    ...extractFaq(post.content),
  ];
  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": `${SITE.domain}${encodeURI(post.path)}#faq`,
          inLanguage: "fa-IR",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  const category = crumbs.length > 1 ? crumbs[0].title : "مقاله";
  const isAdLanding = post.path === LAPTOP_AD_LANDING;
  const heroBadges = isAdLanding
    ? [
        { icon: Wrench, title: "عیب یابی", text: "رایگان" },
        { icon: ShieldCheck, title: "گارانتی کتبی", text: "۶ ماهه" },
        { icon: Clock3, title: "قطعه موجود", text: "همان روز" },
      ]
    : [
        { icon: Wrench, title: "عیب یابی", text: "رایگان" },
        { icon: ShieldCheck, title: "گارانتی", text: "۶ ماهه" },
        { icon: Clock3, title: "تحویل", text: "سریع" },
      ];

  return (
    <article>
      {isArticle && <ReadingProgress />}
      {isAdLanding && (
        <HotjarCallTracking hotjarId={6777563} trackYektanet />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      {articleSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
      )}
      {serviceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      )}
      {howTo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {isArticle ? (
        /* ===== ARTICLE HEADER (ui: Article mockup) ===== */
        <header className="bg-gradient-to-b from-white to-paper">
          <div className="mx-auto max-w-[820px] px-4 pb-8 pt-8 sm:px-6">
            <Breadcrumb crumbs={crumbs} />
            <div className="mt-6">
              <div className="mb-4 flex flex-wrap items-center gap-2.5">
                <span className="rounded-lg bg-accent-tint px-3 py-1.5 text-xs font-extrabold text-accent">
                  {category}
                </span>
                <span className="text-[13px] text-ink-300">
                  {date && `${date} · `}
                  {mins} دقیقه مطالعه
                </span>
              </div>
              <h1 className="text-[28px] font-extrabold leading-[1.5] tracking-tight text-ink-900 sm:text-[38px]">
                {h1For(post.path, post.title)}
              </h1>
              {author ? (
                <Link
                  href={`/team/${author.slug}/`}
                  className="mt-5 flex w-fit items-center gap-3 rounded-xl transition hover:opacity-80"
                  aria-label={`مشاهده پروفایل ${author.name}`}
                >
                  <div className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#E4E7EC] text-base font-extrabold text-ink-500">
                    {author.name[0]}
                  </div>
                  <div>
                    <div className="text-[14.5px] font-extrabold text-ink-900">
                      {author.name}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-ink-300">
                      {author.specialty ?? "مشاهده پروفایل تعمیرکار"}
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/team/"
                  className="mt-5 flex w-fit items-center gap-3 rounded-xl transition hover:opacity-80"
                  aria-label="مشاهده تیم فنی تعمیرات برتر"
                >
                  <div className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#E4E7EC] text-base font-extrabold text-ink-500">
                    ب
                  </div>
                  <div>
                    <div className="text-[14.5px] font-extrabold text-ink-900">
                      تیم فنی تعمیرات برتر
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-ink-300">
                      مشاهده تخصص تکنسین ها
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </header>
      ) : (
        /* ===== SERVICE / PAGE HERO ===== */
        <header className="relative overflow-hidden bg-[#F7F8FA]">
          <div className="absolute inset-0 bg-finegrid opacity-70" />
          <div className="absolute inset-x-0 top-0 h-px bg-line" />
          <div className="relative mx-auto grid max-w-[1240px] gap-8 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1.03fr)_minmax(360px,.74fr)] lg:px-8 lg:pb-20">
            <Breadcrumb crumbs={crumbs} />
            <div className="max-w-2xl lg:col-start-1">
              <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 shadow-[0_4px_14px_rgba(20,24,31,.05)]">
                <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_4px_rgba(218,37,28,.14)]" />
                <span className="text-[13px] font-bold text-ink-700">
                  مرکز تخصصی تعمیرات در {SITE.city}
                </span>
              </span>
              <h1 className="text-[30px] font-extrabold leading-[1.3] tracking-tight text-ink-900 sm:text-[44px]">
                {h1For(post.path, post.title)}
              </h1>
              <p className="mt-4 max-w-[560px] text-[17px] leading-9 text-ink-500">
                {post.metaDesc}
              </p>
              <div
                data-cta="hero"
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <a
                  href={SITE.phoneHref}
                  className="flex items-center gap-2.5 rounded-[14px] bg-accent px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_26px_rgba(218,37,28,.30)] transition hover:-translate-y-0.5 hover:bg-accent-deep"
                >
                  <Phone className="h-[19px] w-[19px]" />
                  تماس و رزرو نوبت
                </a>
                {isAdLanding ? (
                  /* A campaign visitor outside shop hours cannot reach the
                     phone; the online request keeps that visit from being
                     lost. Other pages keep the jump to their body text. */
                  <Link
                    href="/online-repair-request/"
                    className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-hairline bg-white px-6 py-3.5 text-base font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                  >
                    ثبت درخواست آنلاین
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <a
                    href="#content"
                    className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-hairline bg-white px-6 py-3.5 text-base font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                  >
                    مشاهده متن صفحه
                    <ArrowLeft className="h-4 w-4" />
                  </a>
                )}
              </div>
              {isAdLanding && (
                <p className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-ink-500">
                  <Clock3 className="h-4 w-4 shrink-0 text-accent" />
                  پاسخگویی تلفنی: {SITE.hours}
                </p>
              )}
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-2.5 sm:gap-3">
                {heroBadges.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-line bg-white/84 p-3 shadow-card backdrop-blur sm:p-4"
                  >
                    <item.icon className="h-5 w-5 text-accent" />
                    <div className="mt-2 text-xs font-extrabold text-ink-900 sm:mt-3 sm:text-sm">
                      {item.title}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-ink-500 sm:text-xs">
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Decorative. On a phone it pushes the problems block a full
                screen down on the ad landing, so it is desktop-only there. */}
            <div
              className={`relative min-h-[250px] overflow-hidden rounded-[28px] border border-white bg-ink-950 shadow-float sm:min-h-[320px] lg:col-start-2 lg:row-span-2 lg:min-h-[430px] ${isAdLanding ? "hidden lg:block" : ""}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(218,37,28,.34),transparent_38%),linear-gradient(145deg,#242936,#13161C)]" />
              <ServiceDeviceSceneLoader />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-white/[.08] p-4 text-white backdrop-blur-md">
                <div className="text-sm font-extrabold">بررسی دقیق دستگاه قبل از تعمیر</div>
                <div className="mt-1.5 text-xs leading-6 text-white/68">
                  هزینه و زمان تعمیر پیش از شروع کار شفاف اعلام می شود.
                </div>
              </div>
            </div>
          </div>
        </header>
      )}
      {isAdLanding && <LaptopProblems />}

      {/* Body */}
      {isArticle ? (
        <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6 lg:px-8">
          {post.image && (
            <div className="mt-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image}
                alt={post.title}
                width={896}
                height={504}
                fetchPriority="high"
                className="aspect-[16/9] w-full rounded-3xl border border-line object-cover"
              />
            </div>
          )}
          <ClusterContent path={post.path} />
          <PageNotes path={post.path} />
          {toc.length >= 3 && (
            <nav
              aria-label="فهرست مطالب"
              className="mt-10 rounded-2xl border border-line bg-paper p-5"
            >
              <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
                <ListChecks className="h-4 w-4 text-accent" />
                در این مقاله می خوانید
              </p>
              <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {toc.map((t, i) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-500 transition hover:bg-white hover:text-accent"
                    >
                      <span className="text-accent/60">
                        {(i + 1).toLocaleString("fa-IR")}.
                      </span>
                      {t.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {splitAt > 0 ? (
            <div id="post-content" className="prose-fa mt-10">
              <div className="prose-fa" dangerouslySetInnerHTML={{ __html: bodyIntro }} />
              <PageCallout path={post.path} slot="body" />
              <div className="prose-fa" dangerouslySetInnerHTML={{ __html: bodyRest }} />
            </div>
          ) : (
            <div
              id="post-content"
              className="prose-fa mt-10"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          )}
          <PageCallout path={post.path} slot="end" />
          <ReaderComments path={post.path} />
          <ContentEnhancer targetId="post-content" />
          <RepairTypeLinks post={post} />
          <RelatedLinks post={post} />
          <BottomCta />
        </div>
      ) : (
        <div id="content" className="bg-paper">
          <div className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              {post.image && (
                <div className="mb-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.title}
                    width={896}
                    height={504}
                    fetchPriority="high"
                    className="aspect-[16/9] w-full rounded-[26px] border border-line bg-white object-cover shadow-card"
                  />
                </div>
              )}
              {toc.length >= 3 && (
                <nav
                  aria-label="فهرست مطالب"
                  className="mb-7 rounded-[22px] border border-line bg-white p-5 shadow-card"
                >
                  <p className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
                    <ListChecks className="h-4 w-4 text-accent" />
                    فهرست این صفحه
                  </p>
                  <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                    {toc.map((t, i) => (
                      <li key={t.id}>
                        <a
                          href={`#${t.id}`}
                          className="flex items-start gap-2 rounded-xl border border-transparent px-3 py-2 text-sm leading-7 text-ink-500 transition hover:border-accent/20 hover:bg-accent/[.04] hover:text-accent"
                        >
                          <span className="text-accent/70">
                            {(i + 1).toLocaleString("fa-IR")}.
                          </span>
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <ClusterContent path={post.path} />
              <PagePriceTable title={post.title} path={post.path} />
              <div id="post-content" className="prose-fa service-prose svc-stack">
                {svcLead.trim() && (
                  <div
                    className="svc-body svc-lead rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8"
                    dangerouslySetInnerHTML={{ __html: svcLead }}
                  />
                )}
                {svcSections.map((s, i) => (
                  <Fragment key={s.id}>
                    <section className="svc-section rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8">
                      <div
                        className="svc-body"
                        dangerouslySetInnerHTML={{ __html: s.html }}
                      />
                    </section>
                    {/* On a service page the panel follows the opening section,
                        where the reader has just been told what we do and is
                        deciding whether the shop is near enough to bother. */}
                    {i === 0 && <PageCallout path={post.path} slot="body" />}
                  </Fragment>
                ))}
                {!svcLead.trim() && svcSections.length === 0 && (
                  <div
                    className="svc-body rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8 lg:p-10"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                )}
              </div>
              <ContentEnhancer targetId="post-content" />
              <RepairTypeLinks post={post} />
              <RelatedLinks post={post} />
            </div>

            {/* Sticky sidebar */}
            <aside className="sticky-sidebar">
              <div className="sticky-sidebar-content space-y-5">
                <ContactCard />
                <div className="overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-card">
                  <p className="text-sm font-extrabold text-ink-900">مراحل ثبت تعمیر</p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-700">
                    {["تماس و توضیح ایراد دستگاه", "عیب یابی و اعلام هزینه", "تعمیر و تحویل همراه گارانتی"].map((t) => (
                      <li key={t} className="flex gap-2">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
          </div>
        </div>
      )}
      {!isArticle && <ServiceCtaBand title={post.title} />}
      {!isArticle && <PillarArticles path={post.path} />}
      <ServiceCentersSlot path={post.path} />
    </article>
  );
}

/* Inline dark CTA inside articles (ui: Article mockup). */
function BottomCta() {
  return (
    <div className="mt-12 flex flex-wrap items-center justify-between gap-5 rounded-[20px] bg-gradient-to-br from-[#22262F] to-ink-950 px-7 py-7 sm:px-8">
      <div className="text-white">
        <div className="text-[19px] font-extrabold">دستگاهت نیاز به تعمیر دارد؟</div>
        <div className="mt-1.5 text-sm text-ink-300">
          عیب یابی رایگان است. تماس بگیرید یا درخواست خود را آنلاین ثبت کنید.
        </div>
      </div>
      {/* Two ways out, because an article is read at every hour and the phone
          only answers during shop hours. */}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={SITE.phoneHref}
          dir="ltr"
          className="flex shrink-0 items-center gap-2 rounded-[13px] bg-accent px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-accent-deep"
        >
          <Phone className="h-4 w-4" />
          {SITE.phone}
        </a>
        <Link
          href="/online-repair-request/"
          className="flex shrink-0 items-center gap-2 rounded-[13px] border-[1.5px] border-white/25 px-6 py-3.5 text-[15px] font-bold text-white transition hover:border-white/60 hover:bg-white/10"
        >
          ثبت درخواست آنلاین
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* Dark CTA band with branch cards for service pages (ui: Mobile Repair mockup). */
function ServiceCtaBand({ title }: { title: string }) {
  const short = title.split(/\s+با\s+|\s*[|،–—-]\s*/)[0].trim();
  return (
    <section className="mx-auto max-w-[1240px] px-4 pb-20 sm:px-6 lg:px-8">
      <div className="grid items-center gap-8 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#22262F] to-ink-950 p-8 sm:p-11 lg:grid-cols-[1.3fr_1fr]">
        <div className="text-white">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-[30px]">
            {short} را به متخصص بسپارید
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-8 text-ink-300">
            همین حالا تماس بگیرید یا به نزدیک ترین شعبه مراجعه کنید. عیب یابی رایگان است.
          </p>
          <a
            href={SITE.phoneHref}
            dir="ltr"
            data-cta="band"
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
  );
}
