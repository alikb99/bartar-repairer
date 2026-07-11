"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpLeft, FileText, Wrench } from "lucide-react";

export type SearchItem = { title: string; path: string; type: "post" | "page" };

// Normalize Persian/Arabic variants so "ي/ی" and "ك/ک" and spaces match.
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ ‏‎]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SearchClient({ items }: { items: SearchItem[] }) {
  const [q, setQ] = useState("");

  // Seed from ?q= on first paint (static page can't read query on the server).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") || "";
    if (initial) setQ(initial);
  }, []);

  // Keep the URL in sync so results are shareable / bookmarkable.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.toString());
  }, [q]);

  const results = useMemo(() => {
    const nq = norm(q);
    if (nq.length < 2) return [];
    const terms = nq.split(" ").filter(Boolean);
    return items
      .map((it) => {
        const nt = norm(it.title);
        let score = 0;
        if (nt.includes(nq)) score += 100;
        for (const t of terms) if (nt.includes(t)) score += 10;
        // service/landing pages slightly favored (commercial intent)
        if (it.type === "page") score += 2;
        return { it, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((r) => r.it);
  }, [q, items]);

  const nq = norm(q);

  return (
    <div>
      <label className="relative block">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-300" />
        <input
          autoFocus
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="نام برند، دستگاه یا مشکل را بنویسید…"
          aria-label="جستجو در سایت"
          className="w-full rounded-2xl border border-line bg-white py-4 pr-12 pl-4 text-[15px] text-ink-900 shadow-card outline-none transition focus:border-accent/50 focus:ring-4 focus:ring-accent/10"
        />
      </label>

      <div className="mt-8">
        {nq.length < 2 ? (
          <p className="text-sm text-ink-500">
            برای جستجو حداقل دو حرف وارد کنید؛ مثلاً «تعمیر گوشی سامسونگ» یا
            «آب خوردگی لپ تاپ».
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-ink-500">
            نتیجه ای برای «{q}» پیدا نشد. عبارت دیگری را امتحان کنید یا با ما تماس
            بگیرید.
          </p>
        ) : (
          <>
            <p className="mb-5 text-sm text-ink-500">
              {results.length.toLocaleString("fa-IR")} نتیجه برای «{q}»
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((it) => (
                <Link
                  key={it.path}
                  href={it.path}
                  className="card-hover group flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3.5"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-tint text-accent">
                      {it.type === "page" ? (
                        <Wrench className="h-[18px] w-[18px]" />
                      ) : (
                        <FileText className="h-[18px] w-[18px]" />
                      )}
                    </span>
                    <span className="line-clamp-1 text-sm font-medium text-ink-800 transition group-hover:text-accent">
                      {it.title}
                    </span>
                  </span>
                  <ArrowUpLeft className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-accent" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
