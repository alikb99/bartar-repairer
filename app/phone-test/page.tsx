import type { Metadata } from "next";
import { SITE } from "@/lib/data";
import { PHONE_TESTS, PHONE_TEST_BASE, PHONE_TEST_HUB } from "@/lib/phone-tests";
import PhoneTestPage, { TestCards } from "@/components/phone-tests/PhoneTestPage";

const { title, description } = PHONE_TEST_HUB;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: PHONE_TEST_BASE },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title,
    description,
    url: `${SITE.domain}${PHONE_TEST_BASE}`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function PhoneTestHubPage() {
  return (
    <PhoneTestPage
      page={PHONE_TEST_HUB}
      path={PHONE_TEST_BASE}
      tool={<TestCards tests={PHONE_TESTS} />}
    />
  );
}
