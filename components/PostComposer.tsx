"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { MAX_BODY_LENGTH, MAX_NAME_LENGTH, type Post } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAME_STORAGE_KEY = "wall:author-name";
const POSTED_NOTICE_MS = 2000;
const COUNTER_WARNING_AT = 20;

/** Turn a Supabase/Postgres error into a message for visitors. */
function describeInsertError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "P0001": // raised by the rate-limit trigger; its message is written for people
      return error.message || "You're posting too fast. Please wait a minute and try again.";
    case "23514": // check constraint: empty or too long
      return "Your post is empty or too long.";
    default:
      return "Couldn't share your post. Check your connection and try again.";
  }
}

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
  // Timestamp of the last successful post; a new value restarts the 2s notice.
  const [postedAt, setPostedAt] = useState<number | null>(null);

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

  // Hide the "Posted!" notice after 2 seconds (cleared on unmount or a newer post).
  useEffect(() => {
    if (postedAt === null) return;
    const timer = setTimeout(() => setPostedAt(null), POSTED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [postedAt]);

  const body = message.trim();
  const remaining = MAX_BODY_LENGTH - message.length;
  const canShare = body.length > 0 && body.length <= MAX_BODY_LENGTH && !sending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canShare || !supabase) return;

    const authorName = name.trim() || "Anonymous";
    setSending(true);
    setError(null);
    setPostedAt(null);

    try {
      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({ author_name: authorName, body })
        .select()
        .single<Post>();

      if (insertError || !data) {
        // Keep the typed text so the visitor can retry.
        setError(describeInsertError(insertError ?? {}));
        return;
      }

      setMessage("");
      setPostedAt(Date.now());
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

  // Ctrl+Enter / Cmd+Enter shares, like most compose boxes.
  function handleMessageKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-col gap-2">
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
          className="w-full"
        />
      </div>

      <label htmlFor={messageId} className="sr-only">
        Message
      </label>
      <Textarea
        id={messageId}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleMessageKeyDown}
        maxLength={MAX_BODY_LENGTH}
        placeholder="What's on your mind?"
        aria-describedby={counterId}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        rows={4}
        className="min-h-24 resize-y border-2 border-dashed border-[#bdc7d8] bg-[#eef3fb] text-sm focus-visible:border-[#3b5998]"
      />

      <div className="flex items-center justify-between gap-3">
        <p
          id={counterId}
          // Announce only near the limit; announcing every keystroke is noise.
          aria-live={remaining < COUNTER_WARNING_AT ? "polite" : "off"}
          className={cn(
            "text-xs",
            remaining < COUNTER_WARNING_AT ? "font-bold text-red-600" : "text-gray-500",
          )}
        >
          {remaining} characters remaining
        </p>
        <div className="flex items-center gap-3">
          {postedAt !== null && (
            <span role="status" className="text-sm font-bold text-green-600">
              Posted!
            </span>
          )}
          <Button
            type="submit"
            disabled={!canShare}
            aria-busy={sending}
            className={cn(
              "px-4 font-bold",
              // Override the base disabled style (faded, no pointer events) so
              // the not-allowed cursor shows and the idle state reads as gray.
              "disabled:pointer-events-auto disabled:opacity-100",
              // Each state sets its own hover color: the variant's default
              // hover (bg-primary/80, near-black) would otherwise show on the
              // disabled button, which now receives pointer events.
              sending
                ? "cursor-wait bg-[#3b5998] text-white hover:bg-[#3b5998]"
                : canShare
                  ? "bg-[#3b5998] text-white hover:bg-[#2d4373]"
                  : "cursor-not-allowed bg-gray-300 text-gray-600 hover:bg-gray-300",
            )}
          >
            {sending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Sharing...
              </>
            ) : (
              "Share"
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
