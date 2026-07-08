import { createClient } from "@/lib/supabase/server";
import { ArtistManager, type AdminArtist } from "@/components/admin/ArtistManager";
import type { LinkItem } from "@/lib/types";

export const metadata = { title: "Artists" };

export default async function AdminArtistsPage() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen
  const { data } = await supabase!.from("artists").select("*, releases(count)").order("name");

  const artists: AdminArtist[] = (data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    origin: a.origin,
    bio: a.bio,
    photo_url: a.photo_url,
    links: (a.links as LinkItem[]) ?? [],
    release_count: (a.releases as Array<{ count: number }> | null)?.[0]?.count ?? 0,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Artists</h1>
        <p className="mt-2 text-sm text-stone">Everyone on the label. Tap a card to edit.</p>
      </header>
      <ArtistManager artists={artists} />
    </div>
  );
}
