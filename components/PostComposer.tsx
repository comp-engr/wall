"use client";

import { ImageIcon, LoaderCircle, X } from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { describeUploadError, PHOTO_TYPES, uploadPhoto, validatePhoto } from "@/lib/photos";
import { supabase } from "@/lib/supabase";
import { MAX_BODY_LENGTH, MAX_NAME_LENGTH, type Post } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAME_STORAGE_KEY = "wall:author-name";
const POSTED_NOTICE_MS = 2000;
const COUNTER_WARNING_AT = 20;
const PHOTO_ACCEPT = Object.keys(PHOTO_TYPES).join(",");

/** Turn a Supabase/Postgres error into a message for visitors. */
function describeInsertError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case "P0001": // raised by the rate-limit trigger; its message is written for people
      return error.message || "You're posting too fast. Please wait a minute and try again.";
    case "23514": // check constraint: empty, too long, or a bad photo URL
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
  const photoInputId = useId();
  const photoHintId = useId();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
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

  // Local preview of the chosen photo; the object URL is freed when it changes.
  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  // Hide the "Posted!" notice after 2 seconds (cleared on unmount or a newer post).
  useEffect(() => {
    if (postedAt === null) return;
    const timer = setTimeout(() => setPostedAt(null), POSTED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [postedAt]);

  const body = message.trim();
  const remaining = MAX_BODY_LENGTH - message.length;
  // A post needs text or a photo (the database enforces the same rule).
  const canShare = (body.length > 0 || photo !== null) && body.length <= MAX_BODY_LENGTH && !sending;

  function choosePhoto(file: File | undefined) {
    if (!file) return;
    const problem = validatePhoto(file);
    setPhotoError(problem);
    setPhoto(problem ? null : file);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    choosePhoto(event.target.files?.[0]);
    event.target.value = ""; // allow picking the same file again after removing it
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    choosePhoto(event.dataTransfer.files?.[0]);
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canShare || !supabase) return;

    const authorName = name.trim() || "Anonymous";
    setSending(true);
    setError(null);
    setPostedAt(null);

    try {
      let photoUrl: string | null = null;
      if (photo) {
        try {
          photoUrl = await uploadPhoto(supabase, photo);
        } catch (uploadError) {
          setError(describeUploadError(uploadError));
          return;
        }
      }

      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({ author_name: authorName, body, ...(photoUrl ? { photo_url: photoUrl } : {}) })
        .select()
        .single<Post>();

      if (insertError || !data) {
        // Keep the typed text and photo so the visitor can retry.
        setError(describeInsertError(insertError ?? {}));
        return;
      }

      setMessage("");
      setPhoto(null);
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

      {photo && previewUrl ? (
        <div className="relative w-fit">
          {/* A local blob: preview; next/image can't optimize it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Preview of the photo you selected"
            className="max-h-60 max-w-full rounded-lg border border-gray-200 object-contain"
          />
          <button
            type="button"
            onClick={removePhoto}
            disabled={sending}
            aria-label="Remove photo"
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={photoInputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors",
            "focus-within:border-[#3b5998] focus-within:ring-2 focus-within:ring-[#3b5998]/30 hover:bg-[#f5f7fb]",
            dragging ? "border-[#3b5998] bg-[#eef3fb]" : "border-[#bdc7d8]",
          )}
        >
          <ImageIcon className="size-6 text-gray-400" aria-hidden="true" />
          <span className="text-sm">
            <span className="font-bold text-gray-700">Click to add photo</span>{" "}
            <span className="text-gray-500">(optional)</span>
          </span>
          <span id={photoHintId} className="text-xs text-gray-500">
            JPG, PNG, GIF up to 5MB
          </span>
          <input
            id={photoInputId}
            type="file"
            accept={PHOTO_ACCEPT}
            onChange={handlePhotoChange}
            aria-describedby={photoHintId}
            className="sr-only"
          />
        </label>
      )}

      {photoError && (
        <p role="alert" className="text-sm text-red-600">
          {photoError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
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

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
