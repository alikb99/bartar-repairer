"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Check, BadgeCheck } from "lucide-react";
import { SITE } from "@/lib/data";

const rise = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const GUARANTEES = ["گارانتی کتبی تعمیر", "قطعات اصل و درجه یک", "تحویل همان روز"];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(1100px_520px_at_18%_-10%,rgba(218,37,28,.10),transparent_60%),linear-gradient(180deg,#FFFFFF_0%,#F5F6F8_100%)]">
      {/* pulsing accent orb */}
      <div className="pointer-events-none absolute -left-20 -top-32 h-[420px] w-[420px] animate-btpulse rounded-full bg-[radial-gradient(circle,rgba(218,37,28,.16),transparent_70%)]" />

      <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr]">
        {/* Copy */}
        <div>
          <motion.div custom={0} initial="hidden" animate="show" variants={rise}>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2 shadow-[0_4px_14px_rgba(20,24,31,.05)]">
              <span className="h-2 w-2 rounded-full bg-[#2BB673] shadow-[0_0_0_4px_rgba(43,182,115,.18)]" />
              <span className="text-[13px] font-bold text-ink-700">
                مرکز تخصصی تعمیر موبایل و لپ تاپ در {SITE.city}
              </span>
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="show"
            variants={rise}
            className="mt-6 text-[2rem] font-extrabold leading-[1.25] tracking-tight text-ink-900 sm:text-[42px] lg:text-[52px]"
          >
            تعمیر مطمئن دستگاهت،
            <br />
            با <span className="text-accent">گارانتی واقعی</span> و قطعات اصل
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="show"
            variants={rise}
            className="mt-5 max-w-[520px] text-[17px] leading-9 text-ink-500"
          >
            از تعویض گلس و باتری تا تعمیر مادربرد؛ تمام برندهای موبایل و لپ تاپ را با
            عیب یابی رایگان و تحویل سریع تعمیر می کنیم.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="show"
            variants={rise}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href={SITE.phoneHref}
              className="flex items-center gap-2.5 rounded-[14px] bg-accent px-7 py-4 text-[16px] font-bold text-white shadow-[0_10px_26px_rgba(218,37,28,.30)] transition hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-[0_14px_30px_rgba(218,37,28,.34)]"
            >
              <Phone className="h-[19px] w-[19px]" />
              <span dir="ltr">تماس فوری: {SITE.phone}</span>
            </a>
            <Link
              href="#services"
              className="flex items-center gap-2 rounded-[14px] border-[1.5px] border-hairline bg-white px-6 py-4 text-[16px] font-bold text-ink-900 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
            >
              مشاهده خدمات
            </Link>
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate="show"
            variants={rise}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            {GUARANTEES.map((g) => (
              <div key={g} className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                <Check className="h-5 w-5 text-[#2BB673]" strokeWidth={2.4} />
                {g}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Visual: floating devices */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="show"
          variants={rise}
          className="relative hidden h-[480px] items-center justify-center lg:flex"
        >
          <div className="absolute h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(218,37,28,.14),transparent_68%)]" />

          {/* Laptop */}
          <div className="absolute bottom-16 left-[8%] w-[330px] animate-btfloat">
            <div className="rounded-t-[14px] rounded-b-[4px] bg-[#171A21] p-2.5 pb-3 shadow-[0_30px_60px_rgba(20,24,31,.28)]">
              <div className="flex h-[192px] items-center justify-center overflow-hidden rounded-[7px] bg-[repeating-linear-gradient(135deg,#23272F,#23272F_11px,#262B34_11px,#262B34_22px)]">
                <span className="font-mono text-[11px] text-[#8A92A0]">تعمیر لپ تاپ</span>
              </div>
            </div>
            <div className="-mx-3.5 h-3 rounded-b-[12px] bg-gradient-to-b from-[#2A2F39] to-[#1B1F27] shadow-[0_14px_24px_rgba(20,24,31,.22)]" />
          </div>

          {/* Phone */}
          <div className="absolute right-[14%] top-9 z-[2] w-[184px] animate-btfloat2">
            <div className="rounded-[30px] bg-[#171A21] p-2.5 shadow-[0_34px_70px_rgba(20,24,31,.34)]">
              <div className="relative flex h-[350px] items-center justify-center overflow-hidden rounded-[23px] bg-[repeating-linear-gradient(135deg,#DA251C,#DA251C_12px,#c8211a_12px,#c8211a_24px)]">
                <span className="absolute left-1/2 top-2 h-4 w-[62px] -translate-x-1/2 rounded-b-[12px] bg-[#171A21]" />
                <span className="text-center font-mono text-[11px] text-white/85">
                  تعمیر موبایل
                </span>
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute bottom-9 right-[6%] z-[3] flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_18px_40px_rgba(20,24,31,.16)]">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[rgba(43,182,115,.12)] text-[#2BB673]">
              <BadgeCheck className="h-[22px] w-[22px]" />
            </div>
            <div>
              <div className="text-[18px] font-extrabold leading-none">۴۸٬۰۰۰+</div>
              <div className="mt-1 text-xs text-ink-500">تعمیر موفق</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
