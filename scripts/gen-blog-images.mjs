// One-off generator for the hero + inline diagrams on the dishwasher and
// AirPods articles (content/extra-posts.json ids 90010/90011), plus the
// Motorola Razr/Edge hero (90012). Matches the
// visual language already used for xiaomi-robot-vacuum-error-codes: dark hero
// card, light two-column "DIY vs repair shop" panel, light labeled-circle
// diagram. Kept as a script (not a dependency) since it only needs to run
// once per new article's image set.
import sharp from "sharp";
import { writeFileSync } from "fs";

const FONT = "Tahoma, Arial";
const RED = "#DA251C";
const RED_DARK = "#B3170F";
const INK = "#13161C";
const INK_2 = "#1B1F27";
const WHITE = "#FFFFFF";
const PAPER = "#F7F7F9";
const TEXT_MUTED = "#6B7280";
const GREEN = "#1F9D55";
const OUT_DIR = "public/wp-content/uploads/2026/09";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Dark 1200x630 hero/OG card: ring motif left, title block right. */
function heroSvg({ title, subtitle, tags, brandLine }) {
  const W = 1200, H = 630;
  const cx = 235, cy = 315, r = 165;
  const dots = [
    [cx, cy - r],
    [cx - r * 0.94, cy - r * 0.34],
    [cx - r * 0.58, cy + r * 0.81],
    [cx + r * 0.58, cy + r * 0.81],
  ];
  const titleLines = title.split("\n");
  const titleY0 = 300 - (titleLines.length - 1) * 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect width="${W}" height="${H}" fill="${INK_2}" opacity="0.35"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${RED}" stroke-width="3" opacity="0.9"/>
  <circle cx="${cx}" cy="${cy}" r="34" fill="${RED}" opacity="0.16"/>
  <circle cx="${cx}" cy="${cy}" r="16" fill="${RED}"/>
  ${dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${RED}"/>`).join("\n  ")}
  <circle cx="${cx - r * 0.94}" cy="${cy - r * 0.34}" r="4.5" fill="#8A9099"/>
  <circle cx="${cx + r * 0.58}" cy="${cy - r * 0.15}" r="4.5" fill="#8A9099"/>
  ${titleLines
    .map(
      (line, i) =>
        `<text x="1120" y="${titleY0 + i * 64}" font-family="${FONT}" font-weight="bold" font-size="54" fill="${WHITE}" text-anchor="end">${esc(line)}</text>`,
    )
    .join("\n  ")}
  <text x="1120" y="${titleY0 + titleLines.length * 64 + 6}" font-family="${FONT}" font-size="28" fill="${RED}" text-anchor="end">${esc(subtitle)}</text>
  <rect x="1010" y="${titleY0 + titleLines.length * 64 + 30}" width="110" height="4" fill="${RED}"/>
  <text x="1120" y="${titleY0 + titleLines.length * 64 + 90}" font-family="${FONT}" font-size="22" fill="#C7CBD1" text-anchor="end">${esc(tags)}</text>
  <text x="1120" y="580" font-family="${FONT}" font-weight="bold" font-size="22" fill="${WHITE}" text-anchor="end">${esc(brandLine)}</text>
</svg>`;
}

/** Light 1000x560 labeled-circle diagram, 4 points -> 4 cards on the right. */
function diagramSvg({ title, points, cards }) {
  const W = 1000, H = 560;
  const cx = 235, cy = 330, r = 110;
  const angles = [-90, 175, 60, 300]; // top, left, bottom-right-ish, right — matched to point label positions below
  const pos = [
    { x: cx, y: cy - r - 18, anchor: "middle", labelY: cy - r - 30 },
    { x: cx - r - 15, y: cy, anchor: "end", labelY: cy + 6 },
    { x: cx, y: cy + r + 18, anchor: "middle", labelY: cy + r + 40 },
    { x: cx + r - 30, y: cy - r + 30, anchor: "start", labelY: cy - r + 18 },
  ];
  const dotXY = [
    [cx, cy - r],
    [cx - r, cy],
    [cx, cy + r],
    [cx + r * 0.7, cy - r * 0.7],
  ];
  const cardX = 500, cardW = 460, cardH = 78, gap = 16, cardY0 = 118;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="#E7E8EC" stroke-width="2"/>
  <text x="${W - 40}" y="66" font-family="${FONT}" font-weight="bold" font-size="34" fill="${INK}" text-anchor="end">${esc(title)}</text>
  <rect x="${W - 220}" y="82" width="180" height="5" fill="${RED}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#EDEEF2" stroke="${RED}" stroke-width="2.5"/>
  <circle cx="${cx}" cy="${cy}" r="26" fill="none" stroke="${RED}" stroke-width="2.5"/>
  <circle cx="${cx}" cy="${cy}" r="10" fill="${RED}"/>
  ${dotXY.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${RED}"/>`).join("\n  ")}
  ${pos
    .map(
      (p, i) =>
        `<text x="${p.x}" y="${p.labelY}" font-family="${FONT}" font-size="18" fill="${INK}" text-anchor="${p.anchor}">${esc(points[i])}</text>`,
    )
    .join("\n  ")}
  ${cards
    .map((c, i) => {
      const y = cardY0 + i * (cardH + gap);
      return `<g>
    <rect x="${cardX}" y="${y}" width="${cardW}" height="${cardH}" fill="${WHITE}" stroke="#E7E8EC" stroke-width="1.5" rx="4"/>
    <rect x="${cardX + cardW - 5}" y="${y}" width="5" height="${cardH}" fill="${RED}"/>
    <text x="${cardX + cardW - 24}" y="${y + 32}" font-family="${FONT}" font-weight="bold" font-size="23" fill="${INK}" text-anchor="end">${esc(c[0])}</text>
    <text x="${cardX + cardW - 24}" y="${y + 58}" font-family="${FONT}" font-size="17" fill="${TEXT_MUTED}" text-anchor="end">${esc(c[1])}</text>
  </g>`;
    })
    .join("\n  ")}
</svg>`;
}

/** Light 1000x560 two-column DIY-vs-repair-shop comparison panel. */
function compareSvg({ title, repairLabel, repairItems, diyLabel, diyItems, brandLine }) {
  const W = 1000, H = 560;
  const panelY = 130, panelH = 360, panelW = 430, gap = 20;
  const leftX = 48, rightX = leftX + panelW + gap;
  const line = (items, color) =>
    items
      .map(
        (t, i) =>
          `<circle cx="${0}" cy="${0}" r="5" fill="${color}" transform="translate(0,0)"/>`,
      )
      .join("");
  const col = (x, items, dotColor, startY) =>
    items
      .map((t, i) => {
        const y = startY + i * 46;
        return `<circle cx="${x + panelW - 30}" cy="${y - 6}" r="5.5" fill="${dotColor}"/>
    <text x="${x + panelW - 48}" y="${y}" font-family="${FONT}" font-size="19" fill="${INK}" text-anchor="end">${esc(t)}</text>`;
      })
      .join("\n    ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="#E7E8EC" stroke-width="2"/>
  <text x="${W - 40}" y="66" font-family="${FONT}" font-weight="bold" font-size="32" fill="${INK}" text-anchor="end">${esc(title)}</text>
  <rect x="${W - 210}" y="82" width="170" height="5" fill="${RED}"/>
  <rect x="${leftX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="14" fill="#FCEEED"/>
  <text x="${leftX + panelW - 26}" y="${panelY + 46}" font-family="${FONT}" font-weight="bold" font-size="25" fill="${RED_DARK}" text-anchor="end">${esc(repairLabel)}</text>
  ${col(leftX, repairItems, RED, panelY + 92)}
  <rect x="${rightX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="14" fill="${WHITE}" stroke="#ECEDF1"/>
  <text x="${rightX + panelW - 26}" y="${panelY + 46}" font-family="${FONT}" font-weight="bold" font-size="25" fill="${GREEN}" text-anchor="end">${esc(diyLabel)}</text>
  ${col(rightX, diyItems, GREEN, panelY + 92)}
  <text x="${W - 40}" y="${H - 26}" font-family="${FONT}" font-size="17" fill="${TEXT_MUTED}" text-anchor="end">${esc(brandLine)}</text>
</svg>`;
}

// `node scripts/gen-blog-images.mjs motorola` renders only the files whose
// name contains "motorola", so adding one article does not rewrite the rest.
const ONLY = process.argv[2];

async function render(svg, outPath, { quality = 84 } = {}) {
  if (ONLY && !outPath.includes(ONLY)) return;
  const buf = await sharp(Buffer.from(svg)).webp({ quality }).toBuffer();
  writeFileSync(outPath, buf);
  console.log(outPath, "->", (buf.length / 1024).toFixed(1), "KB");
}

async function main() {
  // ---- Article 1: dishwasher ----
  await render(
    heroSvg({
      title: "ارور ماشین ظرفشویی",
      subtitle: "چرا ظروف تمیز نمی‌شوند و راه‌حل هر کد خطا",
      tags: "فیلتر · بازوی آب‌پاش · تخلیه · نشتی",
      brandLine: "برتر سرویس · تعمیر لوازم خانگی",
    }),
    `${OUT_DIR}/dishwasher-error-codes-not-cleaning-dishes.webp`,
  );
  await render(
    diagramSvg({
      title: "چهار نقطه‌ای که باید تمیز کنید",
      points: ["بازوی آب‌پاش بالا", "شیر ورودی آب", "فیلتر کف دستگاه", "لاستیک دور در"],
      cards: [
        ["فیلتر کف", "هر ۲ تا ۳ هفته زیر آب بشویید"],
        ["بازوی آب‌پاش", "سوراخ‌ها را با خلال دندان باز کنید"],
        ["شیر ورودی آب", "فیلتر توری را از رسوب پاک کنید"],
        ["لاستیک دور در", "فرسودگی و ترک‌خوردگی را بررسی کنید"],
      ],
    }),
    `${OUT_DIR}/dishwasher-filter-spray-arm-cleaning.webp`,
  );
  await render(
    compareSvg({
      title: "خودتان رفع کنید یا به تعمیرکار بسپارید؟",
      repairLabel: "کار تعمیرکار است",
      repairItems: [
        "خرابی پمپ تخلیه",
        "ایراد برد کنترل",
        "شیر برقی معیوب",
        "نشتی که بعد از بررسی ادامه دارد",
        "صدای غیرعادی موتور",
      ],
      diyLabel: "در خانه حل می‌شود",
      diyItems: [
        "فیلتر کثیف",
        "بازوی آب‌پاش گرفته",
        "شوینده نامناسب یا کم",
        "چیدن اشتباه ظرف‌ها",
        "بسته بودن شیر آب",
      ],
      brandLine: "برتر سرویس · ۰۲۱۹۱۳۰۰۳۴۸",
    }),
    `${OUT_DIR}/dishwasher-drain-pump-error.webp`,
  );

  // ---- Article 2: AirPods ----
  await render(
    heroSvg({
      title: "تعمیر ایرپاد و\nهندزفری بلوتوث",
      subtitle: "شارژ نشدن، قطع صدا و مشکل اتصال",
      tags: "باتری · کیس شارژ · بلوتوث · رطوبت",
      brandLine: "برتر سرویس · تعمیرات تخصصی اپل",
    }),
    `${OUT_DIR}/airpods-repair-charging-sound-connection.webp`,
  );
  await render(
    diagramSvg({
      title: "چرا یک گوش ایرپاد شارژ نمی‌شود",
      points: ["محل تماس فلزی", "مدار شارژ", "باتری کیس", "جای نشستن گوشی"],
      cards: [
        ["محل تماس فلزی", "با پارچه خشک و نرم تمیز کنید"],
        ["باتری کیس", "دست‌کم ۳۰ دقیقه کامل شارژ کنید"],
        ["جای نشستن گوشی", "درست و صاف داخل کیس بنشانید"],
        ["مدار شارژ", "در صورت ادامه مشکل، بررسی تخصصی"],
      ],
    }),
    `${OUT_DIR}/airpods-charging-case-contact-cleaning.webp`,
  );
  await render(
    compareSvg({
      title: "خودتان رفع کنید یا به تعمیرگاه ببرید؟",
      repairLabel: "کار تعمیرگاه است",
      repairItems: [
        "آب‌خوردگی و باد کردن باتری",
        "آسیب برد داخلی",
        "خرابی داخلی کیس شارژ",
        "خرابی اسپیکر بعد از تمیزکاری",
      ],
      diyLabel: "در خانه حل می‌شود",
      diyItems: [
        "کثیفی توری اسپیکر",
        "بالانس صدای نامتقارن",
        "قطع و وصل بلوتوث",
        "شارژ نشدن به‌خاطر کثیفی کانکتور",
      ],
      brandLine: "برتر سرویس · ۰۲۱۹۱۳۰۰۳۴۸",
    }),
    `${OUT_DIR}/airpods-moisture-water-damage.webp`,
  );

  // ---- Article 3: Motorola Razr / Edge ----
  await render(
    heroSvg({
      title: "معرفی سری ریزر\nو اج موتورولا",
      subtitle: "وضعیت قطعات و هزینه تعمیر در ایران",
      tags: "قطعات یدکی · گارانتی · نگهداری گوشی تاشو",
      brandLine: "برتر سرویس · تعمیر گوشی موتورولا",
    }),
    `${OUT_DIR}/motorola-razr-edge-2026.webp`,
  );

  // ---- Article 4: PS5 console repair ----
  await render(
    heroSvg({
      title: "تعمیر کنسول بازی\nپلی استیشن ۵",
      subtitle: "داغ شدن، خطای دیسک و ایراد دسته",
      tags: "خنک کاری · درایو دیسک · دسته دوال سنس",
      brandLine: "برتر سرویس · تعمیر کنسول بازی",
    }),
    `${OUT_DIR}/ps5-console-repair-2026.webp`,
  );

  // ---- Article 5: swollen phone battery ----
  await render(
    heroSvg({
      title: "باتری گوشی\nباد کرده است",
      subtitle: "چقدر خطرناک است و چه کاری نباید کرد",
      tags: "علائم تورم · نگهداری ایمن · تعویض باتری",
      brandLine: "برتر سرویس · تعویض ایمن باتری",
    }),
    `${OUT_DIR}/swollen-phone-battery.webp`,
  );

  // ---- Article 6: washing machine spin noise / bearing ----
  await render(
    heroSvg({
      title: "صدا و لرزش لباسشویی\nهنگام خشک کن",
      subtitle: "بلبرینگ خراب است یا علت دیگری دارد؟",
      tags: "پیچ حمل · تراز · کمک فنر · تسمه · بلبرینگ",
      brandLine: "برتر سرویس · تعمیر لوازم خانگی",
    }),
    `${OUT_DIR}/washing-machine-noise-vibration-spin-bearing.webp`,
  );
  await render(
    compareSvg({
      title: "خودتان رفع کنید یا به تعمیرکار بسپارید؟",
      repairLabel: "کار تعمیرکار است",
      repairItems: [
        "خرابی بلبرینگ و کاسه نمد",
        "فرسودگی کمک فنرها",
        "تسمه شل یا ساییده",
        "جسم خارجی پشت دیگ",
      ],
      diyLabel: "در خانه حل می‌شود",
      diyItems: [
        "پیچ‌های حمل باز نشده",
        "تراز نبودن پایه‌ها",
        "بار نامتعادل لباس",
        "سکه در فیلتر پمپ",
      ],
      brandLine: "برتر سرویس · ۰۲۱۹۱۳۰۰۳۴۸",
    }),
    `${OUT_DIR}/washing-machine-noise-diy-vs-technician.webp`,
  );

  // ---- Article 7: TV won't turn on / blinking red / no picture ----
  await render(
    heroSvg({
      title: "تلویزیون روشن نمی‌شود",
      subtitle: "چشمک زدن چراغ قرمز، صدا بدون تصویر",
      tags: "برد پاور · مین برد · بک لایت · پنل",
      brandLine: "برتر سرویس · تعمیر تخصصی تلویزیون",
    }),
    `${OUT_DIR}/tv-not-turning-on-red-light-blinking-no-picture.webp`,
  );
  await render(
    diagramSvg({
      title: "چهار قطعه‌ای که باید بررسی شود",
      points: ["برد پاور", "پریز و کابل", "بک لایت", "مین برد"],
      cards: [
        ["پریز و کابل", "هیچ چراغی روشن نمی‌شود"],
        ["برد پاور", "روشن نشدن یا چشمک زدن چراغ قرمز"],
        ["مین برد", "گیر کردن روی لوگو، خاموش و روشن شدن"],
        ["بک لایت", "صدا هست ولی صفحه سیاه است"],
      ],
    }),
    `${OUT_DIR}/tv-power-board-backlight-mainboard-parts.webp`,
  );
}

main();
