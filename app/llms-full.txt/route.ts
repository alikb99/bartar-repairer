import { POSTS, ARTICLE_POSTS, NAV, h1For, type Post } from "@/lib/content";
import { REPAIR_TYPES } from "@/lib/repair-types";
import { LIVE_SERVICE_AREAS } from "@/lib/service-areas";
import { PRICE_RANGES, PRICES_UPDATED, toman } from "@/lib/pricing";
import { SITE } from "@/lib/data";

export const dynamic = "force-static";

// llms-full.txt — the whole site as one plain-text document, so an AI search
// engine can read the business, the prices and the lead section of every
// important page in a single request. llms.txt is the link map; this is the
// text. Kept build-time static so it works with `output: "export"`.
//
// Byte-for-byte replay of the file the 2026-08-16 production build shipped,
// whose source was lost (see docs/00-CRITICAL-source-location.md in the deploy
// repo). Every constant below was measured against that file — change one and
// the parity check in scripts/verify-against-live.mjs will say so.

/** Characters of body text carried per page before the "read on" pointer. */
const EXCERPT_CHARS = 1800;
/** How many of the newest guides get a full text block. */
const GUIDE_COUNT = 150;

// Short labels for the price table. Only the repair types that actually carry
// price rows are named; anything else falls back to its slug, exactly as the
// deployed file does for camera-repair and software-repair.
const PRICE_LABEL: Record<string, string> = {
  "back-cover-replacement": "تعویض درب پشت",
  "battery-replacement": "تعویض باتری",
  "charging-port-repair": "تعمیر سوکت شارژ",
  "lcd-replacement": "تعویض ال سی دی",
};

const url = (path: string) => `${SITE.domain}${encodeURI(path)}`;

// HTML → plain text. Block elements become line breaks so the paragraph and
// list structure of the article survives; everything else is dropped. The
// element list is deliberately narrow: <section>, <table>, <td> and <ul>
// wrappers add no line of their own, only the newlines already in the markup.
function toText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(?:h[1-6]|p|li|blockquote|tr|div)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]{2,}/g, " ")
    // Empty WordPress wrappers leave runs of blank lines behind.
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** The opening of a page, cut back to the last sentence or line break. */
function excerpt(html: string): string {
  const text = toText(html);
  if (text.length <= EXCERPT_CHARS) return text;
  const cut = text.slice(0, EXCERPT_CHARS);
  const at = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("\n"));
  return (at > 0 ? cut.slice(0, at) : cut).trimEnd();
}

function pageBlock(p: Post): string {
  const u = url(p.path);
  return `## ${h1For(p.path, p.title)}
URL: ${u}
خلاصه: ${p.metaDesc}
${excerpt(p.content)}

[ادامه در ${u}]`;
}

export function GET(): Response {
  const byPath = new Map(POSTS.map((p) => [p.path, p]));
  const navKids = (title: string) =>
    NAV.find((n) => n.title === title)?.children ?? [];

  // The commercial spine of the site: brand hubs, then the mobile hubs, then
  // the laptop hubs, each menu in its own order and no page twice. /apple/ is
  // the one hub left out — its device pages (آیفون، مک بوک) carry the text.
  const seen = new Set<string>(["/apple/"]);
  const hubs: Post[] = [];
  for (const c of [
    ...navKids("نمایندگی ها"),
    ...navKids("تعمیرات موبایل"),
    ...navKids("تعمیرات لپ تاپ"),
  ]) {
    if (seen.has(c.slug)) continue;
    seen.add(c.slug);
    const p = byPath.get(c.slug);
    if (p) hubs.push(p);
  }

  const services = REPAIR_TYPES.map(
    (t) => `## ${t.title}
URL: ${SITE.domain}/repairs/${t.slug}/
${t.metaDesc}`,
  ).join("\n\n");

  const prices = PRICE_RANGES.map((r) => {
    const label = PRICE_LABEL[r.repairType] ?? r.repairType;
    const amount = r.to
      ? `${toman(r.from)} تا ${toman(r.to)} تومان`
      : `${toman(r.from)} تومان`;
    return `- ${label} ${r.device}: ${amount}`;
  }).join("\n");

  const areas = LIVE_SERVICE_AREAS.map(
    (a) => `- ${a.name}: ${SITE.domain}/areas/${a.slug}/`,
  ).join("\n");

  // Blank line after the service list is intentional — it separates the
  // "## خدمات" blocks, which are headings themselves, from the next section.
  const body = `# ${SITE.name} — متن کامل سایت

> ${SITE.tagline}. مرکز تعمیرات تخصصی دستگاه های الکترونیکی در ${SITE.city} با دو شعبه فعال، عیب یابی رایگان، قطعات اصل و ۶ ماه گارانتی کتبی روی تعمیرات.

این فایل نسخه کامل متنی سایت است تا در یک درخواست قابل خواندن باشد. نقشه لینک ها در ${SITE.domain}/llms.txt قرار دارد.

## اطلاعات کسب و کار

- نام: ${SITE.name}
- نام تجاری: ${SITE.brandName}
- تلفن شعبه مرکزی: ${SITE.phonePlain}
- تلفن شعبه غرب: ${SITE.phoneWestIntl.replace("+98", "0")}
- شعبه مرکزی: ${SITE.address}
- شعبه غرب: ${SITE.addressWest}
- ساعات کاری: ${SITE.hours}
- ایمیل: ${SITE.email}
- شهر: ${SITE.city}، ایران
- زبان محتوا: فارسی
- گارانتی: ۶ ماه کتبی روی تعمیرات
- عیب یابی: رایگان و پیش از باز کردن دستگاه

## خدمات بر اساس نوع ایراد

${services}


## جدول قیمت تعمیرات

آخرین به روزرسانی: ${PRICES_UPDATED}. عددها شامل قطعه و اجرت نصب هستند و به تومان اعلام می شوند. کف هر بازه مربوط به قطعه کپی و سقف آن مربوط به قطعه اورجینال است.

${prices}

## مناطق تحت پوشش در ${SITE.city}

${areas}

## صفحات اصلی برندها و دستگاه ها

${hubs.map(pageBlock).join("\n")}

## راهنماها و مقالات آموزشی

${ARTICLE_POSTS.slice(0, GUIDE_COUNT).map(pageBlock).join("\n")}

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
