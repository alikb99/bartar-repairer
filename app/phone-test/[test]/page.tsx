import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/data";
import { PHONE_TESTS, phoneTestBy, phoneTestPath, type PhoneTest, type PhoneTestSlug } from "@/lib/phone-tests";
import PhoneTestPage from "@/components/phone-tests/PhoneTestPage";
import DeadPixelTest from "@/components/phone-tests/DeadPixelTest";
import TouchTest from "@/components/phone-tests/TouchTest";
import SpeakerTest from "@/components/phone-tests/SpeakerTest";
import MicrophoneTest from "@/components/phone-tests/MicrophoneTest";

const TOOLS: Record<PhoneTestSlug, ComponentType<{ tool: PhoneTest["tool"] }>> = {
  "dead-pixel": DeadPixelTest,
  "touch-screen": TouchTest,
  speaker: SpeakerTest,
  microphone: MicrophoneTest,
};

export function generateStaticParams() {
  return PHONE_TESTS.map((t) => ({ test: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ test: string }> }): Promise<Metadata> {
  const { test } = await params;
  const t = phoneTestBy(test);
  if (!t) return {};
  const path = phoneTestPath(t.slug);
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      title: t.title,
      description: t.description,
      url: `${SITE.domain}${path}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: t.h1 }],
    },
    twitter: { card: "summary_large_image", title: t.title, description: t.description },
  };
}

export default async function PhoneTestRoute({ params }: { params: Promise<{ test: string }> }) {
  const { test } = await params;
  const t = phoneTestBy(test);
  if (!t) notFound();
  const Tool = TOOLS[t.slug];
  const related = t.related.map((s) => phoneTestBy(s)).filter((x): x is PhoneTest => !!x);
  return <PhoneTestPage page={t} path={phoneTestPath(t.slug)} tool={<Tool tool={t.tool} />} related={related} />;
}
