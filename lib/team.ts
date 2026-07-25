// The repair technicians who actually work on customers' devices.
//
// RULE FOR THIS FILE: nothing here is invented. Names came from the owner.
// Every other field is optional and renders only when it holds a real value.
// Do NOT fill specialty, years or certifications with plausible-sounding
// guesses — a team page exists to prove the team is real, and a single made-up
// credential destroys exactly the trust it was meant to build.

export type Technician = {
  /** Name as given by the owner. */
  name: string;
  /** What this person actually works on. Owner-supplied only. */
  specialty?: string;
  /** Whole years of experience. Owner-supplied only, never estimated. */
  years?: number;
  /**
   * How precise the years figure is, in the owner's own words:
   *   "approx" → "تقریبا ۵ سال"  → rendered "حدود ۵ سال"
   *   "min"    → "بالای ۱۰ سال"  → rendered "بیش از ۱۰ سال"
   * Omitted when the owner gave a flat number.
   */
  yearsNote?: "approx" | "min";
  /** Path under /wp-content/uploads/. Added once real photos arrive. */
  photo?: { src: string; w: number; h: number };
  /** Real certifications only. */
  certifications?: string[];
};

// Ordered by experience, longest first.
export const TECHNICIANS: Technician[] = [
  {
    name: "علیرضا قهرمانی",
    specialty: "تعمیر گوشی آیفون و اندروید",
    years: 12,
  },
  {
    name: "مهدی لسانی",
    specialty: "تعمیر ساعت هوشمند، تبلت و گوشی های ناتینگ فون، گوگل پیکسل و نوکیا",
    years: 10,
    yearsNote: "min",
  },
  {
    name: "سهیل",
    specialty: "تعمیر لپ تاپ و مانیتور",
    years: 8,
  },
  {
    name: "امیرحسین",
    specialty: "تعمیر لپ تاپ و مانیتور",
    years: 8,
  },
  {
    name: "علی کارگر",
    specialty: "تعمیر موبایل و تعمیرات نرم افزاری",
    years: 8,
  },
  {
    name: "ایلیا فرزانه",
    specialty: "تعویض قطعات گوشی آیفون و اندروید",
    years: 5,
    yearsNote: "approx",
  },
  {
    name: "عرفان صادقی",
    specialty: "تعمیرات نرم افزاری",
    years: 3,
  },
];

/** Experience label in the owner's own level of precision. */
export function yearsLabel(t: Technician): string | null {
  if (typeof t.years !== "number") return null;
  const n = t.years.toLocaleString("fa-IR");
  if (t.yearsNote === "min") return `بیش از ${n} سال سابقه`;
  if (t.yearsNote === "approx") return `حدود ${n} سال سابقه`;
  return `${n} سال سابقه`;
}

/** Workshop equipment. Every item below appears in our own workshop photos. */
export const WORKSHOP_TOOLS: { name: string; what: string }[] = [
  {
    name: "میکروسکوپ تعمیرات",
    what: "بررسی مسیرها و پایه های ریز روی برد، جایی که چشم غیرمسلح چیزی نمی بیند.",
  },
  {
    name: "دوربین حرارتی",
    what: "پیدا کردن قطعه ای که اتصال کوتاه دارد از روی گرم شدنش، بدون باز کردن کل مدار.",
  },
  {
    name: "مولتی متر",
    what: "اندازه گیری مسیرهای تغذیه برد پیش از تعویض هر قطعه.",
  },
  {
    name: "هیتر و هویه ریزکاری",
    what: "برداشتن و نصب آی سی و قطعات SMD روی برد موبایل.",
  },
  {
    name: "دستگاه شست وشوی اولتراسونیک",
    what: "شست وشوی برد گوشی آب خورده و برداشتن خوردگی.",
  },
  {
    name: "لامپ UV و چسب مخصوص",
    what: "پخت چسب هنگام تعویض گلس و آب بندی دوباره دستگاه.",
  },
];

/** True when at least one technician has a photo — drives the layout. */
export const HAS_PHOTOS = TECHNICIANS.some((t) => t.photo);
