"use client";

import { useEffect } from "react";

// Google Programmable Search Engine.
//
// Replaced the hand-rolled client-side index: that shipped every page title in
// the bundle and only ever matched on the title string, so a query phrased in
// the words of the article body found nothing. PSE searches the crawled text of
// the whole site and costs no bundle weight.
//
// The loader is injected on mount rather than rendered as a <script> so the
// static export stays free of third-party script tags — nothing is requested
// until someone actually opens /search/.
const CX = "51bdb4c20dee14c78";
const SRC = `https://cse.google.com/cse.js?cx=${CX}`;

export default function PseSearch({ siteName }: { siteName: string }) {
  useEffect(() => {
    if (document.querySelector(`script[src="${SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return (
    <div>
      <div className="gcse-search" />
      <p className="mt-4 text-sm text-ink-500">
        در حال بارگذاری جستجو در {siteName}…
      </p>
    </div>
  );
}
