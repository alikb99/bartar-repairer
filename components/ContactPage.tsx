import Link from "next/link";
import ServiceCentersSlot from "@/components/ServiceCentersSlot";
import {
  Navigation,
  Construction,
  TrainFront,
  Phone,
  MessageCircle,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Twitter,
  Globe,
  MapPin,
  ChevronLeft,
  Clock,
  Package,
} from "lucide-react";
import {
  BRANCHES as SHOP_BRANCHES,
  SITE,
  directionsUrl,
} from "@/lib/data";
import { type Post } from "@/lib/content";

// Content (verbatim from the database) for the contact page.
const INTRO =
  "نمایندگی تعمیرات برتر با بیش از 15 سال سابقه تعمیرات موبایل، لپ تاپ، تبلت و لوازم خانگی آماده خدمت رسانی به شما عزیزان میباشد. شما میتوانید به صورت حضوری به یکی از شعب ما مراجعه کنید و یا اگر امکان مراجعه حضوری ندارید تنها کافی است با شماره نمایندگی برتر تماس بگیرید تا از خدمات تعمیر در محل و پیک رایگان تعمیرات بهرمند شوید. در صورتی که شما عزیزان بنا به هر دلیلی دسترسی به اپلیکیشن های خارجی ندارید میتوانید پیام خود را از طریق بله، روبیکا و ایتا به شماره 09046972370 ارسال نمایید تا کارشناسان برتر سرویس پاسخگو سوال شما عزیزان باشند.";

// Postal shipping note — customers outside Tehran can mail their device in.
const POSTAL_NOTE =
  "اگر امکان مراجعه حضوری ندارید یا خارج از تهران هستید، می توانید دستگاه خود را از طریق پست به آدرس شعبه مرکزی با کد پستی 1586983711 ارسال کنید. پس از دریافت، دستگاه به صورت رایگان عیب یابی می شود و هزینه تعمیر قبل از شروع کار به شما اعلام خواهد شد.";

// Must stay in step with SITE.socials — the same set is emitted as schema
// sameAs in app/layout.tsx and linked from the footer on every page.
const SOCIALS = [
  { label: "اینستاگرام", href: SITE.socials.instagram, icon: Instagram },
  { label: "یوتیوب", href: SITE.socials.youtube, icon: Youtube },
  { label: "ایکس (توییتر)", href: SITE.socials.twitter, icon: Twitter },
  { label: "فیسبوک", href: SITE.socials.facebook, icon: Facebook },
  { label: "پینترست", href: SITE.socials.pinterest, icon: Globe },
  { label: "لینکدین", href: SITE.socials.linkedin, icon: Linkedin },
  { label: "واتساپ", href: SITE.socials.whatsapp, icon: MessageCircle },
];

const BRANCHES = [
  {
    name: "شعبه مرکزی تهران",
    address: "تهران، خیابان مطهری، خیابان قائم مقام فراهانی جنوبی، پلاک ۱۵۸",
    postal: SITE.postalCode,
    metro: { line: "میرزای شیرازی، هفتم تیر", last: "مفتح" },
    directions: directionsUrl(SHOP_BRANCHES[0]),
    note: "",
  },
  {
    name: "شعبه شرق تهران",
    address: "میدال هلال احمر جنب میدان 91 مرکز خدمات پس از فروش برترسرویس",
    postal: "",
    metro: null,
    directions: "",
    // The branch is closed for rebuilding; saying so here stops someone
    // driving across the city to a shuttered door.
    note: "این شعبه در حال بازسازی است و فعلاً پذیرش حضوری ندارد. تا بازگشایی، لطفاً به شعبه مرکزی مراجعه کنید یا تماس بگیرید.",
  },
  {
    name: "شعبه غرب تهران",
    address:
      "تهران، سعادت آباد، میدان کاج، کوچه دوازدهم علی اکبر، پلاک ۳۰، مجتمع اداری کسری، طبقه اول واحد ۵",
    postal: "",
    metro: null,
    directions: "",
    note: "",
  },
];

export default function ContactPage({ post }: { post: Post }) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      { "@type": "ListItem", position: 2, name: "تماس با ما", item: `${SITE.domain}${encodeURI(post.path)}` },
    ],
  };

  return (
    <div className="pt-24 lg:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Description */}
      <header className="bg-finegrid relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute left-1/2 top-0 h-60 w-[40rem] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
          <nav
            className="flex items-center justify-center gap-1 text-sm text-ink-500"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-accent">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4 text-ink-300" />
            <span className="text-ink-700">تماس با ما</span>
          </nav>
          <h1 className="display mt-5 text-3xl font-extrabold text-ink-900 sm:text-5xl">
            ارتباط با خدمات پس از فروش برتر سرویس
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-9 text-ink-500">
            {INTRO}
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-9 text-ink-500">
            {POSTAL_NOTE}
          </p>
          <div className="mx-auto mt-7 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-accent/25 bg-white px-5 py-3.5 shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-tint text-accent">
              <Package className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold text-ink-900">
              کد پستی برای ارسال دستگاه جهت تعمیر:
            </span>
            <span dir="ltr" className="text-lg font-extrabold tracking-wider text-accent">
              {SITE.postalCode}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Social / virtual spaces */}
        <section className="mt-12">
          <h2 className="heading-accent text-xl font-extrabold text-ink-900">
            ما را در فضای مجازی دنبال کنید
          </h2>
          <div className="mt-7 flex flex-wrap gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group flex items-center gap-2.5 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink-700 transition hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent hover:shadow-card"
              >
                <s.icon className="h-5 w-5 text-accent" />
                {s.label}
              </a>
            ))}
          </div>
        </section>

        {/* Phone (above branches) */}
        <section className="bg-dotmatrix mt-12 overflow-hidden rounded-3xl border border-accent/20 bg-accent px-6 py-10 text-center">
          <p className="text-sm font-medium text-white/85">
            شماره خدمات پس از فروش برتر سرویس
          </p>
          <a
            href={SITE.phoneHref}
            dir="ltr"
            className="mt-3 inline-flex items-center gap-3 text-3xl font-extrabold tracking-wide text-white sm:text-4xl"
          >
            <Phone className="h-7 w-7" />
            {SITE.phone}
          </a>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={SITE.socials.whatsapp}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              <MessageCircle className="h-4 w-4" />
              واتساپ ۰۹۰۴۶۹۷۲۳۷۰
            </a>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white">
              <Clock className="h-4 w-4" />
              پشتیبانی ۲۴ ساعته (بله، روبیکا، ایتا)
            </span>
          </div>
        </section>

        {/* Branches in two rows */}
        <section className="mt-14">
          <h2 className="heading-accent text-xl font-extrabold text-ink-900">
            شعبات خدمات پس از فروش برتر
          </h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {BRANCHES.map((b) => (
              <div
                key={b.name}
                className="card-hover flex flex-col rounded-2xl border border-line bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-tint text-accent">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-bold text-ink-900">{b.name}</h3>
                </div>
                <p className="mt-4 flex-1 text-sm leading-8 text-ink-600">
                  {b.address}
                </p>
                {b.postal && (
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink-700">
                    <Package className="h-4 w-4 text-accent" />
                    کد پستی: <span dir="ltr" className="tracking-wider">{b.postal}</span>
                  </p>
                )}
                {b.metro && (
                  <p className="mt-2 flex items-start gap-2 text-sm leading-8 text-ink-600">
                    <TrainFront className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>
                      نزدیک ترین ایستگاه های مترو:{" "}
                      <span className="font-semibold text-ink-800">
                        {b.metro.line} و {b.metro.last}
                      </span>
                    </span>
                  </p>
                )}
                {b.note && (
                  <p className="mt-2 flex items-start gap-2 text-sm leading-8 text-ink-600">
                    <Construction className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{b.note}</span>
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={SITE.phoneHref}
                    dir="ltr"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
                  >
                    <Phone className="h-4 w-4" />
                    {SITE.phone}
                  </a>
                  {b.directions && (
                    <a
                      href={b.directions}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-accent/40 hover:text-accent"
                    >
                      <Navigation className="h-4 w-4" />
                      مسیریابی روی نقشه
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ServiceCentersSlot
        path={post.path}
        always
        heading="شعبه های برتر سرویس روی نقشه"
      />
    </div>
  );
}
