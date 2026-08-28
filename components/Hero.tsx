import Link from "next/link";
import { Phone, Check, ArrowLeft, ShieldCheck, Wrench } from "lucide-react";
import { SITE } from "@/lib/data";
import { LIVE_REPAIR_TYPES } from "@/lib/repair-types";
import Icon from "./Icon";

const GUARANTEES = [
  "۶ ماه گارانتی کتبی",
  "قطعات اصل و درجه یک",
  "عیب یابی رایگان",
  "تحویل همان روز",
];

// The eight problems people actually search for. Links point at the existing
// repair-type hubs so the hero adds internal links instead of dead decoration.
// LIVE_ and not REPAIR_TYPES: hubs below the content threshold never build, and
// slicing the raw list linked the homepage to a 404 (/repairs/charging-port-repair/).
const QUICK = LIVE_REPAIR_TYPES.slice(0, 8);

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(1100px_520px_at_18%_-10%,rgba(218,37,28,.10),transparent_60%),linear-gradient(180deg,#FFFFFF_0%,#F5F6F8_100%)]">
      <div className="pointer-events-none absolute -left-20 -top-32 h-[420px] w-[420px] animate-btpulse rounded-full bg-[radial-gradient(circle,rgba(218,37,28,.16),transparent_70%)]" />

      <div className="relative mx-auto max-w-[1280px] px-4 pb-8 pt-6 sm:px-6 lg:pb-12 lg:pt-10">
        {/* ---- Copy + phone card ---- */}
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[12.5px] font-bold text-ink-700">
                مرکز تخصصی تعمیر موبایل و لپ تاپ در {SITE.city}
              </span>
            </span>

            <h1 className="mt-4 text-[1.75rem] font-extrabold leading-[1.3] tracking-tight text-ink-900 sm:text-[38px] lg:text-[44px]">
              تعمیر مطمئن دستگاهت،
              <br />
              با <span className="text-accent">گارانتی واقعی</span> و قطعات اصل
            </h1>

            <p className="mt-3 max-w-[540px] text-[15px] leading-7 text-ink-500">
              از تعویض گلس و باتری تا تعمیر مادربرد؛ تمام برندهای موبایل و لپ تاپ
              را با عیب یابی رایگان تعمیر می کنیم.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
              <a
                href={SITE.phoneHref}
                className="flex w-full items-center justify-center gap-2.5 rounded-[14px] bg-accent px-6 py-3.5 text-[15.5px] font-bold text-white shadow-[0_10px_26px_rgba(218,37,28,.30)] transition duration-normal ease-premium hover:-translate-y-0.5 hover:bg-accent-deep sm:w-auto"
              >
                <Phone className="h-[18px] w-[18px]" />
                <span dir="ltr">{SITE.phone}</span>
              </a>
              <Link
                href="/online-repair-request/"
                className="flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-hairline bg-white px-5 py-3.5 text-[15.5px] font-bold text-ink-900 transition duration-normal ease-premium hover:border-ink-900 hover:bg-ink-900 hover:text-white sm:w-auto"
              >
                <Wrench className="h-[17px] w-[17px]" />
                ثبت درخواست آنلاین
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-2.5 sm:flex sm:flex-wrap sm:gap-x-6">
              {GUARANTEES.map((g) => (
                <div
                  key={g}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-700"
                >
                  <Check
                    className="h-4 w-4 shrink-0 text-accent"
                    strokeWidth={3}
                  />
                  {g}
                </div>
              ))}
            </div>
          </div>

          {/* Device mock — decorative, desktop only. No text baked into the
              screens: the previous version wrote "تعمیر موبایل" onto the mock,
              which read as an unfinished placeholder. */}
          <div
            aria-hidden
            className="relative hidden h-[330px] items-center justify-center lg:flex"
          >
            <div className="absolute h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,rgba(218,37,28,.14),transparent_68%)]" />

            <div className="absolute bottom-6 left-[6%] w-[300px] animate-btfloat">
              {/* lid */}
              <div className="rounded-t-[14px] rounded-b-[4px] bg-gradient-to-b from-ink-850 to-ink-925 p-[7px] pb-2.5 shadow-float">
                <div className="relative h-[172px] overflow-hidden rounded-[8px] bg-[linear-gradient(150deg,#2A2F39_0%,#171A21_65%)]">
                  {/* abstract screen content — suggests a diagnostics panel */}
                  <div className="absolute inset-0 p-3.5">
                    <div className="h-1.5 w-10 rounded-full bg-accent/70" />
                    <div className="mt-3 h-1.5 w-32 rounded-full bg-white/12" />
                    <div className="mt-2 h-1.5 w-24 rounded-full bg-white/8" />
                    <div className="mt-5 flex gap-2">
                      <div className="h-11 flex-1 rounded-md bg-white/[.055]" />
                      <div className="h-11 flex-1 rounded-md bg-white/[.055]" />
                      <div className="h-11 flex-1 rounded-md bg-accent/15" />
                    </div>
                  </div>
                  {/* glass sheen */}
                  <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_36%,rgba(255,255,255,.07)_46%,transparent_56%)]" />
                </div>
              </div>
              {/* base: front edge catches light, notch centred */}
              <div className="-mx-4 h-3.5 rounded-b-[13px] bg-[linear-gradient(180deg,#3A4150_0%,#22262F_55%,#171A21_100%)] shadow-lift">
                <div className="mx-auto h-1 w-14 rounded-b-full bg-ink-950/60" />
              </div>
              {/* ground shadow so it sits in space instead of floating flat */}
              <div className="mx-auto mt-2 h-4 w-[78%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(19,22,28,.22),transparent_70%)] blur-[2px]" />
            </div>

            <div className="absolute right-[12%] top-2 z-[2] w-[166px] animate-btfloat2">
              <div className="relative rounded-[32px] bg-[linear-gradient(150deg,#3A4150_0%,#171A21_38%)] p-[3px] shadow-float">
                {/* side button */}
                <span className="absolute -left-[2px] top-[86px] h-9 w-[3px] rounded-l-sm bg-ink-850" />
                <div className="rounded-[29px] bg-ink-950 p-1.5">
                  <div className="relative h-[318px] overflow-hidden rounded-[24px] bg-[linear-gradient(160deg,#E0473F_0%,#DA251C_45%,#B3170F_100%)]">
                    <span className="absolute left-1/2 top-1.5 z-[2] h-[18px] w-[54px] -translate-x-1/2 rounded-full bg-ink-950" />
                    {/* inner bezel highlight + sheen */}
                    <div className="absolute inset-0 rounded-[24px] ring-1 ring-inset ring-white/15" />
                    <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_38%,rgba(255,255,255,.18)_48%,transparent_58%)]" />
                  </div>
                </div>
              </div>
              <div className="mx-auto mt-3 h-4 w-[70%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(19,22,28,.26),transparent_70%)] blur-[2px]" />
            </div>

            <div className="absolute bottom-2 right-[4%] z-[3] flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-tint text-accent">
                <ShieldCheck className="h-[21px] w-[21px]" />
              </div>
              <div>
                <div className="text-[17px] font-extrabold leading-none text-ink-900">
                  ۹۴٬۰۰۰+
                </div>
                <div className="mt-1 text-xs text-ink-500">تعمیر موفق</div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Quick repair picker: the first screen now answers "what's
             wrong with my device?" instead of ending at a CTA. ---- */}
        <div className="mt-6 lg:mt-10">
          <div className="mb-3.5 flex items-end justify-between gap-4">
            <h2 className="text-[17px] font-extrabold text-ink-900 sm:text-xl">
              مشکل دستگاهت چیست؟
            </h2>
            <Link
              href="/repairs/"
              className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-accent"
            >
              همه خدمات تعمیر
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {QUICK.map((t) => (
              <Link
                key={t.slug}
                href={`/repairs/${t.slug}/`}
                className="group flex min-h-[68px] items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-card transition duration-normal ease-premium hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-tint text-accent transition duration-normal group-hover:bg-accent group-hover:text-white">
                  <Icon name={t.icon} className="h-[21px] w-[21px]" />
                </span>
                <span className="text-[13px] font-bold leading-[1.6] text-ink-900">
                  {t.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
