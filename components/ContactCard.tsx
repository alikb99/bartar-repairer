import { Phone, MapPin, Clock, ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/data";

export default function ContactCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="bg-dotmatrix border-b border-line bg-accent-tint p-5">
        <p className="text-sm font-semibold text-ink-900">رزرو و مشاوره تعمیر</p>
        <a
          href={SITE.phoneHref}
          dir="ltr"
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-lg font-extrabold tracking-wide text-white transition hover:bg-accent-deep"
        >
          <Phone className="h-5 w-5" />
          {SITE.phone}
        </a>
      </div>
      <ul className="space-y-3.5 p-5 text-sm text-ink-700">
        <li className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          {SITE.address}
        </li>
        <li className="flex items-center gap-3">
          <Clock className="h-4 w-4 shrink-0 text-accent" />
          {SITE.hours}
        </li>
        <li className="flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
          ۶ ماه گارانتی روی تعمیرات
        </li>
      </ul>
    </div>
  );
}
