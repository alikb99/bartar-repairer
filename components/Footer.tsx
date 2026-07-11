import Link from "next/link";
import { Phone, MapPin, Instagram, Send, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/data";
import type { NavItem } from "@/lib/content";

export default function Footer({ nav }: { nav: NavItem[] }) {
  const NAV = nav;
  const services = NAV.filter((item) => item.children.length > 0);
  const quickLinks = NAV.filter((item) => item.children.length === 0);

  return (
    <footer className="bg-ink-950 text-white">
      {/* CTA strip */}
      <div className="border-b border-[#20242D]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-9">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">
              دستگاهت خراب شده؟ همین حالا تماس بگیر
            </div>
            <div className="mt-2 text-[14.5px] text-ink-300">
              عیب یابی رایگان، گارانتی تعمیر و قطعات اصل در دو شعبه تهران.
            </div>
          </div>
          <a
            href={SITE.phoneHref}
            className="flex items-center gap-2.5 rounded-xl bg-accent px-6 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-accent-deep"
          >
            <Phone className="h-[18px] w-[18px]" />
            <span dir="ltr">{SITE.phone}</span>
          </a>
        </div>
      </div>

      {/* Columns */}
      <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.4fr]">
        {/* Brand */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt={SITE.name}
            width={120}
            height={46}
            className="h-11 w-auto rounded-xl bg-white px-3 py-2"
          />
          <p className="mt-5 max-w-[330px] text-sm leading-8 text-ink-300">
            مرکز تخصصی تعمیر موبایل و لپ تاپ و نمایندگی برندهای معتبر. با بیش از یک
            دهه تجربه، خدمات تعمیراتی مطمئن همراه با گارانتی ارائه می دهیم.
          </p>
          <div className="mt-5 flex items-center gap-2.5">
            {[
              { Icon: Instagram, label: "اینستاگرام" },
              { Icon: MessageCircle, label: "واتساپ" },
              { Icon: Send, label: "تلگرام" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-[42px] w-[42px] place-items-center rounded-xl border border-[#2A2F39] text-[#C2C8D2] transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white"
              >
                <Icon className="h-[19px] w-[19px]" />
              </a>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <div className="mb-[18px] text-[15px] font-extrabold">خدمات</div>
          <ul className="flex flex-col gap-3">
            {services.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.slug}
                  className="text-sm text-ink-300 transition hover:pr-1.5 hover:text-white"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div>
          <div className="mb-[18px] text-[15px] font-extrabold">دسترسی سریع</div>
          <ul className="flex flex-col gap-3">
            {quickLinks.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.slug}
                  className="text-sm text-ink-300 transition hover:pr-1.5 hover:text-white"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Branches */}
        <div>
          <div className="mb-[18px] text-[15px] font-extrabold">شعب ما</div>
          <div className="flex flex-col gap-[18px]">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-[19px] w-[19px] shrink-0 text-accent" />
              <div>
                <div className="mb-1 text-[13.5px] font-bold text-[#E7EAEF]">
                  شعبه مرکزی
                </div>
                <div className="text-[13px] leading-7 text-ink-300">
                  {SITE.address}
                </div>
                <a
                  href={SITE.phoneHref}
                  dir="ltr"
                  className="mt-1 inline-block text-[13px] text-ink-300 transition hover:text-white"
                >
                  {SITE.phone}
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-[19px] w-[19px] shrink-0 text-accent" />
              <div>
                <div className="mb-1 text-[13.5px] font-bold text-[#E7EAEF]">
                  شعبه غرب
                </div>
                <div className="text-[13px] leading-7 text-ink-300">
                  {SITE.addressWest}
                </div>
                <a
                  href={SITE.phoneWestHref}
                  dir="ltr"
                  className="mt-1 inline-block text-[13px] text-ink-300 transition hover:text-white"
                >
                  {SITE.phoneWest}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#20242D]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div className="text-[13px] text-[#7B828E]">
            © تمامی حقوق برای {SITE.shortName} محفوظ است — ۱۴۰۴
          </div>
          <div className="text-[13px] text-[#7B828E]">bartar-repairer.com</div>
        </div>
      </div>
    </footer>
  );
}
