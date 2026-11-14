import Image from "next/image";

import { relativeTime } from "@/lib/time";
import type { Post } from "@/lib/types";

type PostItemProps = {
  post: Post;
  /** Current time in ms, refreshed by the parent so all times tick together. */
  now: number;
};

export function PostItem({ post, now }: PostItemProps) {
  return (
    <article className="py-3">
      <header className="flex items-baseline justify-between gap-3">
        {/* React escapes all text children, so user content is never parsed as HTML. */}
        <span className="min-w-0 font-bold wrap-anywhere text-[#3b5998]">
          {post.author_name}
        </span>
        <time
          dateTime={post.created_at}
          title={new Date(post.created_at).toLocaleString()}
          className="shrink-0 text-xs text-gray-500"
        >
          {relativeTime(post.created_at, now)}
        </time>
      </header>
      {post.body && (
        <p className="mt-1 text-sm whitespace-pre-wrap wrap-anywhere text-gray-900">
          {post.body}
        </p>
      )}
      {post.photo_url && (
        <Image
          src={post.photo_url}
          alt={`Photo shared by ${post.author_name}`}
          // Intrinsic size is unknown; these set the placeholder ratio and the
          // CSS (w-full + h-auto) lets the real aspect ratio take over.
          width={480}
          height={360}
          sizes="(min-width: 640px) 480px, 100vw"
          className="mt-2 h-auto w-full max-w-[480px] rounded-lg border border-gray-200"
        />
      )}
    </article>
  );
}
