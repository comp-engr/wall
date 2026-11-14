import { Fragment } from "react";

import { PostItem } from "@/components/PostItem";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@/lib/types";

type PostFeedProps = {
  posts: Post[];
  loading: boolean;
  error: string | null;
  now: number;
};

export function PostFeed({ posts, loading, error, now }: PostFeedProps) {
  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading posts" className="space-y-5 py-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="py-6 text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        No posts yet. Be the first to write on the wall!
      </p>
    );
  }

  return (
    <section aria-label="Wall posts">
      {posts.map((post, i) => (
        <Fragment key={post.id}>
          {i > 0 && <Separator />}
          <PostItem post={post} now={now} />
        </Fragment>
      ))}
    </section>
  );
}
