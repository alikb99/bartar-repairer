"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  ChevronLeft,
  RotateCcw,
  TriangleAlert,
  Wrench,
  ArrowLeft,
  CircleCheck,
} from "lucide-react";
import Icon from "@/components/Icon";
import { SITE } from "@/lib/data";
import {
  TS_DEVICES,
  type TsDevice,
  type TsBrand,
  type TsIssue,
} from "@/lib/troubleshoot";

const STEPS = ["دستگاه", "برند", "ایراد", "راهنما"];

export default function TroubleshootWizard() {
  const [device, setDevice] = useState<TsDevice | null>(null);
  const [brand, setBrand] = useState<TsBrand | null>(null);
  const [issue, setIssue] = useState<TsIssue | null>(null);

  const stepIndex = issue ? 3 : brand ? 2 : device ? 1 : 0;

  const reset = () => {
    setDevice(null);
    setBrand(null);
    setIssue(null);
  };
  const back = () => {
    if (issue) setIssue(null);
    else if (brand) setBrand(null);
    else if (device) setDevice(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Stepper */}
      <ol className="flex items-center justify-center gap-2 sm:gap-3" aria-label="مراحل عیب یابی">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <span
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition sm:text-sm ${
                i === stepIndex
                  ? "border-accent bg-accent text-white shadow-[0_8px_18px_-8px_rgba(218,37,28,.6)]"
                  : i < stepIndex
                    ? "border-accent/30 bg-accent-tint text-accent"
                    : "border-line bg-white text-ink-500"
              }`}
            >
              {i < stepIndex ? (
                <CircleCheck className="h-3.5 w-3.5" />
              ) : (
                <span>{(i + 1).toLocaleString("fa-IR")}</span>
              )}
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <ChevronLeft className="h-4 w-4 text-ink-300" />
            )}
          </li>
        ))}
      </ol>

      {/* Back / restart controls */}
      {device && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-accent/40 hover:text-accent"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
            مرحله قبل
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-500 transition hover:text-accent"
          >
            <RotateCcw className="h-4 w-4" />
            شروع دوباره
          </button>
        </div>
      )}

      {/* Step 1: device */}
      {!device && (
        <section className="mt-8" aria-label="انتخاب دستگاه">
          <h2 className="text-center text-lg font-extrabold text-ink-900">
            دستگاه شما چیست؟
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            {TS_DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d)}
                className="card-hover group flex flex-col items-center gap-3 rounded-2xl border border-line bg-white px-4 py-7 text-center transition hover:border-accent/40"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-tint text-accent transition group-hover:bg-accent group-hover:text-white">
                  <Icon name={d.icon} className="h-7 w-7" />
                </span>
                <span className="text-sm font-extrabold text-ink-900 sm:text-base">
                  {d.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2: brand */}
      {device && !brand && (
        <section className="mt-8" aria-label="انتخاب برند">
          <h2 className="text-center text-lg font-extrabold text-ink-900">
            برند {device.label} شما کدام است؟
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {device.brands.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBrand(b)}
                className="rounded-full border border-line bg-white px-6 py-3 text-sm font-bold text-ink-800 transition hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent hover:shadow-card"
              >
                {b.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: issue */}
      {device && brand && !issue && (
        <section className="mt-8" aria-label="انتخاب ایراد">
          <h2 className="text-center text-lg font-extrabold text-ink-900">
            {device.label} {brand.id !== "other" ? brand.label : ""} شما چه مشکلی دارد؟
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {device.issues.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setIssue(it)}
                className="card-hover group flex items-start gap-3 rounded-2xl border border-line bg-white p-5 text-right transition hover:border-accent/40"
              >
                <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-tint text-accent">
                  <Wrench className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-ink-900 transition group-hover:text-accent sm:text-base">
                    {it.label}
                  </span>
                  <span className="mt-1 block text-[13px] leading-6 text-ink-500">
                    {it.symptoms}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 4: guide */}
      {device && brand && issue && (
        <Guide device={device} brand={brand} issue={issue} />
      )}
    </div>
  );
}

function Guide({
  device,
  brand,
  issue,
}: {
  device: TsDevice;
  brand: TsBrand;
  issue: TsIssue;
}) {
  const brandName = brand.id === "other" ? "" : ` ${brand.label}`;
  return (
    <section className="mt-8" aria-label="راهنمای رفع مشکل">
      <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
        <p className="text-xs font-bold text-accent">راهنمای گام به گام</p>
        <h2 className="mt-2 text-xl font-extrabold leading-9 text-ink-900 sm:text-2xl">
          {issue.label} — {device.label}
          {brandName}
        </h2>
        <p className="mt-2 text-sm leading-7 text-ink-500">{issue.symptoms}</p>

        <ol className="mt-7 space-y-4">
          {issue.steps.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-4 rounded-2xl border border-line bg-paper p-4 sm:p-5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-sm font-extrabold text-white">
                {(i + 1).toLocaleString("fa-IR")}
              </span>
              <div>
                <h3 className="text-[15px] font-extrabold text-ink-900">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-8 text-ink-700">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* When to stop DIY */}
        <div className="mt-6 flex gap-3.5 rounded-2xl border border-accent/25 bg-accent/[.05] p-4 sm:p-5">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h3 className="text-[15px] font-extrabold text-ink-900">
              چه زمانی تعمیر خانگی را متوقف کنید
            </h3>
            <p className="mt-1.5 text-sm leading-8 text-ink-700">
              {issue.stopNow}
            </p>
          </div>
        </div>
      </div>

      {/* CTA: hand off to the matching repair hub */}
      <div className="mt-6 grid items-center gap-6 rounded-3xl bg-gradient-to-br from-[#22262F] to-ink-950 p-7 sm:p-9 lg:grid-cols-[1.4fr_1fr]">
        <div className="text-white">
          <h3 className="text-lg font-extrabold sm:text-xl">
            مشکل حل نشد؟ کارشناسان برتر سرویس آماده اند
          </h3>
          <p className="mt-2 text-sm leading-8 text-ink-300">
            عیب یابی حضوری رایگان است و هزینه تعمیر قبل از شروع کار اعلام می
            شود. برای اطلاعات بیشتر صفحه {brand.repairLabel} را ببینید یا همین
            حالا تماس بگیرید.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={SITE.phoneHref}
              dir="ltr"
              className="inline-flex items-center gap-2 rounded-[13px] bg-accent px-6 py-3 text-[15px] font-bold text-white transition hover:bg-accent-deep"
            >
              <Phone className="h-4 w-4" />
              {SITE.phone}
            </a>
            <Link
              href={brand.repairPath}
              className="inline-flex items-center gap-2 rounded-[13px] border border-white/25 px-6 py-3 text-[15px] font-bold text-white transition hover:bg-white/10"
            >
              {brand.repairLabel}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <ul className="space-y-2.5 text-sm text-ink-300">
          {[
            "عیب یابی رایگان قبل از تعمیر",
            "۶ ماه گارانتی تعمیرات",
            "پیک رایگان دریافت و تحویل دستگاه",
          ].map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <CircleCheck className="h-4 w-4 shrink-0 text-accent" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
