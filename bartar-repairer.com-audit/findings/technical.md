# یافته های فنی — داده خام

## پاسخ سرور

```
Server: nginx
Vary: Accept-Encoding, User-Agent
Cache-Control: public, max-age=0, must-revalidate
Content-Encoding: gzip   (فقط با Accept-Encoding صریح)
```

هدرهای غایب: `Strict-Transport-Security`، `X-Content-Type-Options`، `X-Frame-Options`، `Referrer-Policy`، `Content-Security-Policy`.

## زمان پاسخ

| اندازه گیری | TTFB | کل |
|---|---|---|
| صفحه اصلی ۱ | ۱٫۱۱۴ ثانیه | ۱٫۴۸۷ ثانیه |
| صفحه اصلی ۲ | ۱٫۰۴۳ ثانیه | ۱٫۳۱۲ ثانیه |
| صفحه اصلی ۳ | ۱٫۰۹۹ ثانیه | ۱٫۴۴۰ ثانیه |

صفحات داخلی (کل زمان): xiaomi ۲۹۱ms، contact ۲۵۳ms، online-repair-request ۲۶۵ms، blog ۲۹۲ms، hisense ۳۰۴ms، motorola ۳۱۶ms، laptop-repair ۳۴۴ms، smart-watch ۳۸۸ms، hp ۳۹۷ms، mobile-hub ۴۰۱ms، samsung/mobile ۵۲۶ms، apple ۵۱۸ms، samsung ۵۵۱ms.

## فشرده سازی

`/samsung/` خام ۴۲۱ کیلوبایت، با gzip ۷۹۹۷۹ بایت (۸۰ کیلوبایت). نسبت فشرده سازی حدود ۵٫۳ برابر. Brotli ارائه نمی شود.

## کش دارایی ها

`/_next/static/chunks/webpack-10031099b5931091.js` → `Cache-Control: max-age=1209600`

نام فایل هش محتوا دارد، پس مقدار درست `max-age=31536000, immutable` است.

## robots.txt

```
User-Agent: *
Allow: /

User-Agent: GPTBot
User-Agent: OAI-SearchBot
User-Agent: ChatGPT-User
User-Agent: PerplexityBot
User-Agent: ClaudeBot
User-Agent: Claude-User
User-Agent: Google-Extended
User-Agent: Applebot-Extended
User-Agent: CCBot
Allow: /

Sitemap: https://bartar-repairer.com/sitemap.xml
```

بدون قانون `Disallow`. سایت مپ معرفی شده. اجازه صریح به خزنده های AI.

## سایت مپ

۸۹۳ آدرس. دارای `priority`، `lastmod` و `changefreq`. صفحه اصلی `priority=1`، صفحه repairs `priority=0.9`.

## llms.txt

`https://bartar-repairer.com/llms.txt` → کد ۲۰۰.
