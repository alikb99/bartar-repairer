import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  Cpu,
  ClipboardCheck,
  Star,
  Phone,
} from "lucide-react";
import { STATS, STEPS, SITE } from "@/lib/data";
import { NAV, recentPosts } from "@/lib/content";
import Icon from "./Icon";
import Reveal from "./Reveal";
import PostCard from "./PostCard";

// Mega nav groups drive the service cards + brand grids so everything stays in
// sync with the database-built navigation and links to the EXACT page URLs.
const MEGA = NAV.filter((n) => n.children.length > 0);
const mobileGroup = MEGA.find((n) => n.title.includes("موبایل"));
const laptopGroup = MEGA.find((n) => n.title.includes("لپ"));

function SectionHead({
  eyebrow,
  title,
  desc,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "center" | "start";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className="mb-3 text-sm font-extrabold tracking-wide text-accent">{eyebrow}</div>
      <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-[2.4rem]">
        {title}
      </h2>
      {desc && <p className="mt-4 text-base leading-8 text-ink-500">{desc}</p>}
    </div>
  );
}

/* ---------------- Stats (dark band) ---------------- */
export function Stats() {
  return (
    <section className="bg-ink-950">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-6 px-6 py-10 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div
              className={`text-center text-white ${
                i % 2 === 1 ? "border-r border-[#232831]" : ""
              } lg:[&:not(:first-child)]:border-r lg:[&:not(:first-child)]:border-[#232831]`}
            >
              <div className="text-[38px] font-extrabold">{s.value}</div>
              <div className="mt-1.5 text-sm text-ink-300">{s.label}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Services (3 big cards) ---------------- */
export function Services() {
  return (
    <section id="services" className="mx-auto max-w-[1280px] px-4 pb-6 pt-20 sm:px-6 lg:pt-24">
      <Reveal>
        <SectionHead
          eyebrow="خدمات ما"
          title="هرچه دستگاهت نیاز دارد، اینجاست"
          desc="سه شاخه اصلی خدمات، با تیم تخصصی جداگانه برای هر حوزه."
        />
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {MEGA.map((group, i) => {
          const brands = group.children
            .slice(1)
            .map((c) => c.title.replace(/^تعمیر (گوشی|لپ تاپ) |^نمایندگی /, "").trim());
          return (
            <Reveal key={group.title} delay={(i % 3) * 0.1}>
              <Link
                href={group.slug}
                className="group block h-full rounded-[22px] border border-line bg-white p-7 shadow-card transition duration-300 ease-premium hover:-translate-y-1.5 hover:border-white hover:shadow-soft"
              >
                <div className="mb-5 grid h-[62px] w-[62px] place-items-center rounded-2xl bg-accent-tint text-accent">
                  <Icon name={group.icon} className="h-[30px] w-[30px]" />
                </div>
                <h3 className="text-xl font-extrabold text-ink-900">{group.title}</h3>
                <p className="mt-2.5 text-[14.5px] leading-8 text-ink-500">
                  {group.blurb}
                </p>
                <div className="mb-5 mt-4 flex flex-wrap gap-1.5">
                  {brands.slice(0, 3).map((b) => (
                    <span
                      key={b}
                      className="rounded-lg bg-paper px-2.5 py-1 text-xs font-semibold text-ink-500"
                    >
                      {b}
                    </span>
                  ))}
                  {brands.length > 3 && (
                    <span className="rounded-lg bg-paper px-2.5 py-1 text-xs font-semibold text-ink-500">
                      +{brands.length - 3} برند
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-2 text-[14.5px] font-bold text-accent">
                  مشاهده خدمات
                  <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-accent-tint text-accent transition duration-300 group-hover:bg-accent group-hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Brand grids ---------------- */
function BrandGrid({ label, items }: { label: string; items: { title: string; slug: string }[] }) {
  return (
    <>
      <Reveal>
        <div className="mb-3.5 text-sm font-extrabold text-ink-300">{label}</div>
      </Reveal>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((b, i) => {
          const name = b.title.replace(/^تعمیر (گوشی|لپ تاپ) |^نمایندگی /, "").trim();
          return (
            <Reveal key={b.slug} delay={(i % 5) * 0.04}>
              <Link
                href={b.slug}
                className="flex h-[72px] items-center justify-center gap-2.5 rounded-[14px] border border-line bg-white transition hover:-translate-y-1 hover:border-accent hover:shadow-[0_14px_30px_rgba(218,37,28,.10)]"
              >
                <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] bg-[#F1F2F5] text-sm font-extrabold text-ink-300">
                  {name.slice(0, 1)}
                </span>
                <span className="text-[14.5px] font-bold text-ink-900">{name}</span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}

export function Brands() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
      <Reveal>
        <SectionHead eyebrow="برندهای تحت پوشش" title="تعمیر تخصصی همه برندها" />
      </Reveal>
      <div className="mt-10 space-y-9">
        {mobileGroup && (
          <BrandGrid label="موبایل" items={mobileGroup.children.slice(1, 11)} />
        )}
        {laptopGroup && (
          <BrandGrid label="لپ تاپ" items={laptopGroup.children.slice(1, 11)} />
        )}
      </div>
    </section>
  );
}

/* ---------------- Why us ---------------- */
const WHY = [
  { icon: ShieldCheck, title: "گارانتی کتبی", desc: "روی هر تعمیر برگه گارانتی معتبر دریافت می کنید." },
  { icon: Clock, title: "تحویل سریع", desc: "بیشتر تعمیرات در همان روز مراجعه انجام می شود." },
  { icon: Cpu, title: "قطعات اصل", desc: "فقط از قطعات اصل و درجه یک با اصالت مشخص استفاده می کنیم." },
  { icon: ClipboardCheck, title: "عیب یابی رایگان", desc: "قبل از هر هزینه ای، دستگاه رایگان بررسی و قیمت اعلام می شود." },
];

export function WhyUs() {
  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
        <Reveal>
          <SectionHead eyebrow="چرا برتر؟" title="تعمیری که خیالت را راحت می کند" />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={(i % 4) * 0.08}>
              <div className="h-full rounded-2xl bg-paper p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-soft">
                <span className="grid h-[54px] w-[54px] place-items-center rounded-[14px] bg-accent-tint text-accent">
                  <w.icon className="h-[26px] w-[26px]" />
                </span>
                <h3 className="mt-4 text-[17px] font-extrabold text-ink-900">{w.title}</h3>
                <p className="mt-2 text-[13.5px] leading-7 text-ink-500">{w.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Steps ---------------- */
export function Steps() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
      <Reveal>
        <SectionHead eyebrow="مراحل کار" title="از تماس تا تحویل، در ۴ قدم" />
      </Reveal>
      <div className="mt-12 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.09}>
            <div className="text-center">
              <div
                className={`mx-auto mb-4 grid h-[74px] w-[74px] place-items-center rounded-[20px] text-[26px] font-extrabold text-white ${
                  i === STEPS.length - 1 ? "bg-accent" : "bg-ink-950"
                }`}
              >
                {["۱", "۲", "۳", "۴"][i] ?? i + 1}
              </div>
              <h3 className="text-[17px] font-extrabold text-ink-900">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-[230px] text-[13.5px] leading-7 text-ink-500">
                {s.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
const REVIEWS = [
  {
    text: "گوشی سامسونگم آب خورده بود و همه گفته بودن غیرقابل تعمیره. تو برتر همان روز درستش کردن. واقعاً حرفه ای بودن.",
    initial: "م",
    name: "مهدی رضایی",
    meta: "تعمیر برد سامسونگ",
  },
  {
    text: "صفحه لپ تاپ ایسوسم رو تعویض کردن، قیمت منصفانه و کارشون تمیز بود. برگه گارانتی هم دادن.",
    initial: "س",
    name: "سارا کریمی",
    meta: "تعویض ال سی دی لپ تاپ",
  },
  {
    text: "برای تعمیر آیفونم رفتم، برخورد و راهنماییشون عالی بود و دقیقاً همان چیزی که گفتن انجام شد.",
    initial: "ع",
    name: "علی محمدی",
    meta: "تعویض باتری آیفون",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-line bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
        <Reveal>
          <SectionHead eyebrow="نظر مشتریان" title="اعتماد بیش از ۴۸ هزار مشتری" />
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <Reveal key={r.name} delay={(i % 3) * 0.08}>
              <div className="h-full rounded-[20px] border border-line bg-paper p-7">
                <div className="mb-4 flex gap-0.5 text-[#F5A623]">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-[18px] w-[18px] fill-current" />
                  ))}
                </div>
                <p className="text-[15px] leading-8 text-ink-800">{r.text}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#E4E7EC] text-base font-extrabold text-ink-500">
                    {r.initial}
                  </div>
                  <div>
                    <div className="text-[14.5px] font-extrabold text-ink-900">{r.name}</div>
                    <div className="mt-0.5 text-[12.5px] text-ink-500">{r.meta}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Articles ---------------- */
export function Articles() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:py-24">
      <Reveal>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHead
            eyebrow="مقالات آموزشی"
            title="راهنمای نگهداری دستگاه ها"
            align="start"
          />
          <Link
            href="/blog"
            className="flex items-center gap-2 rounded-xl border-[1.5px] border-hairline bg-white px-5 py-3 text-[15px] font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
          >
            آرشیو مقالات
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recentPosts(6, true).map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.07}>
            <PostCard post={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
export function CTA() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-accent to-accent-deep px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-10 -top-20 h-[300px] w-[300px] rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-[320px] w-[320px] rounded-full bg-black/[.08]" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-[38px]">
              دستگاهت را به دست متخصص بسپار
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[17px] leading-8 text-white/90">
              همین حالا تماس بگیر یا به یکی از دو شعبه ما در {SITE.city} مراجعه کن.
              عیب یابی کاملاً رایگان است.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={SITE.phoneHref}
                className="flex items-center gap-2.5 rounded-[14px] bg-white px-7 py-4 text-base font-extrabold text-accent shadow-[0_12px_30px_rgba(0,0,0,.18)]"
              >
                <Phone className="h-[19px] w-[19px]" />
                <span dir="ltr">{SITE.phone}</span>
              </a>
              <Link
                href="/contact/"
                className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-white/35 bg-white/15 px-6 py-4 text-base font-bold text-white transition hover:bg-white/25"
              >
                آدرس شعب و مسیریابی
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
