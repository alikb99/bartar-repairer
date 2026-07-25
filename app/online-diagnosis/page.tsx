import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import TroubleshootWizard from "@/components/TroubleshootWizard";
import { SITE } from "@/lib/data";
import { TS_DEVICES } from "@/lib/troubleshoot";

const TITLE = "عیب یابی آنلاین دستگاه | راهنمای گام به گام رفع مشکل";
const DESC =
  "دستگاه، برند و ایراد را انتخاب کنید تا راهنمای گام به گام رفع مشکل را ببینید. عیب یابی آنلاین رایگان گوشی، لپ تاپ، تبلت، ساعت هوشمند، تلویزیون و کنسول بازی.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: "/online-diagnosis/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESC,
    url: `${SITE.domain}/online-diagnosis/`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
    {
      "@type": "ListItem",
      position: 2,
      name: "عیب یابی آنلاین",
      item: `${SITE.domain}/online-diagnosis/`,
    },
  ],
};

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE.domain}/online-diagnosis/#webpage`,
  url: `${SITE.domain}/online-diagnosis/`,
  name: TITLE,
  description: DESC,
  inLanguage: "fa-IR",
  isPartOf: { "@id": SITE.websiteId },
  about: { "@id": SITE.localBusinessId },
};

export default function OnlineDiagnosisPage() {
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

      <header className="bg-finegrid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-0 h-60 w-[40rem] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
          <nav
            className="flex items-center justify-center gap-1 text-sm text-ink-500"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-accent">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4 text-ink-300" />
            <span className="text-ink-700">عیب یابی آنلاین</span>
          </nav>
          <h1 className="display mt-5 text-3xl font-extrabold text-ink-900 sm:text-5xl">
            عیب یابی آنلاین دستگاه
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-9 text-ink-500">
            دستگاه، برند و ایراد را انتخاب کنید تا راهنمای گام به گام رفع مشکل
            را ببینید. اگر مشکل با راهکارهای خانگی حل نشد، همان جا مشخص می شود
            که چه زمانی باید دستگاه را به تعمیرگاه بسپارید.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <TroubleshootWizard />

        {/* SEO text + internal links to the commercial hubs */}
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="heading-accent text-xl font-extrabold text-ink-900">
            بعد از عیب یابی، تعمیر تخصصی با گارانتی
          </h2>
          <p className="mt-5 max-w-3xl text-[15px] leading-9 text-ink-700">
            بسیاری از ایرادهای نرم افزاری با همین راهنماها در خانه حل می شوند.
            اما ایرادهای سخت افزاری مانند تعویض نمایشگر، باتری، سوکت شارژ و
            تعمیر برد به ابزار و قطعه اصل نیاز دارند. مرکز تعمیرات برتر با عیب
            یابی رایگان، اعلام هزینه قبل از شروع کار و ۶ ماه گارانتی، تعمیر
            تخصصی همه برندها را انجام می دهد.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TS_DEVICES.map((d) => (
              <Link
                key={d.id}
                href={d.fallbackPath}
                className="card-hover group flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3.5"
              >
                <span className="text-sm font-bold text-ink-800 transition group-hover:text-accent">
                  {d.fallbackLabel}
                </span>
                <ChevronLeft className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
