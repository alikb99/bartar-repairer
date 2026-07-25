import { AlertTriangle, Check, HelpCircle } from "lucide-react";
import { clusterContentFor } from "@/lib/cluster-content";

// Renders the hand-written enrichment block for a money page, above the legacy
// WordPress body. The original content is never replaced — this only adds the
// direct answer, real numbers and honest caveats that the legacy copy lacks.
// Renders nothing for pages without a block.
export default function ClusterContent({ path }: { path: string }) {
  const block = clusterContentFor(path);
  if (!block) return null;

  return (
    <section
      id="cluster-answer"
      className="mb-8 rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8"
    >
      <p className="text-[16px] font-semibold leading-9 text-ink-900 sm:text-[17px]">
        {block.answer}
      </p>

      <dl className="mt-7 grid gap-3 sm:grid-cols-2">
        {block.facts.map((f) => (
          <div
            key={f.label}
            className="flex items-start gap-2.5 rounded-2xl border border-line bg-paper px-4 py-3"
          >
            <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
            <div>
              <dt className="text-[13px] leading-6 text-ink-500">{f.label}</dt>
              <dd className="text-[14px] font-extrabold leading-7 text-ink-900">
                {f.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {block.sections.map((s) => (
        <div key={s.h} className="mt-8">
          <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">
            {s.h}
          </h2>
          {s.p.map((para, i) => (
            <p key={i} className="mt-3 text-[15px] leading-9 text-ink-700">
              {para}
            </p>
          ))}
        </div>
      ))}

      {block.photos && block.photos.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">
            تصویرهایی از کار ما
          </h2>
          <p className="mt-2 text-[14px] leading-8 text-ink-500">
            این عکس ها در کارگاه خودمان و روی دستگاه های واقعی مشتریان گرفته شده اند.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {block.photos.map((ph) => (
              <figure
                key={ph.src}
                className="overflow-hidden rounded-[18px] border border-line bg-paper"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ph.src}
                  alt={ph.alt}
                  width={ph.w}
                  height={ph.h}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full object-cover"
                />
                <figcaption className="px-4 py-3 text-[13px] leading-7 text-ink-500">
                  {ph.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 rounded-[22px] border border-accent/25 bg-accent/[.04] p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-ink-900">
          <AlertTriangle className="h-5 w-5 shrink-0 text-accent" />
          {block.avoid.title}
        </h2>
        <ul className="mt-4 space-y-3">
          {block.avoid.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-[15px] leading-8 text-ink-700"
            >
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink-900 sm:text-2xl">
          <HelpCircle className="h-5 w-5 shrink-0 text-accent" />
          پرسش های پرتکرار
        </h2>
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-[18px] border border-line">
          {block.faq.map((f) => (
            <details key={f.q} className="group bg-white">
              <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-extrabold leading-8 text-ink-900 transition hover:bg-paper">
                {f.q}
              </summary>
              <p className="px-5 pb-5 text-[15px] leading-9 text-ink-700">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
