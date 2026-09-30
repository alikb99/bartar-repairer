// Who is credited for which page.
//
// The site had one anonymous "تیم فنی" byline on every article. That is the
// weakest possible E-E-A-T signal: a reader cannot tell whether an iPhone board
// guide was written by someone who repairs iPhone boards. This module maps each
// page to the ONE person in lib/team.ts whose owner-supplied specialty actually
// covers it, so the byline, the Person schema and the /team/<slug>/ profile all
// name the same real technician.
//
// Two hard rules:
//   1. The mapping is deterministic. Same page in, same person out, on every
//      build — a byline that flips between builds is worse than no byline.
//   2. Nobody is credited outside their owner-supplied specialty. The routing
//      table is derived from `topics` in lib/team.ts rather than written here,
//      so a person can never be given a subject the owner did not state.
//
// This file is pure (no `fs`, no import from lib/content.ts) so it can be used
// from any component; callers pass the few post fields it reads.

import { PEOPLE, type Person, type Topic } from "./team";

export type AuthorInput = {
  /** Page path, e.g. "/تعمیر-ال-سی-دی-لپتاپ-ایسوس/" */
  path: string;
  title: string;
  /** Resolved WordPress category names, when the caller has them. */
  categoryNames?: string[];
  /**
   * Which kind of page this is. Articles ("post") draw from a wider pool that
   * includes the content writers; service pages ("page") stay with the
   * technicians, because a service page describes work someone does rather
   * than an article someone wrote. Defaults to "page", the stricter pool.
   */
  kind?: "post" | "page";
};

// ---------------------------------------------------------------------------
// Per-page overrides
// ---------------------------------------------------------------------------
// The escape hatch for pages the keyword rules get wrong, and for pages the
// owner wants credited to a specific person regardless of subject. Key is the
// exact `path`, value is a `slug` from lib/team.ts. Checked before everything
// else. Add a line here rather than bending a rule below — the rules serve 850
// pages, and a special case for one of them breaks the other 849.
export const AUTHOR_OVERRIDES: Record<string, string> = {};

// ---------------------------------------------------------------------------
// Word boundaries for Persian
// ---------------------------------------------------------------------------
// JavaScript's \b is defined over [A-Za-z0-9_], so it does nothing useful next
// to Persian text: /برد/ happily matches inside "کاربردی", /قاب/ inside
// "قابلیت" and /فن/ inside "فناوری" and "تلفن". Left unhandled, a Windows
// shortcuts guide gets filed as board repair. These build a real boundary out
// of a lookaround over the Arabic block plus the Latin letters, and every short
// or ambiguous term below is wrapped in one.
const L = "\\u0600-\\u06FFa-zA-Z";
const w = (term: string) => `(?<![${L}])${term}(?![${L}])`;
const anyOf = (terms: string[]) => terms.join("|");

// ---------------------------------------------------------------------------
// Topic detection
// ---------------------------------------------------------------------------
// First match wins, so the ORDER of TOPIC_RULES is the policy:
//
//   software → watch → tablet → specialist phone brands → laptop → phone parts
//
// Software comes first deliberately: "چگونه روی لپ تاپ خود رمز بگذاریم" is a
// software question that merely mentions a laptop, and belongs to whoever does
// تعمیرات نرم افزاری, not to the person who replaces laptop LCDs. To stop that
// rule reaching too far, any hardware wording in the page vetoes it — an
// "آموزش تعویض باتری" is a hardware page written as a tutorial.
//
// Everything after that is device-first, which is how the workshop is actually
// organised: the device decides whose bench it lands on.

/** Hardware wording that disqualifies a page from the software bucket. */
const HARDWARE_VETO = new RegExp(
  anyOf([
    // Unambiguous multi-letter terms — safe without a boundary.
    "تعویض",
    "ارتقا",
    "قطعه",
    "قطعات",
    "گلس",
    "ال ?سی ?دی",
    "باتری",
    "مادر ?برد",
    "فلت",
    "هویه",
    "لولا",
    "کانکتور",
    "آی ?سی",
    "صفحه نمایش",
    "دوربین",
    "اسپیکر",
    "میکروفون",
    "خمیر سیلیکون",
    "درب پشت",
    "شاسی",
    "\\blcd\\b",
    // Short words that need a real boundary — see the note above.
    w("برد"),
    w("بردها"),
    w("قاب"),
    w("فن"),
    w("تاچ"),
    w("جک"),
  ]),
  "iu",
);

const TOPIC_RULES: { topic: Topic; re: RegExp }[] = [
  {
    // Operating systems, apps, accounts, settings, how-tos and tech news.
    // Deliberately excludes vague commercial words ("بهترین", "معرفی",
    // "مقایسه"): those appear in service-page titles such as
    // "بهترین مرکز تعمیر لپ تاپ" and would drag them out of their device.
    topic: "software",
    re: new RegExp(
      anyOf([
        "آموزش",
        "چگونه",
        "چطور",
        "راهنمای",
        "نرم ?افزار",
        "اپلیکیشن",
        "برنامه",
        "اندروید ?\\d",
        "\\bios ?\\d",
        "ویندوز",
        "\\bwindows\\b",
        "سیستم ?عامل",
        "آپدیت",
        "به ?روزرسانی",
        "ریست",
        "بازیابی",
        "بکاپ",
        "پشتیبان ?گیری",
        "فلش کردن",
        "ریکاوری",
        "اینستاگرام",
        "واتساپ",
        "تلگرام",
        "گوگل ?پلی",
        "پلی ?استور",
        "اکانت",
        "اپل ?آیدی",
        "پسورد",
        w("رمز"),
        w("قفل"),
        w("روت"),
        "وای ?فای",
        "بلوتوث",
        "هات ?اسپات",
        "\\bvpn\\b",
        "جی ?پی ?اس",
        "\\bgps\\b",
        "تنظیمات",
        "مخاطبین",
        "اسکرین ?شات",
        "ضبط مکالمه",
        "اخبار",
        "رونمایی",
        "هوش مصنوعی",
      ]),
      "iu",
    ),
  },
  {
    topic: "watch",
    re: new RegExp(
      anyOf([
        "ساعت ?هوشمند",
        "اپل ?واچ",
        "گلکسی ?واچ",
        "\\bwatch\\b",
        "مچ ?بند",
        "دستبند سلامتی",
      ]),
      "iu",
    ),
  },
  {
    topic: "tablet",
    re: new RegExp(
      anyOf([
        "تبلت",
        "\\btablet\\b",
        "آی ?پد",
        "\\bipad\\b",
        "گلکسی ?تب",
        "\\bgalaxy ?tab\\b",
        "سرفیس",
        "\\bsurface\\b",
      ]),
      "iu",
    ),
  },
  {
    // The three phone brands the owner named for this technician. They are
    // phones, so without this rule they fall through to the general mobile
    // buckets — keeping them out of there is the entire point.
    topic: "niche-phones",
    re: new RegExp(
      anyOf([
        "ناتینگ ?فون",
        "\\bnothing\\b",
        "گوگل ?پیکسل",
        w("پیکسل"),
        "\\bpixel\\b",
        "نوکیا",
        "\\bnokia\\b",
      ]),
      "iu",
    ),
  },
  {
    topic: "laptop",
    re: new RegExp(
      anyOf([
        "لپ ?تاپ",
        "\\blaptop\\b",
        "نوت ?بوک",
        "\\bnotebook\\b",
        "مک ?بوک",
        "\\bmacbook\\b",
        "مانیتور",
        "\\bmonitor\\b",
        "آی ?مک",
        "\\bimac\\b",
        "کامپیوتر",
        "\\bpc\\b",
        "کیبورد",
        "تاچ ?پد",
        "\\bultrabook\\b",
        "\\bnitro\\b",
        "\\baspire\\b",
        "\\bpredator\\b",
        "\\bvaio\\b",
        "\\bthinkpad\\b",
        "\\bideapad\\b",
        "\\bprobook\\b",
        "\\belitebook\\b",
        "\\bpavilion\\b",
        "\\bvictus\\b",
        "\\bomen\\b",
        "\\brog\\b",
        "\\btuf\\b",
        "\\bzenbook\\b",
        "\\bvivobook\\b",
        "\\binspiron\\b",
        "\\blatitude\\b",
        "\\bxps\\b",
      ]),
      "iu",
    ),
  },
  {
    // Phone work whose owner-supplied description is "تعویض قطعات".
    topic: "mobile-parts",
    re: new RegExp(
      anyOf([
        "تعویض",
        "گلس",
        "ال ?سی ?دی",
        "\\blcd\\b",
        "باتری",
        "\\bbattery\\b",
        "درب پشت",
        "شاسی",
        "دوربین",
        "اسپیکر",
        "میکروفون",
        "صفحه نمایش",
        "گوریلا ?گلس",
        "فلت",
        w("قاب"),
        w("تاچ"),
      ]),
      "iu",
    ),
  },
];

/** The bucket every page that matched nothing lands in. */
const FALLBACK_TOPIC: Topic = "mobile";

function haystack(input: AuthorInput): string {
  let p = input.path;
  try {
    p = decodeURIComponent(p);
  } catch {
    /* keep the raw path */
  }
  return (
    [input.title, p.replace(/[-/]+/g, " "), ...(input.categoryNames ?? [])]
      .join(" ")
      // The database mixes ZWNJ and plain spaces in the same phrase; the rules
      // above are written with plain spaces, so normalise before matching.
      .replace(/‌/g, " ")
  );
}

export function topicFor(input: AuthorInput): Topic {
  const hay = haystack(input);
  const hardware = HARDWARE_VETO.test(hay);
  for (const rule of TOPIC_RULES) {
    if (rule.topic === "software" && hardware) continue;
    if (rule.re.test(hay)) return rule.topic;
  }
  return FALLBACK_TOPIC;
}

// ---------------------------------------------------------------------------
// Topic → person
// ---------------------------------------------------------------------------
// Built from `topics` in lib/team.ts, so this table cannot drift from the
// owner-supplied specialties: adding a person there (a content writer, say)
// puts them in the rotation for their topics and nowhere else.
const ROSTER: Record<Topic, Person[]> = {
  mobile: [],
  "mobile-parts": [],
  laptop: [],
  tablet: [],
  watch: [],
  "niche-phones": [],
  software: [],
};
for (const person of PEOPLE) {
  for (const t of person.topics ?? []) ROSTER[t].push(person);
}

// The pool used for ARTICLES only. It is the technician roster above plus each
// writer's `articleTopics` — the writers produce the guides but do not repair,
// so they are credited on articles and never on a service page. Writers are
// appended after the technicians rather than merged in, so adding a writer
// cannot reshuffle who the existing technicians are credited for beyond the
// even split itself.
const ARTICLE_ROSTER: Record<Topic, Person[]> = {
  mobile: [...ROSTER.mobile],
  "mobile-parts": [...ROSTER["mobile-parts"]],
  laptop: [...ROSTER.laptop],
  tablet: [...ROSTER.tablet],
  watch: [...ROSTER.watch],
  "niche-phones": [...ROSTER["niche-phones"]],
  software: [...ROSTER.software],
};
for (const person of PEOPLE) {
  for (const t of person.articleTopics ?? []) ARTICLE_ROSTER[t].push(person);
}

// When two people cover the same topic — the workshop has two laptop
// technicians with an identical owner-supplied specialty, and two people who do
// تعمیرات نرم افزاری — pages are split evenly and *stably* by hashing the path.
// Not alphabetically, not round-robin over an array whose order can change: the
// same URL must resolve to the same person on every build, and keep doing so
// after an unrelated page is added or removed.
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * The one person credited for a page, or null when nobody covers its topic
 * (possible only if a topic is left unstaffed in lib/team.ts — callers then
 * fall back to the sitewide team byline rather than inventing an author).
 */
export function authorFor(input: AuthorInput): Person | null {
  const override = AUTHOR_OVERRIDES[input.path];
  if (override) {
    const person = PEOPLE.find((p) => p.slug === override);
    if (person) return person;
  }
  const topic = topicFor(input);
  const pool = input.kind === "post" ? ARTICLE_ROSTER[topic] : ROSTER[topic];
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];
  return pool[fnv1a(input.path) % pool.length];
}

/** Persian label for a topic, used as a section heading on a profile. */
export const TOPIC_LABEL: Record<Topic, string> = {
  mobile: "تعمیر گوشی موبایل",
  "mobile-parts": "تعویض قطعات گوشی",
  laptop: "تعمیر لپ تاپ و مانیتور",
  tablet: "تعمیر تبلت",
  watch: "تعمیر ساعت هوشمند",
  "niche-phones": "ناتینگ فون، پیکسل و نوکیا",
  software: "تعمیرات نرم افزاری و آموزش",
};
