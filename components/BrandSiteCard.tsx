import { ArrowLeft } from "lucide-react";
import { SITE, BRAND_SITES } from "@/lib/data";

/**
 * The visible half of the parent/child declaration: on a brand hub that also
 * has its own dedicated site, a block saying so in words a reader understands.
 *
 * The machine-readable half is `subOrganization` on the Organization node in
 * app/layout.tsx, and the full list is /group/. All three say the same thing,
 * which is the point — a relationship stated only in JSON-LD is a claim no
 * reader can check.
 *
 * Renders nothing for a path with no dedicated site, so it is safe to mount
 * unconditionally on any brand landing.
 *
 * No `rel` on the link. These are the company's own properties and the whole
 * purpose here is to state that; `nofollow` would contradict the schema edge
 * sitting a few hundred bytes above it.
 */
export default function BrandSiteCard({ path }: { path: string }) {
  const site = BRAND_SITES[path];
  if (!site) return null;

  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-2xl border border-line bg-paper p-5 sm:p-7">
          <h2 className="text-lg font-extrabold text-ink-900 sm:text-xl">
            سایت تخصصی {site.brand} مجموعه ما
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-8 text-ink-500">
            {SITE.brandName} یک مرکز تعمیر چند برندی است و این صفحه بخش{" "}
            {site.brand} آن را نشان می دهد. برای محصولات {site.brand} یک سایت
            جداگانه داریم که قیمت به تفکیک مدل، شرح خرابی های رایج و ثبت درخواست
            تعمیر در آن کامل تر است. هر دو مجموعه یک شرکت، یک کارگاه و همان دو
            شعبه مطهری و سعادت آباد هستند.
          </p>
          <a
            href={site.url}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {/* The name alone. GROUP_SITES now carries each site's own
                published name, and most of those already read "نمایندگی
                تعمیرات X" — appending "سایت تخصصی تعمیرات X" said the brand
                twice in one button. The heading above already frames it. */}
            رفتن به {site.name}
            <ArrowLeft className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
