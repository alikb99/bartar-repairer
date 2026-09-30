import ServiceCenters from "./ServiceCenters";
import { SERVICE_CENTER_PAGES } from "@/lib/recovered-service-centers";
import { LIVE_SERVICE_AREAS } from "@/lib/service-areas";

// Server-side gate for the branch locator. Keeps the page-list lookup and the
// POSTS-backed area table out of the client bundle — ServiceCenters itself is a
// client component and receives only the plain {slug, name} pairs it renders.
//
// The block sits as the last child of <article> on every page that carries it,
// which is why the slot is dropped into each landing template rather than
// wrapped around them.
export default function ServiceCentersSlot({
  path,
  heading,
  intro,
  always = false,
  withAreas = true,
}: {
  path: string;
  heading?: string;
  intro?: string;
  /** Render regardless of the page list — for the pages that ask by name. */
  always?: boolean;
  /** Drop the covered-areas list (the neighbourhood hubs are one already). */
  withAreas?: boolean;
}) {
  if (!always && !SERVICE_CENTER_PAGES.has(path)) return null;
  return (
    <ServiceCenters
      areas={
        withAreas
          ? LIVE_SERVICE_AREAS.map((a) => ({ slug: a.slug, name: a.name }))
          : []
      }
      heading={heading}
      intro={intro}
    />
  );
}
