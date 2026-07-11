// Streaming extractor for the 1.97GB WordPress dump (bartar.sql).
// Reads the file once, parses only the tables we need with a string-aware
// tuple parser that survives chunk boundaries, and writes clean JSON to /content.
//
// Run:  node scripts/extract.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SQL = path.join(ROOT, "bartar.sql");
const OUT = path.join(ROOT, "content");
fs.mkdirSync(OUT, { recursive: true });

const TARGETS = new Set([
  "wvcp_posts",
  "wvcp_postmeta",
  "wvcp_terms",
  "wvcp_term_taxonomy",
  "wvcp_term_relationships",
  "wvcp_options",
]);

const META_KEYS = new Set([
  "_thumbnail_id",
  "_yoast_wpseo_title",
  "_yoast_wpseo_metadesc",
]);

const OPTION_KEYS = new Set([
  "blogname",
  "blogdescription",
  "home",
  "siteurl",
]);

// ---- collected data ----
const posts = new Map(); // id -> post row (post/page, publish)
const attachments = new Map(); // id -> guid (image url)
const terms = new Map(); // term_id -> {name, slug}
const taxonomies = new Map(); // ttid -> {term_id, taxonomy, parent, count, description}
const rels = new Map(); // object_id -> Set(ttid)
const meta = new Map(); // post_id -> {thumb, seoTitle, seoDesc}
const options = {};
let counters = { postRows: 0, metaRows: 0, kept: 0 };

function unescape(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "\\" && i + 1 < s.length) {
      const n = s[++i];
      if (n === "n") out += "\n";
      else if (n === "r") out += "\r";
      else if (n === "t") out += "\t";
      else if (n === "0") out += "\0";
      else out += n; // \' \" \\ etc.
    } else {
      out += c;
    }
  }
  return out;
}

function emit(table, row) {
  switch (table) {
    case "wvcp_posts": {
      // cols: ID,post_author,post_date,post_date_gmt,post_content,post_title,
      // post_excerpt,post_status,comment_status,ping_status,post_password,
      // post_name,to_ping,pinged,post_modified,post_modified_gmt,
      // post_content_filtered,post_parent,guid,menu_order,post_type,
      // post_mime_type,comment_count
      counters.postRows++;
      const id = +row[0];
      const status = row[7];
      const name = row[11];
      const type = row[20];
      const guid = row[18];
      if (type === "attachment") {
        attachments.set(id, guid);
        return;
      }
      if ((type === "post" || type === "page") && status === "publish") {
        posts.set(id, {
          id,
          type,
          date: row[2],
          content: row[4],
          title: row[5],
          excerpt: row[6],
          name,
          modified: row[14],
          parent: +row[17],
          guid,
        });
      }
      return;
    }
    case "wvcp_postmeta": {
      counters.metaRows++;
      const key = row[2];
      if (!META_KEYS.has(key)) return;
      const pid = +row[1];
      const val = row[3];
      const m = meta.get(pid) || {};
      if (key === "_thumbnail_id") m.thumb = +val;
      else if (key === "_yoast_wpseo_title") m.seoTitle = val;
      else if (key === "_yoast_wpseo_metadesc") m.seoDesc = val;
      meta.set(pid, m);
      return;
    }
    case "wvcp_terms": {
      terms.set(+row[0], { name: row[1], slug: row[2] });
      return;
    }
    case "wvcp_term_taxonomy": {
      taxonomies.set(+row[0], {
        term_id: +row[1],
        taxonomy: row[2],
        description: row[3],
        parent: +row[4],
        count: +row[5],
      });
      return;
    }
    case "wvcp_term_relationships": {
      const oid = +row[0];
      const set = rels.get(oid) || new Set();
      set.add(+row[1]);
      rels.set(oid, set);
      return;
    }
    case "wvcp_options": {
      if (OPTION_KEYS.has(row[1])) options[row[1]] = row[2];
      return;
    }
  }
}

// ---- streaming state machine ----
let mode = "scan"; // scan | values | skip
let table = null;
let buf = "";
// tuple parse state (persist across chunks)
let inTuple = false;
let cur = [];
let field = "";
let inStr = false;
let esc = false;
let quoted = false;

function finalize() {
  if (quoted) return unescape(field);
  const t = field.trim();
  if (t === "NULL" || t === "") return t === "" ? null : null;
  return t;
}

function processValues() {
  // operates on buf, consuming from index 0
  let i = 0;
  const len = buf.length;
  while (i < len) {
    const c = buf[i];
    if (!inTuple) {
      if (c === "(") {
        inTuple = true;
        cur = [];
        field = "";
        inStr = false;
        esc = false;
        quoted = false;
        i++;
      } else if (c === ";") {
        i++;
        mode = "scan";
        buf = buf.slice(i);
        return;
      } else {
        i++; // skip , whitespace newline between tuples
      }
      continue;
    }
    // inside a tuple
    if (inStr) {
      if (esc) {
        field += c;
        esc = false;
        i++;
      } else if (c === "\\") {
        field += c;
        esc = true;
        i++;
      } else if (c === "'") {
        inStr = false;
        i++;
      } else {
        field += c;
        i++;
      }
    } else {
      if (c === "'") {
        inStr = true;
        quoted = true;
        i++;
      } else if (c === ",") {
        cur.push(finalize());
        field = "";
        quoted = false;
        i++;
      } else if (c === ")") {
        cur.push(finalize());
        field = "";
        quoted = false;
        inTuple = false;
        if (TARGETS.has(table)) emit(table, cur);
        i++;
      } else {
        field += c;
        i++;
      }
    }
  }
  // consumed whole buffer mid-parse; keep state, drop processed text
  buf = "";
}

function processSkip() {
  // skip a non-target INSERT: find top-level ';' (string-aware)
  let i = 0;
  const len = buf.length;
  while (i < len) {
    const c = buf[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === "'") inStr = false;
    } else if (c === "'") {
      inStr = true;
    } else if (c === ";") {
      i++;
      mode = "scan";
      buf = buf.slice(i);
      return;
    }
    i++;
  }
  buf = "";
}

function processScan() {
  const marker = "INSERT INTO `";
  const idx = buf.indexOf(marker);
  if (idx === -1) {
    // keep a small tail in case marker is split across chunks
    if (buf.length > marker.length) buf = buf.slice(-marker.length);
    return false;
  }
  const start = idx + marker.length;
  const tick = buf.indexOf("`", start);
  if (tick === -1) {
    buf = buf.slice(idx); // wait for more
    return false;
  }
  const tbl = buf.slice(start, tick);
  const vIdx = buf.indexOf("VALUES", tick);
  if (vIdx === -1) {
    buf = buf.slice(idx);
    return false;
  }
  table = tbl;
  buf = buf.slice(vIdx + "VALUES".length);
  inTuple = false;
  inStr = false;
  esc = false;
  mode = TARGETS.has(tbl) ? "values" : "skip";
  return true;
}

function pump() {
  let progressed = true;
  while (progressed) {
    progressed = false;
    if (mode === "scan") {
      progressed = processScan();
    } else if (mode === "values") {
      const before = buf.length;
      processValues();
      progressed = mode !== "values" || buf.length !== before;
      if (mode === "values") break; // need more data
    } else if (mode === "skip") {
      processSkip();
      if (mode === "skip") break; // need more data
      progressed = true;
    }
  }
}

console.log("Reading", SQL);
const t0 = Date.now();
const stream = fs.createReadStream(SQL, {
  encoding: "utf8",
  highWaterMark: 16 * 1024 * 1024,
});
let bytes = 0;
stream.on("data", (chunk) => {
  bytes += chunk.length;
  buf += chunk;
  pump();
});
stream.on("end", () => {
  if (buf.length) pump();
  finish();
});
stream.on("error", (e) => {
  console.error("stream error", e);
  process.exit(1);
});

function decodeSlug(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function finish() {
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `Parsed in ${secs}s | postRows=${counters.postRows} metaRows=${counters.metaRows}`,
  );

  // ---- build categories ----
  const catByTermId = new Map();
  for (const [ttid, tx] of taxonomies) {
    if (tx.taxonomy !== "category") continue;
    const term = terms.get(tx.term_id);
    if (!term) continue;
    catByTermId.set(tx.term_id, {
      termId: tx.term_id,
      ttid,
      name: term.name,
      slug: term.slug,
      slugDecoded: decodeSlug(term.slug),
      parent: tx.parent,
      count: tx.count,
      description: tx.description || "",
    });
  }
  // map ttid -> term_id for relationship resolution (category only)
  const ttidToTermId = new Map();
  for (const [ttid, tx] of taxonomies) {
    if (tx.taxonomy === "category") ttidToTermId.set(ttid, tx.term_id);
  }
  const categories = [...catByTermId.values()].sort(
    (a, b) => b.count - a.count,
  );

  // ---- build posts ----
  const outPosts = [];
  for (const [id, p] of posts) {
    const m = meta.get(id) || {};
    let image = "";
    if (m.thumb && attachments.has(m.thumb)) image = attachments.get(m.thumb);
    const cats = [];
    const relSet = rels.get(id);
    if (relSet) {
      for (const ttid of relSet) {
        const termId = ttidToTermId.get(ttid);
        if (termId && catByTermId.has(termId)) cats.push(termId);
      }
    }
    outPosts.push({
      id,
      type: p.type,
      slug: p.name,
      slugDecoded: decodeSlug(p.name),
      title: p.title,
      content: p.content,
      excerpt: p.excerpt,
      date: p.date,
      modified: p.modified,
      parent: p.parent,
      categories: cats,
      image,
      seoTitle: m.seoTitle || "",
      seoDesc: m.seoDesc || "",
    });
  }
  outPosts.sort((a, b) => (a.date < b.date ? 1 : -1));

  const site = {
    blogname: options.blogname || "",
    blogdescription: options.blogdescription || "",
    home: options.home || "",
    siteurl: options.siteurl || "",
  };

  fs.writeFileSync(
    path.join(OUT, "categories.json"),
    JSON.stringify(categories),
  );
  fs.writeFileSync(path.join(OUT, "posts.json"), JSON.stringify(outPosts));
  fs.writeFileSync(path.join(OUT, "site.json"), JSON.stringify(site, null, 2));

  const byType = outPosts.reduce((a, p) => ((a[p.type] = (a[p.type] || 0) + 1), a), {});
  console.log("categories:", categories.length);
  console.log("posts/pages:", outPosts.length, byType);
  console.log("with image:", outPosts.filter((p) => p.image).length);
  console.log("with seoTitle:", outPosts.filter((p) => p.seoTitle).length);
  console.log("Wrote content/{categories,posts,site}.json");
}
