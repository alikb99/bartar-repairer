"use client";

import { useState } from "react";
import { Clock3, MapPin, Navigation, Phone, TramFront } from "lucide-react";
import { BRANCHES, baladEmbedUrl, directionsUrl, type Branch } from "@/lib/data";

// Branch locator + free-courier coverage. Rendered on the 648 commercial pages
// listed in lib/recovered-service-centers.ts.
//
// Balad's embed renders exactly one point, so a two-branch map is impossible in
// a single iframe — selecting a branch swaps the `src`, and `key` forces the
// remount. The iframe stays lazy because this block ships on 648 pages.
//
// Areas arrive as a prop rather than being imported here: LIVE_SERVICE_AREAS
// comes from lib/service-areas.ts, which pulls in the whole POSTS table, and
// this is a client component.
//
// No JSON-LD: app/layout.tsx already ships a LocalBusiness node per branch on
// every page, so emitting one here would duplicate the same @id.

const BADGE = ["۱", "۲", "۳"];

// The neighbourhood pages introduce the same two branches as "the ones near
// you", so heading and intro are overridable; everywhere else the sitewide
// wording stands.
const HEADING = "مراکز خدمات برتر سرویس در تهران";
const INTRO =
  "دو شعبه حضوری داریم و هر دو کارگاه تعمیر دارند، نه فقط باجه پذیرش. دستگاه را می توانید حضوری بیاورید یا با پیک رفت و برگشت بفرستید.";

export default function ServiceCenters({
  areas,
  heading = HEADING,
  intro = INTRO,
}: {
  areas: { slug: string; name: string }[];
  heading?: string;
  intro?: string;
}) {
  const [active, setActive] = useState<Branch["id"]>(BRANCHES[0].id);
  const selected = BRANCHES.find((b) => b.id === active) ?? BRANCHES[0];

  return (
    <section className="border-t border-line bg-paper py-14 lg:py-16">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <h2 className="heading-accent flex items-center gap-2 text-xl font-extrabold text-ink-900 sm:text-2xl">
          <MapPin className="h-5 w-5 text-accent" />
          {heading}
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-8 text-ink-600">
          {intro}
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <ol className="flex flex-col gap-3">
            {BRANCHES.map((b, i) => {
              const on = b.id === active;
              return (
                <li key={b.id}>
                  <div
                    className={`rounded-2xl border bg-white p-5 transition ${
                      on ? "border-accent/50 shadow-card" : "border-line"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold ${
                          on ? "bg-accent text-white" : "bg-ink-900 text-white"
                        }`}
                        aria-hidden="true"
                      >
                        {BADGE[i] ?? String(i + 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-extrabold text-ink-900">
                          {b.name} — {b.area}
                        </h3>
                        <address className="mt-2 not-italic text-[13.5px] leading-7 text-ink-600">
                          {b.address}
                        </address>
                        <dl className="mt-3 flex flex-col gap-1.5 text-[13.5px]">
                          <div className="flex items-center gap-2">
                            <dt className="sr-only">تلفن</dt>
                            <Phone className="h-4 w-4 shrink-0 text-accent" />
                            <dd>
                              <a
                                href={b.phoneHref}
                                data-cta="branches"
                                className="font-bold text-ink-900 hover:text-accent"
                              >
                                {b.phone}
                              </a>
                            </dd>
                          </div>
                          <div className="flex items-center gap-2">
                            <dt className="sr-only">ساعت کاری</dt>
                            <Clock3 className="h-4 w-4 shrink-0 text-ink-300" />
                            <dd className="text-ink-600">{b.hours}</dd>
                          </div>
                          {b.metro && (
                            <div className="flex items-center gap-2">
                              <dt className="sr-only">نزدیک ترین مترو</dt>
                              <TramFront className="h-4 w-4 shrink-0 text-ink-300" />
                              <dd className="text-ink-600">
                                نزدیک ترین مترو: {b.metro}
                              </dd>
                            </div>
                          )}
                        </dl>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            aria-pressed={on}
                            onClick={() => setActive(b.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition ${
                              on
                                ? "bg-accent text-white"
                                : "border border-line text-ink-700 hover:border-accent/50 hover:text-accent"
                            }`}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            {on ? "روی نقشه" : "نمایش روی نقشه"}
                          </button>
                          <a
                            href={directionsUrl(b)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-bold text-ink-700 transition hover:border-accent/50 hover:text-accent"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            مسیریابی
                          </a>
                          {b.baladUrl && (
                            <a
                              href={b.baladUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-bold text-ink-700 transition hover:border-accent/50 hover:text-accent"
                            >
                              مشاهده در بلد
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="min-h-[340px] overflow-hidden rounded-2xl border border-line bg-white lg:min-h-full">
            <iframe
              key={selected.id}
              src={baladEmbedUrl(selected)}
              title={`نقشه ${selected.name} برتر سرویس — ${selected.area}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[340px] w-full border-0"
            />
          </div>
        </div>

        {/* The neighbourhood hubs pass no areas: a page about one district
            does not need a list of all the others under its own branch map. */}
        {areas.length > 0 && (
        <div className="mt-8 rounded-2xl border border-line bg-white p-5">
          <h3 className="text-[15px] font-extrabold text-ink-900">
            مناطقی که با پیک رایگان پوشش می دهیم
          </h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {areas.map((a) => (
              <li key={a.slug}>
                <a
                  className="inline-flex rounded-full border border-line px-3.5 py-1.5 text-[13px] text-ink-700 transition hover:border-accent/50 hover:text-accent"
                  href={`/areas/${a.slug}/`}
                >
                  {a.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        )}
      </div>
    </section>
  );
}
