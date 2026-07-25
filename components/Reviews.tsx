import { Star } from "lucide-react";
import { CUSTOMER_REVIEWS, ratingSummary } from "@/lib/pricing";
import { SITE } from "@/lib/data";

// Customer reviews plus AggregateRating markup. Renders nothing — and emits no
// schema — until real reviews are added to lib/pricing.ts. Rating markup that
// is not backed by genuine reviews is a structured-data policy violation, so
// the empty state is deliberate, not a placeholder to fill with samples.
export default function Reviews() {
  const summary = ratingSummary();
  if (!summary) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": SITE.localBusinessId,
    name: SITE.name,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: summary.value,
      reviewCount: summary.count,
      bestRating: 5,
      worstRating: 1,
    },
    review: CUSTOMER_REVIEWS.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      datePublished: r.date,
      reviewBody: r.body,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  };

  return (
    <section className="border-t border-line bg-white py-14 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-3 text-sm font-extrabold tracking-wide text-accent">
            نظر مشتریان
          </div>
          <h2 className="text-[25px] font-extrabold tracking-tight text-ink-900 sm:text-[32px]">
            تجربه مشتریان ما
          </h2>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            <span className="flex" aria-hidden>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-5 w-5 ${
                    n <= Math.round(summary.value)
                      ? "fill-accent text-accent"
                      : "text-ink-300"
                  }`}
                />
              ))}
            </span>
            <span className="text-sm font-bold text-ink-700">
              {summary.value.toLocaleString("fa-IR")} از ۵ بر پایه{" "}
              {summary.count.toLocaleString("fa-IR")} نظر
            </span>
          </div>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CUSTOMER_REVIEWS.map((r) => (
            <figure
              key={`${r.author}-${r.date}`}
              className="rounded-[18px] border border-line bg-paper p-5"
            >
              <div className="flex" aria-label={`${r.rating} از ۵`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      n <= r.rating ? "fill-accent text-accent" : "text-ink-300"
                    }`}
                  />
                ))}
              </div>
              <blockquote className="mt-3 text-[14.5px] leading-8 text-ink-700">
                {r.body}
              </blockquote>
              <figcaption className="mt-4 text-[13px] font-bold text-ink-900">
                {r.author}
                {r.source && (
                  <span className="mr-2 font-normal text-ink-300">
                    — {r.source}
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
