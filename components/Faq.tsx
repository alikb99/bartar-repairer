import { Plus } from "lucide-react";
import { FAQS } from "@/lib/data";

export default function Faq() {
  return (
    <section className="defer-render mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="text-center">
        <span className="section-index">05 / سوالات متداول</span>
        <h2 className="display mt-3 text-3xl font-extrabold text-ink-900 sm:text-[2.6rem]">
          پرسش های پرتکرار مشتریان
        </h2>
      </div>

      <div className="mt-12 space-y-3">
        {FAQS.map((f, i) => (
          <details
            key={f.q}
            open={i === 0}
            className="group overflow-hidden rounded-2xl border border-line bg-white shadow-card open:border-accent/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-right [&::-webkit-details-marker]:hidden">
              <span className="text-base font-semibold text-ink-900">
                {f.q}
              </span>
              <Plus className="h-5 w-5 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45" />
            </summary>
            <p className="px-5 pb-5 text-sm leading-8 text-ink-500">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
