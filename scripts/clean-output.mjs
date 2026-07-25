import fs from "node:fs";
import path from "node:path";

// Next's static export can leave obsolete route folders in an existing `out/`
// directory. Removing only that generated directory before each build prevents
// deleted pagination/detail URLs from being deployed as stale indexable pages.
const output = path.resolve(process.cwd(), "out");
if (path.dirname(output) !== path.resolve(process.cwd())) {
  throw new Error(`Refusing to remove unexpected path: ${output}`);
}
fs.rmSync(output, { recursive: true, force: true });
