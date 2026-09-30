// Differences between the deployed 2026-08-16 site and the current build that
// are deliberate, with the reason for each. verify-against-live.mjs consults
// this file to split "we changed this on purpose" from "the rebuild lost this".
//
// Nothing here is hidden: an accepted difference is still printed, still
// counted, and still listed per page. Accepting it only means it does not fail
// the check. Delete an entry and the difference reappears as UNRESOLVED.
//
// RULE FOR THIS FILE: an entry needs a reason a person can check. "It looked
// fine" is not one. If you cannot say why the new behaviour is correct, the
// difference is a regression and belongs in the fix list instead.

/** Official profile URLs, old (deployed) → why the new one replaced it. */
const SOCIAL_HOSTS =
  /(instagram\.com|t\.me\/|aparat\.com|x\.com|facebook\.com|linkedin\.com|pinterest\.com|wa\.me|youtube\.com)/;

/** Blank out every "sameAs":[…] list so the rest of the node can be compared. */
const stripSameAs = (node) =>
  node.replace(/"sameAs":\[[^\]]*\]/g, '"sameAs":[]');

export const ACCEPTED = [
  {
    id: "social-profile-urls",
    axes: ["links", "schema"],
    reason:
      "Social profile URLs were canonicalised after the 2026-08-16 deploy. " +
      "The live build carries an Instagram share link with a rotating ?igsh= " +
      "token and a Facebook /people/…/pfbid… URL that eventually 404s; both " +
      "are replaced by the form the platform itself canonicalises to. Telegram, " +
      "Aparat, X, LinkedIn and Pinterest were added. sameAs is an identity " +
      "claim, so a stable URL is the whole point.",
    // links: a bare profile URL on one side or the other.
    matches: (value) => SOCIAL_HOSTS.test(value),
    // schema: two versions of the SAME @id node are accepted only when
    // blanking every sameAs array makes them identical. Testing "does this
    // node mention instagram.com" would wave through a node that changed its
    // prices as well, which is exactly the kind of miss this file exists to
    // prevent.
    matchesNodePair: (live, build) =>
      stripSameAs(live) === stripSameAs(build),
  },
  {
    id: "href-less-anchors",
    axes: ["links"],
    reason:
      "The WordPress export lost the href on 108 anchors across 49 pages — " +
      "45 bare <a> around a branch address, 59 <a tabindex=\"0\"> from the old " +
      "theme, one anchor pasted in without its URL, three with href=\"\" — and " +
      "the deployed site " +
      "still ships them. An <a> with no href does nothing when clicked, is " +
      "still announced as a link by screen readers, and hands a crawler a " +
      "dangling anchor. cleanContent now renders each as a plain <span>, so " +
      "these entries exist only on the live side. Nothing else moved: the " +
      "text, headings, images and schema axes are identical on all 49 pages, " +
      "which is the check that would catch a wrong replacement.",
    // A link entry is "<href> :: <label>"; an empty href means the anchor had
    // none. Only ever matches on the live side, because the build no longer
    // emits such an anchor at all.
    matches: (value) => value.startsWith(" :: "),
  },
  {
    id: "related-link-anchor-text",
    axes: ["links"],
    reason:
      "The deployed site truncated related-article anchor text at about 45 " +
      "characters; the rebuild renders the full post title. The cards already " +
      "clamp visually with line-clamp-1, so nothing overflows, and full " +
      "descriptive anchor text carries more internal-link signal than a " +
      "sentence cut mid-word. Same href, longer label — no link was gained " +
      "or lost.",
    // Same URL on both sides, and the live label is a prefix of the build one.
    matchesPair: (href, live, build) =>
      build.startsWith(live) && live.length > 0 && live.length < build.length,
  },
  {
    id: "heading-level-normalisation",
    axes: ["headings"],
    reason:
      "WordPress bodies pick heading sizes by eye, so a section headed <h2> " +
      "often has its sub-headings at <h4>, and some bodies open at <h3> under " +
      "the page's <h1>. levelHeadings() closes those gaps: every heading is " +
      "emitted one level below its nearest surviving ancestor and never " +
      "deeper than it already was. The outline a crawler and a screen reader " +
      "read now matches the one a reader sees.",
    // Whole-axis check, because a per-entry one could not tell a re-levelled
    // heading from a lost one. Every heading must still be there, with the
    // same text, at the same or a shallower level — one deleted heading, one
    // edited word, or one heading pushed deeper and this returns false.
    matchesList: (onlyLive, onlyBuild) => {
      if (onlyLive.length !== onlyBuild.length) return false;
      const text = (h) => h.slice(h.indexOf(": ") + 2);
      const level = (h) => Number(h[1]);
      const rest = [...onlyBuild];
      for (const live of onlyLive) {
        const i = rest.findIndex(
          (b) => text(b) === text(live) && level(b) <= level(live),
        );
        if (i < 0) return false;
        rest.splice(i, 1);
      }
      return true;
    },
  },
];

/**
 * Page-specific edits: the exact deployed value and the exact value that
 * replaced it. A rule in ACCEPTED says "this KIND of difference is fine
 * anywhere"; an entry here says "this ONE difference, on this ONE page, is
 * fine, and here is what it was before". It is the only way a scalar axis
 * (title, description, canonical, robots) can be accepted, because a scalar
 * has no entries to pattern-match — quoting both values in full is the check.
 *
 * `live: null` means the build adds something the deployed site does not have;
 * `build: null` means it drops something. Anything on the page beyond what is
 * listed here is still unexplained, and the page is still UNRESOLVED.
 */
// Five article bodies carried an <h2></h2> — a heading block whose text the
// editor deleted but whose block stayed. It rendered as a blank numbered row in
// the on-page table of contents ("۴." with nothing after it), and as a heading
// with no name to a screen reader. cleanContent drops empty headings now, which
// removes the blank row and renumbers the rows below it. The entries below were
// generated from the measured diff, not typed, so they quote the exact before
// and after on each of the five pages.
const TOC_REASON =
  "An empty <h2> left a blank numbered row in this page's table of contents. " +
  "Removing it renumbers the rows below — no section was added, removed or " +
  "renamed, and every anchor still points at the same heading.";

// Four more article bodies had a picture dropped into a heading block —
// <h2><img …></h2> — which is a heading with no name. The image is kept and
// only its heading wrapper goes, which takes another blank row out of the
// contents list. Generated from the measured diff, same as TOC_REASON above.
const IMG_H2_REASON =
  "An <h2> that contained nothing but an image put a blank numbered row in " +
  "this page's table of contents. The image stays where it is; only the " +
  "heading wrapper around it is gone, so the rows below renumber and no " +
  "section was added, removed or renamed.";

export const EDITS = [
  {
    id: "title-rewrite-about",
    page: "about/index.html",
    axis: "title",
    live: "درباره ی ما | برتر سرویس",
    build: "درباره برتر سرویس | ۱۵ سال تعمیر تخصصی موبایل و لپ تاپ در تهران",
    reason:
      "24 characters, half of them the brand suffix, on a page that is one of " +
      "the site's main trust signals. The new title says how long the shop " +
      "has been trading and what it repairs.",
  },
  {
    id: "title-rewrite-services",
    page: "services/index.html",
    axis: "title",
    live: "خدمات | برتر سرویس",
    build: "خدمات تعمیرات برتر سرویس | موبایل، لپ تاپ، تبلت و لوازم خانگی",
    reason:
      "18 characters — the shortest title on the site, and the single word " +
      "\"خدمات\" matches no query anyone types. The new one names the four " +
      "device categories the page actually lists.",
  },
  {
    id: "title-rewrite-apple-parts",
    page: "apple-mobile-part/index.html",
    axis: "title",
    live: "قطعات اپل | برتر سرویس",
    build: "قطعات اصل موبایل اپل | تشخیص قطعه اورجینال و گارانتی تعویض",
    reason:
      "22 characters. The page is about telling a genuine Apple part from a " +
      "copy, which the old title never said.",
  },
  {
    id: "meta-desc-mobile-repair-online",
    page: "mobile-repair-online/index.html",
    axis: "description",
    live: "تعمیر موبایل بدون مراجعه حضوری: درخواست را آنلاین ثبت کنید، پیک رایگان همان روز دستگاه را می گیرد، هزینه پیش از تعمیر اعلام می شود و با همان پیک برمی گردد. ۶ ماه گارانتی کتبی.",
    build: "تعمیر موبایل بدون مراجعه حضوری: آنلاین ثبت کنید، پیک رایگان همان روز دستگاه را می برد و برمی گرداند، هزینه پیش از تعمیر اعلام می شود. ۶ ماه گارانتی کتبی.",
    reason:
      "175 characters, so Google cut it mid-clause and the گارانتی never " +
      "showed. 153 now, same promise, nothing dropped.",
  },
  {
    id: "acer-projector-icon-alt",
    page: "acer/index.html",
    axis: "images",
    live: "assets/icons/projector.webp :: ",
    build: "assets/icons/projector.webp :: آیکن تعمیر ویدئو پرژکتور ایسر",
    reason:
      "The only image on the site with an empty alt. Its five sibling icons " +
      "on the same page all read \"آیکن تعمیر <device> ایسر\"; this card's " +
      "was left blank. The device name comes from the card's own <h3>.",
  },
  {
    id: "blog-breadcrumb",
    page: "blog/index.html",
    axis: "schema",
    live: null,
    build: '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","item":"https://bartar-repairer.com","name":"خانه","position":1},{"@type":"ListItem","item":"https://bartar-repairer.com/blog/","name":"مقالات و راهنماهای تعمیرات","position":2}]}',
    reason:
      "/blog/ was the one indexable page on the site with no BreadcrumbList, " +
      "because it is a route of its own rather than a post going through " +
      "[...slug]. Added, nothing else on the page touched.",
  },
  {
    id: "empty-h2-complete-guide-to-fixing-t",
    page: "complete-guide-to-fixing-the-problem-of-iphone-not-connecting-to-wi-fi/index.html",
    axis: "text",
    at: 434,
    live: "ده تخصص تکنسین ها در این مقاله می خوانید ۱. سه دلیل اصلی ۲. ۳. راه حل های سریع و اولیه ۴. تنظیمات پیشرفته و سیستمیک ۵. عیب یابی روتر/مودم و نکات تخصصی",
    build: "ده تخصص تکنسین ها در این مقاله می خوانید ۱. سه دلیل اصلی ۲. راه حل های سریع و اولیه ۳. تنظیمات پیشرفته و سیستمیک ۴. عیب یابی روتر/مودم و نکات تخصصی ۵.",
    liveChars: 8747,
    buildChars: 8744,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-complete-guide-to-fixing-t",
    page: "complete-guide-to-fixing-the-problem-of-iphone-not-connecting-to-wi-fi/index.html",
    axis: "links",
    live: "#sec-2 :: ۲.",
    build: "#sec-2 :: ۲. راه حل های سریع و اولیه",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-complete-guide-to-fixing-t",
    page: "complete-guide-to-fixing-the-problem-of-iphone-not-connecting-to-wi-fi/index.html",
    axis: "links",
    live: "#sec-3 :: ۳. راه حل های سریع و اولیه",
    build: "#sec-3 :: ۳. تنظیمات پیشرفته و سیستمیک",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-complete-guide-to-fixing-t",
    page: "complete-guide-to-fixing-the-problem-of-iphone-not-connecting-to-wi-fi/index.html",
    axis: "links",
    live: "#sec-4 :: ۴. تنظیمات پیشرفته و سیستمیک",
    build: "#sec-4 :: ۴. عیب یابی روتر/مودم و نکات تخصصی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-complete-guide-to-fixing-t",
    page: "complete-guide-to-fixing-the-problem-of-iphone-not-connecting-to-wi-fi/index.html",
    axis: "links",
    live: "#sec-5 :: ۵. عیب یابی روتر/مودم و نکات تخصصی",
    build: "#sec-5 :: ۵. چه زمانی نیاز به تعمیرکار دارید؟",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-complete-guide-to-fixing-t",
    page: "complete-guide-to-fixing-the-problem-of-iphone-not-connecting-to-wi-fi/index.html",
    axis: "links",
    live: "#sec-6 :: ۶. چه زمانی نیاز به تعمیرکار دارید؟",
    build: "#sec-6 :: ۶. به روزرسانی کاربردی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-complete-guide-to-fixing-t",
    page: "complete-guide-to-fixing-the-problem-of-iphone-not-connecting-to-wi-fi/index.html",
    axis: "links",
    live: "#sec-7 :: ۷. به روزرسانی کاربردی",
    build: null,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-clean-your-phone-wi",
    page: "how-to-clean-your-phone-without-erasing-data/index.html",
    axis: "text",
    at: 635,
    live: "سی مرورگر و فایل های دانلودی ۶. بروزرسانی اندروید یا iOS ۷. ۸. بک آپ هوشمند قبل از هر اقدام ۹. پیشگیری؛ بهترین روش ویروس کشی ممکن است برایتان پیش آمده",
    build: "سی مرورگر و فایل های دانلودی ۶. بروزرسانی اندروید یا iOS ۷. بک آپ هوشمند قبل از هر اقدام ۸. پیشگیری؛ بهترین روش ویروس کشی ممکن است برایتان پیش آمده با",
    liveChars: 7055,
    buildChars: 7052,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-clean-your-phone-wi",
    page: "how-to-clean-your-phone-without-erasing-data/index.html",
    axis: "links",
    live: "#sec-7 :: ۷.",
    build: "#sec-7 :: ۷. بک آپ هوشمند قبل از هر اقدام",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-clean-your-phone-wi",
    page: "how-to-clean-your-phone-without-erasing-data/index.html",
    axis: "links",
    live: "#sec-8 :: ۸. بک آپ هوشمند قبل از هر اقدام",
    build: "#sec-8 :: ۸. پیشگیری؛ بهترین روش ویروس کشی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-clean-your-phone-wi",
    page: "how-to-clean-your-phone-without-erasing-data/index.html",
    axis: "links",
    live: "#sec-9 :: ۹. پیشگیری؛ بهترین روش ویروس کشی",
    build: null,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "text",
    at: 624,
    live: "است؟ ۳. بهترین روش اتصال لپ تاپ به تلویزیون (پیشنهاد ما) ۴. ۵. اگر لپ تاپ HDMI نداشت چه کار کنیم؟ ۶. اتصال بیسیم لپ تاپ به تلویزیون با بلوتوث (بدون کا",
    build: "است؟ ۳. بهترین روش اتصال لپ تاپ به تلویزیون (پیشنهاد ما) ۴. اگر لپ تاپ HDMI نداشت چه کار کنیم؟ ۵. اتصال بیسیم لپ تاپ به تلویزیون با بلوتوث (بدون کابل)",
    liveChars: 12714,
    buildChars: 12702,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-4 :: ۴.",
    build: "#sec-4 :: ۴. اگر لپ تاپ HDMI نداشت چه کار کنیم؟",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-5 :: ۵. اگر لپ تاپ HDMI نداشت چه کار کنیم؟",
    build: "#sec-5 :: ۵. اتصال بیسیم لپ تاپ به تلویزیون با بلوتوث (بدون کابل)",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-6 :: ۶. اتصال بیسیم لپ تاپ به تلویزیون با بلوتوث (بدون کابل)",
    build: "#sec-6 :: ۶. روش های قدیمی تر (VGA) — فقط در مواقع ضروری",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-7 :: ۷.",
    build: "#sec-7 :: ۷. تنظیمات مهم بعد از اتصال لپ تاپ به تلویزیون",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-8 :: ۸. روش های قدیمی تر (VGA) — فقط در مواقع ضروری",
    build: "#sec-8 :: ۸. مشکلات رایج + تشخیص سریع (از نگاه تعمیرکار)",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-9 :: ۹. تنظیمات مهم بعد از اتصال لپ تاپ به تلویزیون",
    build: "#sec-9 :: ۹. چه زمانی مشکل از لپ تاپ است و نیاز به تعمیر دارد؟",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-10 :: ۱۰. مشکلات رایج + تشخیص سریع (از نگاه تعمیرکار)",
    build: "#sec-10 :: ۱۰. بررسی دقیق تر دلایل وصل نشدن لپ تاپ به تلویزیون (از ساده تا تخصصی)",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-11 :: ۱۱. چه زمانی مشکل از لپ تاپ است و نیاز به تعمیر دارد؟",
    build: "#sec-11 :: ۱۱. چه زمانی حتماً باید لپ تاپ بررسی و تعمیر شود؟",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-12 :: ۱۲. بررسی دقیق تر دلایل وصل نشدن لپ تاپ به تلویزیون (از ساده تا تخصصی)",
    build: "#sec-12 :: ۱۲. این مقاله چه کمکی به شما میکند؟ (از نگاه خدمات تعمیرات)",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-13 :: ۱۳.",
    build: "#sec-13 :: ۱۳. جمع بندی نهایی و کاربردی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-14 :: ۱۴. چه زمانی حتماً باید لپ تاپ بررسی و تعمیر شود؟",
    build: "#sec-14 :: ۱۴. سوالات متداول (FAQ) در اتصال تلویزیون به لپ تاپ",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-15 :: ۱۵. این مقاله چه کمکی به شما میکند؟ (از نگاه خدمات تعمیرات)",
    build: null,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-16 :: ۱۶. جمع بندی نهایی و کاربردی",
    build: null,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-how-to-connect-laptop-to-t",
    page: "how-to-connect-laptop-to-tv/index.html",
    axis: "links",
    live: "#sec-17 :: ۱۷. سوالات متداول (FAQ) در اتصال تلویزیون به لپ تاپ",
    build: null,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "text",
    at: 758,
    live: ". مزایای استفاده از خدمات تعمیر تبلت اچ پی در برتر سرویس ۴. ۵. شعبات حضوری تعمیرات تبلت برتر سرویس ۶. مراحل تعمیر تبلت اچ پی در برتر سرویس ۷. خدمات تع",
    build: ". مزایای استفاده از خدمات تعمیر تبلت اچ پی در برتر سرویس ۴. شعبات حضوری تعمیرات تبلت برتر سرویس ۵. مراحل تعمیر تبلت اچ پی در برتر سرویس ۶. خدمات تعمیر",
    liveChars: 19147,
    buildChars: 19141,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-4 :: ۴.",
    build: "#sec-4 :: ۴. شعبات حضوری تعمیرات تبلت برتر سرویس",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-5 :: ۵. شعبات حضوری تعمیرات تبلت برتر سرویس",
    build: "#sec-5 :: ۵. مراحل تعمیر تبلت اچ پی در برتر سرویس",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-6 :: ۶. مراحل تعمیر تبلت اچ پی در برتر سرویس",
    build: "#sec-6 :: ۶. خدمات تعمیرات تبلت اچ پی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-7 :: ۷. خدمات تعمیرات تبلت اچ پی",
    build: "#sec-7 :: ۷. هزینه تعمیرات تبلت اچ پی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-8 :: ۸. هزینه تعمیرات تبلت اچ پی",
    build: "#sec-8 :: ۸. تعمیرات شکستگی تاچ و ال سی دی تبلت اچ پی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-9 :: ۹. تعمیرات شکستگی تاچ و ال سی دی تبلت اچ پی",
    build: "#sec-9 :: ۹. رفع مشکل نصب نشدن نرم افزار بر روی تبلت اچ پی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-10 :: ۱۰. رفع مشکل نصب نشدن نرم افزار بر روی تبلت اچ پی",
    build: "#sec-10 :: ۱۰. تعمیرات سوکت شارژ تبلت اچ پی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-11 :: ۱۱. تعمیرات سوکت شارژ تبلت اچ پی",
    build: "#sec-11 :: ۱۱. رفع مشکل روشن نشدن تبلت اچ پی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-12 :: ۱۲. رفع مشکل روشن نشدن تبلت اچ پی",
    build: "#sec-12 :: ۱۲. مشکلات سخت افزاری و نرم افزاری تبلت اچ پی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-13 :: ۱۳. مشکلات سخت افزاری و نرم افزاری تبلت اچ پی",
    build: "#sec-13 :: ۱۳. تعمیرات تخصصی تبلت اچ پی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-14 :: ۱۴. تعمیرات تخصصی تبلت اچ پی",
    build: "#sec-14 :: ۱۴. شعب نمایندگی تعمیرات تبلت اچ پی در تهران",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-15 :: ۱۵. شعب نمایندگی تعمیرات تبلت اچ پی در تهران",
    build: "#sec-15 :: ۱۵. سوالات متداول کاربران تبلت اچ پی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: "#sec-16 :: ۱۶. سوالات متداول کاربران تبلت اچ پی",
    build: null,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-tablet",
    page: "hp/tablet/index.html",
    axis: "links",
    live: " :: خیابان گلبرگ غربی، بعد از میدان هلال احمر",
    build: null,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "text",
    at: 488,
    live: "م؟ ۲. بررسی نوع هارد فعلی لپ تاپ ۳. انتخاب بین SSD و HDD ۴. ۵. تهیه ابزار و تجهیزات لازم ۶. پشتیبان گیری از اطلاعات ۷. باز کردن قاب و جدا کردن هارد قد",
    build: "م؟ ۲. بررسی نوع هارد فعلی لپ تاپ ۳. انتخاب بین SSD و HDD ۴. تهیه ابزار و تجهیزات لازم ۵. پشتیبان گیری از اطلاعات ۶. باز کردن قاب و جدا کردن هارد قدیمی",
    liveChars: 9165,
    buildChars: 9161,
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-4 :: ۴.",
    build: "#sec-4 :: ۴. تهیه ابزار و تجهیزات لازم",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-5 :: ۵. تهیه ابزار و تجهیزات لازم",
    build: "#sec-5 :: ۵. پشتیبان گیری از اطلاعات",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-6 :: ۶. پشتیبان گیری از اطلاعات",
    build: "#sec-6 :: ۶. باز کردن قاب و جدا کردن هارد قدیمی",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-7 :: ۷. باز کردن قاب و جدا کردن هارد قدیمی",
    build: "#sec-7 :: ۷. نصب هارد جدید",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-8 :: ۸. نصب هارد جدید",
    build: "#sec-8 :: ۸. نصب یا انتقال سیستم عامل",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-9 :: ۹. نصب یا انتقال سیستم عامل",
    build: "#sec-9 :: ۹. بهینه سازی و تست عملکرد",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-10 :: ۱۰. بهینه سازی و تست عملکرد",
    build: "#sec-10 :: ۱۰. نکات مهم پس از ارتقا هارد لپ تاپ",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-11 :: ۱۱. نکات مهم پس از ارتقا هارد لپ تاپ",
    build: "#sec-11 :: ۱۱. ارتقا هارد لپ تاپ در مراکز تخصصی تعمیرات",
    reason: TOC_REASON,
  },
  {
    id: "empty-h2-step-by-step-tutorial-on-u",
    page: "step-by-step-tutorial-on-upgrading-a-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-12 :: ۱۲. ارتقا هارد لپ تاپ در مراکز تخصصی تعمیرات",
    build: null,
    reason: TOC_REASON,
  },
  {
    id: "img-h2-causes-of-burning-laptop-h",
    page: "causes-of-burning-laptop-hard-drive/index.html",
    axis: "text",
    at: 434,
    live: "کنسین ها در این مقاله می خوانید ۱. علت سوختن هارد لپ تاپ ۲. ۳. سوختن هارد لپ تاپ در اثر ضربه و شوک ۴. ۵. سوختن هارد لپ تاپ در اثر نوسانات برق ۶. سوختن",
    build: "کنسین ها در این مقاله می خوانید ۱. علت سوختن هارد لپ تاپ ۲. سوختن هارد لپ تاپ در اثر ضربه و شوک ۳. سوختن هارد لپ تاپ در اثر نوسانات برق ۴. سوختن هارد ",
    liveChars: 11151,
    buildChars: 11145,
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-causes-of-burning-laptop-h",
    page: "causes-of-burning-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-2 :: ۲.",
    build: "#sec-2 :: ۲. سوختن هارد لپ تاپ در اثر ضربه و شوک",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-causes-of-burning-laptop-h",
    page: "causes-of-burning-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-3 :: ۳. سوختن هارد لپ تاپ در اثر ضربه و شوک",
    build: "#sec-3 :: ۳. سوختن هارد لپ تاپ در اثر نوسانات برق",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-causes-of-burning-laptop-h",
    page: "causes-of-burning-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-4 :: ۴.",
    build: "#sec-4 :: ۴. سوختن هارد لپ تاپ در اثر گرمای بیش از حد",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-causes-of-burning-laptop-h",
    page: "causes-of-burning-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-5 :: ۵. سوختن هارد لپ تاپ در اثر نوسانات برق",
    build: "#sec-5 :: ۵. سوختن هارد لپ تاپ در اثر استفاده طولانی مدت",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-causes-of-burning-laptop-h",
    page: "causes-of-burning-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-6 :: ۶. سوختن هارد لپ تاپ در اثر گرمای بیش از حد",
    build: "#sec-6 :: ۶. سوختن هارد لپ تاپ در اثر خرابی نرم افزاری",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-causes-of-burning-laptop-h",
    page: "causes-of-burning-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-7 :: ۷. سوختن هارد لپ تاپ در اثر استفاده طولانی مدت",
    build: "#sec-7 :: ۷. سوالات متداول درباره علت سوختن هارد لپ تاپ",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-causes-of-burning-laptop-h",
    page: "causes-of-burning-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-8 :: ۸. سوختن هارد لپ تاپ در اثر خرابی نرم افزاری",
    build: null,
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-causes-of-burning-laptop-h",
    page: "causes-of-burning-laptop-hard-drive/index.html",
    axis: "links",
    live: "#sec-9 :: ۹. سوالات متداول درباره علت سوختن هارد لپ تاپ",
    build: null,
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-dell-laptop-beeping",
    page: "dell-laptop-beeping/index.html",
    axis: "text",
    at: 466,
    live: "های رفع بوق زدن لپ تاپ ۳. معنی الگوهای بوق زدن لپ تاپ دل ۴. ۵. آیا بوق زدن لپ تاپ دل خطرناک است؟ ۶. نمایندگی تعمیرات رسمی لپ تاپ دل ۷. کلام آخر ۸. سوا",
    build: "های رفع بوق زدن لپ تاپ ۳. معنی الگوهای بوق زدن لپ تاپ دل ۴. آیا بوق زدن لپ تاپ دل خطرناک است؟ ۵. نمایندگی تعمیرات رسمی لپ تاپ دل ۶. کلام آخر ۷. سوالات",
    liveChars: 12162,
    buildChars: 12159,
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-dell-laptop-beeping",
    page: "dell-laptop-beeping/index.html",
    axis: "links",
    live: "#sec-4 :: ۴.",
    build: "#sec-4 :: ۴. آیا بوق زدن لپ تاپ دل خطرناک است؟",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-dell-laptop-beeping",
    page: "dell-laptop-beeping/index.html",
    axis: "links",
    live: "#sec-5 :: ۵. آیا بوق زدن لپ تاپ دل خطرناک است؟",
    build: "#sec-5 :: ۵. نمایندگی تعمیرات رسمی لپ تاپ دل",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-dell-laptop-beeping",
    page: "dell-laptop-beeping/index.html",
    axis: "links",
    live: "#sec-6 :: ۶. نمایندگی تعمیرات رسمی لپ تاپ دل",
    build: "#sec-6 :: ۶. کلام آخر",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-dell-laptop-beeping",
    page: "dell-laptop-beeping/index.html",
    axis: "links",
    live: "#sec-7 :: ۷. کلام آخر",
    build: "#sec-7 :: ۷. سوالات متداول درباره صدای بوق لپ تاپ دل (Dell)",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-dell-laptop-beeping",
    page: "dell-laptop-beeping/index.html",
    axis: "links",
    live: "#sec-8 :: ۸. سوالات متداول درباره صدای بوق لپ تاپ دل (Dell)",
    build: null,
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-mi-11-ultra-lcd-replacemen",
    page: "mi-11-ultra-lcd-replacement/index.html",
    axis: "text",
    at: 616,
    live: "لام می شود. فهرست این صفحه ۱. تعویض ال سی دی Mi 11 Ultra ۲. ۳. قیمت تعویض ال سی دی Mi 11 Ultra چقدر است؟ ۴. ۵. قیمت تعویض ال سی دی Mi 11 Ultra چقدر اس",
    build: "لام می شود. فهرست این صفحه ۱. تعویض ال سی دی Mi 11 Ultra ۲. قیمت تعویض ال سی دی Mi 11 Ultra چقدر است؟ ۳. قیمت تعویض ال سی دی Mi 11 Ultra چقدر است؟ ۴. ",
    liveChars: 9460,
    buildChars: 9454,
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-mi-11-ultra-lcd-replacemen",
    page: "mi-11-ultra-lcd-replacement/index.html",
    axis: "links",
    live: "#sec-2 :: ۲.",
    build: "#sec-2 :: ۲. قیمت تعویض ال سی دی Mi 11 Ultra چقدر است؟",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-mi-11-ultra-lcd-replacemen",
    page: "mi-11-ultra-lcd-replacement/index.html",
    axis: "links",
    live: "#sec-4 :: ۴.",
    build: "#sec-4 :: ۴. دیگر خدمات تعمیر می 11 اولترا",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-mi-11-ultra-lcd-replacemen",
    page: "mi-11-ultra-lcd-replacement/index.html",
    axis: "links",
    live: "#sec-5 :: ۵. قیمت تعویض ال سی دی Mi 11 Ultra چقدر است؟",
    build: "#sec-5 :: ۵. علائم خرابی تاچ و ال سی دی Mi 11 Ultra",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-mi-11-ultra-lcd-replacemen",
    page: "mi-11-ultra-lcd-replacement/index.html",
    axis: "links",
    live: "#sec-6 :: ۶. دیگر خدمات تعمیر می 11 اولترا",
    build: "#sec-6 :: ۶. تعمیر ال سی دی Mi 11 Ultra",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-mi-11-ultra-lcd-replacemen",
    page: "mi-11-ultra-lcd-replacement/index.html",
    axis: "links",
    live: "#sec-7 :: ۷. علائم خرابی تاچ و ال سی دی Mi 11 Ultra",
    build: null,
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-mi-11-ultra-lcd-replacemen",
    page: "mi-11-ultra-lcd-replacement/index.html",
    axis: "links",
    live: "#sec-8 :: ۸. تعمیر ال سی دی Mi 11 Ultra",
    build: null,
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-remove-google-play-ads-on-",
    page: "remove-google-play-ads-on-xiaomi-phones/index.html",
    axis: "text",
    at: 469,
    live: "لیغات در گوگل پلی و گوشی های شیائومی نمایش داده می شوند؟ ۲. ۳. روش های حذف تبلیغات گوگل پلی و MIUI در گوشی شیائومی ۴. آیا روت کردن گوشی شیائومی برای ح",
    build: "لیغات در گوگل پلی و گوشی های شیائومی نمایش داده می شوند؟ ۲. روش های حذف تبلیغات گوگل پلی و MIUI در گوشی شیائومی ۳. آیا روت کردن گوشی شیائومی برای حذف ",
    liveChars: 10594,
    buildChars: 10591,
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-remove-google-play-ads-on-",
    page: "remove-google-play-ads-on-xiaomi-phones/index.html",
    axis: "links",
    live: "#sec-2 :: ۲.",
    build: "#sec-2 :: ۲. روش های حذف تبلیغات گوگل پلی و MIUI در گوشی شیائومی",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-remove-google-play-ads-on-",
    page: "remove-google-play-ads-on-xiaomi-phones/index.html",
    axis: "links",
    live: "#sec-3 :: ۳. روش های حذف تبلیغات گوگل پلی و MIUI در گوشی شیائومی",
    build: "#sec-3 :: ۳. آیا روت کردن گوشی شیائومی برای حذف تبلیغات مفید است؟",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-remove-google-play-ads-on-",
    page: "remove-google-play-ads-on-xiaomi-phones/index.html",
    axis: "links",
    live: "#sec-4 :: ۴. آیا روت کردن گوشی شیائومی برای حذف تبلیغات مفید است؟",
    build: "#sec-4 :: ۴. روش های دیگر برای کاهش تبلیغات در شیائومی",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-remove-google-play-ads-on-",
    page: "remove-google-play-ads-on-xiaomi-phones/index.html",
    axis: "links",
    live: "#sec-5 :: ۵. روش های دیگر برای کاهش تبلیغات در شیائومی",
    build: "#sec-5 :: ۵. نکات پایانی",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-remove-google-play-ads-on-",
    page: "remove-google-play-ads-on-xiaomi-phones/index.html",
    axis: "links",
    live: "#sec-6 :: ۶. نکات پایانی",
    build: "#sec-6 :: ۶. سوالات متداول کاربران",
    reason: IMG_H2_REASON,
  },
  {
    id: "img-h2-remove-google-play-ads-on-",
    page: "remove-google-play-ads-on-xiaomi-phones/index.html",
    axis: "links",
    live: "#sec-7 :: ۷. سوالات متداول کاربران",
    build: null,
    reason: IMG_H2_REASON,
  },
];

/**
 * Classify one axis diff. Returns the ids of the rules that explain every
 * entry in it, or null when at least one entry is unexplained.
 */
export function classify(axis, diff, page) {
  // Deliberate one-page edits come off the top: whatever they explain is
  // removed from the diff, and the rest still has to survive the rules below.
  const { diff: remaining, ids: editIds } = applyEdits(axis, diff, page);
  if (remaining === null) return editIds;
  if (remaining.onlyLive && !remaining.onlyLive.length && !remaining.onlyBuild.length)
    return editIds;
  const rest = classifyRules(axis, remaining);
  return rest ? [...new Set([...editIds, ...rest])] : null;
}

/**
 * Strike the differences that EDITS accounts for. Returns the diff that is
 * left plus the ids used; `diff: null` means a scalar was fully explained.
 */
function applyEdits(axis, diff, page) {
  const mine = EDITS.filter((e) => e.page === page && e.axis === axis);
  if (!mine.length) return { diff, ids: [] };
  const ids = new Set();

  if (diff.onlyLive || diff.onlyBuild) {
    const onlyLive = [...(diff.onlyLive ?? [])];
    const onlyBuild = [...(diff.onlyBuild ?? [])];
    for (const e of mine) {
      // Both sides must be exactly where the entry says they are, or the entry
      // does not apply — a half-matching edit explains nothing.
      const i = e.live === null ? -1 : onlyLive.indexOf(e.live);
      const j = e.build === null ? -1 : onlyBuild.indexOf(e.build);
      if ((e.live !== null && i < 0) || (e.build !== null && j < 0)) continue;
      if (i >= 0) onlyLive.splice(i, 1);
      if (j >= 0) onlyBuild.splice(j, 1);
      ids.add(e.id);
    }
    return { diff: { onlyLive, onlyBuild }, ids: [...ids] };
  }

  // The text axis reports a first-difference excerpt rather than the whole
  // page, so a text edit is pinned by all five things the report carries: the
  // offset it starts at, the excerpt on each side, and the total length of
  // each side. A second, unintended change anywhere in the page moves the
  // offset or the length, and the entry stops matching.
  if (diff.at !== undefined) {
    const e = mine.find(
      (e) =>
        e.at === diff.at &&
        e.live === diff.live &&
        e.build === diff.build &&
        e.liveChars === diff.liveChars &&
        e.buildChars === diff.buildChars,
    );
    return e ? { diff: null, ids: [e.id] } : { diff, ids: [] };
  }

  const e = mine.find((e) => e.live === diff.live && e.build === diff.build);
  return e ? { diff: null, ids: [e.id] } : { diff, ids: [] };
}

function classifyRules(axis, diff) {
  const used = new Set();

  const explainOne = (value) => {
    for (const rule of ACCEPTED) {
      if (!rule.axes.includes(axis) || !rule.matches) continue;
      if (axis === "schema") continue; // schema goes through matchesNodePair
      if (rule.matches(value)) {
        used.add(rule.id);
        return true;
      }
    }
    return false;
  };

  if (!diff.onlyLive) return null; // scalar/text axes are never auto-accepted

  // Rules that have to see the whole axis at once, because no single entry
  // carries enough to judge it (a re-levelled heading looks exactly like a
  // deleted one until you can see its replacement).
  for (const rule of ACCEPTED) {
    if (!rule.axes.includes(axis) || !rule.matchesList) continue;
    if (rule.matchesList(diff.onlyLive, diff.onlyBuild)) return [rule.id];
  }

  // Schema nodes are paired by @id and compared whole, so a node cannot be
  // waved through on the strength of one property while another changed.
  if (axis === "schema") {
    const idOf = (s) => (s.match(/"@id":"([^"]*)"/) ?? s.match(/"@type":"([^"]*)"/) ?? [, "?"])[1];
    const build = new Map(diff.onlyBuild.map((s) => [idOf(s), s]));
    const live = new Map(diff.onlyLive.map((s) => [idOf(s), s]));
    if (build.size !== live.size) return null; // a node was added or removed
    for (const [id, liveNode] of live) {
      const buildNode = build.get(id);
      if (buildNode === undefined) return null;
      const rule = ACCEPTED.find(
        (r) => r.axes.includes("schema") && r.matchesNodePair?.(liveNode, buildNode),
      );
      if (!rule) return null;
      used.add(rule.id);
    }
    return [...used];
  }

  const split = (s) => {
    const i = s.indexOf(" :: ");
    return i < 0 ? [s, ""] : [s.slice(0, i), s.slice(i + 4)];
  };
  const buildByHref = new Map(diff.onlyBuild.map(split));
  const liveByHref = new Map(diff.onlyLive.map(split));

  for (const entry of diff.onlyLive) {
    const [href, label] = split(entry);
    if (explainOne(entry)) continue;
    const counterpart = buildByHref.get(href);
    if (counterpart !== undefined) {
      const pairRule = ACCEPTED.find(
        (r) => r.axes.includes(axis) && r.matchesPair?.(href, label, counterpart),
      );
      if (pairRule) {
        used.add(pairRule.id);
        continue;
      }
    }
    return null;
  }
  for (const entry of diff.onlyBuild) {
    const [href, label] = split(entry);
    if (explainOne(entry)) continue;
    const counterpart = liveByHref.get(href);
    if (counterpart !== undefined) {
      const pairRule = ACCEPTED.find(
        (r) => r.axes.includes(axis) && r.matchesPair?.(href, counterpart, label),
      );
      if (pairRule) {
        used.add(pairRule.id);
        continue;
      }
    }
    return null;
  }

  return [...used];
}
