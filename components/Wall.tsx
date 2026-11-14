"use client";

import { useCallback, useEffect, useState } from "react";

import { PostComposer } from "@/components/PostComposer";
import { PostFeed } from "@/components/PostFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { missingEnvVars, supabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";

const FEED_LIMIT = 50;
const CLOCK_TICK_MS = 30_000;

/** Merge posts into the feed: dedupe by id, newest first, capped at FEED_LIMIT. */
function mergePosts(current: Post[], incoming: Post[]): Post[] {
  const byId = new Map<string, Post>();
  for (const post of [...incoming, ...current]) {
    if (!byId.has(post.id)) byId.set(post.id, post);
  }
  return [...byId.values()]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, FEED_LIMIT);
}

/** Right column: composer + live feed. Owns the post list shared by both. */
export function Wall() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const addPosts = useCallback((incoming: Post[]) => {
    setPosts((current) => mergePosts(current, incoming));
  }, []);

  /**
   * Fetch the latest posts and merge them in. A background refresh (after a
   * realtime reconnect or when the tab is shown again) never replaces a feed
   * that is already on screen with an error.
   */
  const loadLatest = useCallback(
    async ({ background }: { background: boolean }) => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(FEED_LIMIT);

      if (error) {
        if (!background) setLoadError("Couldn't load posts. Check your connection and try again.");
      } else {
        setLoadError(null);
        addPosts(data ?? []);
      }
      if (!background) setLoading(false);
    },
    [addPosts],
  );

  const retry = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    void loadLatest({ background: false });
  }, [loadLatest]);

  // Subscribe first, then fetch, so a post inserted in between isn't missed.
  // Duplicates (own post via insert + realtime, or fetch + realtime) are
  // dropped by id in mergePosts.
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let hasSubscribed = false;

    const channel = client
      .channel("public:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => addPosts([payload.new as Post]),
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        // The client rejoins on its own after a dropped connection, but
        // inserts made while offline are not replayed: catch up on rejoin.
        if (hasSubscribed) void loadLatest({ background: true });
        hasSubscribed = true;
      });

    void loadLatest({ background: false });

    return () => {
      client.removeChannel(channel);
    };
  }, [addPosts, loadLatest]);

  // Keep relative times ("2m", "3h") fresh, and catch up when a backgrounded
  // tab (where timers and sockets may have been throttled) is shown again.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      setNow(Date.now());
      void loadLatest({ background: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadLatest]);

  if (!supabase) {
    return (
      <Card className="border-red-300 ring-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Supabase is not configured</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Missing environment variable{missingEnvVars.length > 1 ? "s" : ""}:{" "}
            <code className="font-mono font-bold">{missingEnvVars.join(", ")}</code>
          </p>
          <p>
            Add {missingEnvVars.length > 1 ? "them" : "it"} to <code>.env.local</code> (or your
            Vercel project settings), then restart or redeploy.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PostComposer onPosted={(post) => addPosts([post])} />
      <div className="border-t border-[#d8dfea]">
        <PostFeed posts={posts} loading={loading} error={loadError} now={now} onRetry={retry} />
      </div>
    </div>
  );
}
