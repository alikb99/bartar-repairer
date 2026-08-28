import Link from "next/link";
import {
  ArrowUpLeft,
  Bike,
  ChevronLeft,
  LayoutList,
  MapPin,
  Search,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { BRANCHES, SITE, STATS } from "@/lib/data";
import { TECHNICIANS, WORKSHOP_TOOLS, yearsLabel } from "@/lib/team";

// The homepage's long-form body: what the shop does, which devices it takes,
// who works on them, why to pick it, when NOT to, and where the branches are.
// This is the page's main indexable copy — it sits between <WhyUs /> and
// <Steps /> and was the single largest content block missing from the rebuilt
// source.
//
// Figures come from data wherever data can produce the published number:
// STATS for the years/devices counts, TECHNICIANS for the team, WORKSHOP_TOOLS
// for the equipment. The price counts below are the exception — see the note
// on PRICE_COPY.

const [years, devices] = [STATS[0].value, STATS[1].value];
const lead = TECHNICIANS[0];
const specialties = [
  ...new Set(TECHNICIANS.map((t) => t.specialty).filter(Boolean)),
] as string[];
const tools = WORKSHOP_TOOLS.slice(0, 4)
  .map((t) => t.name)
  .join("، ");

/**
 * Price figures quoted in the prose.
 *
 * These are NOT derived from PRICE_RANGES. The published table on /prices/
 * comes from the imported page content, not from lib/pricing.ts, and the two
 * disagree (PRICE_RANGES holds 152 LCD / 98 battery rows against the table's
 * 123 / 158). Deriving them here would silently rewrite copy Google has already
 * indexed, so the published numbers are pinned. Re-check them against /prices/
 * whenever that table is regenerated.
 */
const PRICE_COPY = {
  lcdModels: "۱۲۳",
  batteryModels: "۱۵۸",
  lcdFrom: "۱٬۹۰۰٬۰۰۰",
  lcdTo: "۱۳۶٬۰۰۰٬۰۰۰",
  batteryFrom: "۷۲۰٬۰۰۰",
  batteryTo: "۱۳٬۰۰۰٬۰۰۰",
  rows: "۳۱۰",
};

const DEVICE_LINKS: { href: string; label: string }[] = [
  { href: "/services/category-mobile-phone-repair/", label: "تعمیر موبایل" },
  { href: "/services/laptop-repair/", label: "تعمیر لپ تاپ" },
  { href: "/smart-watch-repair/", label: "تعمیر ساعت هوشمند" },
  { href: "/home-appliances/tv-repair-in-tehran/", label: "تعمیر تلویزیون" },
  { href: "/home-appliances/", label: "تعمیر لوازم خانگی" },
  { href: "/prices/", label: "قیمت تعمیر به تفکیک مدل" },
];

const REASONS: { title: string; desc: string }[] = [
  {
    title: "قیمت پیش از کار، نه بعد از آن",
    desc: `عیب یابی رایگان است و عدد پیش از باز کردن دستگاه گفته می شود. قیمت ${PRICE_COPY.rows} ردیف تعمیر روی سایت منتشر شده تا پیش از تماس بدانید با چه بازه ای طرف هستید.`,
  },
  {
    title: "گارانتی ۶ ماهه کتبی",
    desc: "روی قطعه و اجرت. اگر همان ایراد در این بازه برگردد بدون هزینه رفع می شود. قطعه تعویض شده و شماره سریال دستگاه روی برگه گارانتی نوشته می شود.",
  },
  {
    title: "تیم تفکیک شده به جای یک تعمیرکار همه کاره",
    desc: `${TECHNICIANS.length.toLocaleString("fa-IR")} تکنسین با تخصص های جدا، به علاوه تجهیزات ریزکاری برد که در عکس های کارگاه هم دیده می شوند.`,
  },
  {
    title: "پیک رفت و برگشت در تهران",
    desc: `لازم نیست تا شعبه بیایید. برای گوشی و لپ تاپ پیک می فرستیم و خارج از تهران دستگاه با پست به کد پستی ${SITE.postalCode} می رسد و بعد از تعمیر پس فرستاده می شود.`,
  },
];

// A repair shop that never says "don't bother" is not being honest. These four
// cases keep the page from reading as a sales pitch and they are the passages
// AI answer engines quote most often.
const AVOID: string[] = [
  "دستگاه هنوز زیر گارانتی فروشنده رسمی است. اول سراغ همان جا بروید، چون باز کردن دستگاه گارانتی را باطل می کند.",
  "هزینه تعمیر از نصف قیمت روز دستگاه بیشتر می شود. در این حالت عدد را می گوییم و خودمان توصیه می کنیم دستگاه را عوض کنید.",
  "دنبال تعمیر برد گوشی یا لپ تاپ در منزل هستید. این کار به میکروسکوپ، هیتر و دستگاه شست وشوی اولتراسونیک نیاز دارد که هیچ کدام قابل حمل نیستند. به جایش پیک می فرستیم. استثنا لوازم خانگی است که در محل تعمیر می شود.",
  "برد گوشی دچار خوردگی گسترده آب شده و چند آی سی سوخته است. گاهی تعمیر جواب می دهد ولی دوامش قابل تضمین نیست و ما گارانتی این مورد را نمی پذیریم.",
];

const H2 =
  "mt-12 text-[24px] font-extrabold leading-[1.5] tracking-tight text-ink-900 sm:text-[28px]";
const P = "mt-4 text-[16px] leading-9 text-ink-700 sm:text-[17px]";
const INLINE_LINK =
  "font-bold text-accent underline decoration-accent/30 underline-offset-4 transition hover:decoration-accent";

export function HomeAbout() {
  const [central, west] = BRANCHES;

  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-[860px] px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="text-[26px] font-extrabold leading-[1.5] tracking-tight text-ink-900 sm:text-[32px]">
          برتر سرویس چه کاری انجام می دهد
        </h2>
        <p className="mt-5 text-[16px] leading-9 text-ink-700 sm:text-[17px]">
          برتر سرویس یک تعمیرگاه تخصصی موبایل، لپ تاپ، تبلت، ساعت هوشمند،
          تلویزیون و لوازم خانگی در تهران است که {years} سال است کار می کند و در
          این مدت {devices} دستگاه از دستش گذشته است. دو شعبه حضوری داریم: شعبه
          مرکزی در خیابان مطهری و شعبه غرب در سعادت آباد. هر دو شعبه یک کارگاه
          مشترک دارند، پس دستگاهی که به هر کدام تحویل بدهید دست همان تکنسینی می
          رسد که تخصصش همان کار است.
        </p>
        <p className={P}>
          روال کار ساده است: دستگاه را می آورید یا می گویید پیک بفرستیم، عیب
          یابی رایگان انجام می شود، هزینه و مدت زمان پیش از باز کردن دستگاه به
          شما گفته می شود و کار فقط با تایید خودتان شروع می شود. روی هر تعمیر ۶
          ماه گارانتی کتبی می گیرید که قطعه تعویض شده و شماره سریال دستگاه رویش
          ثبت است.
        </p>

        <h2 className={H2}>چه دستگاه هایی را تعمیر می کنیم</h2>
        <p className={P}>
          کار اصلی ما تعمیر موبایل و لپ تاپ است و بیشترین مراجعه هم برای تعویض
          نمایشگر و باتری است. در کنار آن تبلت، ساعت هوشمند، مانیتور، تلویزیون،
          کنسول بازی و لوازم خانگی هم تعمیر می شوند. برای{" "}
          {PRICE_COPY.lcdModels} مدل گوشی قیمت تعویض ال سی دی و برای{" "}
          {PRICE_COPY.batteryModels}{" "}
          مدل قیمت تعویض باتری را روی سایت نوشته ایم؛ بازه ال سی دی از{" "}
          {PRICE_COPY.lcdFrom} تا {PRICE_COPY.lcdTo} تومان و بازه باتری از{" "}
          {PRICE_COPY.batteryFrom} تا{" "}
          {PRICE_COPY.batteryTo} تومان است. این اختلاف زیاد به مدل دستگاه و به
          کپی یا اورجینال بودن قطعه برمی گردد و هر دو گزینه با قیمت به شما گفته
          می شود.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {DEVICE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2.5 text-[13px] font-bold text-ink-800 transition hover:border-accent hover:text-accent"
            >
              {l.label}
              <ArrowUpLeft className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>

        <h2 className={H2}>چه کسی روی دستگاه شما کار می کند</h2>
        <p className={P}>
          {TECHNICIANS.length.toLocaleString("fa-IR")} تعمیرکار در این مجموعه کار
          می کنند و سرپرستی کارگاه با {SITE.manager.name} است. تعمیر گوشی، لپ
          تاپ و ساعت هوشمند سه کار متفاوت هستند و ما آنها را به یک نفر نمی
          سپاریم؛ هر کدام تکنسین خودش را دارد. باتجربه ترین عضو تیم،{" "}
          {lead.name} با{" "}
          {yearsLabel(lead)} روی {lead.specialty} است. وقتی دستگاه را تحویل می
          دهید می توانید بپرسید چه کسی روی آن کار می کند و ما جواب می دهیم.
        </p>
        <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {specialties.map((s) => (
            <li
              key={s}
              className="flex items-start gap-2.5 rounded-xl border border-line bg-paper px-4 py-3 text-[14px] leading-7 text-ink-700"
            >
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[16px] leading-9 text-ink-700 sm:text-[17px]">
          تعمیر برد بدون ابزار درست حدس زدن است، برای همین کارگاه ما{" "}
          {tools}{" "}
          دارد. نام و تخصص تک تک تکنسین ها و عکس تجهیزات کارگاه در{" "}
          <Link href="/team/" className={INLINE_LINK}>
            صفحه تیم فنی
          </Link>{" "}
          آمده است.
        </p>

        <h2 className={H2}>چرا برتر سرویس را انتخاب کنید</h2>
        <p className={P}>
          چهار چیز ما را از یک تعمیرگاه معمولی جدا می کند و هر چهار تا قابل
          بررسی هستند، نه شعار.
        </p>
        <ol className="mt-5 space-y-4">
          {REASONS.map((r, i) => (
            <li
              key={r.title}
              className="flex gap-4 rounded-[18px] border border-line bg-paper p-5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-[15px] font-extrabold text-white">
                {(i + 1).toLocaleString("fa-IR")}
              </span>
              <div>
                <h3 className="text-[16px] font-extrabold text-ink-900">
                  {r.title}
                </h3>
                <p className="mt-1.5 text-[14.5px] leading-8 text-ink-700">
                  {r.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-[22px] border border-accent/25 bg-accent/[.04] p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[19px] font-extrabold text-ink-900 sm:text-[22px]">
            <TriangleAlert className="h-5 w-5 shrink-0 text-accent" />
            چه زمانی سراغ ما نیایید
          </h2>
          <p className="mt-3 text-[15px] leading-9 text-ink-700">
            یک تعمیرگاه صادق باید مرز کارش را هم بگوید. در این چهار حالت وقت
            خودتان را تلف نکنید:
          </p>
          <ul className="mt-4 space-y-3 text-[15px] leading-8 text-ink-700">
            {AVOID.map((a) => (
              <li key={a} className="flex items-start gap-2.5">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {a}
              </li>
            ))}
          </ul>
        </div>

        <h2 className={H2}>کجا و چه ساعتی</h2>
        <p className={P}>
          شعبه مرکزی: {central.address}، تلفن{" "}
          <span dir="ltr">{central.phone}</span>. شعبه غرب: {west.address}، تلفن{" "}
          <span dir="ltr">{west.phone}</span>. ساعت کاری هر دو شعبه{" "}
          {SITE.hours} است. اگر نمی دانید دستگاه شما دقیقا چه ایرادی دارد، پیش
          از تماس{" "}
          <Link href="/online-diagnosis/" className={INLINE_LINK}>
            عیب یابی آنلاین
          </Link>{" "}
          را امتحان کنید یا مستقیم{" "}
          <Link href="/online-repair-request/" className={INLINE_LINK}>
            درخواست تعمیر ثبت کنید
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

const TOOLS: {
  href: string;
  label: string;
  desc: string;
  icon: typeof Stethoscope;
}[] = [
  {
    href: "/online-diagnosis/",
    label: "عیب یابی آنلاین",
    desc: "چند پرسش ساده تا حدس اولیه ایراد دستگاه، پیش از اینکه از خانه بیرون بزنید.",
    icon: Stethoscope,
  },
  {
    href: "/mobile-repair-online/",
    label: "تعمیر موبایل آنلاین",
    desc: "پیک رفت و برگشت رایگان در تهران؛ گوشی را درب منزل تحویل می گیریم و تعمیر شده برمی گردانیم.",
    icon: Bike,
  },
  {
    href: "/areas/",
    label: "مناطق تحت پوشش",
    desc: "پوشش ۱۳ منطقه تهران با آدرس شعبه و نزدیک ترین ایستگاه مترو.",
    icon: MapPin,
  },
  {
    href: "/directory/",
    label: "فهرست کامل خدمات",
    desc: "همه صفحه های تعمیر به تفکیک برند و دستگاه، یک جا و بدون جستجو.",
    icon: LayoutList,
  },
  {
    href: "/app/",
    label: "اپلیکیشن برتر سرویس",
    desc: "پیگیری وضعیت تعمیر و ثبت درخواست از روی گوشی.",
    icon: Search,
  },
];

/** Self-serve entry points, so the homepage funnels into the tool pages. */
export function HomeTools() {
  return (
    <section className="bg-paper py-12 lg:py-16">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <h2 className="text-[24px] font-extrabold leading-[1.5] text-ink-900 sm:text-[30px]">
          پیش از مراجعه، از این ابزارها استفاده کنید
        </h2>
        <p className="mt-3 max-w-[680px] text-[15.5px] leading-9 text-ink-500">
          لازم نیست برای هر سوالی حضوری بیایید. ایراد دستگاه را آنلاین حدس بزنید،
          هزینه را ببینید و اگر وقت مراجعه ندارید پیک رایگان بفرستیم.
        </p>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => {
            const I = t.icon;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="card-hover flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-accent"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-tint text-accent">
                      <I className="h-5 w-5" />
                    </span>
                    <span className="text-[16.5px] font-bold text-ink-900">
                      {t.label}
                    </span>
                  </span>
                  <span className="mt-3 flex-1 text-[14px] leading-8 text-ink-600">
                    {t.desc}
                  </span>
                  <span className="mt-3 flex items-center gap-1 text-[13.5px] font-bold text-accent">
                    مشاهده
                    <ChevronLeft className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
