import { Info } from "lucide-react";
import { pricesFor, toman, PRICES_UPDATED } from "@/lib/pricing";

// Repair price table for a repair-type hub, grouped by brand so a 150-row list
// stays readable. Renders nothing when no prices exist for the hub — a page
// with no prices beats a page with wrong ones.
export default function PriceTable({
  repairType,
  repairTitle,
}: {
  repairType: string;
  repairTitle: string;
}) {
  const rows = pricesFor(repairType);
  if (rows.length === 0) return null;

  // Group by brand, largest group first.
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const b = r.brand ?? "سایر";
    const arr = groups.get(b);
    if (arr) arr.push(r);
    else groups.set(b, [r]);
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <section id="prices" className="border-b border-line bg-white py-12 lg:py-16">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <h2 className="heading-accent text-xl font-extrabold text-ink-900 sm:text-2xl">
          هزینه {repairTitle} به تفکیک مدل
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-8 text-ink-500">
          ارقام شامل قطعه و اجرت نصب هستند و به تومان نوشته شده اند. کف بازه
          مربوط به قطعه کپی و سقف آن مربوط به قطعه اورجینال است. قیمت قطعی پس از
          عیب یابی رایگان و بررسی دستگاه اعلام می شود و تعمیر فقط با تایید شما
          شروع می شود.
        </p>

        <div className="mt-7 space-y-8">
          {ordered.map(([brand, list]) => (
            <div key={brand}>
              <h3 className="mb-3 text-[15px] font-extrabold text-ink-900">
                {brand}
                <span className="mr-2 text-[13px] font-normal text-ink-300">
                  {list.length.toLocaleString("fa-IR")} مدل
                </span>
              </h3>
              <div className="overflow-x-auto rounded-[18px] border border-line">
                <table className="price-table">
                  <thead>
                    <tr>
                      <th>مدل دستگاه</th>
                      <th>هزینه با قطعه کپی</th>
                      <th>هزینه با قطعه اورجینال</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => (
                      <tr key={r.device}>
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

        <p className="mt-6 flex items-start gap-2 text-[13px] leading-7 text-ink-300">
          <Info className="mt-1 h-4 w-4 shrink-0" />
          <span>
            {PRICES_UPDATED
              ? `آخرین بروزرسانی قیمت ها: ${PRICES_UPDATED}. `
              : ""}
            قیمت قطعات با نرخ بازار تغییر می کند؛ اگر مدل شما در جدول نیست تماس
            بگیرید تا استعلام شود.
          </span>
        </p>
      </div>
    </section>
  );
}
