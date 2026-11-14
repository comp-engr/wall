import type { SupabaseClient } from "@supabase/supabase-js";

export const PHOTO_BUCKET = "wall-photos";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Accepted types and the extension used for the stored file name. */
export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

/** Returns a message for the visitor, or null when the file is acceptable. */
export function validatePhoto(file: File): string | null {
  if (!(file.type in PHOTO_TYPES)) return "Photos must be JPG, PNG, or GIF.";
  if (file.size > MAX_PHOTO_BYTES) return "Photos must be 5 MB or smaller.";
  return null;
}

/**
 * Upload to the public wall-photos bucket under a random name and return its
 * public URL. The bucket enforces type/size and the name format server-side.
 */
export async function uploadPhoto(client: SupabaseClient, file: File): Promise<string> {
  const path = `${crypto.randomUUID()}.${PHOTO_TYPES[file.type]}`;
  const bucket = client.storage.from(PHOTO_BUCKET);
  const { error } = await bucket.upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000", // names are unique, so the file never changes
    upsert: false,
  });
  if (error) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}

/** Turn a Storage error into a message for visitors. */
export function describeUploadError(error: unknown): string {
  const status = String((error as { statusCode?: string | number })?.statusCode ?? "");
  if (status === "413") return "Photos must be 5 MB or smaller.";
  if (status === "415") return "Photos must be JPG, PNG, or GIF.";
  return "Couldn't upload your photo. Check your connection and try again.";
}
