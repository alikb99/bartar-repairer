import { Phone } from "lucide-react";
import { SITE } from "@/lib/data";

// Always-visible call button on mobile so the phone number is one tap away.
// Sized and positioned to match the chat bubble the 9fx widget injects
// (chat.js: bottom:20px, right:20px, 56x56px circle) so the two sit on the
// same row, the same height, with a real gap instead of nearly touching.
export default function CallFab() {
  return (
    <a
      href={SITE.phoneHref}
      aria-label={`تماس با ${SITE.name} | ${SITE.phone}`}
      dir="ltr"
      className="fixed bottom-5 left-4 right-[92px] z-40 flex h-14 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-bold text-white shadow-[0_12px_30px_-10px_rgba(181,27,27,0.7)] lg:hidden"
    >
      <Phone className="h-4 w-4" />
      {SITE.phone}
    </a>
  );
}
