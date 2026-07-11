import Link from "next/link";
import {
  Phone,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  Smartphone,
  ListChecks,
} from "lucide-react";
import { breadcrumbs, type Post } from "@/lib/content";
import { SITE } from "@/lib/data";
import ContactCard from "@/components/ContactCard";
import TrustBadges from "@/components/TrustBadges";
import RelatedLinks from "@/components/RelatedLinks";
import PillarArticles from "@/components/PillarArticles";

// Premium hand-tuned layout for the flagship landing pages.
// Strips media + rebuilds the broken WordPress FAQ into clean accordions.
// All text is taken verbatim from the database.

function stripMedia(html: string): string {
  return html
    .replace(/<img[^>]*>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "");
}

type Faq = { q: string; a: string };

function parseFaq(faqInner: string): Faq[] {
  const items: Faq[] = [];
  const re = /([^<]*?؟)\s*((?:<p>[\s\S]*?<\/p>\s*)+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(faqInner))) {
    const q = m[1]
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .pop();
    if (!q) continue;
    items.push({ q, a: m[2].trim() });
  }
  return items;
}

export default function CustomLanding({ post }: { post: Post }) {
  const crumbs = breadcrumbs(post);

  // 1) clean + split body / faq
  const cleaned = stripMedia(post.content);
  const faqHead = cleaned.search(/<h2[^>]*>\s*سوالات متداول/);
  let body = faqHead >= 0 ? cleaned.slice(0, faqHead) : cleaned;
  let faqs: Faq[] = [];
  if (faqHead >= 0) {
    const rest = cleaned.slice(faqHead);
    const inner = rest.replace(/^<h2[^>]*>[\s\S]*?<\/h2>/i, "");
    faqs = parseFaq(inner);
  }

  // 2) ids + table of contents from body H2s
  const toc: { id: string; text: string }[] = [];
  let i = 0;
  body = body.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t) => {
    const id = "sec-" + ++i;
    const text = t
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    toc.push({ id, text });
    return `<h2 id="${id}">${t}</h2>`;
  });

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
  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
            },
          })),
        }
      : null;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: post.title,
    serviceType: post.title,
    areaServed: { "@type": "City", name: SITE.city },
    provider: { "@type": "LocalBusiness", "@id": SITE.domain, name: SITE.name },
    image: post.image ? `${SITE.domain}${post.image}` : `${SITE.domain}/logo.png`,
    url: `${SITE.domain}${encodeURI(post.path)}`,
    description: post.metaDesc,
  };

  return (
    <article className="pt-24 lg:pt-28">
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

      {/* Hero */}
      <header className="bg-finegrid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
        <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8 lg:py-16">
          <div>
            <nav
              className="flex flex-wrap items-center gap-1 text-sm text-ink-500"
              aria-label="مسیر"
            >
              <Link href="/" className="hover:text-accent">
                خانه
              </Link>
              {crumbs.map((c, idx) => (
                <span key={c.path} className="flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4 text-ink-300" />
                  {idx === crumbs.length - 1 ? (
                    <span className="line-clamp-1 text-ink-700">{c.title}</span>
                  ) : (
                    <Link href={c.path} className="hover:text-accent">
                      {c.title}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-tint px-4 py-1.5 text-xs font-semibold text-accent">
              <ShieldCheck className="h-3.5 w-3.5" />
              نمایندگی تخصصی در {SITE.city}
            </span>

            <h1 className="display mt-5 text-3xl font-extrabold leading-tight text-ink-900 sm:text-5xl">
              {post.title}
            </h1>

            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={SITE.phoneHref}
                dir="ltr"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-accent-deep"
              >
                <Phone className="h-4 w-4" />
                {SITE.phone}
              </a>
              <TrustBadges variant="pills" />
            </div>
          </div>

          {/* Decorative device */}
          <div className="hidden justify-center lg:flex">
            <div className="bg-dotmatrix relative grid h-[300px] w-[180px] place-items-center rounded-[2rem] border border-ink-900/10 bg-white shadow-float">
              <div className="absolute inset-3 rounded-[1.5rem] border border-line" />
              <span className="absolute right-1/2 top-3 h-1.5 w-14 translate-x-1/2 rounded-full bg-ink-900/10" />
              <Smartphone className="h-16 w-16 text-accent" strokeWidth={1.1} />
            </div>
          </div>
        </div>
      </header>

      {/* Body + sidebar */}
      <div className="mx-auto max-w-[1240px] px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <div
              className="prose-fa"
              dangerouslySetInnerHTML={{ __html: body }}
            />

            {/* Rebuilt FAQ */}
            {faqs.length > 0 && (
              <section className="mt-14">
                <h2 className="display text-2xl font-extrabold text-ink-900">
                  سوالات متداول
                </h2>
                <div className="mt-6 space-y-3">
                  {faqs.map((f, idx) => (
                    <details
                      key={idx}
                      className="group overflow-hidden rounded-2xl border border-line bg-white transition open:border-accent/40 open:shadow-card"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-bold text-ink-900 transition group-open:text-accent [&::-webkit-details-marker]:hidden">
                        {f.q}
                        <ChevronDown className="h-5 w-5 shrink-0 text-accent transition-transform group-open:rotate-180" />
                      </summary>
                      <div
                        className="px-5 pb-5 text-sm leading-8 text-ink-500 [&_p]:mt-2"
                        dangerouslySetInnerHTML={{ __html: f.a }}
                      />
                    </details>
                  ))}
                </div>
              </section>
            )}

            <RelatedLinks post={post} />
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5">
              {toc.length > 2 && (
                <nav className="rounded-2xl border border-line bg-white p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
                    <ListChecks className="h-4 w-4 text-accent" />
                    در این صفحه می خوانید
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {toc.map((t) => (
                      <li key={t.id}>
                        <a
                          href={`#${t.id}`}
                          className="block rounded-lg px-2 py-1.5 text-sm text-ink-500 transition hover:bg-paper hover:text-accent"
                        >
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <ContactCard />
            </div>
          </aside>
        </div>
      </div>

      <PillarArticles path={post.path} />
    </article>
  );
}
