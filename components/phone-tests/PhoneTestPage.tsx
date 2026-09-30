import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Hand, Mic, MonitorSmartphone, Phone, Plus, Volume2, Wrench } from "lucide-react";
import { SITE } from "@/lib/data";
import {
  PHONE_TESTS,
  PHONE_TEST_BASE,
  PHONE_TEST_HUB,
  phoneTestPath,
  type PhoneTest,
  type PhoneTestHub,
  type PhoneTestIcon,
} from "@/lib/phone-tests";

// قالب مشترک صفحه اصلی تست ها و هر تست. ابزار (کامپوننت کلاینت) از بیرون می آید؛
// متن، پرسش ها و اسکیما همه سمت سرور رندر می شوند.

const ICONS: Record<PhoneTestIcon, typeof Hand> = {
  pixel: MonitorSmartphone,
  touch: Hand,
  speaker: Volume2,
  mic: Mic,
};

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function articleHtml(page: PhoneTestHub | PhoneTest) {
  return page.sections.map((s) => `<h2 id="${s.id}">${escapeHtml(s.h2)}</h2>\n${s.html}`).join("\n");
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function schemaFor(page: PhoneTestHub | PhoneTest, path: string) {
  const url = `${SITE.domain}${path}`;
  const isTest = "tool" in page;
  const crumbs = [
    { name: "خانه", item: `${SITE.domain}/` },
    ...(isTest ? [{ name: PHONE_TEST_HUB.crumb, item: `${SITE.domain}${PHONE_TEST_BASE}` }] : []),
    { name: page.crumb, item: url },
  ];
  const graph: Record<string, unknown>[] = [
    {
      "@type": isTest ? "WebPage" : "CollectionPage",
      "@id": `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: "fa-IR",
      isPartOf: { "@id": SITE.websiteId },
      about: { "@id": SITE.localBusinessId },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      dateModified: page.updated,
      mainEntity: { "@id": isTest ? `${url}#app` : `${url}#tests` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })),
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      // دقیقا همان متن روی صفحه
      mainEntity: page.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: stripTags(f.a) },
      })),
    },
  ];
  if (isTest) {
    graph.push({
      "@type": "WebApplication",
      "@id": `${url}#app`,
      name: page.tool.appName,
      url,
      description: page.tool.appDescription,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Android, iOS",
      browserRequirements: "Requires JavaScript. Chrome, Safari, Samsung Internet or Firefox (recent versions).",
      inLanguage: "fa-IR",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "IRR" },
      provider: { "@id": SITE.localBusinessId },
    });
  } else {
    graph.push({
      "@type": "ItemList",
      "@id": `${url}#tests`,
      itemListElement: PHONE_TESTS.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t.crumb,
        url: `${SITE.domain}${phoneTestPath(t.slug)}`,
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function TestCards({ tests }: { tests: PhoneTest[] }) {
  return (
    <ul className="grid gap-3.5 sm:grid-cols-2">
      {tests.map((t) => {
        const Icon = ICONS[t.icon];
        return (
          <li key={t.slug}>
            <Link
              href={phoneTestPath(t.slug)}
              className="card-hover group flex h-full flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-card"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-tint text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-1 text-base font-extrabold text-ink-900 transition group-hover:text-accent">{t.crumb}</h3>
              <p className="text-sm leading-7 text-ink-500">{t.cardText}</p>
              <span className="mt-auto text-[13px] text-ink-400">{t.duration}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function formatUpdated(iso: string) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}

export default function PhoneTestPage({
  page,
  path,
  tool,
  afterTool,
  related,
}: {
  page: PhoneTestHub | PhoneTest;
  path: string;
  tool?: ReactNode;
  afterTool?: ReactNode;
  related?: PhoneTest[];
}) {
  const isTest = "tool" in page;
  return (
    <div className="pt-24 lg:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFor(page, path)).replace(/</g, "\\u003c") }}
      />

      <header className="bg-finegrid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-0 h-60 w-[40rem] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav className="flex flex-wrap items-center gap-1 text-sm text-ink-500" aria-label="مسیر">
            <Link href="/" className="hover:text-accent">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4 text-ink-300" aria-hidden />
            {isTest ? (
              <>
                <Link href={PHONE_TEST_BASE} className="hover:text-accent">
                  {PHONE_TEST_HUB.crumb}
                </Link>
                <ChevronLeft className="h-4 w-4 text-ink-300" aria-hidden />
              </>
            ) : null}
            <span className="text-ink-700" aria-current="page">
              {page.crumb}
            </span>
          </nav>
          <h1 className="display mt-5 text-3xl font-extrabold text-ink-900 sm:text-5xl">{page.h1}</h1>
          <p className="mt-5 text-base leading-9 text-ink-700">{page.lead}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {page.meta.map((m) => (
              <li key={m} className="rounded-full border border-line bg-white px-3 py-1 text-[13px] text-ink-700">
                {m}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {tool}
        {afterTool}

        {/* یک رشته HTML تا قواعد .prose-fa (فاصله فرزندان مستقیم، h2 اول) درست اعمال شوند */}
        <article
          className="prose-fa pt-prose mt-10 rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8"
          dangerouslySetInnerHTML={{ __html: articleHtml(page) }}
        />

        {related && related.length > 0 && (
          <section className="mt-12" aria-labelledby="related-title">
            <h2 id="related-title" className="heading-accent text-xl font-extrabold text-ink-900">
              تست های دیگر گوشی
            </h2>
            <div className="mt-6">
              <TestCards tests={related} />
            </div>
            <p className="mt-4 text-sm">
              <Link href={PHONE_TEST_BASE} className="font-bold text-accent hover:underline">
                همه تست های گوشی
              </Link>
              <span className="mx-2 text-ink-300">·</span>
              <Link href="/online-diagnosis/" className="font-bold text-accent hover:underline">
                عیب یابی آنلاین گام به گام
              </Link>
            </p>
          </section>
        )}

        <section className="mt-12" aria-labelledby="faq-title">
          <h2 id="faq-title" className="heading-accent text-xl font-extrabold text-ink-900">
            سوالات متداول
          </h2>
          <div className="mt-6 space-y-3">
            {page.faq.map((f, i) => (
              <details
                key={f.q}
                open={i === 0}
                className="group overflow-hidden rounded-2xl border border-line bg-white shadow-card open:border-accent/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-right [&::-webkit-details-marker]:hidden">
                  <span className="text-base font-semibold text-ink-900">{f.q}</span>
                  <Plus className="h-5 w-5 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45" />
                </summary>
                <p
                  className="px-5 pb-5 text-sm leading-8 text-ink-500 [&_a]:font-bold [&_a]:text-accent [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: f.a }}
                />
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[26px] bg-ink-950 p-6 text-white sm:p-8">
          <h2 className="text-xl font-extrabold">{page.cta.title}</h2>
          <p className="mt-3 text-[15px] leading-8 text-ink-100">{page.cta.text}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/online-repair-request/"
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-5 font-bold text-white transition hover:bg-accent-deep"
            >
              <Wrench className="h-4 w-4" aria-hidden />
              ثبت درخواست تعمیر
            </a>
            <a
              href={SITE.phoneHref}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/30 px-5 font-bold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4" aria-hidden />
              <span dir="ltr">{SITE.phone}</span>
            </a>
          </div>
        </section>

        <p className="mt-6 text-[13px] text-ink-400">آخرین بروزرسانی: {formatUpdated(page.updated)}</p>
      </div>
    </div>
  );
}
