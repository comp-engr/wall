import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_* values are inlined at build time, so they must be read
// with literal property access (no dynamic process.env[name] lookups).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Names of required env variables that are missing; empty when configured. */
export const missingEnvVars: string[] = [
  !url && "NEXT_PUBLIC_SUPABASE_URL",
  !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
].filter((name): name is string => Boolean(name));

/** The single shared Supabase client, or null when env variables are missing. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
