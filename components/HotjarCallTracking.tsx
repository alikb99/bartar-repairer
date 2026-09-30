"use client";

import { useEffect } from "react";

// Hotjar for one ad landing page, plus a Hotjar event on every call-button tap.
//
// Why only here: the page is the target of a Yektanet native-ad campaign and
// the question is how many visitors actually press "call". Loading Hotjar sitewide would put
// third-party JS on ~950 static pages to answer a question about one of them.
//
// Events sent per tap (filter recordings and heatmaps by them in Hotjar):
//   call_click             — every tel: tap on the page, whatever the button
//   call_click_<location>  — which button: hero, problems, band, sidebar,
//                            branches, header, fab, footer, body
//   from_yektanet          — once per visit that arrived through a Yektanet ad
//                            (utm_source or any query value naming yektanet).
//                            Combine it with call_click in a Hotjar filter to
//                            count calls from the campaign alone.
// The location comes from the nearest [data-cta] ancestor, else the landmark
// the link sits in, so shared components need no tracking markup of their own.

const HOTJAR_SV = 6;

type HotjarCallTrackingProps = {
  hotjarId: number;
  trackYektanet?: boolean;
};

type HotjarFn = ((...args: unknown[]) => void) & { q?: unknown[][] };
declare global {
  interface Window {
    hj?: HotjarFn;
    _hjSettings?: { hjid: number; hjsv: number };
  }
}

function hotjarStub() {
  const w = window;
  // The queueing stub from Hotjar's snippet: events fired before the real
  // script arrives are replayed once it loads, so no early tap is lost.
  w.hj =
    w.hj ||
    Object.assign(
      function (...args: unknown[]) {
        (w.hj!.q = w.hj!.q || []).push(args);
      },
      { q: [] as unknown[][] },
    );
  return w.hj;
}

function ensureHotjar(hotjarId: number) {
  const w = window;
  hotjarStub();
  if (w._hjSettings) return;
  w._hjSettings = { hjid: hotjarId, hjsv: HOTJAR_SV };
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://static.hotjar.com/c/hotjar-${hotjarId}.js?sv=${HOTJAR_SV}`;
  document.head.appendChild(s);
}

function locationOf(a: HTMLAnchorElement): string {
  const tagged = a.closest<HTMLElement>("[data-cta]");
  if (tagged?.dataset.cta) return tagged.dataset.cta;
  // CallFab is the only fixed-position tel: link on the site.
  if (getComputedStyle(a).position === "fixed") return "fab";
  if (a.closest("footer")) return "footer";
  if (a.closest("aside")) return "sidebar";
  if (a.closest("header")) return "header";
  return "body";
}

export default function HotjarCallTracking({
  hotjarId,
  trackYektanet = false,
}: HotjarCallTrackingProps) {
  useEffect(() => {
    // Load after the page is interactive so Hotjar never competes with LCP.
    const idle =
      window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const start = () => idle(() => ensureHotjar(hotjarId));
    // Yektanet tags its ad clicks with utm_source=yektanet. Read on the client:
    // the page is a static export, so the query string never reaches a server.
    // Queued on the stub, so it is sent when the idle-time load happens.
    let query = window.location.search;
    try {
      query = decodeURIComponent(query);
    } catch {
      // A malformed %-escape: test the raw string instead.
    }
    if (trackYektanet && /yektanet/i.test(query)) {
      hotjarStub()("event", "from_yektanet");
    }
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>(
        'a[href^="tel:"]',
      );
      if (!a) return;
      ensureHotjar(hotjarId);
      window.hj!("event", "call_click");
      window.hj!("event", `call_click_${locationOf(a)}`);
    };
    // Capture phase: runs before any handler that might stop propagation.
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("load", start);
      document.removeEventListener("click", onClick, true);
    };
  }, [hotjarId, trackYektanet]);

  return null;
}
