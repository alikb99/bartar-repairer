// ---------- Repair-type hubs (second internal-linking axis) ----------
// The site's only topical axis was BRAND (samsung → samsung mobile → models),
// which left 42% of pages with three or fewer inbound internal links. These
// hubs add a REPAIR TYPE axis that cuts across every brand, so a model page
// such as /a06-battery-replacement/ is reachable from two directions and the
// site builds authority on high-volume generic queries ("تعویض باتری گوشی").
// Hubs are generated at build time from existing pages — no database content
// is modified and no existing URL changes.
import { POSTS, type Post } from "./content";
import { ARTICLE_REPAIR_TYPE } from "./recovered-membership";
import { REPAIR_TYPE_MEMBERSHIP } from "./recovered-membership-types";

export type RepairType = {
  /** URL segment under /repairs/ */
  slug: string;
  /** H1 + hub label */
  title: string;
  metaTitle: string;
  metaDesc: string;
  /** Short intro paragraph rendered above the listings. */
  lead: string;
  /** When this repair is NOT the right call (honesty rule from voice.md). */
  notFor: string;
  /** Lucide icon name. */
  icon: string;
  /** Matches page/article titles that belong to this hub. */
  match: RegExp;
};

// Pages kept out of the index — they must not be linked from a hub either.
const EXCLUDED = new Set(["/home/", "/تست-المنتور/", "/blog/"]);

export const REPAIR_TYPES: RepairType[] = [
  {
    slug: "lcd-replacement",
    title: "تعویض ال سی دی و تاچ",
    metaTitle: "تعویض ال سی دی و تاچ - قطعه اصل و ۶ ماه گارانتی | برتر سرویس",
    metaDesc:
      "تعویض ال سی دی، تاچ و گلس گوشی، تبلت و لپ تاپ همه برندها با قطعه اصل؛ اعلام هزینه قبل از تعمیر، نصب همان روز و ۶ ماه گارانتی کتبی در تهران.",
    lead: "تعویض ال سی دی رایج ترین تعمیری است که روی دستگاه های امروزی انجام می شود. صفحات تخصصی تعویض نمایشگر برای هر برند و مدل اینجا جمع شده تا مستقیم سراغ دستگاه خودتان بروید.",
    notFor:
      "اگر فقط شیشه روی نمایشگر ترک خورده و تصویر و لمس کاملا سالم است، تعویض کل ال سی دی لازم نیست و تعمیر گلس هزینه کمتری دارد.",
    icon: "Smartphone",
    match: /ال ?سی ?دی|LCD|نمایشگر|تاچ|گلس|شیشه شکسته|صفحه نمایش/i,
  },
  {
    slug: "battery-replacement",
    title: "تعویض باتری",
    metaTitle: "تعویض باتری گوشی و لپ تاپ - نصب همان روز | برتر سرویس",
    metaDesc:
      "تعویض باتری گوشی، تبلت و لپ تاپ همه برندها با باتری اصل؛ رفع افت شارژ و خاموشی ناگهانی با اعلام هزینه قبل از تعویض و ۶ ماه گارانتی کتبی.",
    lead: "افت سریع شارژ، خاموشی ناگهانی و داغ شدن دستگاه معمول ترین نشانه های پایان عمر باتری هستند. صفحات زیر تعویض باتری را برای هر برند و مدل جداگانه پوشش می دهند.",
    notFor:
      "اگر دستگاه فقط هنگام بازی یا شارژ داغ می شود و سلامت باتری بالای ۸۵ درصد است، تعویض باتری مشکل را حل نمی کند و باید مصرف نرم افزاری بررسی شود.",
    icon: "BatteryCharging",
    match: /باتری|battery/i,
  },
  {
    slug: "board-repair",
    title: "تعمیر برد و مادربرد",
    metaTitle: "تعمیر برد گوشی و مادربرد لپ تاپ - تعمیر سطح آی سی | برتر سرویس",
    metaDesc:
      "تعمیر تخصصی برد گوشی و مادربرد لپ تاپ در سطح آی سی؛ رفع روشن نشدن، شارژ نشدن و تصویر نداشتن با عیب یابی رایگان و اعلام هزینه پیش از تعمیر.",
    lead: "تعمیر برد تخصصی ترین بخش تعمیرات است و به میکروسکوپ، هیت گان و تکنسین سطح آی سی نیاز دارد. راهنماها و صفحات تخصصی تعمیر برد در این هاب جمع شده اند.",
    notFor:
      "اگر هزینه تعمیر برد به قیمت دستگاه نو نزدیک شود یا برد چند بار قبلا تعمیر شده باشد، تعمیر دوباره معمولا پایدار نیست و آن را پیشنهاد نمی کنیم.",
    icon: "CircuitBoard",
    match: /تعمیر برد|مادربرد|برد گوشی|برد لپ ?تاپ|motherboard|آی ?سی/i,
  },
  {
    slug: "water-damage",
    title: "تعمیر آب خوردگی",
    metaTitle: "تعمیر گوشی و لپ تاپ آب خورده - عیب یابی رایگان | برتر سرویس",
    metaDesc:
      "احیای دستگاه های آب خورده با شست و شوی تخصصی برد و رفع سولفاته شدن؛ هرچه زودتر اقدام کنید شانس نجات دستگاه بیشتر است. عیب یابی رایگان در تهران.",
    lead: "در آب خوردگی زمان مهم ترین عامل است. خوردگی مسیرهای برد از لحظه تماس با مایع شروع می شود و روشن کردن دستگاه آن را تسریع می کند. راهنماهای زیر ترتیب درست کار را توضیح می دهند.",
    notFor:
      "اگر دستگاه بعد از خیس شدن روشن مانده و بدون مشکل کار می کند باز هم شست و شوی پیشگیرانه لازم است؛ اما وقتی ماه ها از حادثه گذشته و خوردگی گسترده شده، نتیجه تعمیر تضمینی نیست.",
    icon: "Droplets",
    match: /آب ?خورد|آبخورد|خیس ?شد|water damage/i,
  },
  {
    slug: "back-cover-replacement",
    title: "تعویض درب پشت و قاب",
    metaTitle: "تعویض درب پشت گوشی - قاب اورجینال و آب بندی مجدد | برتر سرویس",
    metaDesc:
      "تعویض درب پشت و قاب گوشی همه برندها با قطعه اورجینال، چسب کاری اصولی و آب بندی مجدد؛ اعلام هزینه قبل از تعمیر و تحویل همان روز در تهران.",
    lead: "شکستگی درب پشت فقط ظاهری نیست؛ درز باز شده راه ورود گرد و غبار و رطوبت به داخل دستگاه است. صفحات زیر تعویض قاب را برای هر مدل پوشش می دهند.",
    notFor:
      "اگر فقط خط و خش سطحی روی قاب افتاده و درزی باز نشده، تعویض قاب ضرورت فنی ندارد و یک قاب محافظ کافی است.",
    icon: "Layers",
    match: /درب پشت|قاب پشت|تعویض قاب|back ?(cover|door)/i,
  },
  {
    slug: "camera-repair",
    title: "تعمیر دوربین",
    metaTitle: "تعمیر دوربین گوشی - رفع تاری و لک با ۶ ماه گارانتی | برتر سرویس",
    metaDesc:
      "تعمیر و تعویض دوربین جلو و عقب گوشی و تبلت؛ رفع تاری تصویر، لک، لرزش و خطای باز نشدن دوربین با قطعه اصل و ۶ ماه گارانتی کتبی.",
    lead: "تاری تصویر همیشه به معنی خرابی ماژول دوربین نیست؛ گاهی شیشه محافظ لنز ترک خورده یا ایراد نرم افزاری است. راهنماهای زیر تفاوت این حالت ها را توضیح می دهند.",
    notFor:
      "اگر دوربین فقط در یک برنامه خاص کار نمی کند ولی در برنامه دوربین اصلی سالم است، مشکل نرم افزاری است و تعویض ماژول لازم نیست.",
    icon: "Camera",
    match: /دوربین|camera/i,
  },
  {
    slug: "charging-port-repair",
    title: "تعمیر سوکت شارژ",
    metaTitle: "تعمیر سوکت شارژ گوشی - رفع شارژ نشدن و قطع و وصلی | برتر سرویس",
    metaDesc:
      "تعمیر و تعویض کانکتور شارژ گوشی و لپ تاپ؛ رفع شارژ نشدن، قطع و وصلی و کند شارژ شدن با عیب یابی رایگان و ۶ ماه گارانتی تعمیرات.",
    lead: "شارژ نشدن دستگاه می تواند از کابل، آداپتور، سوکت شارژ یا مدار تغذیه برد باشد. تشخیص درست این چهار حالت جلوی هزینه اضافی را می گیرد.",
    notFor:
      "قبل از هر تعمیری کابل و آداپتور دیگری را تست کنید؛ در بخشی از مراجعه ها مشکل فقط از کابل معیوب است و دستگاه سالم است.",
    icon: "PlugZap",
    match: /سوکت شارژ|کانکتور شارژ|شارژ نمی|مشکل شارژ|شارژر|charging/i,
  },
  {
    slug: "speaker-microphone-repair",
    title: "تعمیر اسپیکر و میکروفون",
    metaTitle: "تعمیر اسپیکر و میکروفون گوشی - رفع بی صدایی | برتر سرویس",
    metaDesc:
      "تعمیر اسپیکر، میکروفون و مشکلات صدای گوشی و لپ تاپ؛ رفع بی صدا شدن، خش داشتن صدا و نشنیدن صدای تماس با قطعه اصل و ۶ ماه گارانتی.",
    lead: "بی صدا شدن دستگاه گاهی فقط گرفتگی توری اسپیکر است و گاهی خرابی ماژول یا آی سی صدا. تشخیص این دو حالت هزینه تعمیر را کاملا تغییر می دهد.",
    notFor:
      "اگر صدا فقط در تماس قطع می شود ولی موزیک پخش می شود، معمولا اسپیکر مکالمه یا تنظیمات نرم افزاری مقصر است و تعویض اسپیکر اصلی لازم نیست.",
    icon: "Volume2",
    match: /اسپیکر|میکروفون|بی ?صدا|مشکل صدا|speaker|microphone/i,
  },
  {
    slug: "software-repair",
    title: "تعمیر نرم افزاری و فلش",
    metaTitle: "تعمیر نرم افزاری موبایل - فلش با حفظ اطلاعات | برتر سرویس",
    metaDesc:
      "رفع هنگ، بوت لوپ، کندی و خطاهای نرم افزاری گوشی و لپ تاپ؛ نصب رام رسمی و فلش تخصصی با تلاش برای حفظ اطلاعات و عیب یابی رایگان.",
    lead: "بخش زیادی از خرابی هایی که سخت افزاری به نظر می رسند ریشه نرم افزاری دارند. راهنماهای زیر ترتیب درست عیب یابی، از کم ریسک به پرریسک، را نشان می دهند.",
    notFor:
      "اگر از اطلاعات دستگاه نسخه پشتیبان ندارید، فلش کردن را به عنوان اولین راه حل انتخاب نکنید؛ در بیشتر روش های فلش اطلاعات پاک می شود.",
    icon: "Cpu",
    match: /نرم ?افزار|فلش|رام|بوت ?لوپ|هنگ|ریست|سیف ?مود|safe mode|فکتوری/i,
  },
  {
    slug: "keyboard-repair",
    title: "تعمیر کیبورد لپ تاپ",
    metaTitle: "تعمیر و تعویض کیبورد لپ تاپ - ۶ ماه گارانتی کتبی | برتر سرویس",
    metaDesc:
      "تعمیر و تعویض کیبورد لپ تاپ همه برندها؛ رفع کار نکردن کلیدها، چسبندگی بعد از ریختن مایعات و ایراد فلت با قطعه اصل و ۶ ماه گارانتی.",
    lead: "کار نکردن چند کلید همیشه به معنی خرابی کل کیبورد نیست؛ فلت، سوکت و کنترلر مادربرد هم می توانند مقصر باشند و تعویض کامل اولین گزینه نیست.",
    notFor:
      "اگر همه کلیدها با کیبورد USB خارجی هم کار نمی کنند، مشکل از خود کیبورد نیست و باید مادربرد بررسی شود.",
    icon: "Keyboard",
    match: /کیبورد|صفحه ?کلید|keyboard|تاچ ?پد|touchpad/i,
  },
  {
    slug: "overheating-fan-repair",
    title: "رفع داغ شدن و سرویس فن",
    metaTitle: "رفع داغ شدن لپ تاپ - سرویس فن و خمیر حرارتی | برتر سرویس",
    metaDesc:
      "سرویس فن، تعویض خمیر حرارتی و رفع داغ شدن لپ تاپ و گوشی؛ رفع خاموشی زیر بار، افت کارایی و صدای زیاد فن با عیب یابی رایگان در تهران.",
    lead: "داغ شدن و افت کارایی معمولا از گرفتگی مسیر هوا، خشک شدن خمیر حرارتی یا خرابی فن می آید. سرویس حرارتی به موقع از آسیب دائمی به قطعات جلوگیری می کند.",
    notFor:
      "اگر لپ تاپ فقط هنگام رندر یا بازی سنگین گرم می شود و خاموش نمی شود، این رفتار طبیعی است و سرویس فوری لازم ندارد.",
    icon: "Fan",
    match: /داغ ?شد|حرارت|فن لپ|خمیر حرارتی|خنک|overheat|cooling/i,
  },
];

const bySlug = new Map(REPAIR_TYPES.map((t) => [t.slug, t]));
const itemsBySlug = new Map<string, { services: Post[]; articles: Post[] }>();
const typesByPostId = new Map<number, RepairType[]>();

for (const t of REPAIR_TYPES) itemsBySlug.set(t.slug, { services: [], articles: [] });
for (const p of POSTS) {
  if (EXCLUDED.has(p.path)) continue;
  const matched: RepairType[] = [];
  // What the deployed hubs actually list wins outright: they are the record of
  // where each page was filed, including the pages that sit under two hubs
  // (see recovered-membership-types.ts). Pages the hubs do not mention fall
  // back to the single recovered pin, then to the title regexes.
  const filed = REPAIR_TYPE_MEMBERSHIP[p.path];
  const pinned = ARTICLE_REPAIR_TYPE[p.path];
  // Match on TITLE only — the most reliable signal. Slugs are often
  // abbreviated and article bodies mention every repair type in passing.
  for (const t of REPAIR_TYPES) {
    if (filed ? !filed.includes(t.slug) : t.slug !== pinned && !t.match.test(p.title))
      continue;
    matched.push(t);
    const bucket = itemsBySlug.get(t.slug)!;
    if (p.type === "page") bucket.services.push(p);
    else bucket.articles.push(p);
  }
  // Cap so a title naming several parts does not up-link everywhere.
  if (matched.length) typesByPostId.set(p.id, matched.slice(0, 3));
}

/** Repair-type hub by URL segment. */
export function repairTypeBy(slug: string): RepairType | undefined {
  return bySlug.get(slug);
}

/** Service pages and articles collected under a repair-type hub. */
export function repairTypeContent(slug: string): {
  services: Post[];
  articles: Post[];
} {
  return itemsBySlug.get(slug) ?? { services: [], articles: [] };
}

/** Hubs a given page belongs to (used for up-links from model pages). */
export function repairTypesFor(post: Post): RepairType[] {
  return typesByPostId.get(post.id) ?? [];
}

/** Hubs that collected enough content to be worth publishing as their own page. */
export const LIVE_REPAIR_TYPES = REPAIR_TYPES.filter((t) => {
  const c = itemsBySlug.get(t.slug)!;
  return c.services.length + c.articles.length >= 6;
});
