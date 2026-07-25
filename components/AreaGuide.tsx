import Link from "next/link";
import { AlertTriangle, MapPin, Phone, Truck } from "lucide-react";
import { SITE } from "@/lib/data";
import type { ServiceArea } from "@/lib/service-areas";

// Practical "how do I actually get my device to you from here" content for a
// service-area hub. Generated from the area's real branch assignment — every
// address, phone and postal code below comes from lib/data.ts.
//
// The honest bit: phone and laptop repair genuinely cannot happen at the
// customer's home (it needs a microscope, hot air station and ultrasonic
// cleaner), so these pages promise a courier instead of pretending otherwise.
// Home appliances are the opposite and do get an on-site visit.
export default function AreaGuide({ area }: { area: ServiceArea }) {
  const west = area.branch === "west";
  const branch = west
    ? {
        label: "شعبه غرب (سعادت آباد)",
        addr: SITE.addressWest,
        phone: SITE.phoneWest,
        href: SITE.phoneWestHref,
      }
    : {
        label: "شعبه مرکزی (مطهری)",
        addr: SITE.address,
        phone: SITE.phone,
        href: SITE.phoneHref,
      };

  return (
    <section className="mt-12 rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8">
      <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">
        از {area.name} چطور دستگاه را به ما برسانید
      </h2>

      <p className="mt-4 text-[15px] leading-9 text-ink-700">
        نزدیک ترین شعبه به {area.name}، {branch.label} است. می توانید خودتان
        دستگاه را بیاورید یا بگویید پیک بفرستیم. برای گوشی و لپ تاپ، پیک رفت و
        برگشت در تهران رایگان است و لازم نیست از {area.name} تا اینجا بیایید.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-sm font-extrabold text-ink-900">{branch.label}</p>
          <p className="mt-3 flex gap-2 text-sm leading-8 text-ink-700">
            <MapPin className="mt-1.5 h-4 w-4 shrink-0 text-accent" />
            {branch.addr}
          </p>
          <a
            href={branch.href}
            dir="ltr"
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-accent"
          >
            <Phone className="h-4 w-4" />
            {branch.phone}
          </a>
          <p className="mt-3 text-[13px] leading-7 text-ink-500">
            ساعت کاری: {SITE.hours}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
            <Truck className="h-4 w-4 text-accent" />
            پیک رفت و برگشت
          </p>
          <p className="mt-3 text-sm leading-8 text-ink-700">
            تماس بگیرید، ساعت هماهنگ می شود و پیک دستگاه را از {area.name}
            تحویل می گیرد. پس از عیب یابی رایگان هزینه اعلام می شود و کار فقط با
            تایید شما شروع می شود.
          </p>
          <p className="mt-3 text-[13px] leading-7 text-ink-500">
            خارج از تهران: ارسال پستی به کد پستی {SITE.postalCode}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-[22px] border border-accent/25 bg-accent/[.04] p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-accent" />
          تعمیر گوشی و لپ تاپ در محل انجام نمی شود
        </h3>
        <p className="mt-3 text-sm leading-8 text-ink-700">
          تعمیر برد گوشی و لپ تاپ به میکروسکوپ، هیتر و دستگاه شست وشوی
          اولتراسونیک نیاز دارد که هیچ کدام قابل حمل نیستند. هر جا به شما قول
          تعمیر برد در منزل داده شد، احتمالاً کار سطحی انجام می شود. به جایش پیک
          می فرستیم تا خودتان جابه جا نشوید.
        </p>
        <p className="mt-3 text-sm leading-8 text-ink-700">
          استثنا لوازم خانگی است: یخچال، لباسشویی، ظرفشویی و کولر گازی در
          {" "}
          {area.name} در محل تعمیر می شوند چون جابه جا کردنشان منطقی نیست.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/online-repair-request/"
          className="inline-flex items-center gap-2 rounded-[13px] bg-accent px-5 py-3 text-sm font-bold text-white transition hover:bg-accent-deep"
        >
          ثبت درخواست آنلاین
        </Link>
        <Link
          href="/team/"
          className="inline-flex items-center gap-2 rounded-[13px] border-[1.5px] border-hairline bg-white px-5 py-3 text-sm font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
        >
          تکنسین ها را ببینید
        </Link>
      </div>
    </section>
  );
}
