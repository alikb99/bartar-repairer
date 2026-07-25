# یافته های درون صفحه — داده خام

۱۵ صفحه نمونه. همه کد ۲۰۰، همه کنونیکال خودارجاع درست، همه `robots: index, follow`، همه دقیقاً یک H1، همه دارای Open Graph و Twitter Card.

## جدول کامل

| صفحه | HTML کیلوبایت | طول تایتل | طول متا | H2 | تصویر | بدون alt | کلمه |
|---|---|---|---|---|---|---|---|
| `/` | ۱۹۹ | ۷۰ | ۱۴۹ | ۸ | ۸ | ۰ | ۹۲۹ |
| `/samsung/` | ۴۲۱ | ۶۷ | ۱۴۲ | ۲۷ | ۳۵ | ۹ | ۱۰٬۷۴۹ |
| `/apple/` | ۳۶۸ | ۶۶ | ۱۳۹ | ۲۷ | ۲۴ | ۲ | ۱۰٬۹۹۶ |
| `/xiaomi/` | ۲۹۴ | ۶۶ | ۱۳۸ | ۲۰ | ۱۹ | ۰ | ۴٬۶۱۲ |
| `/samsung/mobile/` | ۴۱۶ | ۷۱ | ۱۲۹ | ۳۵ | ۵۸ | ۱۰ | ۸٬۳۶۲ |
| `/services/category-mobile-phone-repair/` | ۳۰۶ | ۶۷ | ۱۳۶ | ۱۵ | ۵۱ | ۲۵ | ۵٬۰۰۰ |
| `/services/laptop-repair/` | ۲۴۴ | ۶۶ | ۱۴۰ | ۹ | ۲۲ | ۰ | ۶٬۸۸۵ |
| `/hp/lap-top/` | ۲۵۷ | ۶۷ | ۱۲۴ | ۱۴ | ۱۹ | ۲ | ۶٬۵۰۹ |
| `/motorola-mobile-repair-center/` | ۲۳۳ | ۵۹ | ۱۲۴ | ۱۷ | ۲۱ | ۰ | ۴٬۳۵۹ |
| `/home-appliances/hisense-air-conditioner-repair/` | ۱۷۵ | ۳۰ | ۱۱۰ | ۱۳ | ۱۴ | ۰ | ۲٬۸۸۲ |
| `/contact/` | ۱۰۹ | ۴ | ۱۰۴ | ۲ | ۲ | ۰ | ۵۶۹ |
| `/blog/` | ۱۳۵ | ۴۱ | ۸۰ | ۰ | ۱۳ | ۰ | ۶۷۹ |
| `/online-repair-request/` | ۱۰۳ | ۷۱ | ۱۴۶ | ۲ | ۲ | ۰ | ۶۵۲ |
| `/smart-watch-repair/` | ۱۸۳ | ۶۳ | ۱۳۲ | ۱۵ | ۱۷ | ۱ | ۳٬۷۴۲ |
| `/nothingphone-repair/` | ۲۵۰ | ۵۴ | ۱۴۷ | ۲۶ | ۲۶ | ۰ | ۵٬۱۸۳ |

**نکته:** ستون «بدون ابعاد» حذف شد چون روی هر ۱۵ صفحه مقدارش صفر بود. صد درصد تصاویر `width` و `height` صریح دارند.

## تایتل های نیازمند اصلاح

| صفحه | تایتل فعلی | مشکل |
|---|---|---|
| `/contact/` | `تماس` | ۴ کاراکتر، بدون کلمه کلیدی |
| `/home-appliances/hisense-air-conditioner-repair/` | `تعمیر کولرگازی هایسنس در تهران` | ۳۰ کاراکتر، املای «کولرگازی» سرهم |
| `/motorola-mobile-repair-center/` | `نمایندگی تعمیرات گوشی موتورولا در تهران \| نمایندگی Motorola` | تکرار «نمایندگی» |
| `/nothingphone-repair/` | `نمایندگی ناتینگ فون در تهران \| تعمیر گوشی ناتینگ فون📱` | ایموji |

## اسکیمای هر صفحه

همه صفحات: `LocalBusiness`، `WebSite`، `Organization`، `Person`.

اضافه بر آن:
- `/` → `FAQPage`، `WebPage`
- صفحات برند و خدمات → `BreadcrumbList`، `Service`، `FAQPage`، `WebPage`
- `/services/laptop-repair/` → بدون `FAQPage`
- `/contact/` → فقط `BreadcrumbList`
- `/blog/` → `CollectionPage`، `ItemList`
- `/online-repair-request/` → `HowTo`

هیچ خطای پارس JSON-LD مشاهده نشد.

## تصاویر بدون alt

نمونه از هاب موبایل، همگی لوگوی برند:
```
/wp-content/uploads/2025/07/realme.webp
/wp-content/uploads/2025/07/oppo.webp
/wp-content/uploads/2025/07/oneplus.webp
/wp-content/uploads/2025/07/vivo.webp
/wp-content/uploads/2025/07/samsung.webp
/wp-content/uploads/2025/07/apple-1-150x150.webp
```
