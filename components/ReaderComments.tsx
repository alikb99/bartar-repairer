import { MessageCircle, Phone } from "lucide-react";
import { SITE } from "@/lib/data";
import { commentsFor } from "@/lib/recovered-comments";

// Questions readers left under the page, with the shop's answer beneath each.
// They are real customer questions carried over from the WordPress comments, so
// they are published verbatim — the note under the heading says so, and nothing
// here is edited or invented.
export default function ReaderComments({ path }: { path: string }) {
  const block = commentsFor(path);
  if (!block || block.threads.length === 0) return null;

  return (
    <section className="mt-14 border-t border-line pt-10">
      <h2 className="heading-accent flex items-center gap-2 text-xl font-extrabold text-ink-900">
        <MessageCircle className="h-5 w-5 shrink-0 text-accent" />
        پرسش های خوانندگان این صفحه
      </h2>
      <p className="mt-3 text-sm leading-8 text-ink-500">
        {block.threads.length.toLocaleString("fa-IR")} پرسشی که کاربران زیر این
        مطلب نوشته اند و پاسخی که تیم فنی ما داده است. متن ها همان چیزی است که
        نوشته شده و ویرایش نشده اند.
      </p>
      <ol className="mt-7 space-y-5">
        {block.threads.map((c) => (
          <li
            key={c.id}
            id={`comment-${c.id}`}
            className="rounded-[22px] border border-line bg-white p-5 shadow-card sm:p-6"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[15px] font-extrabold text-ink-900">
                {c.author}
              </span>
              <time dateTime={c.dateTime} className="text-[12.5px] text-ink-300">
                {c.date}
              </time>
            </div>
            <p className="mt-2.5 text-[15px] leading-9 text-ink-700">{c.text}</p>
            {c.reply && (
              <div
                id={`comment-${c.reply.id}`}
                className="mt-4 rounded-[16px] border p-4 sm:p-5 border-accent/25 bg-accent/[.04]"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[14px] font-extrabold text-accent-deep">
                    پاسخ برتر سرویس
                  </span>
                  <time
                    dateTime={c.reply.dateTime}
                    className="text-[12.5px] text-ink-300"
                  >
                    {c.reply.date}
                  </time>
                </div>
                <p className="mt-2 text-[14.5px] leading-8 text-ink-700">
                  {c.reply.text}
                </p>
              </div>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-6 flex flex-wrap items-center gap-2 text-sm leading-8 text-ink-500">
        سوال شما اینجا نیست؟
        <a
          href={SITE.phoneHref}
          dir="ltr"
          className="inline-flex items-center gap-1.5 font-bold text-accent"
        >
          <Phone className="h-4 w-4" />
          {SITE.phone}
        </a>
      </p>
    </section>
  );
}
