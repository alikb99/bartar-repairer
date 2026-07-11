// Downloads every bartar-repairer.com image referenced by posts into /public,
// mirroring the original URL path (/wp-content/uploads/...). Resumable: skips
// files that already exist. URL rewriting (origin -> relative) happens in
// lib/content.ts at build time, so we only need the files on disk here.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const ORIGIN = "https://bartar-repairer.com";

const posts = JSON.parse(
  fs.readFileSync(path.join(ROOT, "content", "posts.json"), "utf8"),
);

const urls = new Set();
for (const p of posts) {
  if (p.image && p.image.startsWith(ORIGIN)) urls.add(p.image);
  for (const m of p.content.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    if (m[1].startsWith(ORIGIN)) urls.add(m[1]);
  }
}
const list = [...urls];
console.log("images to fetch:", list.length);

const CONCURRENCY = 24;
let i = 0;
let ok = 0;
let skip = 0;
let fail = 0;
const failures = [];

function destFor(u) {
  const { pathname } = new URL(u);
  return path.join(PUBLIC, decodeURIComponent(pathname));
}

async function worker() {
  while (i < list.length) {
    const idx = i++;
    const u = list[idx];
    const dest = destFor(u);
    try {
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        skip++;
        continue;
      }
      const res = await fetch(u, {
        signal: AbortSignal.timeout(20000),
        headers: { "User-Agent": "Mozilla/5.0 bartar-localizer" },
      });
      if (!res.ok) {
        fail++;
        failures.push(`${res.status} ${u}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      ok++;
    } catch (e) {
      fail++;
      failures.push(`ERR ${u} ${e.message}`);
    }
    if ((ok + skip + fail) % 200 === 0)
      console.log(`progress ${ok + skip + fail}/${list.length} (ok=${ok} skip=${skip} fail=${fail})`);
  }
}

const t0 = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(
  `done in ${((Date.now() - t0) / 1000).toFixed(0)}s | ok=${ok} skip=${skip} fail=${fail}`,
);
if (failures.length) {
  fs.writeFileSync(
    path.join(ROOT, "content", "_img_failures.txt"),
    failures.join("\n"),
  );
  console.log("failures written to content/_img_failures.txt");
}
