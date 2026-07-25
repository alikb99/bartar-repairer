// Static marketing constants (client-safe — no large imports).
// Real content (posts, categories, navigation) lives in lib/content.ts.

export const SITE = {
  name: "مرکز تخصصی تعمیرات برتر",
  shortName: "تعمیرات برتر",
  // Trade/brand name the business is known by (used in DB titles). Kept as an
  // alternateName in schema for NAP consistency without changing the legal name.
  brandName: "برتر سرویس",
  domain: "https://bartar-repairer.com",
  organizationId: "https://bartar-repairer.com/#organization",
  localBusinessId: "https://bartar-repairer.com/#localbusiness",
  websiteId: "https://bartar-repairer.com/#website",
  authorId: "https://bartar-repairer.com/#editorial-team",
  phone: "۰۲۱-۹۱۳۰۰۳۴۸",
  phonePlain: "02191300348",
  phoneIntl: "+982191300348",
  phoneHref: "tel:02191300348",
  // West branch (شعبه غرب) — Saadat Abad.
  phoneWest: "۰۲۱-۲۲۱۲۹۱۷۰",
  phoneWestIntl: "+982122129170",
  phoneWestHref: "tel:02122129170",
  geoWest: { lat: 35.782578745007484, lng: 51.37508182469265 },
  city: "تهران",
  // کد پستی شعبه مرکزی — برای ارسال پستی دستگاه جهت تعمیر.
  postalCode: "1586983711",
  address:
    "تهران، خیابان مطهری، خیابان قائم مقام فراهانی جنوبی، پلاک ۱۵۸",
  addressWest:
    "تهران، سعادت آباد، میدان کاج، کوچه دوازدهم علی اکبر، پلاک ۳۰، مجتمع اداری کسری، طبقه اول واحد ۵",
  email: "info@bartar-repairer.com",
  hours: "شنبه تا چهارشنبه ۹ تا ۱۸:۳۰ — پنجشنبه ۹ تا ۱۵",
  mapCentral:
    "https://balad.ir/p/%D8%A8%D8%B1%D8%AA%D8%B1-%D8%B3%D8%B1%D9%88%DB%8C%D8%B3-tehran-nei-sanaei_electronic-equipment-repair-4TyjywJEshQMcD#15/35.72402/51.42398",
  socials: {
    instagram:
      "https://www.instagram.com/bartar_repairer?igsh=MTJ5aXJhcW00cmFyMA==",
    youtube: "https://www.youtube.com/@bartar_services",
    twitter: "https://x.com/Bartar_repairer",
    facebook:
      "https://www.facebook.com/people/%D8%A8%D8%B1%D8%AA%D8%B1-%D8%B3%D8%B1%D9%88%DB%8C%D8%B3/pfbid02MAe5xVUQdSiJozu9SHA5sS3zTkPk2iJYz3capxQC3N617jmdxrhuPbUVPMHJvLuMl/",
    pinterest: "https://www.pinterest.com/bartar_repairer/",
    linkedin: "https://ir.linkedin.com/in/bartar-repairer",
    whatsapp: "https://wa.me/09046972370",
  },
  tagline: "تعمیر تخصصی دستگاه های الکترونیکی با گارانتی واقعی",
};

export const BRANDS = [
  "اپل",
  "سامسونگ",
  "شیائومی",
  "هوآوی",
  "سونی",
  "لنوو",
  "ایسوس",
  "ایسر",
  "دل",
  "اچ پی",
  "نوکیا",
  "ریلمی",
];

// Brand → hub page, so the homepage brand marquee funnels link equity to the
// commercial brand pillars. Brands without a built hub (e.g. ریلمی) stay null
// and render as a plain chip. Acer has no /acer/ page — its hub is /lap-top-acer/.
export const BRAND_LINKS: Record<string, string | null> = {
  اپل: "/apple/",
  سامسونگ: "/samsung/",
  شیائومی: "/xiaomi/",
  هوآوی: "/huawei/",
  سونی: "/sony/",
  لنوو: "/lenovo/",
  ایسوس: "/asus/",
  ایسر: "/lap-top-acer/",
  دل: "/dell/",
  "اچ پی": "/hp/",
  نوکیا: "/nokia/",
  ریلمی: null,
};

export const STATS = [
  { value: "۱۲", label: "سال تجربه تخصصی" },
  { value: "۴۸٬۰۰۰", label: "دستگاه تعمیر شده" },
  { value: "۹۸٪", label: "رضایت مشتریان" },
  { value: "۶ ماه", label: "گارانتی تعمیرات" },
];

export const STEPS = [
  { title: "ثبت درخواست", desc: "تماس یا ثبت آنلاین دستگاه و شرح ایراد." },
  { title: "عیب یابی رایگان", desc: "بررسی تخصصی و اعلام هزینه پیش از تعمیر." },
  { title: "تعمیر با قطعه اصل", desc: "تعمیر توسط تکنسین متخصص با قطعات اصل." },
  { title: "تحویل با گارانتی", desc: "تحویل دستگاه همراه با برگه گارانتی معتبر." },
];

export const FAQS = [
  {
    q: "هزینه عیب یابی چقدر است؟",
    a: "عیب یابی اولیه دستگاه رایگان است و هزینه تعمیر پیش از انجام کار به صورت شفاف اعلام می شود. تعمیر تنها پس از تأیید شما آغاز می شود.",
  },
  {
    q: "آیا تعمیرات گارانتی دارد؟",
    a: "بله. تمام تعمیرات تا ۶ ماه گارانتی می شوند و قطعه تعویض شده روی برگه گارانتی درج می شود.",
  },
  {
    q: "چه زمانی تعمیر به صرفه نیست؟",
    a: "اگر هزینه تعمیر برد به قیمت دستگاه نو نزدیک شود یا قطعه اصل موجود نباشد، صادقانه اعلام می کنیم و تعمیر را پیشنهاد نمی دهیم.",
  },
  {
    q: "تعمیر چقدر طول می کشد؟",
    a: "تعمیرات رایج مانند تعویض ال سی دی و باتری معمولاً همان روز انجام می شود؛ تعمیرات برد بسته به قطعه ۱ تا ۳ روز کاری زمان می برد.",
  },
];
