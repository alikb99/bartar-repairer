"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Phone,
  Clock,
  MapPin,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { SITE } from "@/lib/data";
import type { NavItem } from "@/lib/content";
import Icon from "./Icon";

export default function Header({ nav }: { nav: NavItem[] }) {
  const NAV = nav;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Items that open a mega panel, plain links, and the CTA ("تماس با ما").
  const megaItems = NAV.filter((n) => n.children.length > 0);
  const linkItems = NAV.filter(
    (n) => n.children.length === 0 && n.slug !== "/contact/",
  );
  const ctaItem = NAV.find((n) => n.slug === "/contact/");
  const active = megaItems.find((n) => n.title === openMega);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  return (
    <header
      className="sticky top-0 z-[1000]"
      onMouseLeave={() => setOpenMega(null)}
    >
      {/* ---- Top utility bar (hides on scroll) ---- */}
      <div
        className="overflow-hidden bg-[#171A21] transition-all duration-300"
        style={{
          maxHeight: scrolled ? 0 : 44,
          opacity: scrolled ? 0 : 1,
        }}
      >
        <div className="mx-auto flex h-11 max-w-[1280px] items-center justify-between gap-4 px-6">
          <a
            href={SITE.phoneHref}
            className="flex items-center gap-2 text-[13.5px] font-semibold text-[#EDEFF3]"
          >
            <Phone className="h-4 w-4 text-accent" />
            <span dir="ltr" className="tracking-wide">
              {SITE.phone}
            </span>
          </a>
          <div className="hidden items-center gap-4 sm:flex">
            <span className="flex items-center gap-1.5 text-[12.5px] text-[#A8AEBB]">
              <Clock className="h-[15px] w-[15px] text-accent" />
              همه روزه 9 تا 19
            </span>
            <span className="h-4 w-px bg-[#3A3F4A]" />
            <span className="flex items-center gap-1.5 text-[12.5px] text-[#A8AEBB]">
              <MapPin className="h-[15px] w-[15px] text-accent" />۲ شعبه در تهران
            </span>
          </div>
        </div>
      </div>

      {/* ---- Main nav ---- */}
      <nav
        className={`relative bg-white transition-shadow duration-300 ${
          scrolled
            ? "border-b border-line shadow-[0_6px_24px_rgba(20,24,31,.08)]"
            : "border-b border-[#F1F2F5]"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center" aria-label={SITE.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt={SITE.name}
              width={120}
              height={46}
              className="h-10 w-auto sm:h-[46px]"
            />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden h-full items-center gap-1 lg:flex">
            {NAV.filter((n) => n.slug !== "/contact/").map((item) => (
              <li
                key={item.title}
                className="flex h-full items-center"
                onMouseEnter={() =>
                  setOpenMega(item.children.length ? item.title : null)
                }
              >
                <Link
                  href={item.slug}
                  className={`group flex h-full items-center gap-1.5 px-3.5 text-[15px] font-semibold transition-colors ${
                    openMega === item.title ? "text-accent" : "text-ink-900 hover:text-accent"
                  }`}
                >
                  {item.title}
                  {item.children.length > 0 && (
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-200 ${
                        openMega === item.title ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA + hamburger */}
          <div className="flex shrink-0 items-center gap-3">
            {ctaItem && (
              <Link
                href={ctaItem.slug}
                className="hidden items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[14.5px] font-bold text-white shadow-[0_6px_18px_rgba(218,37,28,.28)] transition hover:-translate-y-px hover:bg-accent-deep hover:shadow-[0_10px_26px_rgba(218,37,28,.35)] lg:flex"
              >
                <Phone className="h-[17px] w-[17px]" />
                {ctaItem.title}
              </Link>
            )}
            <button
              aria-label="منو"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-xl border border-hairline bg-white text-ink-900 lg:hidden"
            >
              {mobileOpen ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" />}
            </button>
          </div>
        </div>

        {/* ---- Mega panel ---- */}
        <AnimatePresence>
          {active && (
            <motion.div
              key={active.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setOpenMega(active.title)}
              className="absolute inset-x-0 top-full z-[60] hidden border-t border-line bg-white shadow-[0_24px_50px_rgba(20,24,31,.14)] lg:block"
            >
              <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_280px] gap-7 px-6 py-7">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-[13px] font-extrabold tracking-wide text-ink-300">
                      {active.title} بر اساس برند
                    </div>
                    <Link
                      href={active.slug}
                      className="flex items-center gap-1 text-[13px] font-bold text-accent"
                    >
                      مشاهده همه
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
                    {active.children.map((c) => (
                      <Link
                        key={c.slug}
                        href={c.slug}
                        className="group flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3 py-2.5 transition hover:-translate-y-0.5 hover:border-accent hover:bg-white hover:shadow-[0_8px_22px_rgba(218,37,28,.12)]"
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-ink-300 transition group-hover:bg-accent" />
                        <span className="text-[13.5px] font-semibold text-ink-900">
                          {c.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
                {/* Promo card */}
                <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#22262F] to-[#171A21] p-5 text-white">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-white">
                      <Icon name={active.icon} className="h-5 w-5" />
                    </span>
                    <div className="text-[16px] font-extrabold">تشخیص رایگان عیب</div>
                  </div>
                  <p className="mt-3 text-[13px] leading-7 text-[#B8BEC9]">
                    دستگاه خود را بیاورید؛ کارشناسان ما بدون هزینه عیب یابی می کنند و قیمت را پیش از تعمیر اعلام می کنند.
                  </p>
                  <a
                    href={SITE.phoneHref}
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[14px] font-bold text-white transition hover:bg-accent-deep"
                  >
                    <Phone className="h-4 w-4" />
                    رزرو نوبت تلفنی
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ---- Mobile drawer ---- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[1100] bg-ink-950/50 backdrop-blur-[2px] lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-y-0 right-0 z-[1101] flex w-[340px] max-w-[88vw] flex-col bg-white shadow-[-20px_0_50px_rgba(15,18,23,.2)] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt={SITE.name} width={100} height={38} className="h-9 w-auto" />
                <button
                  aria-label="بستن"
                  onClick={() => setMobileOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-hairline text-ink-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {NAV.filter((n) => n.children.length === 0 && n.slug !== "/contact/").map(
                  (item) => (
                    <Link
                      key={item.slug}
                      href={item.slug}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15.5px] font-bold text-ink-900 transition hover:bg-paper hover:text-accent"
                    >
                      <Icon name={item.icon} className="h-5 w-5 text-accent" />
                      {item.title}
                    </Link>
                  ),
                )}

                {megaItems.map((item) => (
                  <div key={item.title} className="mt-1">
                    <button
                      onClick={() =>
                        setOpenAccordion((v) => (v === item.title ? null : item.title))
                      }
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-[15.5px] font-bold text-ink-900 transition hover:bg-paper"
                    >
                      <span className="flex items-center gap-3">
                        <Icon name={item.icon} className="h-5 w-5 text-accent" />
                        {item.title}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-ink-300 transition-transform ${
                          openAccordion === item.title ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {openAccordion === item.title && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                            {item.children.map((c) => (
                              <Link
                                key={c.slug}
                                href={c.slug}
                                onClick={() => setMobileOpen(false)}
                                className="rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-ink-700 transition hover:bg-paper hover:text-accent"
                              >
                                {c.title}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {ctaItem && (
                  <Link
                    href={ctaItem.slug}
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15.5px] font-bold text-ink-900 transition hover:bg-paper hover:text-accent"
                  >
                    <Icon name={ctaItem.icon} className="h-5 w-5 text-accent" />
                    {ctaItem.title}
                  </Link>
                )}

                <a
                  href={SITE.phoneHref}
                  className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-[15px] font-bold text-white"
                >
                  <Phone className="h-[18px] w-[18px]" />
                  <span dir="ltr">{SITE.phone}</span>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
