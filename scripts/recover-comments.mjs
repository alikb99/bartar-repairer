// Recovers the reader-comment threads ("پرسش های خوانندگان این صفحه") from the
// deployed site. They came from the WordPress `wvcp_comments` table, which the
// rebuilt source never imported, so the rendered HTML is the only copy left.
//
//   node scripts/recover-comments.mjs [--live <dir>] [--out <file>]
//
// Each page keeps its threads in document order: one reader question, with at
// most one shop reply nested under it. Ids are the original comment ids, so the
// #comment-NNN anchors that are already indexed keep working.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const LIVE = argOf("--live", "D:/Folder D/back up/bartar-repairer.com");
const OUT = argOf("--out", "lib/recovered-comments.ts");

const ENT = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  zwnj: "\u200c",
  laquo: "«",
  raquo: "»",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};
const decode = (s) =>
  s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, b) => {
    if (b[0] === "#") {
      const c =
        b[1] === "x" || b[1] === "X"
          ? parseInt(b.slice(2), 16)
          : parseInt(b.slice(1), 10);
      return Number.isFinite(c) ? String.fromCodePoint(c) : m;
    }
    return b in ENT ? ENT[b] : m;
  });
const text = (html) =>
  decode(html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, ""))
    .replace(/[ \t\r\n]+/g, " ")
    .trim();

const pages = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, `${rel}${e.name}/`);
    else if (e.name === "index.html") pages.push([rel === "" ? "/" : `/${rel}`, abs]);
  }
})(LIVE, "");

// Every <li id="comment-N"> … optionally containing <div id="comment-M"> …
const THREAD =
  /<li id="comment-(\d+)"[^>]*>([\s\S]*?)(?=<li id="comment-\d+"|<\/ol>)/g;
const FIELD =
  /<span[^>]*>([\s\S]*?)<\/span><time dateTime="([^"]+)"[^>]*>([\s\S]*?)<\/time><\/div><p[^>]*>([\s\S]*?)<\/p>/;
const REPLY =
  /<div id="comment-(\d+)"[^>]*>[\s\S]*?<time dateTime="([^"]+)"[^>]*>([\s\S]*?)<\/time><\/div><p[^>]*>([\s\S]*?)<\/p>/;

const recovered = [];
let total = 0;
for (const [urlPath, file] of pages.sort()) {
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes("پرسش های خوانندگان این صفحه")) continue;

  // The JSON-LD carries the ISO timestamps with the +03:30 offset the visible
  // <time> attributes drop, and marks which pages published the thread as
  // schema at all. Both are read back so the rebuild emits the same nodes.
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((s) => s[1])
    .find((s) => s.includes('"Comment"'));
  const schema = ld ? JSON.parse(ld).comment ?? null : null;
  // The deployed JSON-LD names the author of a few threads differently from the
  // visible block — a shop answer that was posted as its own comment rather
  // than as a reply. The published nodes are the record, so they win.
  const schemaAuthor = new Map();
  for (const node of schema ?? []) {
    const id = String(node.url ?? "").match(/#comment-(\d+)$/);
    if (id) schemaAuthor.set(Number(id[1]), node.author?.name ?? "");
  }

  const threads = [];
  THREAD.lastIndex = 0;
  let m;
  while ((m = THREAD.exec(html))) {
    const [id, body] = [Number(m[1]), m[2]];
    const f = body.match(FIELD);
    if (!f) continue;
    const r = body.match(REPLY);
    const shown = text(f[1]);
    const published = schemaAuthor.get(id);
    threads.push({
      id,
      author: shown,
      ...(published && published !== shown ? { schemaAuthor: published } : {}),
      dateTime: f[2],
      date: text(f[3]),
      text: text(f[4]),
      ...(r
        ? {
            reply: {
              id: Number(r[1]),
              dateTime: r[2],
              date: text(r[3]),
              text: text(r[4]),
            },
          }
        : {}),
    });
  }

  if (threads.length) {
    total += threads.length;
    recovered.push([urlPath, { threads, schema: Boolean(schema) }]);
  }
}

const j = (v, indent) =>
  JSON.stringify(v, null, 2).split("\n").join("\n" + " ".repeat(indent));

const body = recovered
  .map(
    ([p, b]) =>
      `  ${JSON.stringify(p)}: {\n` +
      `    schema: ${b.schema},\n` +
      `    threads: ${j(b.threads, 4)},\n  },`,
  )
  .join("\n");

fs.writeFileSync(
  OUT,
  `// Reader comments recovered from the deployed site.
//
// The WordPress export used to rebuild this project did not include the
// wvcp_comments table, so these questions and the shop's answers survived only
// in the rendered HTML. scripts/recover-comments.mjs reads them back;
// components/ReaderComments.tsx renders them and app/[...slug]/page.tsx puts
// them in the Article schema.
//
// \`schema: false\` means the deployed page showed the thread but did not emit
// Comment JSON-LD for it — kept so the rebuild does not add nodes the live site
// never had.
//
// Do not edit by hand — re-run the script.

export type ReaderReply = {
  id: number;
  /** ISO timestamp without offset, as the <time datetime> attribute has it. */
  dateTime: string;
  /** The same moment, already formatted in the Persian calendar. */
  date: string;
  text: string;
};

export type ReaderComment = ReaderReply & {
  author: string;
  /** Set where the deployed JSON-LD credited the comment to someone else. */
  schemaAuthor?: string;
  reply?: ReaderReply;
};

export type PageComments = { schema: boolean; threads: ReaderComment[] };

export const COMMENTS: Record<string, PageComments> = {
${body}
};

/** Reader comments for a page, or null when it has none. */
export function commentsFor(path: string): PageComments | null {
  return COMMENTS[path] ?? null;
}
`,
  "utf8",
);

console.log(`recovered ${total} comments on ${recovered.length} pages -> ${OUT}`);
for (const [p, b] of recovered)
  console.log(
    `  ${p}  ${b.threads.length} thread(s), ${b.threads.filter((t) => t.reply).length} answered${b.schema ? "" : "  (no JSON-LD on live)"}`,
  );
