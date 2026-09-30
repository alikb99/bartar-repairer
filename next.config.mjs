import { readdirSync, existsSync } from "node:fs";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

// Frozen pages (docs/frozen-pages.md) are folders in public/ holding a raw
// index.html. Read off the disk so a new one needs no edit here.
const FROZEN_DIRS = readdirSync("public", { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(`public/${e.name}/index.html`))
  .map((e) => e.name);

/** @type {(phase: string) => import('next').NextConfig} */
export default function nextConfig(phase) {
  // "output: export" makes dev crash on /prices/, /app/ and /mobile-repair-online/:
  // those three paths are intentionally absent from generateStaticParams (see
  // docs/frozen-pages.md — they are served as raw HTML from public/ instead),
  // and static export forces dynamicParams to false, so next dev hard-errors
  // instead of 404ing. Production builds are untouched: this only relaxes dev.
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    output: isDev ? undefined : "export",
    images: {
      unoptimized: true,
    },
    reactStrictMode: true,
    trailingSlash: true,
    // next dev serves public/ files only at their exact path, so /app/ falls
    // through to [...slug] and 404s while /app/index.html works. The host does
    // this directory-index mapping in production; this mirrors it in dev only
    // (rewrites are not allowed with output: "export").
    ...(isDev && {
      async rewrites() {
        return {
          beforeFiles: FROZEN_DIRS.map((dir) => ({
            source: `/${dir}/`,
            destination: `/${dir}/index.html`,
          })),
        };
      },
    }),
  };
}
