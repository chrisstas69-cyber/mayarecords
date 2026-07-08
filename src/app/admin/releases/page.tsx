import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ReleasesTable, type AdminReleaseRow } from "@/components/admin/ReleasesTable";
import type { PublishState } from "@/lib/types";

export const metadata = { title: "Releases" };

export default async function AdminReleasesPage() {
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen
  const { data } = await supabase!
    .from("releases")
    .select("id, title, slug, catalog_number, release_date, genre, cover_url, state, updated_at, artists(name)")
    .order("updated_at", { ascending: false });

  const releases: AdminReleaseRow[] = (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    catalog_number: r.catalog_number,
    artist_name: (r.artists as unknown as { name: string } | null)?.name ?? "—",
    release_date: r.release_date,
    genre: r.genre,
    cover_url: r.cover_url,
    state: r.state as PublishState,
    updated_at: r.updated_at,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-md text-cream">Releases</h1>
          <p className="mt-2 text-sm text-stone">The whole catalog — filter, edit, publish.</p>
        </div>
        <Link
          href="/admin/releases/new"
          className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-[0.75rem] font-medium uppercase tracking-[0.16em] text-night transition-colors hover:bg-gold-bright"
        >
          <PlusCircle size={15} /> New Release
        </Link>
      </header>
      <ReleasesTable releases={releases} />
    </div>
  );
}
