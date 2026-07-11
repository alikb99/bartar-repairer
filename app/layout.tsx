import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/data";
import { NAV } from "@/lib/content";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallFab from "@/components/CallFab";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.domain),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.shortName}`,
  },
  description:
    "مرکز تخصصی تعمیرات برتر؛ تعمیر تخصصی موبایل، لپ تاپ، تبلت، ساعت هوشمند و تلویزیون در تهران با قطعات اصل و گارانتی معتبر.",
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: SITE.name,
    title: `${SITE.name} | ${SITE.tagline}`,
    description:
      "تعمیر تخصصی دستگاه های الکترونیکی با قطعات اصل و گارانتی معتبر در تهران.",
    url: SITE.domain,
    images: [{ url: "/logo.png", width: 246, height: 95, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name}`,
    description: SITE.tagline,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#DA251C",
};

const openingHours = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
    opens: "09:00",
    closes: "18:30",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: "Thursday",
    opens: "09:00",
    closes: "15:00",
  },
];

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": SITE.localBusinessId,
  name: SITE.name,
  image: `${SITE.domain}/logo.png`,
  logo: `${SITE.domain}/logo.png`,
  url: SITE.domain,
  telephone: SITE.phoneIntl,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.address,
    addressLocality: SITE.city,
    addressCountry: "IR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 35.7231,
    longitude: 51.4222,
  },
  areaServed: { "@type": "City", name: SITE.city },
  openingHoursSpecification: openingHours,
  description: SITE.tagline,
};

// Second physical location (Saadat Abad) as its own LocalBusiness node, linked
// back to the main business via branchOf so both locations are discoverable.
const westBranchSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE.domain}/#branch-west`,
  name: `${SITE.name} — شعبه غرب`,
  image: `${SITE.domain}/logo.png`,
  url: SITE.domain,
  telephone: SITE.phoneWestIntl,
  priceRange: "$$",
  branchOf: { "@id": SITE.localBusinessId },
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.addressWest,
    addressLocality: SITE.city,
    addressCountry: "IR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: SITE.geoWest.lat,
    longitude: SITE.geoWest.lng,
  },
  areaServed: { "@type": "City", name: SITE.city },
  openingHoursSpecification: openingHours,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": SITE.organizationId,
  name: SITE.name,
  url: SITE.domain,
  logo: `${SITE.domain}/logo.png`,
  contactPoint: {
    "@type": "ContactPoint",
    telephone: SITE.phoneIntl,
    contactType: "customer service",
    areaServed: "IR",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": SITE.websiteId,
  name: SITE.name,
  url: SITE.domain,
  inLanguage: "fa-IR",
  publisher: { "@id": SITE.organizationId },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE.domain}/search/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const authorSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": SITE.authorId,
  name: "تیم تحریریه تعمیرات برتر",
  jobTitle: "کارشناس تعمیرات دستگاه های الکترونیکی",
  worksFor: { "@id": SITE.organizationId },
  url: SITE.domain,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(westBranchSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          رفتن به محتوای اصلی
        </a>
        <Header nav={NAV} />
        <main id="main">{children}</main>
        <Footer nav={NAV} />
        <CallFab />
      </body>
    </html>
  );
}
