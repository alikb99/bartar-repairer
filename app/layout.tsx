import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { BRANCHES, SITE } from "@/lib/data";
import { NAV } from "@/lib/content";
import { TECHNICIANS } from "@/lib/team";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallFab from "@/components/CallFab";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.domain),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    // The brand suffix is the trade name "برتر سرویس", not the legal name —
    // mandated site-wide from 2026-08-01 and carried by every live <title>.
    template: `%s | ${SITE.brandName}`,
  },
  description:
    "مرکز تخصصی تعمیرات برتر؛ تعمیر تخصصی موبایل، لپ تاپ، تبلت، ساعت هوشمند و تلویزیون در تهران با قطعات اصل و گارانتی معتبر.",
  alternates: { canonical: "/" },
  // Google requires a square favicon that is a multiple of 48px; declare the
  // PNG set explicitly (sizes attribute included) so the crawler picks it up.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
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
  alternateName: SITE.brandName,
  image: `${SITE.domain}/logo.png`,
  logo: `${SITE.domain}/logo.png`,
  url: SITE.domain,
  telephone: SITE.phoneIntl,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.address,
    addressLocality: SITE.city,
    postalCode: SITE.postalCode,
    addressCountry: "IR",
  },
  // Straight from BRANCHES so the schema, the branch locator and the footer
  // map can never drift apart. The rounded 35.7231/51.4222 pair that used to
  // sit here put the pin about 250 m off, on the wrong side of Motahari.
  geo: {
    "@type": "GeoCoordinates",
    latitude: BRANCHES[0].geo.lat,
    longitude: BRANCHES[0].geo.lng,
  },
  areaServed: { "@type": "City", name: SITE.city },
  openingHoursSpecification: openingHours,
  hasMap: SITE.mapCentral,
  sameAs: Object.values(SITE.socials),
  parentOrganization: { "@id": SITE.organizationId },
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
  // The west branch is not registered on Balad, so its map link is a Google
  // Maps coordinate search rather than a POI page.
  hasMap: `https://www.google.com/maps/search/?api=1&query=${SITE.geoWest.lat},${SITE.geoWest.lng}`,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": SITE.organizationId,
  name: SITE.name,
  alternateName: SITE.brandName,
  url: SITE.domain,
  logo: `${SITE.domain}/logo.png`,
  sameAs: Object.values(SITE.socials),
  // The named human behind the business. A real, verifiable manager is a much
  // stronger trust signal than an anonymous Organization node.
  employee: {
    "@type": "Person",
    name: SITE.manager.name,
    jobTitle: SITE.manager.jobTitle,
    url: `${SITE.domain}/team/`,
  },
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

// Site-wide author identity. Modelled as an OrganizationRole backed by the real
// technicians in lib/team.ts rather than an anonymous "editorial team" — the
// people named here are the ones who actually do the repairs, and /team/ lists
// each with their specialty and years of experience.
const authorSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": SITE.authorId,
  name: `تیم فنی ${SITE.shortName}`,
  url: `${SITE.domain}/team/`,
  parentOrganization: { "@id": SITE.organizationId },
  employee: TECHNICIANS.map((t) => ({
    "@type": "Person",
    name: t.name,
    ...(t.specialty ? { jobTitle: t.specialty, knowsAbout: t.specialty } : {}),
  })),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa-IR" dir="rtl">
      <head>
        <link
          rel="preload"
          href="/fonts/1abbc144918f74fd-s.p.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
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
        {/* Online support chat. lazyOnload keeps third-party JS out of the
            critical path — it must never compete with LCP on a site whose
            hosting already costs it a slow TTFB. */}
        <Script
          src={SITE.chat.src}
          data-key={SITE.chat.key}
          data-label={SITE.chat.label}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
