"use client";

import dynamic from "next/dynamic";

const ServiceDeviceScene = dynamic(() => import("./ServiceDeviceScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,rgba(218,37,28,.2),transparent_42%)]" />
  ),
});

export default function ServiceDeviceSceneLoader() {
  return <ServiceDeviceScene />;
}
