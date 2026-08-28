import { Phone } from "lucide-react";
import { SITE } from "@/lib/data";

// Always-visible call button on mobile so the phone number is one tap away.
// The right inset leaves room for the online-support chat bubble (SITE.chat) —
// at `right-4` the two overlap and the chat launcher becomes untappable.
export default function CallFab() {
  return (
    <a
      href={SITE.phoneHref}
      aria-label={`تماس با ${SITE.name} | ${SITE.phone}`}
      dir="ltr"
      className="fixed bottom-4 left-4 right-[74px] z-40 flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_-10px_rgba(181,27,27,0.7)] lg:hidden"
    >
      <Phone className="h-4 w-4" />
      {SITE.phone}
    </a>
  );
}
