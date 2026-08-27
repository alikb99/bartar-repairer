import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, MapPin, Phone, Wrench } from "lucide-react";
import { SITE } from "@/lib/data";
import { TECHNICIANS, WORKSHOP_TOOLS, yearsLabel } from "@/lib/team";

// Non-absolute: the root layout template appends " | برتر سرویس".
const TITLE = "تیم فنی تعمیرگاه - تکنسین ها و تجهیزات کارگاه";
const DESC =
  "تکنسین های تعمیرگاه برتر سرویس و تجهیزاتی که با آن کار می کنیم: میکروسکوپ، دوربین حرارتی، شست وشوی اولتراسونیک و ابزار ریزکاری برد.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE.domain}/team/` },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${SITE.domain}/team/`,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function TeamPage() {
  // One Person node per technician. Only fields we actually have are emitted —
  // no jobTitle or knowsAbout unless the owner supplied it.
  const people = TECHNICIANS.map((t) => ({
    "@context": "https://schema.org",
    "@type": "Person",
    name: t.name,
    worksFor: { "@id": SITE.organizationId },
    ...(t.specialty ? { jobTitle: t.specialty, knowsAbout: t.specialty } : {}),
    ...(t.photo ? { image: `${SITE.domain}${t.photo.src}` } : {}),
    ...(t.certifications?.length ? { hasCredential: t.certifications } : {}),
  }));

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      {
        "@type": "ListItem",
        position: 2,
        name: "تیم فنی",
        item: `${SITE.domain}/team/`,
      },
    ],
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {people.map((p) => (
        <script
          key={p.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(p) }}
        />
      ))}

      <header className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-finegrid opacity-[.16]" />
        <div className="absolute inset-0 bg-[radial-gradient(720px_380px_at_18%_18%,rgba(218,37,28,.28),transparent_62%)]" />
        <div className="relative mx-auto max-w-[1240px] px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20">
          <nav
            className="flex flex-wrap items-center gap-1 text-sm text-white/62"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-white">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4 text-white/36" />
            <span className="text-white">تیم فنی</span>
          </nav>

          <h1 className="mt-6 max-w-3xl text-[32px] font-extrabold leading-[1.35] tracking-tight sm:text-[48px]">
            تکنسین هایی که دستگاه شما را تعمیر می کنند
          </h1>
          <p className="mt-5 max-w-2xl text-[16px] leading-9 text-white/74 sm:text-[17px]">
            {TECHNICIANS.length.toLocaleString("fa-IR")} تعمیرکار در دو شعبه
            مطهری و سعادت آباد کار می کنند. کار هر دستگاه به کسی سپرده می شود که
            تخصصش همان است: موبایل، لپ تاپ، ساعت هوشمند یا نرم افزار.
          </p>
        </div>
      </header>

      <section className="bg-paper py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[32px]">
            تعمیرکاران برتر سرویس
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-9 text-ink-700">
            تعمیر گوشی، لپ تاپ و ساعت هوشمند سه کار متفاوت است و ما آنها را به
            یک نفر نمی سپاریم. وقتی دستگاه را تحویل می دهید، می توانید بپرسید چه
            کسی روی آن کار می کند.
          </p>

          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TECHNICIANS.map((t) => (
              <li
                key={t.name}
                className="rounded-[22px] border border-line bg-white p-5 shadow-card"
              >
                <div className="flex items-start gap-4">
                  {t.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={t.photo.src}
                      alt={`${t.name}، تعمیرکار برتر سرویس`}
                      width={t.photo.w}
                      height={t.photo.h}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-paper text-accent"
                    >
                      <Wrench className="h-6 w-6" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-extrabold leading-7 text-ink-900">
                      {t.name}
                    </h3>
                    {t.specialty && (
                      <p className="mt-1 text-sm leading-7 text-ink-500">
                        {t.specialty}
                      </p>
                    )}
                    {yearsLabel(t) && (
                      <p className="mt-1 text-[13px] font-bold leading-7 text-accent">
                        {yearsLabel(t)}
                      </p>
                    )}
                    {t.certifications?.length ? (
                      <ul className="mt-2 space-y-1">
                        {t.certifications.map((c) => (
                          <li key={c} className="text-[13px] leading-6 text-ink-500">
                            {c}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[32px]">
            با چه تجهیزاتی کار می کنیم
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-9 text-ink-700">
            تعمیر برد موبایل بدون ابزار درست، حدس زدن است. این فهرست تجهیزاتی
            است که روی میز کار ما هست و در عکس های کارگاه هم دیده می شود.
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WORKSHOP_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="rounded-[22px] border border-line bg-paper p-5"
              >
                <dt className="text-[15px] font-extrabold text-ink-900">
                  {tool.name}
                </dt>
                <dd className="mt-2 text-sm leading-8 text-ink-500">
                  {tool.what}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-line bg-paper py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-[26px] border border-line bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">
              دستگاه را کجا تحویل بدهم
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm font-extrabold text-ink-900">شعبه مرکزی</p>
                <p className="mt-2 flex gap-2 text-sm leading-8 text-ink-700">
                  <MapPin className="mt-1.5 h-4 w-4 shrink-0 text-accent" />
                  {SITE.address}
                </p>
                <a
                  href={SITE.phoneHref}
                  dir="ltr"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-accent"
                >
                  <Phone className="h-4 w-4" />
                  {SITE.phone}
                </a>
              </div>
              <div>
                <p className="text-sm font-extrabold text-ink-900">شعبه غرب</p>
                <p className="mt-2 flex gap-2 text-sm leading-8 text-ink-700">
                  <MapPin className="mt-1.5 h-4 w-4 shrink-0 text-accent" />
                  {SITE.addressWest}
                </p>
                <a
                  href={SITE.phoneWestHref}
                  dir="ltr"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-accent"
                >
                  <Phone className="h-4 w-4" />
                  {SITE.phoneWest}
                </a>
              </div>
            </div>
            <p className="mt-5 text-sm leading-8 text-ink-500">
              ساعت کاری: {SITE.hours}
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
