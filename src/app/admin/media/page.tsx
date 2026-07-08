import { createClient } from "@/lib/supabase/server";
import { MediaLibrary, type MediaItem } from "@/components/admin/MediaLibrary";

export const metadata = { title: "Media Library" };

export default async function AdminMediaPage() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen
  const { data } = await supabase!
    .from("media_assets")
    .select("id, kind, title, public_url, mime_type, size_bytes, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Media Library</h1>
        <p className="mt-2 text-sm text-stone">
          Artwork, audio, photos and press files. Click any asset to copy its URL.
        </p>
      </header>
      <MediaLibrary assets={(data ?? []) as MediaItem[]} />
    </div>
  );
}
