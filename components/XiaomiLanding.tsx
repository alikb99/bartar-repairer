import Link from "next/link";
import {
  Phone,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  BadgeCheck,
  Wallet,
  Clock,
  Truck,
  Headphones,
  Wrench,
  MapPin,
  ArrowLeft,
  PhoneCall,
} from "lucide-react";
import { breadcrumbs, h1For, type Post } from "@/lib/content";
import { SITE } from "@/lib/data";
import { clusterContentFor } from "@/lib/cluster-content";
import ClusterContent from "@/components/ClusterContent";
import PillarArticles from "@/components/PillarArticles";

/*
  Hand-tuned premium landing for the Xiaomi service page (/xiaomi/).
  The visual structure follows the reference repair-shop layout, but every
  piece of Persian copy is taken VERBATIM from the database content — the
  parser below only re-arranges the original HTML into the new sections.
*/

// ---------- tiny HTML helpers (all text stays verbatim) ----------
type Sec = { heading: string; inner: string };
type Img = { src: string; alt: string };

const txt = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function sections(html: string): Sec[] {
  const out: Sec[] = [];
  for (const part of html.split(/(?=<h2\b)/i)) {
    const m = part.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    if (m) out.push({ heading: txt(m[1]), inner: part.slice(m[0].length) });
    else if (part.trim()) out.push({ heading: "", inner: part });
  }
  return out;
}
const find = (secs: Sec[], kw: string) =>
  secs.find((s) => s.heading.includes(kw));

const images = (html: string): Img[] =>
  [...html.matchAll(/<img[^>]*>/gi)].map((t) => ({
    src: (t[0].match(/src="([^"]*)"/) || [])[1] || "",
    alt: (t[0].match(/alt="([^"]*)"/) || [])[1] || "",
  }));
const imgByAlt = (imgs: Img[], kw: string) =>
  imgs.find((i) => i.alt.includes(kw));
const imgBySrc = (imgs: Img[], kw: string) =>
  imgs.find((i) => i.src.includes(kw));

const paras = (s: string) =>
  [...s.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1]);
const listItems = (s: string) =>
  [...s.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1]);

// strip media so the remaining text can be shown as clean prose
const prose = (s: string) =>
  s
    .replace(/<img[^>]*>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<details[\s\S]*?<\/details>/gi, "")
    .replace(/<table[\s\S]*?<\/table>/gi, "")
    .replace(/<div class="table-wrap">[\s\S]*?<\/div>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();

// ---------- presentational pieces ----------
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold shadow-soft transition ${
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

function SectionImage({ img, alt }: { img?: Img; alt: string }) {
  if (!img) return null;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/5 blur-2xl" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.src}
        alt={img.alt || alt}
        width={880}
        height={560}
        loading="lazy"
        decoding="async"
        className="aspect-[16/10] w-full object-cover"
      />
    </div>
  );
}

// alternating image + verbatim-text block (the OFERTA-style rows)
function AltSection({
  index,
  heading,
  html,
  img,
}: {
  index: number;
  heading: string;
  html: string;
  img?: Img;
}) {
  const flip = index % 2 === 1;
  return (
    <section className="border-b border-line/70 py-14 lg:py-20">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className={flip ? "lg:order-2" : ""}>
          <span className="section-index">— نمایندگی شیائومی</span>
          <h2 className="display mt-3 text-2xl font-extrabold text-ink-900 sm:text-[2rem]">
            {heading}
          </h2>
          <div
            className="prose-fa mt-5 [&_h2]:hidden"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
        <div className={flip ? "lg:order-1" : ""}>
          <SectionImage img={img} alt={heading} />
        </div>
      </div>
    </section>
  );
}

export default function XiaomiLanding({ post }: { post: Post }) {
  const crumbs = breadcrumbs(post);
  const secs = sections(post.content);
  const imgs = images(post.content);
  const maps = [...post.content.matchAll(/<iframe[^>]*src="([^"]*)"[^>]*>/gi)].map(
    (m) => m[1],
  );

  // ---- hero ----
  const heroSec = secs[0];
  const heroParas = heroSec ? paras(heroSec.inner).slice(0, 2) : [];
  const heroBg =
    imgByAlt(imgs, "تعمیر شیائومی تهران") ||
    imgByAlt(imgs, "xiaomi repair in tehran");

  // ---- benefits / steps / branches ----
  const benefits = find(secs, "مزایای استفاده");
  const benefitItems = benefits ? listItems(benefits.inner).map(txt) : [];

  const stepsSec = find(secs, "مراحل تعمیرات");
  const stepsBeforeBranch = stepsSec
    ? stepsSec.inner.split(/<h3\b/i)[0]
    : "";
  const stepIntro = paras(stepsBeforeBranch)[0] || "";
  const stepItems = listItems(stepsBeforeBranch).map(txt);

  // branch addresses live inside the steps section after the <h3>
  const branchBlock = stepsSec
    ? "<h3" + (stepsSec.inner.split(/<h3\b/i)[1] || "")
    : "";
  const branchIntro = paras(branchBlock)[0] || "";
  const addrPara =
    paras(branchBlock).find((p) => p.includes("آدرس نمایندگی")) || "";
  const branchCards = addrPara
    .split(/<br\s*\/?>/i)
    .map((line) => {
      const label = (line.match(/<strong>([\s\S]*?)<\/strong>/i) || [])[1] || "";
      const addr = txt(line.replace(/<strong>[\s\S]*?<\/strong>/i, ""));
      return { label: txt(label), addr };
    })
    .filter((b) => b.addr);

  // ---- offer gallery (verbatim labels, exact subpage URLs) ----
  const offerSec = find(secs, "خدمات نمایندگی تعمیرات شیائومی");
  const offerIntro = offerSec ? prose(offerSec.inner) : "";
  const gallery = [
    { label: "تعمیر گوشی شیائومی", href: "/xiaomi/mobile/", img: imgByAlt(imgs, "تعمیر گوشی شیائومی") },
    { label: "تعمیر تبلت شیائومی", href: "/xiaomi/tablet/", img: imgByAlt(imgs, "تعمیر تبلت شیائومی") },
    { label: "تعمیر تلویزیون شیائومی", href: "/xiaomi/tv/", img: imgByAlt(imgs, "تعمیر تلویزیون شیائومی") },
    { label: "تعمیر ساعت هوشمند شیائومی", href: "/xiaomi/smart-watch/", img: imgByAlt(imgs, "تعمیر ساعت هوشمند شیائومی") },
    { label: "تعمیر لپ تاپ شیائومی", href: "/xiaomi/lap-top/", img: imgByAlt(imgs, "لپ تاپ") },
    { label: "تعمیر جارو رباتیک شیائومی", href: null as string | null, img: imgBySrc(imgs, "جارو") },
  ];

  // ---- dark support band (keep ALL text verbatim) ----
  const supportSec = find(secs, "پشتیبانی شیائومی");
  const supportParas = supportSec ? paras(supportSec.inner) : [];
  const supportList = supportSec ? listItems(supportSec.inner).map(txt) : [];

  // ---- alternating device sections ----
  const altDefs: { kw: string; img?: Img }[] = [
    { kw: "مرکز تعمیرات شیائومی", img: imgByAlt(imgs, "xiaomi repair in tehran") },
    { kw: "نمایندگی تعمیرات موبایل", img: imgByAlt(imgs, "تعمیر گوشی شیائومی") },
    { kw: "نمایندگی تعمیرات تلویزیون", img: imgByAlt(imgs, "تعمیر تلویزیون شیائومی") },
    { kw: "نمایندگی تعمیرات ساعت", img: imgByAlt(imgs, "تعمیر ساعت هوشمند شیائومی") },
    { kw: "نمایندگی تعمیرات تبلت", img: imgByAlt(imgs, "تعمیر تبلت شیائومی") },
    { kw: "نمایندگی تعمیرات لپ تاپ", img: imgByAlt(imgs, "لپ تاپ") },
    { kw: "نمایندگی تعمیرات جارو", img: imgBySrc(imgs, "جارو") },
    { kw: "خدمات پس از فروش", img: imgByAlt(imgs, "تعمیر شیائومی تهران") },
    { kw: "تعمیرات فوری", img: imgByAlt(imgs, "نمایندگی رسمی تعمیرات شیائومی") },
  ];
  const altSections = altDefs
    .map((d) => {
      const s = find(secs, d.kw);
      if (!s) return null;
      // the company-intro & support text already shown elsewhere; here we keep
      // device descriptions. Trim the stats counters tail from after-sales.
      let body = prose(s.inner);
      const cut = body.indexOf("مشتری تا به امروز");
      if (cut >= 0) body = body.slice(0, cut);
      return { heading: s.heading, html: body, img: d.img };
    })
    .filter(Boolean) as { heading: string; html: string; img?: Img }[];

  // ---- price table ----
  const priceSec = find(secs, "هزینه تعمیرات");
  const priceIntro = priceSec ? paras(priceSec.inner) : [];
  const priceTable =
    priceSec && priceSec.inner.match(/<table[\s\S]*?<\/table>/i)
      ? (priceSec.inner.match(/<table[\s\S]*?<\/table>/i) as RegExpMatchArray)[0]
      : "";

  // ---- "why us" (چرا نمایندگی شیائومی) inside the نمایندگی شیائومی section ----
  const whySec = find(secs, "نمایندگی شیائومی");
  const whyItems = whySec ? listItems(whySec.inner).map(txt) : [];
  // keep the verbatim explainer paragraphs (tehran/تحریم text) too
  const whyParas = whySec ? paras(whySec.inner) : [];
  const whyImg = imgByAlt(imgs, "نمایندگی رسمی شیائومی در تهران");

  // ---- FAQ ----
  const faqSec = find(secs, "پرسش های متداول");
  const clusterFaqs = clusterContentFor(post.path)?.faq ?? [];
  const faqs = [
    ...clusterFaqs,
    ...(faqSec
    ? [
        ...faqSec.inner.matchAll(
          /<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi,
        ),
      ].map((m) => ({
        q: txt(m[1]),
        a: paras(m[2]).map((p) => txt(p)).join(" "),
      }))
    : []),
  ];

  // ---------- schema ----------
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
    name: post.title,
    serviceType: "تعمیر محصولات شیائومی",
    areaServed: { "@type": "City", name: SITE.city },
    provider: { "@type": "LocalBusiness", "@id": SITE.localBusinessId, name: SITE.name },
    image: post.image ? `${SITE.domain}${post.image}` : `${SITE.domain}/logo.png`,
    url: `${SITE.domain}${encodeURI(post.path)}`,
    description: post.metaDesc,
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

  const benefitIcons = [Truck, ShieldCheck, Headphones, Phone, Wrench, BadgeCheck, Wallet, Clock, Wrench];

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

      {/* ===================== HERO ===================== */}
      <header className="relative overflow-hidden bg-ink-900 pt-24 text-white lg:pt-28">
        {heroBg && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroBg.src}
              alt={heroBg.alt}
              width={1600}
              height={900}
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-ink-900 via-ink-900/85 to-ink-900/60" />
          </>
        )}
        <div className="relative mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <nav
            className="flex flex-wrap items-center gap-1 text-sm text-white/60"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-white">
              خانه
            </Link>
            {crumbs.map((c, idx) => (
              <span key={c.path} className="flex items-center gap-1">
                <ChevronLeft className="h-4 w-4 text-white/40" />
                {idx === crumbs.length - 1 ? (
                  <span className="line-clamp-1 text-white/90">{c.title}</span>
                ) : (
                  <Link href={c.path} className="hover:text-white">
                    {c.title}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-soft" />
            نمایندگی تخصصی شیائومی در {SITE.city}
          </span>

          <h1 className="display mt-5 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">
            {h1For(post.path, post.title)}
          </h1>

          {heroParas.map((p, i) => (
            <p
              key={i}
              className="mt-5 max-w-2xl text-base leading-9 text-white/80 [&_strong]:text-white"
              dangerouslySetInnerHTML={{ __html: p }}
            />
          ))}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PhoneButton>تماس با مرکز تعمیرات شیائومی</PhoneButton>
            <span dir="ltr" className="text-lg font-extrabold tracking-wide">
              {SITE.phone}
            </span>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {["قطعات اصل", "۶ ماه گارانتی", "عیب یابی رایگان", "پیک رایگان"].map(
              (t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80"
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-accent-soft" />
                  {t}
                </span>
              ),
            )}
          </div>
        </div>
      </header>

      {/* ===================== CLUSTER ANSWER ===================== */}
      {clusterFaqs.length > 0 && (
        <section className="border-b border-line bg-paper py-10 lg:py-14">
          <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8">
            <ClusterContent path={post.path} />
          </div>
        </section>
      )}

      {/* ===================== BENEFITS ===================== */}
      {benefitItems.length > 0 && (
        <section className="border-b border-line bg-paper py-14 lg:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="section-index">— چرا برتر سرویس</span>
              <h2 className="display mt-3 text-2xl font-extrabold text-ink-900 sm:text-[2rem]">
                {benefits?.heading}
              </h2>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefitItems.map((b, i) => {
                const Ico = benefitIcons[i % benefitIcons.length];
                return (
                  <div
                    key={i}
                    className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition hover:border-accent/40 hover:shadow-soft"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-tint text-accent transition group-hover:bg-accent group-hover:text-white">
                      <Ico className="h-5 w-5" />
                    </span>
                    <p className="pt-1.5 text-[15px] font-semibold text-ink-900">
                      {b}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===================== STEPS ===================== */}
      {stepItems.length > 0 && (
        <section className="bg-finegrid border-b border-line py-14 lg:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="section-index">— روند تعمیر</span>
              <h2 className="display mt-3 text-2xl font-extrabold text-ink-900 sm:text-[2rem]">
                {stepsSec?.heading}
              </h2>
              {stepIntro && (
                <p
                  className="mt-4 leading-8 text-ink-500"
                  dangerouslySetInnerHTML={{ __html: stepIntro }}
                />
              )}
            </div>
            <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {stepItems.map((s, i) => (
                <li
                  key={i}
                  className="relative rounded-2xl border border-line bg-white p-5 shadow-card"
                >
                  <span className="display text-3xl font-extrabold text-accent/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-sm font-semibold leading-7 text-ink-900">
                    {s}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ===================== BRANCHES + MAPS ===================== */}
      {branchCards.length > 0 && (
        <section className="border-b border-line bg-ink-900 py-14 text-white lg:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-soft">
                — اینجا پیدایمان کنید
              </span>
              <h2 className="display mt-3 text-2xl font-extrabold sm:text-[2rem]">
                {find(secs, "مراحل") ? "شعب حضوری نمایندگی شیائومی در تهران" : ""}
              </h2>
              {branchIntro && (
                <p
                  className="mt-4 leading-8 text-white/70"
                  dangerouslySetInnerHTML={{ __html: branchIntro }}
                />
              )}
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {branchCards.map((b, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5"
                >
                  <div className="flex items-start gap-3 p-6">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-white">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-accent-soft">
                        {b.label || `شعبه ${i + 1}`}
                      </p>
                      <p className="mt-1.5 text-sm leading-7 text-white/80">
                        {b.addr}
                      </p>
                    </div>
                  </div>
                  {maps[i + 1] && (
                    <iframe
                      src={maps[i + 1]}
                      title={b.label || `شعبه ${i + 1}`}
                      width={600}
                      height={300}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-56 w-full border-0 grayscale-[0.2]"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <PhoneButton light>
                تماس و دریافت پیک رایگان — {SITE.phone}
              </PhoneButton>
            </div>
          </div>
        </section>
      )}

      {/* ===================== OFFER / GALLERY ===================== */}
      {offerSec && (
        <section className="border-b border-line bg-paper py-14 lg:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="section-index">— خدمات ما</span>
              <h2 className="display mt-3 text-2xl font-extrabold text-ink-900 sm:text-[2rem]">
                {offerSec.heading}
              </h2>
              {offerIntro && (
                <div
                  className="prose-fa mt-5"
                  dangerouslySetInnerHTML={{ __html: offerIntro }}
                />
              )}
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((g) => {
                const card = (
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-line bg-white shadow-card transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-soft">
                    <div className="relative overflow-hidden">
                      {g.img && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={g.img.src}
                          alt={g.label}
                          width={600}
                          height={380}
                          loading="lazy"
                          decoding="async"
                          className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/55 to-transparent" />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-5">
                      <span className="text-base font-bold text-ink-900">
                        {g.label}
                      </span>
                      {g.href && (
                        <ArrowLeft className="h-5 w-5 text-accent transition group-hover:-translate-x-1" />
                      )}
                    </div>
                  </div>
                );
                return g.href ? (
                  <Link key={g.label} href={g.href} className="block h-full">
                    {card}
                  </Link>
                ) : (
                  <div key={g.label}>{card}</div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===================== DARK SUPPORT BAND ===================== */}
      {supportSec && (
        <section className="bg-dotmatrix relative overflow-hidden bg-accent py-16 text-white lg:py-20">
          <div className="mx-auto max-w-[1240px] px-4 text-center sm:px-6 lg:px-8">
            <Headphones className="mx-auto h-10 w-10 text-white/90" />
            <h2 className="display mt-4 text-2xl font-extrabold sm:text-4xl">
              {supportSec.heading}
            </h2>
            {supportParas.map((p, i) => (
              <p
                key={i}
                className="mx-auto mt-4 max-w-3xl text-[15px] leading-8 text-white/85 [&_a]:font-bold [&_a]:text-white [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: p }}
              />
            ))}
            {supportList.length > 0 && (
              <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2.5">
                {supportList.map((li, i) => (
                  <li
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    {li}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-8 flex justify-center">
              <PhoneButton light>{SITE.phone}</PhoneButton>
            </div>
          </div>
        </section>
      )}

      {/* ===================== ALTERNATING DEVICE SECTIONS ===================== */}
      {altSections.map((s, i) => (
        <AltSection
          key={s.heading}
          index={i}
          heading={s.heading}
          html={s.html}
          img={s.img}
        />
      ))}

      {/* ===================== WHY US (نمایندگی شیائومی) ===================== */}
      {whySec && (
        <section className="border-b border-line bg-paper py-14 lg:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
              <div>
                <span className="section-index">— درباره نمایندگی</span>
                <h2 className="display mt-3 text-2xl font-extrabold text-ink-900 sm:text-[2rem]">
                  {whySec.heading}
                </h2>
                <div className="prose-fa mt-5">
                  {whyParas.map((p, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
                  ))}
                </div>
              </div>
              <div className="lg:pt-16">
                <SectionImage img={whyImg} alt={whySec.heading} />
                {whyItems.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {whyItems.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card"
                      >
                        <BadgeCheck className="h-5 w-5 shrink-0 text-accent" />
                        <span className="text-sm font-semibold text-ink-900">
                          {w}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================== PRICE TABLE ===================== */}
      {priceTable && (
        <section className="bg-finegrid border-b border-line py-14 lg:py-20">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="section-index">— تعرفه تقریبی</span>
              <h2 className="display mt-3 text-2xl font-extrabold text-ink-900 sm:text-[2rem]">
                {priceSec?.heading}
              </h2>
              {priceIntro.map((p, i) => (
                <p
                  key={i}
                  className="mt-4 leading-8 text-ink-500"
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
            </div>
            <div
              className="prose-fa mt-8"
              dangerouslySetInnerHTML={{ __html: priceTable }}
            />
          </div>
        </section>
      )}

      {/* ===================== FAQ ===================== */}
      {faqs.length > 0 && (
        <section className="border-b border-line bg-paper py-14 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="display text-2xl font-extrabold text-ink-900 sm:text-[2rem]">
              پرسش های متداول درباره نمایندگی تعمیرات شیائومی
            </h2>
            <div className="mt-8 space-y-3">
              {faqs.map((f, i) => (
                <details
                  key={i}
                  className="group overflow-hidden rounded-2xl border border-line bg-white transition open:border-accent/40 open:shadow-card"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-bold text-ink-900 transition group-open:text-accent [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-accent transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 text-sm leading-8 text-ink-500">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== FINAL CTA ===================== */}
      <section className="bg-ink-900 py-16 text-white lg:py-20">
        <div className="mx-auto max-w-[1240px] px-4 text-center sm:px-6 lg:px-8">
          <PhoneCall className="mx-auto h-10 w-10 text-accent-soft" />
          <h2 className="display mt-4 text-2xl font-extrabold sm:text-4xl">
            ما اینجاییم تا به شما کمک کنیم
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            برای ثبت سفارش تعمیر، مشاوره رایگان و دریافت پیک، همین حالا با
            کارشناسان نمایندگی شیائومی تماس بگیرید.
          </p>
          <div className="mt-8 flex justify-center">
            <PhoneButton light>همین حالا تماس بگیرید — {SITE.phone}</PhoneButton>
          </div>
        </div>
      </section>

      <PillarArticles path={post.path} />
    </article>
  );
}
