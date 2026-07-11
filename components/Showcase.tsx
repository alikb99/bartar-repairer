"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ScreenShare,
  BatteryCharging,
  CircuitBoard,
  Droplets,
  Smartphone,
} from "lucide-react";

const FEATURES = [
  {
    icon: ScreenShare,
    no: "01",
    title: "تعویض ال سی دی و تاچ",
    desc: "نمایشگر اورجینال با تضمین رنگ و دقت لمس، نصب در محیط استریل.",
  },
  {
    icon: BatteryCharging,
    no: "02",
    title: "تعویض باتری",
    desc: "باتری اصل با ظرفیت واقعی و تست سلامت پیش از تحویل دستگاه.",
  },
  {
    icon: CircuitBoard,
    no: "03",
    title: "ترمیم برد",
    desc: "عیب یابی میکروسکوپی و تعمیر سطح برد توسط تکنسین متخصص.",
  },
  {
    icon: Droplets,
    no: "04",
    title: "رفع آب خوردگی",
    desc: "شست وشوی تخصصی برد و احیای دستگاه پس از تماس با مایعات.",
  },
];

export default function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 0.96]);
  const glow = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    ["0.06", "0.16", "0.06"],
  );

  return (
    <section className="border-y border-line bg-paper">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sticky immersive device */}
          <div className="relative lg:h-auto">
            <div className="sticky top-0 flex h-[60vh] items-center justify-center lg:h-screen">
              <motion.div
                style={{ opacity: glow }}
                className="pointer-events-none absolute h-80 w-80 rounded-full bg-accent blur-[90px]"
              />
              <motion.div
                style={{ rotate, scale }}
                className="bg-dotmatrix relative grid h-[420px] w-[230px] place-items-center rounded-[2.4rem] border border-ink-900/10 bg-white shadow-float"
              >
                <div className="absolute inset-3 rounded-[1.9rem] border border-line" />
                <span className="absolute right-1/2 top-3 h-1.5 w-16 translate-x-1/2 rounded-full bg-ink-900/10" />
                <Smartphone
                  className="h-20 w-20 text-accent"
                  strokeWidth={1.1}
                />
                <span className="absolute bottom-6 text-[11px] font-semibold tracking-wide text-ink-300">
                  برتر · تعمیر دقیق
                </span>
              </motion.div>
            </div>
          </div>

          {/* Scroll-revealed features */}
          <div ref={ref} className="py-16 lg:py-[18vh]">
            <div className="mb-10">
              <span className="section-index">/ نمایش تخصص</span>
              <h2 className="display mt-3 text-3xl font-extrabold text-ink-900 sm:text-4xl">
                هر تعمیر، دقیق و قابل اعتماد
              </h2>
            </div>

            <div className="space-y-5">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.no}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{
                    duration: 0.6,
                    delay: (i % 2) * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="card-hover flex gap-5 rounded-2xl border border-line bg-white p-6"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-tint text-accent">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <span className="section-index">{f.no}</span>
                    <h3 className="mt-1 text-lg font-bold text-ink-900">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-ink-500">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
