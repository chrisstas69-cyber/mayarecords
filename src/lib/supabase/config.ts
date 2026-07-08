export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when the app has Supabase credentials. Without them the public site
 * serves the built-in seed catalog and the admin shows setup instructions. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const BUCKETS = {
  covers: "covers",
  audio: "audio",
  press: "press",
  video: "video",
} as const;
