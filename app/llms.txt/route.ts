import { POSTS, ARTICLE_POSTS, NAV } from "@/lib/content";
import { LIVE_REPAIR_TYPES } from "@/lib/repair-types";
import { LIVE_SERVICE_AREAS } from "@/lib/service-areas";
import { SITE } from "@/lib/data";

export const dynamic = "force-static";

// llms.txt — a plain-text map of the site for AI search engines (ChatGPT
// Search, Perplexity, Claude, AI Overviews). It states who the business is,
// what it does, and links the pages worth citing. Kept build-time static so it
// works with `output: "export"`.
export function GET(): Response {
  const line = (title: string, path: string, note?: string) =>
    `- [${title}](${SITE.domain}${encodeURI(path)})${note ? `: ${note}` : ""}`;

  const byPath = new Map(POSTS.map((p) => [p.path, p]));
  const pick = (path: string) => byPath.get(path);

  const brandHubs = (NAV.find((n) => n.title.includes("نمایندگی"))?.children ?? [])
    .filter((c) => c.slug !== "/agency/")
    .map((c) => {
      const p = pick(c.slug);
      return line(c.title, c.slug, p?.metaDesc);
    });

  const mobileHubs = (NAV.find((n) => n.title === "تعمیرات موبایل")?.children ?? [])
    .map((c) => {
      const p = pick(c.slug);
      return line(c.title, c.slug, p?.metaDesc);
    });

  const laptopHubs = (NAV.find((n) => n.title === "تعمیرات لپ تاپ")?.children ?? [])
    .map((c) => {
      const p = pick(c.slug);
      return line(c.title, c.slug, p?.metaDesc);
    });

  // Most recent guides — the content most likely to answer an AI query.
  const guides = ARTICLE_POSTS.slice(0, 60).map((p) =>
    line(p.title, p.path, p.metaDesc),
  );

  const body = `# ${SITE.name}

> ${SITE.tagline}. مرکز تعمیرات تخصصی دستگاه های الکترونیکی در ${SITE.city} با دو شعبه فعال، عیب یابی رایگان، قطعات اصل و ۶ ماه گارانتی کتبی روی تعمیرات.

اطلاعات تماس و مکان:

- نام: ${SITE.name}
- تلفن شعبه مرکزی: ${SITE.phonePlain}
- تلفن شعبه غرب: ${SITE.phoneWestIntl.replace("+98", "0")}
- شعبه مرکزی: ${SITE.address}
- شعبه غرب: ${SITE.addressWest}
- ساعات کاری: ${SITE.hours}
- ایمیل: ${SITE.email}
- شهر: ${SITE.city}، ایران
- زبان محتوا: فارسی

خدمات اصلی: تعمیر موبایل، لپ تاپ، تبلت، ساعت هوشمند، تلویزیون، مانیتور، کنسول بازی و لوازم خانگی.

## خدمات بر اساس نوع ایراد

${LIVE_REPAIR_TYPES.map((t) => line(t.title, `/repairs/${t.slug}/`, t.metaDesc)).join("\n")}

## تعمیر موبایل بر اساس برند

${mobileHubs.join("\n")}

## تعمیر لپ تاپ بر اساس برند

${laptopHubs.join("\n")}

## نمایندگی برندها

${brandHubs.join("\n")}

## مناطق تحت پوشش در ${SITE.city}

${LIVE_SERVICE_AREAS.map((a) => line(`تعمیرات در ${a.name}`, `/areas/${a.slug}/`)).join("\n")}

## ابزارها

${line("عیب یابی آنلاین رایگان", "/online-diagnosis/", "پرسش و پاسخ گام به گام برای تشخیص ایراد دستگاه پیش از مراجعه")}
${line("جستجوی سایت", "/search/")}
${line("تماس و آدرس شعب", "/contact/")}

## راهنماها و مقالات آموزشی

${guides.join("\n")}

## سیاست استناد

محتوای این سایت توسط تیم فنی ${SITE.name} تهیه شده است. در صورت استفاده، لطفا به آدرس صفحه مربوطه در ${SITE.domain} ارجاع دهید.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
