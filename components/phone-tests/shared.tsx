"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Lock, Phone, RotateCcw, Wrench } from "lucide-react";
import { SITE } from "@/lib/data";

// اجزای مشترک ابزارهای /phone-test/. هیچ داده ای از مرورگر بیرون نمی رود.

export const REPAIR_REQUEST_PATH = "/online-repair-request/";

/** عدد فارسی برای نمایش */
export function fa(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

type Umami = { track?: (name: string, data?: Record<string, string>) => void };

/** رویداد بی نام برای ابزار تحلیل اگر نصب باشد؛ هرگز تست را نمی شکند */
export function track(name: string, data?: Record<string, string>) {
  try {
    (window as unknown as { umami?: Umami }).umami?.track?.(name, data);
  } catch {
    /* بی صدا */
  }
}

// آیفون برای عنصر معمولی Fullscreen API ندارد؛ لایه fixed کافی است و این فقط تلاش اضافه است
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => void };
type FsDocument = Document & { webkitExitFullscreen?: () => void; webkitFullscreenElement?: Element | null };

export function enterFullscreen(el: HTMLElement) {
  const e = el as FsElement;
  try {
    const p = e.requestFullscreen ? e.requestFullscreen() : e.webkitRequestFullscreen?.();
    if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});
  } catch {
    /* پشتیبانی نمی شود */
  }
  document.documentElement.style.overflow = "hidden";
}

export function exitFullscreen() {
  const d = document as FsDocument;
  if (d.fullscreenElement || d.webkitFullscreenElement) {
    try {
      const p = d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.();
      if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});
    } catch {
      /* پشتیبانی نمی شود */
    }
  }
  document.documentElement.style.overflow = "";
}

/** وقتی کاربر با دکمه برگشت یا Esc از تمام صفحه بیرون می آید، تست را ببند */
export function useFullscreenExit(active: boolean, onExit: () => void) {
  const cb = useRef(onExit);
  cb.current = onExit;
  useEffect(() => {
    if (!active) return;
    const onChange = () => {
      const d = document as FsDocument;
      if (!d.fullscreenElement && !d.webkitFullscreenElement) cb.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cb.current();
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);
}

export function ToolCard({
  heading,
  intro,
  privacy,
  children,
}: {
  heading: string;
  intro: string;
  privacy: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby="tool-title"
      className="rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8"
    >
      <h2 id="tool-title" className="text-lg font-extrabold text-ink-900">
        {heading}
      </h2>
      <p className="mt-2 text-[15px] leading-8 text-ink-700">{intro}</p>
      <div className="mt-5">{children}</div>
      <p className="mt-5 flex items-start gap-2 text-[13px] leading-7 text-ink-500">
        <Lock className="mt-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {privacy}
      </p>
    </section>
  );
}

const btnBase =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btnBase} bg-accent text-white hover:bg-accent-deep`;
export const btnGhost = `${btnBase} border border-line bg-white text-ink-900 hover:bg-paper aria-pressed:border-accent aria-pressed:bg-accent-tint aria-pressed:text-accent-deep`;

export type Tone = "ok" | "bad" | "info";

export interface ResultData {
  tone: Tone;
  title: string;
  text?: ReactNode;
  stats?: { value: string; label: string }[];
  serviceHref?: string;
  serviceLabel?: string;
}

export function Result({
  data,
  testKey,
  onRetry,
}: {
  data: ResultData;
  testKey: string;
  onRetry: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    track("phone-test-result", { test: testKey, outcome: data.tone });
  }, [data, testKey]);

  const titleColor =
    data.tone === "ok" ? "text-[rgb(20_120_72)]" : data.tone === "bad" ? "text-accent" : "text-ink-900";

  return (
    <div ref={ref} aria-live="polite" className="mt-5 rounded-2xl border border-line bg-paper p-4 sm:p-5">
      <h3 className={`text-base font-extrabold ${titleColor}`}>{data.title}</h3>
      {data.stats && (
        <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {data.stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-white px-3.5 py-2.5">
              <dd className="text-2xl font-extrabold text-ink-900">{s.value}</dd>
              <dt className="text-[13px] text-ink-500">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}
      {data.text && <p className="mt-3 text-[15px] leading-8 text-ink-700">{data.text}</p>}
      <div className="mt-4 flex flex-wrap gap-2.5">
        {data.tone === "bad" && (
          <a
            href={REPAIR_REQUEST_PATH}
            onClick={() => track("phone-test-repair-click", { test: testKey })}
            className={btnPrimary}
          >
            <Wrench className="h-4 w-4" aria-hidden />
            ثبت درخواست تعمیر
          </a>
        )}
        {data.tone === "bad" && data.serviceHref && (
          <a href={data.serviceHref} className={btnGhost}>
            {data.serviceLabel ?? "هزینه و شرایط تعمیر"}
          </a>
        )}
        {data.tone === "bad" && (
          <a href={SITE.phoneHref} className={btnGhost} dir="ltr">
            <Phone className="h-4 w-4" aria-hidden />
            {SITE.phone}
          </a>
        )}
        <button type="button" onClick={onRetry} className={btnGhost}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          تست دوباره
        </button>
      </div>
    </div>
  );
}

/** سؤال بعد از تست های دیداری و شنیداری که فقط کاربر جوابش را می داند */
export function Ask({
  question,
  options,
}: {
  question: string;
  options: { label: string; onPick: () => void }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);
  return (
    <div ref={ref} className="mt-5 rounded-2xl border border-line bg-paper p-4 sm:p-5">
      <h3 className="text-base font-extrabold text-ink-900">{question}</h3>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {options.map((o, i) => (
          <button key={o.label} type="button" onClick={o.onPick} className={i === 0 ? btnPrimary : btnGhost}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** پیام وسط لایه تمام صفحه که بعد از چند ثانیه محو می شود */
export function StageHint({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <div
      role="status"
      className={`pointer-events-none absolute left-1/2 top-1/2 w-[min(90vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-black/75 px-5 py-4 text-center text-[15px] leading-8 text-white transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

/** نمایش پیام برای مدت کوتاه؛ هر بار key عوض شود دوباره نمایش می دهد */
export function useFlash(key: unknown, ms: number): boolean {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    setShown(true);
    const t = setTimeout(() => setShown(false), ms);
    return () => clearTimeout(t);
  }, [key, ms, setShown]);
  return shown;
}
