// Recompress bloated webp images in /public.
//
// Every image is already webp, but a large batch was written at near-lossless
// quality: a 911x500 hero weighed 532KB, about 1.2 bytes per pixel, where a
// well-encoded webp costs roughly 0.15. Those bytes are pure LCP cost. This
// pass re-encodes anything above BPP_LIMIT (and downscales anything wider than
// MAX_W), then rewrites _image-meta.json so the injected width/height
// attributes keep matching the real pixels.
//
// Safe to re-run: already-lean images are skipped, and a re-encode that would
// grow the file is discarded.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// libvips keeps decoded files in an internal cache, which on Windows leaves a
// handle on the path and makes the next open fail with UNKNOWN. Reading each
// file into a Buffer ourselves (below) plus disabling the cache keeps every
// open/write pair independent.
sharp.cache(false);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const META = path.join(ROOT, "content", "_image-meta.json");

const MAX_W = 1400; // widest container in the design plus retina headroom
const MIN_BYTES = 60 * 1024; // only touch files heavy enough to matter
const BPP_LIMIT = 0.4; // bytes per pixel above which a webp is over-encoded
const QUALITY = 80;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (e.name.toLowerCase().endsWith(".webp")) out.push(f);
  }
  return out;
}

const urlKey = (abs) =>
  "/" + path.relative(PUBLIC, abs).split(path.sep).join("/");

const meta = JSON.parse(fs.readFileSync(META, "utf8"));
const files = walk(PUBLIC);

let touched = 0;
let savedBytes = 0;
let failed = 0;

for (const file of files) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    continue;
  }
  if (stat.size < MIN_BYTES) continue;

  try {
    const src = fs.readFileSync(file);
    const info = await sharp(src).metadata();
    if (!info.width || !info.height) continue;

    const tooWide = info.width > MAX_W;
    const bpp = stat.size / (info.width * info.height);
    // Re-encode when the file is oversized in pixels OR in bytes-per-pixel.
    if (!tooWide && bpp <= BPP_LIMIT) continue;

    const pipeline = sharp(src);
    if (tooWide) pipeline.resize({ width: MAX_W, withoutEnlargement: true });
    const buf = await pipeline.webp({ quality: QUALITY }).toBuffer();

    // Never write a bigger file than we started with.
    if (buf.length >= stat.size) continue;

    fs.writeFileSync(file, buf);
    savedBytes += stat.size - buf.length;
    touched++;

    const after = await sharp(buf).metadata();
    const key = urlKey(file);
    // Update every manifest entry that points at this file, so the width and
    // height attributes injected into <img> keep matching the real pixels.
    for (const [k, v] of Object.entries(meta)) {
      if (k === key || v?.webp === key) {
        if (v.webp === key || k === key) {
          if (k === key) {
            v.w = after.width;
            v.h = after.height;
          } else {
            // Source raster entry pointing at this webp: keep aspect ratio in
            // sync so layout reservation stays accurate.
            v.w = after.width;
            v.h = after.height;
          }
        }
      }
    }
  } catch (err) {
    failed++;
    console.warn("skip", urlKey(file), String(err).slice(0, 80));
  }
}

fs.writeFileSync(META, JSON.stringify(meta));
console.log(
  `resized ${touched} images, saved ${(savedBytes / 1024 / 1024).toFixed(1)} MB` +
    (failed ? `, ${failed} failed` : ""),
);
