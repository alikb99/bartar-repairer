import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Github,
  Instagram,
  Linkedin,
  MapPin,
  Phone,
  Plus,
  Check,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import { SITE } from "@/lib/data";
import {
  PEOPLE,
  colleaguesOf,
  personBySlug,
  personId,
  roleLabel,
  toolsFor,
  yearsLabel,
} from "@/lib/team";
import { authorFor, TOPIC_LABEL, type AuthorInput } from "@/lib/authors";
import { ARTICLE_POSTS, POSTS, CATEGORIES, linkLabel } from "@/lib/content";
import PostCard from "@/components/PostCard";

const catName = new Map(CATEGORIES.map((c) => [c.termId, c.name]));

function authorInputFor(
  post: { path: string; title: string; categories: number[] },
  kind: "post" | "page",
): AuthorInput {
  return {
    path: post.path,
    title: post.title,
    kind,
    categoryNames: post.categories
      .map((id) => catName.get(id))
      .filter((n): n is string => !!n),
  };
}

// Pages excluded from every article/service listing site-wide (mirrors
// app/[...slug]/page.tsx and lib/site-index.ts).
const EXCLUDE = new Set([
  "/home/",
  "/تست-المنتور/",
  "/blog/",
  "/home-appliances/air-conditioner-repair-agency/",
]);

/** Every article this person is credited as the author of. */
function articlesFor(slug: string) {
  return ARTICLE_POSTS.filter(
    (p) => !EXCLUDE.has(p.path) && authorFor(authorInputFor(p, "post"))?.slug === slug,
  );
}

/** Every service page this person's specialty covers. */
function servicesFor(slug: string) {
  return POSTS.filter(
    (p) =>
      p.type === "page" &&
      !EXCLUDE.has(p.path) &&
      authorFor(authorInputFor(p, "page"))?.slug === slug,
  );
}

export function generateStaticParams() {
  return PEOPLE.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const person = personBySlug(slug);
  if (!person) return {};
  const title = `${person.name} - ${roleLabel(person)} ${SITE.brandName}`;
  const desc = person.specialty
    ? `${person.name}، ${roleLabel(person)} ${SITE.brandName}: ${person.specialty}${
        yearsLabel(person) ? "، " + yearsLabel(person) : ""
      }.`
    : `${person.name}، ${roleLabel(person)} ${SITE.brandName}.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `${SITE.domain}/team/${person.slug}/` },
    openGraph: {
      title,
      description: desc,
      url: `${SITE.domain}/team/${person.slug}/`,
      type: "profile",
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: ["/opengraph-image"],
    },
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = personBySlug(slug);
  if (!person) notFound();

  const articles = articlesFor(person.slug);
  const services = servicesFor(person.slug).slice(0, 24);
  const topicLabels = [
    ...new Set(
      [...(person.topics ?? []), ...(person.articleTopics ?? [])].map(
        (t) => TOPIC_LABEL[t],
      ),
    ),
  ];
  const tools = toolsFor(person);
  const colleagues = colleaguesOf(person, 4);
  // Owner-supplied public profiles, in a stable order. They double as the
  // outbound authoritative links this page would otherwise have none of.
  const profileLinks = [
    person.profiles?.linkedin && {
      href: person.profiles.linkedin,
      label: `پروفایل لینکدین ${person.name}`,
      Icon: Linkedin,
    },
    person.profiles?.github && {
      href: person.profiles.github,
      label: `گیت هاب ${person.name}`,
      Icon: Github,
    },
    person.profiles?.instagram && {
      href: person.profiles.instagram,
      label: `اینستاگرام ${person.name}`,
      Icon: Instagram,
    },
  ].filter((l): l is { href: string; label: string; Icon: typeof Linkedin } => !!l);

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personId(SITE.domain, person.slug),
    name: person.name,
    url: `${SITE.domain}/team/${person.slug}/`,
    worksFor: { "@id": SITE.organizationId },
    ...(person.specialty ? { jobTitle: person.specialty } : {}),
    // knowsAbout is the list of things this person actually works on, not a
    // restatement of the job title: the owner-supplied specialty plus the
    // concrete jobs derived from it.
    ...(person.specialty || person.does?.length
      ? {
          knowsAbout: [
            ...(person.specialty ? [person.specialty] : []),
            ...(person.does ?? []),
          ],
        }
      : {}),
    ...(person.bio ? { description: person.bio } : {}),
    // sameAs is an identity claim, so only owner-supplied profiles go here.
    ...(profileLinks.length
      ? { sameAs: profileLinks.map((l) => l.href) }
      : {}),
    ...(person.photo ? { image: `${SITE.domain}${person.photo.src}` } : {}),
    ...(person.certifications?.length
      ? { hasCredential: person.certifications }
      : {}),
  };

  // One FAQPage per profile, built from the person's own questions. Emitted
  // only when there are questions — an empty FAQPage is a schema error.
  const faqSchema = person.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${SITE.domain}/team/${person.slug}/#faq`,
        mainEntity: person.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

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
      {
        "@type": "ListItem",
        position: 3,
        name: person.name,
        item: `${SITE.domain}/team/${person.slug}/`,
      },
    ],
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
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
        <div className="relative mx-auto max-w-[1240px] px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20">
          <nav
            className="flex flex-wrap items-center gap-1 text-sm text-white/62"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-white">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4 text-white/36" />
            <Link href="/team/" className="hover:text-white">
              تیم فنی
            </Link>
            <ChevronLeft className="h-4 w-4 text-white/36" />
            <span className="line-clamp-1 text-white">{person.name}</span>
          </nav>

          <div className="mt-6 flex items-center gap-4">
            {person.photo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={person.photo.src}
                alt={`${person.name}، ${roleLabel(person)} ${SITE.brandName}`}
                width={person.photo.w}
                height={person.photo.h}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-white/15"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl font-extrabold text-white ring-2 ring-white/15"
              >
                {person.name[0]}
              </span>
            )}
            <span className="inline-flex rounded-lg bg-accent-tint px-3 py-1.5 text-xs font-extrabold text-accent">
              {roleLabel(person)}
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-[30px] font-extrabold leading-[1.35] tracking-tight sm:text-[44px]">
            {person.name}
          </h1>
          {person.specialty && (
            <p className="mt-3 max-w-2xl text-[16px] leading-9 text-white/74 sm:text-[17px]">
              {person.specialty}
            </p>
          )}
          {yearsLabel(person) && (
            <p className="mt-2 text-[14px] font-bold text-accent">
              {yearsLabel(person)}
            </p>
          )}
        </div>
      </header>

      <section className="bg-paper py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          {person.bio && (
            <div className="max-w-3xl rounded-[26px] border border-line bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-extrabold text-ink-900 sm:text-xl">
                درباره {person.name}
              </h2>
              <p className="mt-4 text-[15px] leading-9 text-ink-700">
                {person.bio}
              </p>
              {person.about?.map((para) => (
                <p key={para} className="mt-4 text-[15px] leading-9 text-ink-700">
                  {para}
                </p>
              ))}
              {topicLabels.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {topicLabels.map((label) => (
                    <li
                      key={label}
                      className="rounded-lg bg-accent-tint px-3 py-1.5 text-xs font-bold text-accent"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              )}
              {profileLinks.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
                  {profileLinks.map(({ href, label, Icon }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="me noopener"
                      className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink-800 transition hover:border-accent hover:text-accent"
                    >
                      <Icon className="h-4 w-4 text-accent" />
                      {label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {(person.does?.length || person.notFor) && (
        <section className="border-t border-line bg-white py-12 lg:py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            {person.does?.length ? (
              <>
                <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[32px]">
                  {person.name} چه کارهایی انجام می دهد
                </h2>
                <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {person.does.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 rounded-[16px] border border-line bg-paper p-4 text-sm font-bold leading-7 text-ink-800"
                    >
                      <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {person.notFor && (
              <div className="mt-8 flex max-w-3xl gap-3 rounded-[22px] border border-line bg-paper p-5 sm:p-6">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-[15px] font-extrabold text-ink-900">
                    چه زمانی سراغ {person.name} نیایید
                  </p>
                  <p className="mt-2 text-[15px] leading-9 text-ink-700">
                    {person.notFor}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {tools.length > 0 && (
        <section className="border-t border-line bg-paper py-12 lg:py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[32px]">
              ابزارهایی که {person.name} با آنها کار می کند
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-9 text-ink-700">
              این تجهیزات روی میز کار همین مجموعه هستند و در عکس های کارگاه هم
              دیده می شوند.
            </p>
            <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  className="rounded-[22px] border border-line bg-white p-5"
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
      )}

      {articles.length > 0 && (
        <section className="border-t border-line bg-white py-12 lg:py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[32px]">
              مقاله‌های نوشته شده توسط {person.name}
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-9 text-ink-700">
              {articles.length.toLocaleString("fa-IR")} مقاله در حوزه{" "}
              {topicLabels.join("، ") || person.specialty || roleLabel(person)}.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section className="border-t border-line bg-paper py-12 lg:py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[32px]">
              خدماتی که {person.name} مسئول آن است
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((post) => (
                <li key={post.id}>
                  <Link
                    href={post.path}
                    className="card-hover flex items-center gap-3 rounded-[16px] border border-line bg-white p-4 text-sm font-bold text-ink-800 transition hover:border-accent hover:text-accent"
                  >
                    <Wrench className="h-4 w-4 shrink-0 text-accent" />
                    <span className="line-clamp-1">{linkLabel(post.title)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {person.faqs?.length ? (
        <section className="border-t border-line bg-white py-12 lg:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[32px]">
              پرسش های پرتکرار درباره کار {person.name}
            </h2>
            <div className="mt-8 space-y-3">
              {person.faqs.map((f, i) => (
                <details
                  key={f.q}
                  open={i === 0}
                  className="group overflow-hidden rounded-2xl border border-line bg-paper shadow-card open:border-accent/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-right [&::-webkit-details-marker]:hidden">
                    <span className="text-base font-semibold text-ink-900">
                      {f.q}
                    </span>
                    <Plus className="h-5 w-5 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-8 text-ink-500">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {colleagues.length > 0 && (
        <section className="border-t border-line bg-paper py-12 lg:py-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[32px]">
              همکاران {person.name}
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-9 text-ink-700">
              کار هر دستگاه به کسی سپرده می شود که تخصصش همان است. اگر ایراد
              دستگاه شما در حوزه دیگری است، پروفایل همکار مربوط را ببینید.
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {colleagues.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/team/${c.slug}/`}
                    className="card-hover flex h-full flex-col rounded-[22px] border border-line bg-white p-5 shadow-card transition hover:border-accent"
                  >
                    <span className="text-xs font-extrabold text-accent">
                      {roleLabel(c)}
                    </span>
                    <span className="mt-2 text-[16px] font-extrabold leading-7 text-ink-900">
                      {c.name}
                    </span>
                    {c.specialty && (
                      <span className="mt-1 text-sm leading-7 text-ink-500">
                        {c.specialty}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="border-t border-line bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-[26px] border border-line bg-paper p-6 shadow-card sm:p-8">
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
            <Link
              href="/team/"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent hover:opacity-80"
            >
              مشاهده کل تیم فنی
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
