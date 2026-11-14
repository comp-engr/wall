"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { MAX_BODY_LENGTH, MAX_NAME_LENGTH, type Post } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAME_STORAGE_KEY = "wall:author-name";

type PostComposerProps = {
  onPosted: (post: Post) => void;
};

export function PostComposer({ onPosted }: PostComposerProps) {
  const nameId = useId();
  const messageId = useId();
  const counterId = useId();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore the last used name. localStorage only exists in the browser,
  // so this runs after mount; storage can also throw (e.g. private mode).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_STORAGE_KEY);
      if (saved) setName(saved.slice(0, MAX_NAME_LENGTH));
    } catch {
      // Ignore: the visitor just retypes their name.
    }
  }, []);

  const body = message.trim();
  const remaining = MAX_BODY_LENGTH - message.length;
  const canShare = body.length > 0 && body.length <= MAX_BODY_LENGTH && !sending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canShare || !supabase) return;

    const authorName = name.trim() || "Anonymous";
    setSending(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({ author_name: authorName, body })
        .select()
        .single<Post>();

      if (insertError || !data) {
        // Keep the typed text so the visitor can retry.
        setError(`Couldn't share your post: ${insertError?.message ?? "unknown error"}`);
        return;
      }

      setMessage("");
      try {
        localStorage.setItem(NAME_STORAGE_KEY, name.trim());
      } catch {
        // Storage unavailable; nothing else to do.
      }
      onPosted(data);
    } catch {
      setError("Couldn't share your post. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="space-y-1">
        <label htmlFor={nameId} className="text-xs font-bold text-gray-600">
          Your name
        </label>
        <Input
          id={nameId}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Anonymous"
          autoComplete="name"
          className="max-w-xs"
        />
      </div>

      <label htmlFor={messageId} className="sr-only">
        Message
      </label>
      <Textarea
        id={messageId}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={MAX_BODY_LENGTH}
        placeholder="What's on your mind?"
        aria-describedby={counterId}
        rows={4}
        className="min-h-24 resize-y border-2 border-dashed border-[#bdc7d8] bg-[#eef3fb] text-sm focus-visible:border-[#3b5998]"
      />

      <div className="flex items-center justify-between gap-3">
        <p
          id={counterId}
          aria-live="polite"
          className={cn("text-xs", remaining < 20 ? "font-bold text-red-600" : "text-gray-500")}
        >
          {remaining} characters remaining
        </p>
        <Button
          type="submit"
          disabled={!canShare}
          className="bg-[#3b5998] px-4 font-bold text-white hover:bg-[#2d4373]"
        >
          {sending ? "Sharing…" : "Share"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
