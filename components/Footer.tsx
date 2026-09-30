import Link from "next/link";
import {
  Phone,
  MapPin,
  Instagram,
  Youtube,
  Video,
  MessageCircle,
  Download,
  TrainFront,
  Navigation,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";
import { BRANCHES, SITE, directionsUrl } from "@/lib/data";
import type { NavItem } from "@/lib/content";
import { LIVE_SERVICE_AREAS } from "@/lib/service-areas";

// Site-wide exact-match anchors to the money pages (brand hubs and
// brand+device hubs). Every page links these, funneling internal authority to
// the keywords each hub targets — the same pattern the top-ranking competitors
// use in their footers.
const KEYWORD_LINKS: { title: string; items: [string, string][] }[] = [
  {
    title: "نمایندگی تعمیرات",
    items: [
      ["نمایندگی تعمیرات سامسونگ", "/samsung/"],
      ["نمایندگی تعمیرات اپل", "/apple/"],
      ["نمایندگی تعمیرات شیائومی", "/xiaomi/"],
      ["نمایندگی تعمیرات ایسوس", "/asus/"],
      ["نمایندگی تعمیرات هواوی", "/huawei/"],
      ["نمایندگی تعمیرات لنوو", "/lenovo/"],
      ["نمایندگی تعمیرات اچ پی", "/hp/"],
      ["نمایندگی تعمیرات سونی", "/sony/"],
      ["نمایندگی تعمیرات دل", "/dell/"],
      ["نمایندگی تعمیرات نوکیا", "/nokia/"],
    ],
  },
  {
    title: "تعمیر گوشی",
    items: [
      ["تعمیر گوشی سامسونگ", "/samsung/mobile/"],
      ["تعمیر گوشی آیفون", "/apple/mobile-2/"],
      ["تعمیر گوشی شیائومی", "/xiaomi/mobile/"],
      ["تعمیر گوشی هواوی", "/huawei/mobile/"],
      ["تعمیر گوشی ایسوس", "/asus/mobile/"],
      ["تعمیر گوشی اچ تی سی", "/htc/mobile/"],
      ["تعمیر گوشی گوگل پیکسل", "/google-pixel-mobile-phone-repair/"],
      ["تعمیر گوشی موتورولا", "/motorola-mobile-repair-center/"],
      ["تعمیر گوشی ناتینگ فون", "/nothingphone-repair/"],
      ["تعمیر گوشی نوکیا", "/nokia/"],
    ],
  },
  {
    title: "تعمیر لپ تاپ",
    items: [
      ["تعمیر لپ تاپ ایسوس", "/asus/lap-top-2/"],
      ["تعمیر لپ تاپ لنوو", "/lenovo/lap-top/"],
      ["تعمیر لپ تاپ اچ پی", "/hp/lap-top/"],
      ["تعمیر لپ تاپ دل", "/dell/lap-top/"],
      ["تعمیر لپ تاپ ایسر", "/lap-top-acer/"],
      ["تعمیر لپ تاپ سونی", "/sony/lap-top/"],
      ["تعمیر لپ تاپ سامسونگ", "/samsung/lap-top/"],
      ["تعمیر لپ تاپ شیائومی", "/xiaomi/lap-top/"],
      ["تعمیر مک بوک", "/apple/macbook/"],
      ["تعمیرات لپ تاپ", "/services/laptop-repair/"],
    ],
  },
];

/** "الف، ب، ج" → "الف، ب و ج" — reads as a sentence, not as a data field. */
function metroPhrase(metro: string): string {
  const stops = metro.split("، ").filter(Boolean);
  if (stops.length < 2) return metro;
  return `${stops.slice(0, -1).join("، ")} و ${stops[stops.length - 1]}`;
}

export default function Footer({ nav }: { nav: NavItem[] }) {
  const NAV = nav;
  const central = BRANCHES[0];
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
            src="/logo.webp"
            alt={SITE.name}
            width={120}
            height={46}
            className="h-11 w-auto rounded-xl bg-white px-3 py-2"
          />
          <p className="mt-5 max-w-[330px] text-sm leading-8 text-ink-300">
            مرکز تخصصی تعمیر موبایل و لپ تاپ و نمایندگی برندهای معتبر. با بیش از
            ۱۵ سال تجربه، خدمات تعمیراتی مطمئن همراه با گارانتی ارائه می دهیم.
          </p>
          {/* The full profile set — same accounts as schema sameAs in
              app/layout.tsx. No nofollow: these are the site's own accounts,
              and the link is the corroboration. */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {[
              { Icon: Instagram, label: "اینستاگرام", href: SITE.socials.instagram },
              { Icon: MessageCircle, label: "واتساپ", href: SITE.socials.whatsapp },
              { Icon: Youtube, label: "یوتیوب", href: SITE.socials.youtube },
              { Icon: Video, label: "آپارات", href: SITE.socials.aparat },
              { Icon: Linkedin, label: "لینکدین", href: SITE.socials.linkedin },
              { Icon: Twitter, label: "ایکس (توییتر)", href: SITE.socials.twitter },
              { Icon: Globe, label: "پینترست", href: SITE.socials.pinterest },
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="grid h-[42px] w-[42px] place-items-center rounded-xl border border-[#2A2F39] text-[#C2C8D2] transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white"
              >
                <Icon className="h-[19px] w-[19px]" />
              </a>
            ))}
          </div>
          <a
            href="/app/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#2A2F39] px-4 py-2.5 text-[13.5px] font-bold text-[#E7EAEF] transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white"
          >
            <Download className="h-[17px] w-[17px]" />
            دانلود اپلیکیشن اندروید
          </a>
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
                {central.metro && (
                  <div className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-6 text-ink-300">
                    <TrainFront className="mt-0.5 h-[15px] w-[15px] shrink-0 text-ink-300" />
                    <span>نزدیک مترو {metroPhrase(central.metro)}</span>
                  </div>
                )}
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
          {/* Google's own embed, not Balad, because this one has to render for
              crawlers and for visitors who arrive from Google Maps. Lazy: it is
              below the fold on every page of the site. */}
          <div className="mt-6">
            <div className="mb-3 text-[13.5px] font-bold text-[#E7EAEF]">
              موقعیت شعبه مرکزی روی نقشه
            </div>
            <div className="overflow-hidden rounded-xl border border-[#2A2F39]">
              <iframe
                title={`موقعیت شعبه مرکزی ${SITE.brandName} روی نقشه`}
                src={`https://maps.google.com/maps?q=${central.geo.lat},${central.geo.lng}&z=16&hl=fa&output=embed`}
                width="100%"
                height="190"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-[190px] w-full grayscale-[.2]"
                style={{ border: 0 }}
              />
            </div>
            <a
              href={directionsUrl(central)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-[#2A2F39] px-3 py-1.5 text-[12.5px] font-bold text-[#E7EAEF] transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-white"
            >
              <Navigation className="h-[14px] w-[14px]" />
              مسیریابی روی نقشه
            </a>
          </div>
          {/* Local landing pages — sitewide inbound links so neighbourhood
              pages are never more than two clicks from any page. */}
          <div className="mt-6">
            <div className="mb-3 text-[13.5px] font-bold text-[#E7EAEF]">
              مناطق تحت پوشش
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {LIVE_SERVICE_AREAS.map((a) => (
                <Link
                  key={a.slug}
                  href={`/areas/${a.slug}/`}
                  className="text-[12.5px] text-ink-300 transition hover:text-white"
                >
                  {a.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keyword links band: exact-match anchors to the commercial hubs */}
      <div className="border-t border-[#20242D]">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-10 sm:grid-cols-3">
          {KEYWORD_LINKS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <div className="mb-4 text-[14px] font-extrabold text-[#E7EAEF]">
                {col.title}
              </div>
              <ul className="flex flex-col gap-2.5">
                {col.items.map(([label, href]) => (
                  <li key={href + label}>
                    <Link
                      href={href}
                      className="text-[13px] text-ink-300 transition hover:pr-1 hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#20242D]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div className="text-[13px] text-[#7B828E]">
            © تمامی حقوق برای {SITE.shortName} محفوظ است — ۱۴۰۴
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#7B828E]">
            {/* Plain <a>, not <Link>: /app/ and /prices/ are frozen HTML in
                public/ with no Next runtime, so a client-side navigation would
                render nothing. See docs/frozen-pages.md. */}
            <a href="/app/" className="transition hover:text-white">
              دانلود اپلیکیشن
            </a>
            <a href="/prices/" className="transition hover:text-white">
              قیمت تعمیر
            </a>
            <Link href="/team/" className="transition hover:text-white">
              تیم فنی
            </Link>
            <Link href="/directory/" className="transition hover:text-white">
              فهرست کامل صفحات
            </Link>
            <Link href="/group/" className="transition hover:text-white">
              سایت های مجموعه
            </Link>
            <Link href="/privacy-policy/" className="transition hover:text-white">
              حریم خصوصی
            </Link>
            <Link href="/terms-and-conditions/" className="transition hover:text-white">
              قوانین و مقررات
            </Link>
            <span>bartar-repairer.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
