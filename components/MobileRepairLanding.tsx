import Link from "next/link";
import {
  BatteryCharging,
  Camera,
  Check,
  ChevronDown,
  CircuitBoard,
  Cpu,
  Droplets,
  ListChecks,
  MapPin,
  Phone,
  PlugZap,
  ShieldCheck,
  Smartphone,
  Volume2,
  Wrench,
} from "lucide-react";
import {
  POSTS,
  NAV,
  extractFaq,
  h1For,
  mobileRepairInfo,
  type Post,
} from "@/lib/content";
import { SITE } from "@/lib/data";
import { SCHEMA_CURRENCY, pricesForPage, rial } from "@/lib/pricing";
import { clusterContentFor } from "@/lib/cluster-content";
import ClusterContent from "@/components/ClusterContent";
import ContentEnhancer from "@/components/ContentEnhancer";
import PagePriceTable from "@/components/PagePriceTable";
import PillarArticles from "@/components/PillarArticles";
import PageCallout from "@/components/PageCallout";
import { CARD_LABELS } from "@/lib/recovered-hub-labels";
import RelatedLinks from "@/components/RelatedLinks";
import RepairRequestSection from "@/components/RepairRequestSection";
import RepairTypeLinks from "@/components/RepairTypeLinks";
import ServiceCentersSlot from "@/components/ServiceCentersSlot";

// Premium mobile-repair landing implementing ui/Mobile Repair.dc.html.
// The exact database content renders untouched inside the white content
// cards; the mockup sections (hero, faults, process, CTA band, related
// brands) wrap around it.

type TocItem = { id: string; text: string };

const FAULTS = [
  {
    icon: Smartphone,
    title: "تعویض گلس و تاچ",
    desc: "تعویض شیشه و صفحه لمسی شکسته با قطعه اصل.",
  },
  {
    icon: BatteryCharging,
    title: "تعویض باتری",
    desc: "رفع افت شارژ و خاموشی ناگهانی با باتری اورجینال.",
  },
  {
    icon: PlugZap,
    title: "کانکتور شارژ",
    desc: "تعمیر و تعویض سوکت شارژ و مشکلات شارژ نشدن.",
  },
  {
    icon: Camera,
    title: "دوربین",
    desc: "رفع تاری، لک و خرابی دوربین جلو و عقب.",
  },
  {
    icon: Droplets,
    title: "خیس شدگی",
    desc: "احیای دستگاه های آب خورده و شست و شوی برد.",
  },
  {
    icon: CircuitBoard,
    title: "تعمیر برد",
    desc: "تعمیر تخصصی مادربرد و قطعات سطح آی سی.",
  },
  {
    icon: Volume2,
    title: "اسپیکر و میکروفون",
    desc: "رفع مشکلات صدا، اسپیکر و میکروفون.",
  },
  {
    icon: Cpu,
    title: "نرم افزار و فلش",
    desc: "رفع هنگ، ریست و نصب نرم افزار رسمی.",
  },
];

// Default FAQ set from the mockup — rendered only when the database content
// carries no FAQ of its own.
const DEFAULT_FAQS = [
  {
    q: "هزینه عیب یابی چقدر است؟",
    a: "عیب یابی در هر دو شعبه کاملا رایگان است و قبل از هر تعمیری هزینه دقیق به شما اعلام می شود.",
  },
  {
    q: "تعمیر معمولا چقدر طول می کشد؟",
    a: "بسیاری از تعمیرات رایج مانند تعویض گلس یا باتری در همان روز انجام می شود. تعمیرات تخصصی برد ممکن است ۱ تا ۳ روز زمان ببرد.",
  },
  {
    q: "آیا قطعات ضمانت دارند؟",
    a: "بله، روی قطعات و خدمات تعمیر برگه ضمانت کتبی صادر می شود.",
  },
  {
    q: "اطلاعات گوشی من حفظ می شود؟",
    a: "در بیشتر تعمیرات اطلاعات دستگاه دست نخورده باقی می ماند؛ با این حال توصیه می کنیم پیش از تحویل، از اطلاعات خود نسخه پشتیبان بگیرید.",
  },
  {
    q: "امکان تعمیر فوری وجود دارد؟",
    a: "بله، برای بسیاری از خدمات امکان تعمیر فوری در حضور شما فراهم است. کافی است هنگام مراجعه اعلام کنید.",
  },
];

const STEPS = [
  { n: "۱", title: "تماس / مراجعه", desc: "تماس بگیرید یا به شعبه مراجعه کنید." },
  { n: "۲", title: "عیب یابی رایگان", desc: "تشخیص و اعلام هزینه دقیق." },
  { n: "۳", title: "تعمیر تخصصی", desc: "تعمیر با قطعات اصل." },
  { n: "۴", title: "تحویل با ضمانت", desc: "تحویل دستگاه سالم + ضمانت." },
];

const stripText = (html: string) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let n = 0;
  const body = html.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_m, inner) => {
    const id = `sec-${++n}`;
    const text = stripText(inner);
    if (text) toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: body, toc };
}

// Split the long database HTML at every <h2> so each topic renders as its own
// card. Markup inside each section is preserved byte-for-byte.
function splitSections(html: string): { lead: string; sections: { id: string; html: string }[] } {
  const parts = html.split(/(?=<h2\b)/i);
  let lead = "";
  if (parts.length && !/^<h2\b/i.test(parts[0])) lead = parts.shift() || "";
  const sections = parts.map((part, i) => {
    const idm = part.match(/<h2\b[^>]*id="([^"]+)"/i);
    return { id: idm ? idm[1] : `sec-x${i}`, html: part };
  });
  return { lead, sections };
}

// Wrap the brand name inside the H1 with the accent color without altering
// the title text itself.
function TitleWithAccent({ title, brand }: { title: string; brand: string | null }) {
  if (!brand) return <>{title}</>;
  const idx = title.indexOf(brand);
  if (idx < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, idx)}
      <span className="text-accent">{brand}</span>
      {title.slice(idx + brand.length)}
    </>
  );
}

// Short mockup-style breadcrumb: خانه / تعمیر موبایل / [برند] / [صفحه]
function Breadcrumb({ crumbs }: { crumbs: { title: string; path: string }[] }) {
  return (
    <nav
      className="mb-7 flex flex-wrap items-center gap-2 text-[13px] text-ink-300"
      aria-label="مسیر"
    >
      <Link href="/" className="hover:text-accent">
        خانه
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-2">
          <span aria-hidden>/</span>
          {i === crumbs.length - 1 ? (
            <span className="line-clamp-1 font-bold text-ink-900">{c.title}</span>
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

export default function MobileRepairLanding({ post }: { post: Post }) {
  const info = mobileRepairInfo(post);
  const brand = info?.brandFa ?? null;
  const brandLabel = brand ?? "موبایل";
  // "موبایل سامسونگ" with a brand, plain "موبایل" without (avoids "موبایل موبایل").
  const phoneLabel = brand ? `موبایل ${brand}` : "موبایل";
  const childPages = POSTS.filter((c) => c.parent === post.id);
  const faqs = [
    ...(clusterContentFor(post.path)?.faq ?? []),
    ...extractFaq(post.content),
  ];
  const { html: idHtml, toc } = withHeadingIds(post.content);
  const { lead, sections } = splitSections(idHtml);

  // Related mobile brands (internal linking across the mobile cluster).
  const mobileGroup = NAV.find((n) => n.title === "تعمیرات موبایل");
  const otherBrands = (mobileGroup?.children ?? []).filter(
    (c) => c.slug !== post.path,
  );

  // Brand-level pages (the mobile hub + brand mobile pages listed in the nav)
  // get the exact mockup hero copy; model/service leaf pages keep their own
  // topic-specific H1 (trimmed at the first separator for a clean look).
  const MOBILE_HUB = "/services/category-mobile-phone-repair/";
  const isBrandLevel =
    post.path === MOBILE_HUB ||
    (mobileGroup?.children ?? []).some((c) => c.slug === post.path);
  const heroTitle = h1For(
    post.path,
    isBrandLevel && brand
      ? `تعمیر تخصصی موبایل ${brand}`
      : post.title.split(/\s*[|]\s*/)[0].trim(),
  );
  const heroLead =
    isBrandLevel && brand
      ? `از تعویض گلس و باتری تا تعمیر برد و رفع خیس شدگی؛ تمام مدل های موبایل ${brand} توسط تکنسین متخصص و با قطعات اصل تعمیر می شوند.`
      : post.metaDesc;

  // Short mockup breadcrumb. The brand crumb links to the brand's mobile hub
  // when this page is a model/service page of a known brand.
  const brandCrumb =
    !isBrandLevel && brand
      ? (mobileGroup?.children ?? []).find((c) => c.title.includes(brand))
      : undefined;
  const crumbs: { title: string; path: string }[] = [
    ...(post.path !== MOBILE_HUB
      ? [{ title: "تعمیر موبایل", path: MOBILE_HUB }]
      : []),
    ...(brandCrumb && brandCrumb.slug !== post.path
      ? [{ title: brand as string, path: brandCrumb.slug }]
      : []),
    {
      title: isBrandLevel && brand ? brand : heroTitle,
      path: post.path,
    },
  ];

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
    about: { "@id": SITE.localBusinessId },
    breadcrumb: { "@id": `${SITE.domain}${encodeURI(post.path)}#breadcrumb` },
  };
  // Real prices for this exact page (brand + repair), when we have them.
  const pagePrices = pricesForPage(post.title, post.path);
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${SITE.domain}${encodeURI(post.path)}#service`,
    // The page's own name, as it renders it — not the database title.
    name: h1For(post.path, post.title),
    serviceType: post.title.split("|")[0].trim(),
    areaServed: { "@type": "City", name: SITE.city },
    provider: { "@id": SITE.localBusinessId },
    image: post.image ? `${SITE.domain}${post.image}` : `${SITE.domain}/logo.png`,
    url: `${SITE.domain}${encodeURI(post.path)}`,
    description: post.metaDesc,
    ...(pagePrices
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: SCHEMA_CURRENCY,
            lowPrice: rial(Math.min(...pagePrices.rows.map((p) => p.from))),
            highPrice: rial(Math.max(...pagePrices.rows.map((p) => p.to ?? p.from))),
            offerCount: pagePrices.rows.length,
            availability: "https://schema.org/InStock",
            url: `${SITE.domain}${encodeURI(post.path)}`,
          },
        }
      : {}),
    ...(childPages.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: h1For(post.path, post.title),
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
  // Schema mirrors what is visible: the page's own FAQ when present,
  // otherwise the default accordion rendered at the end of the page.
  const visibleFaqs =
    faqs.length > 0 ? faqs : DEFAULT_FAQS.map((f) => ({ q: f.q, a: f.a }));
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE.domain}${encodeURI(post.path)}#faq`,
    inLanguage: "fa-IR",
    mainEntity: visibleFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // Model and service pages lead with their own text: the database body and
  // its price table sit directly under the hero, and the marketing blocks
  // follow. Brand hubs do the opposite — the hub is a shop window, so the
  // faults grid comes first and the body text sits further down.
  const contentBlock = (
    <section id="content" className="mx-auto max-w-[1280px] px-4 pb-12 sm:px-6 lg:px-8">
      {toc.length >= 3 && (
        <nav
          aria-label="فهرست مطالب"
          className="mb-7 rounded-[22px] border border-line bg-white p-5 shadow-card"
        >
          <p className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
            <ListChecks className="h-4 w-4 text-accent" />
            فهرست این صفحه
          </p>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
        {lead.trim() && (
          <div
            className="svc-body svc-lead rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8"
            dangerouslySetInnerHTML={{ __html: lead }}
          />
        )}
        {sections.map((s) => (
          <section
            key={s.id}
            className="svc-section rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8"
          >
            <div className="svc-body" dangerouslySetInnerHTML={{ __html: s.html }} />
          </section>
        ))}
        {!lead.trim() && sections.length === 0 && (
          <div
            className="svc-body rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8"
            dangerouslySetInnerHTML={{ __html: idHtml }}
          />
        )}
      </div>
      <ContentEnhancer targetId="post-content" />
    </section>
  );
  const requestBlock = (
    <RepairRequestSection heading={`ثبت آنلاین درخواست تعمیر ${phoneLabel}`} />
  );

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

      {/* ===== HERO (ui: Mobile Repair mockup) ===== */}
      <header className="relative overflow-hidden bg-[radial-gradient(900px_460px_at_88%_-10%,rgba(218,37,28,.12),transparent_60%),linear-gradient(180deg,#FFFFFF,#F5F6F8)]">
        <div className="mx-auto max-w-[1280px] px-4 pb-14 pt-7 sm:px-6 lg:px-8 lg:pb-16">
          <Breadcrumb crumbs={crumbs} />
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-10">
            <div>
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 shadow-[0_4px_14px_rgba(20,24,31,.05)]">
                <span className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-paper text-[13px] font-extrabold text-ink-700">
                  {brandLabel.slice(0, 1)}
                </span>
                <span className="text-[13px] font-bold text-ink-700">
                  مرکز تخصصی تعمیر {brandLabel}
                </span>
              </div>
              <h1 className="text-[29px] font-extrabold leading-[1.4] tracking-tight text-ink-900 sm:text-[38px] lg:text-[46px] lg:leading-[1.3]">
                <TitleWithAccent title={heroTitle} brand={brand} />
              </h1>
              <p className="mt-4 max-w-[540px] text-[16px] leading-9 text-ink-500 sm:text-[17px]">
                {heroLead}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={SITE.phoneHref}
                  className="flex items-center gap-2.5 rounded-[14px] bg-accent px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_26px_rgba(218,37,28,.30)] transition hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-[0_14px_32px_rgba(218,37,28,.36)]"
                >
                  <Phone className="h-[19px] w-[19px]" />
                  تماس و رزرو نوبت
                </a>
                <a
                  href="#faults"
                  className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-hairline bg-white px-6 py-3.5 text-base font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                >
                  مشاهده خدمات
                </a>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-5">
                {["عیب یابی رایگان", "ضمانت قطعات", "تحویل سریع"].map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-700"
                  >
                    <Check className="h-[18px] w-[18px] text-[#2BB673]" strokeWidth={2.6} />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* phone visual */}
            <div className="relative hidden h-[400px] items-center justify-center lg:flex">
              <div className="absolute h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(218,37,28,.14),transparent_68%)]" />
              <div className="relative w-[210px] rounded-[32px] bg-ink-950 p-2.5 shadow-[0_34px_70px_rgba(20,24,31,.30)]">
                <div className="relative flex h-[380px] items-center justify-center overflow-hidden rounded-3xl bg-paper">
                  {post.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={post.image}
                      alt={h1For(post.path, post.title)}
                      width={210}
                      height={380}
                      fetchPriority="high"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#EDEFF3,#EDEFF3_13px,#F5F6F8_13px,#F5F6F8_26px)]" />
                      <Smartphone className="relative h-12 w-12 text-ink-300" strokeWidth={1.4} />
                    </>
                  )}
                  <div className="absolute left-1/2 top-2.5 h-[18px] w-[70px] -translate-x-1/2 rounded-b-[13px] bg-ink-950" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {!isBrandLevel && contentBlock}
      {requestBlock}

      {/* ===== FAULTS ===== */}
      <section id="faults" className="mx-auto max-w-[1280px] px-4 pb-4 pt-14 sm:px-6 lg:px-8 lg:pt-[74px]">
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <div className="mb-3 text-sm font-extrabold tracking-wide text-accent">
            خدمات تعمیر
          </div>
          <h2 className="text-[26px] font-extrabold tracking-tight text-ink-900 sm:text-[34px]">
            رایج ترین مشکلات {phoneLabel}
          </h2>
          <p className="mt-3 text-base leading-8 text-ink-500">
            هر عیبی که دارید، تیم تخصصی ما راه حلش را دارد.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FAULTS.map((f) => (
            <div
              key={f.title}
              className="group rounded-[18px] border border-line bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-white hover:shadow-[0_22px_44px_rgba(20,24,31,.12)]"
            >
              <div className="mb-4 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-accent/10 text-accent transition duration-200 group-hover:bg-accent group-hover:text-white">
                <f.icon className="h-[22px] w-[22px]" />
              </div>
              <h3 className="mb-2 text-[16.5px] font-extrabold text-ink-900">{f.title}</h3>
              <p className="text-[13px] leading-7 text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="mx-auto max-w-[1280px] px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-11">
          <div className="relative hidden h-[380px] items-center justify-center overflow-hidden rounded-[22px] border border-line bg-[repeating-linear-gradient(135deg,#EDEFF3,#EDEFF3_16px,#F5F6F8_16px,#F5F6F8_32px)] lg:flex">
            <Wrench className="h-14 w-14 text-ink-300" strokeWidth={1.2} />
          </div>
          <div>
            <h2 className="mb-5 text-[24px] font-extrabold tracking-tight text-ink-900 sm:text-[30px]">
              چرا تعمیر {brandLabel} را به ما بسپارید؟
            </h2>
            <div className="flex flex-col gap-5">
              {[
                {
                  icon: ShieldCheck,
                  title: `تکنسین متخصص ${brandLabel}`,
                  desc: `تعمیرکارانی که روی محصولات ${brandLabel} تخصص دارند و با ساختار دستگاه ها آشنا هستند.`,
                },
                {
                  icon: BatteryCharging,
                  title: "قطعات اصل با اصالت",
                  desc: "استفاده از قطعات اورجینال و درجه یک با ضمانت اصالت.",
                },
                {
                  icon: Check,
                  title: "تعمیر شفاف و با ضمانت",
                  desc: "قیمت قبل از تعمیر اعلام و برگه ضمانت کتبی صادر می شود.",
                },
              ].map((it) => (
                <div key={it.title} className="flex gap-3.5">
                  <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <it.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="mb-1 text-base font-extrabold text-ink-900">{it.title}</div>
                    <p className="text-sm leading-8 text-ink-500">{it.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== MODELS / CHILD SERVICES ===== */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-14 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 text-[24px] font-extrabold tracking-tight text-ink-900 sm:text-[30px]">
            تعمیر تمام مدل های {brandLabel}
          </h2>
          <p className="mx-auto mb-8 max-w-[560px] text-base leading-8 text-ink-500">
            از مدل های قدیمی تا جدیدترین سری های روز بازار را پشتیبانی می کنیم.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {childPages.length > 0
              ? childPages.map((c) => (
                  <Link
                    key={c.path}
                    href={c.path}
                    className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-bold text-ink-800 transition hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                  >
                    {c.title.split(/\s*[|،–—]\s*/)[0].trim()}
                  </Link>
                ))
              : [
                  "سری پرچم دار",
                  "سری میان رده",
                  "سری اقتصادی",
                  "مدل های قدیمی",
                  "جدیدترین مدل ها",
                ].map((m) => (
                  <span
                    key={m}
                    className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-bold text-ink-800"
                  >
                    {m}
                  </span>
                ))}
          </div>
        </div>
      </section>

      {/* ===== PROCESS ===== */}
      <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-[74px]">
        <div className="mx-auto mb-11 max-w-[600px] text-center">
          <div className="mb-3 text-sm font-extrabold tracking-wide text-accent">مراحل کار</div>
          <h2 className="text-[25px] font-extrabold tracking-tight text-ink-900 sm:text-[32px]">
            سپردن دستگاه در ۴ قدم ساده
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {STEPS.map((s, i) => (
            <div key={s.n} className="text-center">
              <div
                className={`mx-auto mb-4 grid h-[70px] w-[70px] place-items-center rounded-[20px] text-2xl font-extrabold text-white ${
                  i === STEPS.length - 1 ? "bg-accent" : "bg-ink-950"
                }`}
              >
                {s.n}
              </div>
              <h3 className="mb-1.5 text-base font-extrabold text-ink-900">{s.title}</h3>
              <p className="text-[13px] leading-7 text-ink-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 overflow-hidden rounded-[26px] bg-gradient-to-br from-[#22262F] to-ink-950 p-8 sm:p-11 lg:grid-cols-[1.3fr_1fr]">
          <div className="text-white">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-[30px]">
              {phoneLabel} شما منتظر تعمیر است
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-8 text-ink-300">
              همین حالا تماس بگیرید یا به نزدیک ترین شعبه مراجعه کنید. عیب یابی رایگان است.
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

      {isBrandLevel && contentBlock}

      {/* ===== FAQ (ui: Mobile Repair mockup) — shown when the database
           content has no FAQ of its own, so questions never duplicate. ===== */}
      {faqs.length === 0 && (
        <section className="border-t border-line bg-white">
          <div className="mx-auto max-w-[860px] px-4 py-14 sm:px-6 lg:py-[74px]">
            <div className="mb-9 text-center">
              <div className="mb-3 text-sm font-extrabold tracking-wide text-accent">
                سوالات متداول
              </div>
              <h2 className="text-[25px] font-extrabold tracking-tight text-ink-900 sm:text-[32px]">
                پرسش های رایج درباره تعمیر {brandLabel}
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {DEFAULT_FAQS.map((f, i) => (
                <details
                  key={f.q}
                  open={i === 0}
                  className="group rounded-2xl border border-line bg-[#F7F8FA] transition hover:border-[#D5D9E0]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden">
                    <span className="text-base font-bold text-ink-900">{f.q}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-accent transition group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-[14.5px] leading-8 text-ink-500">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== RELATED BRANDS ===== */}
      {otherBrands.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mb-7 text-center">
            <h2 className="text-[22px] font-extrabold text-ink-900 sm:text-[26px]">
              تعمیر سایر برندهای موبایل
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            {otherBrands.map((b) => (
              <Link
                key={b.slug}
                href={b.slug}
                className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink-800 transition hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              >
                {b.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Contextual cluster links (pillar/siblings + repair-type hubs) */}
      <div className="mx-auto max-w-[1280px] px-4 pb-6 sm:px-6 lg:px-8">
        <PageCallout path={post.path} slot="end" />
        <RepairTypeLinks post={post} />
        <RelatedLinks post={post} />
      </div>
      <PillarArticles path={post.path} />
      <ServiceCentersSlot path={post.path} />
    </article>
  );
}
