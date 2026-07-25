import Link from "next/link";
import { ArrowUpLeft, MapPin } from "lucide-react";
import type { Post } from "@/lib/content";
import { LIVE_REPAIR_TYPES, repairTypesFor } from "@/lib/repair-types";
import { LIVE_SERVICE_AREAS, serviceAreasFor } from "@/lib/service-areas";
import Icon from "@/components/Icon";

// Up-links from a page to the repair-type and service-area hubs it belongs to.
// These are the second and third internal-linking axes: a model page like
// /a06-battery-replacement/ links up to /repairs/battery-replacement/, and a
// neighbourhood page links up to /areas/sattarkhan/ — each hub links back down
// to every sibling, so nearly-orphaned pages gain real inbound authority.
export default function RepairTypeLinks({ post }: { post: Post }) {
  const liveTypes = new Set(LIVE_REPAIR_TYPES.map((t) => t.slug));
  const types = repairTypesFor(post).filter((t) => liveTypes.has(t.slug));
  const liveAreas = new Set(LIVE_SERVICE_AREAS.map((a) => a.slug));
  const areas = serviceAreasFor(post).filter((a) => liveAreas.has(a.slug));
  if (types.length === 0 && areas.length === 0) return null;

  return (
    <section className="mt-10 grid gap-4 sm:grid-cols-2">
      {types.length > 0 && (
        <div className="rounded-[22px] border border-line bg-white p-5 shadow-card sm:p-6">
          <p className="text-sm font-extrabold text-ink-900">
            همین تعمیر برای برندهای دیگر
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {types.map((t) => (
              <Link
                key={t.slug}
                href={`/repairs/${t.slug}/`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3 transition hover:border-accent/40 hover:bg-white"
              >
                <span className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-accent shadow-card transition group-hover:bg-accent group-hover:text-white">
                    <Icon name={t.icon} className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold text-ink-800 transition group-hover:text-accent">
                    {t.title} همه برندها
                  </span>
                </span>
                <ArrowUpLeft className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </div>
      )}
      {areas.length > 0 && (
        <div className="rounded-[22px] border border-line bg-white p-5 shadow-card sm:p-6">
          <p className="text-sm font-extrabold text-ink-900">
            خدمات ما در این منطقه
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {areas.map((a) => (
              <Link
                key={a.slug}
                href={`/areas/${a.slug}/`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-4 py-3 transition hover:border-accent/40 hover:bg-white"
              >
                <span className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-accent shadow-card transition group-hover:bg-accent group-hover:text-white">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold text-ink-800 transition group-hover:text-accent">
                    تعمیرات در {a.name}
                  </span>
                </span>
                <ArrowUpLeft className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
