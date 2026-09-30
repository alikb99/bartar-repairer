"use client";

import dynamic from "next/dynamic";

// The request form is interactive-only: it embeds the 9fx form and has no
// server-rendered state worth shipping. Loading it on the client keeps
// the landing pages' HTML small; the placeholder reserves the form's height so
// nothing below it jumps when the form arrives.
const RepairRequestForm = dynamic(() => import("./RepairRequestForm"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="mx-auto block w-full max-w-[560px] rounded-[22px] bg-white shadow-card"
      style={{ height: 760 }}
    />
  ),
});

export default function RepairRequestSlot() {
  return <RepairRequestForm />;
}
