// One-off (resumable) image optimizer.
//   1. Walks /public and reads every image's intrinsic width/height.
//   2. For raster images (jpg/jpeg/png) generates a compressed .webp sibling
//      (skipped if a fresh one already exists) — big LCP win.
//   3. Writes content/_image-meta.json: a manifest keyed by the public URL path
//      (decoded, leading slash) → { w, h, webp? }. lib/content.ts consumes this
//      at build time to swap <img> sources to webp and inject width/height
//      (CLS prevention) WITHOUT running sharp during `next build`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "content", "_image-meta.json");

const RASTER = new Set([".jpg", ".jpeg", ".png"]);
const ALL = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/** Public-relative URL key, decoded, forward slashes, leading slash. */
function urlKey(absFile) {
  const rel = path.relative(PUBLIC, absFile).split(path.sep).join("/");
  return "/" + rel;
}

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (ALL.has(path.extname(name).toLowerCase())) files.push(full);
  }
  return files;
}

const files = walk(PUBLIC);
console.log("images found:", files.length);

const manifest = {};
let made = 0;
let skipped = 0;
let failed = 0;
let dims = 0;
let n = 0;

for (const file of files) {
  n++;
  const ext = path.extname(file).toLowerCase();
  const key = urlKey(file);
  let entry = manifest[key] || (manifest[key] = {});

  // 1) intrinsic dimensions
  try {
    const meta = await sharp(file).metadata();
    if (meta.width && meta.height) {
      entry.w = meta.width;
      entry.h = meta.height;
      dims++;
    }
  } catch {
    /* unreadable — leave without dims */
  }

  // 2) webp sibling for raster
  if (RASTER.has(ext)) {
    const webpFile = file.slice(0, -ext.length) + ".webp";
    const webpKey = key.slice(0, -ext.length) + ".webp";
    entry.webp = webpKey;
    try {
      const fresh =
        fs.existsSync(webpFile) &&
        fs.statSync(webpFile).mtimeMs >= fs.statSync(file).mtimeMs &&
        fs.statSync(webpFile).size > 0;
      if (fresh) {
        skipped++;
      } else {
        await sharp(file)
          .webp({ quality: 80, effort: 4 })
          .toFile(webpFile);
        made++;
        // record webp dims (same as source) under its own key too
        manifest[webpKey] = { w: entry.w, h: entry.h };
      }
      // ensure webp dims present even when skipped
      if (!manifest[webpKey] && entry.w)
        manifest[webpKey] = { w: entry.w, h: entry.h };
    } catch (e) {
      failed++;
      delete entry.webp; // don't point at a webp we failed to create
    }
  }

  if (n % 250 === 0)
    console.log(`  ${n}/${files.length} (made=${made} skip=${skipped} fail=${failed})`);
}

fs.writeFileSync(OUT, JSON.stringify(manifest));
console.log(
  `done | files=${files.length} webp_made=${made} webp_skip=${skipped} fail=${failed} dims=${dims}`,
);
console.log("manifest:", path.relative(ROOT, OUT));
