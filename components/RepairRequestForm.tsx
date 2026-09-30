"use client";

import { useEffect, useRef, useState } from "react";
import { Phone } from "lucide-react";
import { SITE } from "@/lib/data";

// Requests are registered in the 9fx panel, so the form is 9fx's own embed.
// Posting to its API from here is not an option: it sends no CORS headers,
// and device/brand must match the panel's own taxonomy.
const FORM_ORIGIN = "https://9fx.ir";
const FORM_SRC = `${FORM_ORIGIN}/embed/repair-request?site=bartar-repairer`;

export default function RepairRequestForm() {
  const frame = useRef<HTMLIFrameElement>(null);
  // Matches the slot placeholder until the embed reports its real height.
  const [height, setHeight] = useState(760);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== FORM_ORIGIN) return;
      if (event.source !== frame.current?.contentWindow) return;
      const data = event.data;
      if (data?.type === "bartar-form-height" && typeof data.height === "number") {
        setHeight(Math.ceil(data.height));
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
      <iframe
        ref={frame}
        src={FORM_SRC}
        title="فرم ثبت درخواست تعمیر"
        className="block w-full border-0"
        style={{ height }}
      />
      <p className="border-t border-line px-5 py-3.5 text-[12.5px] leading-7 text-ink-500 sm:px-7">
        اگر فرم نمایش داده نشد، مستقیم تماس بگیرید:{" "}
        <a
          href={SITE.phoneHref}
          dir="ltr"
          className="inline-flex items-center gap-1.5 font-bold text-accent"
        >
          <Phone className="h-3.5 w-3.5" />
          {SITE.phone}
        </a>
      </p>
    </div>
  );
}
