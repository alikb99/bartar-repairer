import Link from "next/link";
import {
  ChevronLeft,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { breadcrumbs, type Post } from "@/lib/content";
import { SITE } from "@/lib/data";
import RepairRequestForm from "@/components/RepairRequestForm";

// The database page for /online-repair-request/ was a single sentence with no
// working form. This replaces it with a real request flow: the customer
// describes the fault, the shop receives it by email.

const STEPS = [
  {
    icon: Wrench,
    title: "فرم را پر کنید",
    desc: "دستگاه، برند و شرح ایراد را بنویسید. هرچه دقیق تر، تخمین اولیه ما دقیق تر است.",
  },
  {
    icon: Phone,
    title: "کارشناس تماس می گیرد",
    desc: "در ساعات کاری با شما تماس می گیریم، ایراد را بررسی و بازه هزینه را اعلام می کنیم.",
  },
  {
    icon: Truck,
    title: "دستگاه را تحویل دهید",
    desc: "به یکی از دو شعبه مراجعه کنید یا هماهنگ کنید تا دستگاه دریافت شود.",
  },
  {
    icon: ShieldCheck,
    title: "تعمیر و تحویل با گارانتی",
    desc: "پس از تایید نهایی شما تعمیر انجام و دستگاه همراه برگه گارانتی تحویل داده می شود.",
  },
];

export default function RepairRequestPage({ post }: { post: Post }) {
  const crumbs = breadcrumbs(post);
  const url = `${SITE.domain}${encodeURI(post.path)}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: SITE.domain },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.title,
        item: `${SITE.domain}${encodeURI(c.path)}`,
      })),
    ],
  };
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: post.title,
    description: post.metaDesc,
    inLanguage: "fa-IR",
    isPartOf: { "@id": SITE.websiteId },
    about: { "@id": SITE.localBusinessId },
    breadcrumb: { "@id": `${url}#breadcrumb` },
  };
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name: "ثبت آنلاین درخواست تعمیر",
    description:
      "مراحل ثبت درخواست تعمیر دستگاه به صورت آنلاین در مرکز تعمیرات برتر.",
    inLanguage: "fa-IR",
    step: STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.desc,
      url: `${url}#step-${i + 1}`,
    })),
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <header className="relative overflow-hidden bg-[radial-gradient(900px_460px_at_88%_-10%,rgba(218,37,28,.12),transparent_60%),linear-gradient(180deg,#FFFFFF,#F5F6F8)]">
        <div className="mx-auto max-w-[1240px] px-4 pb-10 pt-7 sm:px-6 lg:px-8 lg:pb-14">
          <nav
            className="mb-7 flex items-center gap-1 text-[13px] text-ink-300"
            aria-label="مسیر"
          >
            <Link href="/" className="hover:text-accent">
              خانه
            </Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="font-bold text-ink-900">{post.title}</span>
          </nav>
          <h1 className="max-w-3xl text-[29px] font-extrabold leading-[1.4] tracking-tight text-ink-900 sm:text-[38px] lg:text-[42px] lg:leading-[1.3]">
            ثبت آنلاین <span className="text-accent">درخواست تعمیر</span>
          </h1>
          <p className="mt-4 max-w-[640px] text-[16px] leading-9 text-ink-500 sm:text-[17px]">
            فرم زیر را پر کنید تا کارشناسان ما در ساعات کاری با شما تماس بگیرند و
            پیش از هر اقدامی بازه هزینه را اعلام کنند. ثبت درخواست رایگان است و
            شما را به تعمیر متعهد نمی کند.
          </p>
        </div>
      </header>

      <section className="bg-paper py-10 lg:py-14">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="min-w-0">
            <RepairRequestForm />

            <div className="mt-8 rounded-[22px] border border-line bg-white p-5 shadow-card sm:p-7">
              <h2 className="text-lg font-extrabold text-ink-900">
                بعد از ثبت درخواست چه اتفاقی می افتد؟
              </h2>
              <ol className="mt-5 grid gap-5 sm:grid-cols-2">
                {STEPS.map((s, i) => (
                  <li key={s.title} id={`step-${i + 1}`} className="flex gap-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="mb-1 text-[15px] font-extrabold text-ink-900">
                        {(i + 1).toLocaleString("fa-IR")}. {s.title}
                      </div>
                      <p className="text-[13.5px] leading-7 text-ink-500">
                        {s.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 rounded-[22px] border border-line bg-white p-5 shadow-card sm:p-7">
              <h2 className="text-lg font-extrabold text-ink-900">
                چه زمانی ثبت آنلاین مناسب نیست
              </h2>
              <p className="mt-3 text-[14.5px] leading-8 text-ink-500">
                اگر دستگاه آب خورده و هنوز خشک نشده، منتظر تماس ما نمانید.
                خوردگی برد از همان ساعات اول شروع می شود و هر ساعت تاخیر شانس
                نجات دستگاه را کم می کند. در این حالت دستگاه را خاموش کنید،
                شارژ نکنید و مستقیم تماس بگیرید.
              </p>
            </div>
          </div>

          <aside className="sticky-sidebar">
            <div className="sticky-sidebar-content space-y-5">
              <div className="rounded-[22px] border border-line bg-white p-5 shadow-card">
                <p className="text-sm font-extrabold text-ink-900">
                  ترجیح می دهید تماس بگیرید؟
                </p>
                <div className="mt-4 space-y-3">
                  <a
                    href={SITE.phoneHref}
                    dir="ltr"
                    className="flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white transition hover:bg-accent-deep"
                  >
                    <Phone className="h-4 w-4" />
                    {SITE.phone}
                  </a>
                  <a
                    href={SITE.phoneWestHref}
                    dir="ltr"
                    className="flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-4 py-3 text-sm font-bold text-ink-900 transition hover:border-accent hover:text-accent"
                  >
                    <Phone className="h-4 w-4" />
                    {SITE.phoneWest}
                  </a>
                </div>
                <div className="mt-4 flex gap-2.5 border-t border-line pt-4 text-[13px] leading-7 text-ink-500">
                  <Clock3 className="mt-1 h-4 w-4 shrink-0 text-accent" />
                  <span>{SITE.hours}</span>
                </div>
              </div>

              <div className="rounded-[22px] border border-line bg-white p-5 shadow-card">
                <p className="text-sm font-extrabold text-ink-900">شعب ما</p>
                <div className="mt-4 space-y-4 text-[13px] leading-7 text-ink-700">
                  <div className="flex gap-2.5">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <div className="font-bold text-ink-900">شعبه مرکزی</div>
                      {SITE.address}
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <div className="font-bold text-ink-900">شعبه غرب</div>
                      {SITE.addressWest}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-line bg-white p-5 shadow-card">
                <p className="text-sm font-extrabold text-ink-900">
                  نمی دانید مشکل از کجاست؟
                </p>
                <p className="mt-2.5 text-[13px] leading-7 text-ink-500">
                  با ابزار عیب یابی آنلاین، علامت دستگاه را انتخاب کنید تا علت
                  احتمالی را ببینید.
                </p>
                <Link
                  href="/online-diagnosis/"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-line bg-paper px-4 py-3 text-sm font-bold text-ink-900 transition hover:border-accent hover:text-accent"
                >
                  عیب یابی آنلاین رایگان
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </article>
  );
}
