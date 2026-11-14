/** A row of public.posts (see supabase/schema.sql). */
export type Post = {
  id: string;
  author_name: string;
  body: string;
  photo_url: string | null;
  /** ISO 8601 timestamp (timestamptz). */
  created_at: string;
};

export const MAX_BODY_LENGTH = 280;
export const MAX_NAME_LENGTH = 50;
