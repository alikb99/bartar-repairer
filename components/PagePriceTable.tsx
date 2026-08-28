import Link from "next/link";
import { Info, Phone } from "lucide-react";
import {
  pricesForPage,
  rial,
  toman,
  PRICES_UPDATED,
  REPAIR_LABELS,
  SCHEMA_CURRENCY,
} from "@/lib/pricing";
import { SITE } from "@/lib/data";

// Price table for an individual service page (e.g. /iphone-battery-replacement/).
// Shows only the slice that matches the page — Apple battery rows, not all 98 —
// so the numbers answer the query the visitor actually arrived with.
// Renders nothing when the page has no confident brand + repair match.
export default function PagePriceTable({
  title,
  path,
}: {
  title: string;
  path: string;
}) {
  const data = pricesForPage(title, path);
  if (!data) return null;

  // Brand hubs span several repair types; group them so the table reads well.
  const groups = new Map<string, typeof data.rows>();
  for (const r of data.rows) {
    const key = data.grouped ? r.repairType : "";
    const arr = groups.get(key);
    if (arr) arr.push(r);
    else groups.set(key, [r]);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  // One Offer per priced model, wrapped in an OfferCatalog. Prices are real
  // (content/parts-prices.json) so this is safe to expose as structured data.
  // Rows without an upper bound emit a single price instead of a range.
  // The table shows tomans; the schema currency is the rial, so every figure
  // goes through rial() (see lib/pricing.ts).
  const offerSchema = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: data.heading,
    numberOfItems: data.rows.length,
    itemListElement: data.rows.map((r) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: `${REPAIR_LABELS[r.repairType] ?? "تعمیر"} ${r.device}`,
        provider: { "@id": SITE.localBusinessId },
      },
      priceCurrency: SCHEMA_CURRENCY,
      priceSpecification: r.to
        ? {
            "@type": "PriceSpecification",
            minPrice: rial(r.from),
            maxPrice: rial(r.to),
            priceCurrency: SCHEMA_CURRENCY,
            valueAddedTaxIncluded: true,
          }
        : {
            "@type": "PriceSpecification",
            price: rial(r.from),
            priceCurrency: SCHEMA_CURRENCY,
            valueAddedTaxIncluded: true,
          },
      availability: "https://schema.org/InStock",
      areaServed: { "@type": "City", name: SITE.city },
    })),
  };

  return (
    <section id="prices" className="my-8 rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
      />
      <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">
        {data.heading}
      </h2>
      <p className="mt-3 text-sm leading-8 text-ink-500">
        ارقام به تومان و شامل قطعه و اجرت نصب هستند. کف بازه مربوط به قطعه کپی و
        سقف آن مربوط به قطعه اورجینال است. قیمت قطعی پس از عیب یابی رایگان اعلام
        می شود و تعمیر فقط با تایید شما شروع می شود.
      </p>

      <div className="mt-6 space-y-7">
        {ordered.map(([key, list]) => (
          <div key={key || "all"}>
            {data.grouped && (
              <h3 className="mb-3 text-[15px] font-extrabold text-ink-900">
                {REPAIR_LABELS[key] ?? key}
                <span className="mr-2 text-[13px] font-normal text-ink-300">
                  {list.length.toLocaleString("fa-IR")} مدل
                </span>
              </h3>
            )}
            <div className="overflow-x-auto rounded-[18px] border border-line">
              <table className="price-table">
                <thead>
                  <tr>
                    <th>مدل دستگاه</th>
                    <th>با قطعه کپی</th>
                    <th>با قطعه اورجینال</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={`${r.repairType}-${r.device}`}>
                      <td>{r.device}</td>
                      <td>{toman(r.from)}</td>
                      <td>{r.to ? toman(r.to) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={SITE.phoneHref}
          dir="ltr"
          className="inline-flex items-center gap-2 rounded-[13px] bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-deep"
        >
          <Phone className="h-4 w-4" />
          {SITE.phone}
        </a>
        <Link
          href="/online-repair-request/"
          className="inline-flex items-center gap-2 rounded-[13px] border-[1.5px] border-hairline bg-white px-5 py-3 text-sm font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
        >
          ثبت درخواست آنلاین
        </Link>
        {/* This table lists only the models named on this page; /prices/ carries
            every row, so a visitor whose model is absent still has somewhere
            to go instead of bouncing. */}
        <Link
          href="/prices/"
          className="inline-flex items-center gap-2 text-sm font-bold text-accent underline decoration-accent/30 underline-offset-4 transition hover:decoration-accent"
        >
          جستجوی قیمت مدل های دیگر
        </Link>
      </div>

      <p className="mt-5 flex items-start gap-2 text-[13px] leading-7 text-ink-300">
        <Info className="mt-1 h-4 w-4 shrink-0" />
        <span>
          {PRICES_UPDATED ? `آخرین بروزرسانی: ${PRICES_UPDATED}. ` : ""}
          قیمت قطعات با نرخ بازار تغییر می کند؛ اگر مدل شما در جدول نیست تماس
          بگیرید تا استعلام شود.
        </span>
      </p>
    </section>
  );
}
