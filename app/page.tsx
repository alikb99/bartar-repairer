import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Faq from "@/components/Faq";
import Reviews from "@/components/Reviews";
import {
  Stats,
  Services,
  Brands,
  WhyUs,
  Steps,
  Articles,
  CTA,
} from "@/components/Sections";
import { FAQS, SITE } from "@/lib/data";

export const metadata: Metadata = {
  title: {
    absolute:
      "تعمیرات برتر | نمایندگی تعمیر موبایل، لپ تاپ، تبلت و تلویزیون در تهران",
  },
  description:
    "مرکز تخصصی تعمیرات برتر؛ تعمیر موبایل، لپ تاپ، تبلت، ساعت هوشمند و تلویزیون در تهران با قطعات اصل، عیب یابی رایگان و ۶ ماه گارانتی. تماس: " +
    SITE.phonePlain,
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "تعمیرات برتر | نمایندگی تعمیر موبایل، لپ تاپ، تبلت و تلویزیون در تهران",
    description:
      "تعمیر تخصصی دستگاه های الکترونیکی در تهران با قطعات اصل و گارانتی معتبر.",
    url: SITE.domain,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE.domain}/#faq`,
  inLanguage: "fa-IR",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const homePageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE.domain}/#webpage`,
  url: SITE.domain,
  name: "تعمیرات برتر",
  description: metadata.description,
  inLanguage: "fa-IR",
  isPartOf: { "@id": SITE.websiteId },
  about: { "@id": SITE.localBusinessId },
  publisher: { "@id": SITE.organizationId },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homePageSchema) }}
      />
      <Hero />
      <Stats />
      <Services />
      <Brands />
      <WhyUs />
      <Steps />
      {/* Renders only once real customer reviews exist in lib/pricing.ts. The
          previous placeholder testimonials (invented names, invented quotes)
          were removed — presenting them as real customer feedback misleads
          visitors, and adding rating schema to them would breach Google's
          structured-data policy. */}
      <Reviews />
      <Articles />
      <Faq />
      <CTA />
    </>
  );
}
