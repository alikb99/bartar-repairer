import Link from "next/link";
import {
  Phone,
  Thermometer,
  Power,
  MonitorX,
  Droplets,
  Keyboard,
  BatteryWarning,
  Clock3,
} from "lucide-react";
import { NAV } from "@/lib/content";
import { SITE } from "@/lib/data";

// First block under the hero on /services/laptop-repair/, the page the
// Yektanet native-ad campaign lands on. That visitor was reading something else
// when they clicked, so they are not comparing repair shops yet; they want to
// know whether their problem is serious. Each card names the likely cause and a
// check they can do at home in a couple of minutes, then the call button
// follows the answer.
//
// Durations are the ones already published on the laptop brand pages
// (lib/cluster-content.ts): an in-stock part the same day, a motherboard 2 to 5
// working days. No laptop price data exists, so no price is shown.

const PROBLEMS = [
  {
    icon: Thermometer,
    title: "داغ می کند و وسط کار خاموش می شود",
    text: "اگر لپ تاپ دو سه سال است سرویس نشده، به احتمال زیاد فن پر از گرد و خاک است و خمیر سیلیکون روی پردازنده خشک شده. این مشکل معمولاً با سرویس حل می شود و قطعه ای عوض نمی شود.",
    time: "همان روز",
  },
  {
    icon: Power,
    title: "اصلاً روشن نمی شود",
    text: "اول آداپتور دیگری با همان ولتاژ و همان سوکت امتحان کنید. زیاد پیش آمده که مشتری با نگرانی خرابی مادربرد آمده و فقط شارژرش سوخته بود. اگر با آداپتور دیگر هم هیچ چراغی روشن نشد، ایراد از مدار تغذیه روی مادربرد است.",
    time: "مادربرد: ۲ تا ۵ روز کاری",
  },
  {
    icon: MonitorX,
    title: "صفحه سیاه است یا خط افتاده",
    text: "لپ تاپ را با کابل HDMI به تلویزیون یا مانیتور وصل کنید. اگر تصویر روی تلویزیون آمد، مادربرد و گرافیک سالم اند و ایراد از خود ال سی دی یا کابل فلت است، که تعمیرش ساده تر و ارزان تر است.",
    time: "همان روز، اگر قطعه موجود باشد",
  },
  {
    icon: Droplets,
    title: "آب یا چای رویش ریخته",
    text: "همین الان خاموشش کنید، شارژر را بکشید و اگر باتری جدا می شود جدایش کنید. روشن کردن برای امتحان و خشک کردن با سشوار کار را خراب تر می کند. همان روز بیاورید، چون خوردگی روی برد با گذشت هر ساعت پیش می رود.",
    time: "بستگی به میزان خوردگی دارد",
  },
  {
    icon: Keyboard,
    title: "چند دکمه کیبورد یا تاچ پد کار نمی کند",
    text: "اگر بعد از آپدیت ویندوز شروع شده، احتمالاً مشکل از درایور است و قطعه ای لازم نیست. اگر بعد از ریختن مایع یا ضربه شروع شده، خود کیبورد باید عوض شود. تا مطمئن نشویم، قطعه عوض نمی کنیم.",
    time: "همان روز، اگر قطعه موجود باشد",
  },
  {
    icon: BatteryWarning,
    title: "شارژ نمی شود یا باتری زود تمام می شود",
    text: "سه مقصر دارد: آداپتور، سوکت شارژ و خود باتری. اگر با تکان دادن سیم شارژ چراغ شارژ قطع و وصل می شود، ایراد از سوکت است و لازم نیست باتری بخرید.",
    time: "همان روز، اگر قطعه موجود باشد",
  },
];

export default function LaptopProblems() {
  const brands =
    NAV.find((n) => n.slug === "/services/laptop-repair/")?.children.filter(
      (c) => c.slug !== "/services/laptop-repair/",
    ) ?? [];

  return (
    <section
      aria-labelledby="laptop-problems-title"
      className="border-b border-line bg-white"
    >
      <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2
          id="laptop-problems-title"
          className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-[30px]"
        >
          لپ تاپ تان چه مشکلی دارد
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-8 text-ink-500">
          این شش مشکل بیشتر از بقیه به کارگاه ما می رسد. کنار هرکدام نوشته ایم معمولاً علتش چیست، خودتان در خانه چه چیزی را می توانید امتحان کنید و تعمیرش چقدر طول می کشد.
        </p>

        <ul className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p) => (
            <li
              key={p.title}
              className="flex flex-col rounded-[20px] border border-line bg-paper p-5"
            >
              <p.icon className="h-6 w-6 text-accent" aria-hidden="true" />
              <h3 className="mt-3 text-[16px] font-extrabold leading-8 text-ink-900">
                {p.title}
              </h3>
              <p className="mt-1.5 flex-1 text-[14px] leading-7 text-ink-700">
                {p.text}
              </p>
              <p className="mt-4 flex items-center gap-1.5 text-[13px] font-bold text-ink-500">
                <Clock3 className="h-4 w-4 text-accent" aria-hidden="true" />
                {p.time}
              </p>
            </li>
          ))}
        </ul>

        <div
          data-cta="problems"
          className="mt-8 flex flex-col gap-5 rounded-[22px] bg-ink-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7"
        >
          <div>
            <p className="text-[18px] font-extrabold">
              مدل لپ تاپ و مشکلش را پشت تلفن بگویید
            </p>
            <p className="mt-1.5 text-[14px] leading-7 text-ink-300">
              همان جا می گوییم ایراد احتمالاً از کجاست و ارزش آوردن دارد یا نه. عیب یابی در شعبه رایگان است و تا هزینه را تایید نکنید، کاری روی دستگاه انجام نمی شود.
            </p>
            <p className="mt-1 text-[13px] text-ink-300">{SITE.hours}</p>
          </div>
          <a
            href={SITE.phoneHref}
            dir="ltr"
            className="flex shrink-0 items-center justify-center gap-2.5 rounded-[14px] bg-accent px-7 py-3.5 text-base font-extrabold text-white transition hover:bg-accent-deep"
          >
            <Phone className="h-[19px] w-[19px]" aria-hidden="true" />
            {SITE.phone}
          </a>
        </div>

        {brands.length > 0 && (
          <nav aria-label="تعمیر لپ تاپ بر اساس برند" className="mt-8">
            <p className="text-sm font-extrabold text-ink-900">
              برای خواندن درباره برند لپ تاپ خودتان
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {brands.map((b) => (
                <li key={b.slug}>
                  <Link
                    href={b.slug}
                    className="block rounded-full border border-line bg-white px-4 py-2 text-[13.5px] font-bold text-ink-700 transition hover:border-accent hover:text-accent"
                  >
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  );
}
