import { pageNotesFor } from "@/lib/recovered-page-notes";

// A short panel above the article body on the neighbourhood laptop pages: what
// that brand's machines usually arrive with, and how to get a device to us from
// that part of the city. Same card as the ClusterContent block, without the
// direct answer, facts and FAQ those pages do not have.
export default function PageNotes({ path }: { path: string }) {
  const notes = pageNotesFor(path);
  if (!notes) return null;

  return (
    <section className="mb-8 rounded-[26px] border border-line bg-white p-5 shadow-card sm:p-8">
      {notes.map((s, i) => (
        <div key={s.h} className={i ? "mt-8" : ""}>
          <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{s.h}</h2>
          {s.p.map((para, k) => (
            <p key={k} className="mt-3 text-[15px] leading-9 text-ink-700">
              {para}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}
