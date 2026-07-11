import Link from "next/link";
import { readingMinutes, type Post } from "@/lib/content";

export default function PostCard({ post }: { post: Post }) {
  const mins = readingMinutes(post.content);
  return (
    <Link
      href={post.path}
      className="card-hover group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white"
    >
      <div className="bg-dotmatrix-soft relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-line">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image}
            alt={post.title}
            loading="lazy"
            decoding="async"
            width={480}
            height={300}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="display text-5xl font-black text-accent/15">برتر</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="line-clamp-2 text-base font-bold leading-7 text-ink-900 transition group-hover:text-accent">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-7 text-ink-500">
            {post.excerpt}
          </p>
        )}
        <span className="mt-5 text-xs font-medium text-ink-300">
          {mins} دقیقه مطالعه
        </span>
      </div>
    </Link>
  );
}
