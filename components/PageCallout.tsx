import Link from "next/link";
import { calloutFor, type Callout } from "@/lib/recovered-callouts";

// The bordered panel that tells a visitor who landed on a neighbourhood page
// that the two branches serve the whole city, and points at the hub page with
// the full model list. On the brand hubs it does the opposite job: it sends the
// visitor straight to the page for their own device.
//
// One panel per page at most (lib/recovered-callouts.ts). `slot` says where the
// template is asking from, so the same component can be dropped into several
// positions and only renders in the one this page used.
const LINK =
  "font-bold text-accent underline decoration-accent/30 underline-offset-4 transition hover:decoration-accent";

export default function PageCallout({
  path,
  slot,
}: {
  path: string;
  slot: Callout["slot"];
}) {
  const block = calloutFor(path);
  if (!block || block.slot !== slot) return null;

  return (
    <section className="my-8 rounded-[22px] border-r-[3px] border-accent bg-paper p-5 sm:p-6">
      <h2 className="text-[17px] font-extrabold leading-8 text-ink-900 sm:text-xl">
        {block.title}
      </h2>
      {block.paras.map((para, i) => (
        <p key={i} className="mt-3 text-[15px] leading-9 text-ink-700">
          {para.map((part, k) =>
            typeof part === "string" ? (
              part
            ) : (
              <Link key={k} className={LINK} href={part.href}>
                {part.text}
              </Link>
            ),
          )}
        </p>
      ))}
    </section>
  );
}
