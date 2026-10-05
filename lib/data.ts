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
    // These are the profile URLs the site is deployed with, in this order:
    // Object.values() feeds the schema sameAs, and sameAs is an identity claim
    // that has to match what is published. The Instagram link keeps its share
    // token and Facebook its /people/…/pfbid… form for that reason; replacing
    // them with the platforms' canonical forms is a change to make on the live
    // site first, not here.
    instagram: "https://www.instagram.com/bartar_repairer?igsh=MTJ5aXJhcW00cmFyMA==",
    youtube: "https://www.youtube.com/@bartar_services",
    twitter: "https://x.com/Bartar_repairer",
    facebook:
      "https://www.facebook.com/people/%D8%A8%D8%B1%D8%AA%D8%B1-%D8%B3%D8%B1%D9%88%DB%8C%D8%B3/pfbid02MAe5xVUQdSiJozu9SHA5sS3zTkPk2iJYz3capxQC3N617jmdxrhuPbUVPMHJvLuMl/",
    pinterest: "https://www.pinterest.com/bartar_repairer/",
    linkedin: "https://www.linkedin.com/in/bartar-repairer/",
    aparat: "https://www.aparat.com/bartar_service",
    // wa.me needs the full international number with no leading zero —
    // "09046972370" silently fails to open a chat.
    whatsapp: "https://wa.me/989046972370",
  },
  tagline: "تعمیر تخصصی دستگاه های الکترونیکی با گارانتی واقعی",
  // Workshop supervisor. Owner-supplied, like everything in lib/team.ts —
  // named on /team/, in the homepage body and in the Organization schema.
  manager: {
    name: "حمیدرضا آتشین پای",
    jobTitle: "سرپرست و مدیر مجموعه",
    bio: "سرپرستی کارگاه، سپردن هر دستگاه به تکنسین مربوط به آن و پیگیری تعمیرهایی که طول می کشند با ایشان است. اگر از نتیجه کار راضی نبودید، با شعبه تماس بگیرید و بخواهید پرونده دستگاه به ایشان ارجاع شود.",
  },
  // Online support chat. `data-key` identifies the account on the 9fx widget;
  // it loads lazily because it is third-party JS on every page.
  chat: {
    src: "https://9fx.ir/chat.js",
    key: "9jteaHBEC7uCiddu",
    label: "گفتگوی آنلاین با پشتیبانی برتر سرویس",
  },
};

// ---------- The group: this site and its sibling properties ----------

/**
 * Every web property the company owns. This site is the parent; the rest are
 * single-brand sites plus a training academy and an accessories shop.
 *
 * Why this list exists at all. All of these domains publish the same phone
 * number (SITE.phone) and the same two branch addresses, and until now none of
 * them said who owned them. Several of the brand sites also carried a sitewide
 * footer block linking to each other. Many same-NAP domains, reciprocally
 * footer-linked, with no declared owner is indistinguishable from a link
 * network — the ownership was real, it was just never stated anywhere a crawler
 * could read it.
 *
 * Declaring the parent is what fixes that, and it is a hygiene measure rather
 * than a ranking tactic: links between properties one company owns are
 * discounted heavily, so nobody should expect this list to move rankings. What
 * it buys is that the group reads as one company with subsidiaries instead of
 * as twelve strangers sharing an address.
 *
 * The shape is a hub and spoke, not a mesh. This site links out to each
 * property, each property links back here, and the siblings do not link to each
 * other. `subOrganization` in app/layout.tsx is the machine-readable half of the
 * same claim, and /group/ is the human-readable half.
 *
 * `path` is the brand's hub page on this site, and is what mounts the visible
 * link (components/BrandSiteCard.tsx). A property with no `path` still belongs
 * to the group and still appears on /group/ and in the schema — it just has no
 * brand section here to link from.
 *
 * Add a property only once it is live and serving over valid HTTPS. A dangling
 * entry publishes a claim about a domain that does not answer, and a link to an
 * expired certificate is worse than no link.
 *
 * Deliberately absent: asus-repairer.com, acer-repairer.ir and dell-repairer.ir.
 * Those brands own two domains each, and pointing at both would recreate the
 * split this list is meant to close. The owner picked the domain kept here.
 */
export type GroupSite = {
  /** Domain root, with the trailing slash. */
  url: string;
  /** What the property calls itself. */
  name: string;
  /**
   * Where the brand-hub button and its in-text link point, when that should be
   * a page deeper than the domain root (e.g. the property's contact page).
   * `url` stays the root, because that is what /group/ and the schema name.
   */
  linkUrl?: string;
  /** Brand covered, or null for the two non-repair properties. */
  brand: string | null;
  /** Brand hub on this site, where one exists to carry the visible link. */
  path?: string;
  /** One factual line, taken from what the property actually publishes. */
  blurb: string;
};

export const GROUP_SITES: GroupSite[] = [
  {
    url: "https://apple-servise.ir/",
    name: "اپل سرویس",
    brand: "اپل",
    path: "/apple/",
    blurb: "تعمیر آیفون، مک بوک، آیپد و اپل واچ به تفکیک مدل.",
  },
  {
    url: "https://samsung-repairer.ir/",
    name: "نمایندگی تعمیرات سامسونگ",
    linkUrl: "https://samsung-repairer.ir/contact-us/",
    brand: "سامسونگ",
    path: "/samsung/",
    blurb: "تعمیر گوشی، تبلت، لپ تاپ و ساعت هوشمند سامسونگ.",
  },
  {
    url: "https://xiaomi-repair.ir/",
    name: "نمایندگی رسمی تعمیرات شیائومی",
    brand: "شیائومی",
    path: "/xiaomi/",
    blurb: "تعمیر گوشی و تبلت شیائومی، ردمی و پوکو.",
  },
  {
    url: "https://huawei-repairer.ir/",
    name: "نمایندگی تعمیرات هوآوی",
    brand: "هوآوی",
    path: "/huawei/",
    blurb: "تعمیر موبایل، تبلت و لپ تاپ هوآوی و آنر.",
  },
  {
    url: "https://asus-services.com/",
    name: "ایسوس سرویس",
    brand: "ایسوس",
    path: "/asus/",
    blurb: "تعمیر لپ تاپ، لپ تاپ گیمینگ و گوشی ایسوس.",
  },
  {
    url: "https://lenovo-repairer.ir/",
    name: "مرکز تخصصی تعمیرات لنوو",
    brand: "لنوو",
    path: "/lenovo/",
    blurb: "تعمیر لپ تاپ، تبلت و آل این وان لنوو.",
  },
  {
    url: "https://hp-services.org/",
    name: "نمایندگی اچ پی",
    brand: "اچ پی",
    path: "/hp/",
    blurb: "تعمیر لپ تاپ، پرینتر و مانیتور اچ پی.",
  },
  {
    url: "https://dell-services.ir/",
    name: "نمایندگی تعمیرات دل",
    brand: "دل",
    path: "/dell/",
    blurb: "تعمیر لپ تاپ، آل این وان و سیستم های دل.",
  },
  {
    url: "https://sony-services.com/",
    name: "نمایندگی تعمیرات SONY",
    brand: "سونی",
    path: "/sony/",
    blurb: "تعمیر لپ تاپ، تلویزیون، دوربین و پلی استیشن سونی.",
  },
  {
    url: "https://www.acer-services.org/",
    name: "نمایندگی تعمیرات ایسر",
    brand: "ایسر",
    // No `path`, but not for lack of a hub: /acer/ exists and ranks, it is just
    // frozen pre-rendered HTML in public/ rather than a Next route (see
    // docs/frozen-pages.md), so BrandSiteCard cannot mount on it. Its visible
    // link to acer-services.org is written by hand in public/acer/index.html,
    // and must be edited there if this URL ever changes.
    blurb: "تعمیر لپ تاپ ایسر، نیترو، اسپایر و پریدیتور.",
  },
  {
    url: "https://htc-service.org/",
    name: "نمایندگی تعمیرات اچ تی سی",
    brand: "اچ تی سی",
    path: "/htc/",
    blurb: "تعمیر موبایل، تبلت و ساعت هوشمند اچ تی سی.",
  },
  {
    url: "https://bartar-academy.com/",
    name: "آموزشگاه برتر",
    brand: null,
    blurb: "آموزشگاه تعمیرات موبایل و لپ تاپ، داخل همین کارگاه.",
  },
  {
    url: "https://bartar-janebi.com/",
    name: "برتر جانبی",
    brand: null,
    blurb: "فروش لوازم جانبی موبایل: پاوربانک، شارژر و گلس.",
  },
];

/**
 * The group sites that have a brand hub here, keyed by that hub's path. This is
 * what components/BrandSiteCard.tsx looks a page up in.
 */
export const BRAND_SITES: Record<string, GroupSite> = Object.fromEntries(
  GROUP_SITES.filter((s) => s.path).map((s) => [s.path as string, s])
);

// ---------- Physical branches ----------
// Single source of truth for the branch locator (components/ServiceCenters.tsx),
// the footer map and the LocalBusiness nodes. Never hardcode an embed URL in a
// component — build it with baladEmbedUrl() below.
export type Branch = {
  id: "central" | "west";
  /** Card heading, rendered as `name — area`. */
  name: string;
  area: string;
  address: string;
  phone: string;
  phoneHref: string;
  hours: string;
  geo: { lat: number; lng: number };
  /** Nearest metro stations, shown only where the branch has them. */
  metro?: string;
  /**
   * Balad POI token. Only the Motahari branch is registered on Balad; the
   * Saadat Abad branch falls back to a bare lat/lng pin. If the owner registers
   * it, add the token here and the map and "مشاهده در بلد" link follow.
   */
  baladPoi?: string;
  baladUrl?: string;
};

export const BRANCHES: Branch[] = [
  {
    id: "central",
    name: "شعبه مرکزی",
    area: "خیابان مطهری",
    address: SITE.address,
    phone: SITE.phone,
    phoneHref: SITE.phoneHref,
    hours: SITE.hours,
    geo: { lat: 35.723166, lng: 51.419674 },
    metro: "میرزای شیرازی، هفتم تیر، مفتح",
    baladPoi: "4TyjywJEshQMcD",
    baladUrl: SITE.mapCentral,
  },
  {
    id: "west",
    name: "شعبه غرب",
    area: "سعادت آباد، میدان کاج",
    address: SITE.addressWest,
    phone: SITE.phoneWest,
    phoneHref: SITE.phoneWestHref,
    hours: SITE.hours,
    geo: SITE.geoWest,
  },
];

/**
 * Balad's embed page reads exactly three query params: `p` (POI token),
 * `lat` and `lng`. A registered place gets the business card; anything else
 * gets a plain pin. The `#zoom/lat/lng` hash controls the viewport.
 */
export function baladEmbedUrl(branch: Branch, zoom = 16): string {
  const hash = `#${zoom}/${branch.geo.lat}/${branch.geo.lng}`;
  return branch.baladPoi
    ? `https://balad.ir/embed?p=${branch.baladPoi}${hash}`
    : `https://balad.ir/embed?lat=${branch.geo.lat}&lng=${branch.geo.lng}${hash}`;
}

/** Google Maps turn-by-turn link for a branch. */
export function directionsUrl(branch: Branch): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${branch.geo.lat},${branch.geo.lng}`;
}

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
  { value: "۱۵", label: "سال تجربه تخصصی" },
  { value: "۹۴٬۰۰۰", label: "دستگاه تعمیر شده" },
  { value: "۹۵٪", label: "رضایت مشتریان" },
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
