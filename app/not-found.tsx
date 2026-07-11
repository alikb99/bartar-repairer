import type { Metadata } from "next";
import Link from "next/link";
import { Home, Phone, Newspaper } from "lucide-react";
import { SITE } from "@/lib/data";

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="bg-finegrid relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 pt-24 lg:pt-28">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      <div className="relative mx-auto max-w-xl text-center">
        <span className="display text-7xl font-extrabold text-accent/30 sm:text-8xl">
          ۴۰۴
        </span>
        <h1 className="display mt-4 text-2xl font-extrabold text-ink-900 sm:text-3xl">
          این صفحه پیدا نشد
        </h1>
        <p className="mt-4 leading-8 text-ink-500">
          ممکن است آدرس تغییر کرده باشد یا صفحه حذف شده باشد. از مسیرهای زیر
          ادامه دهید یا برای راهنمایی با ما تماس بگیرید.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-accent-deep"
          >
            <Home className="h-4 w-4" />
            صفحه اصلی
          </Link>
          <Link
            href="/blog/"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 text-sm font-bold text-ink-700 transition hover:border-accent/40 hover:text-accent"
          >
            <Newspaper className="h-4 w-4" />
            مقالات
          </Link>
          <a
            href={SITE.phoneHref}
            dir="ltr"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3 text-sm font-bold text-ink-700 transition hover:border-accent/40 hover:text-accent"
          >
            <Phone className="h-4 w-4" />
            {SITE.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
