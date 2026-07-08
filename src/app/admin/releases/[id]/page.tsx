import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReleaseWizard, type WizardData } from "@/components/admin/ReleaseWizard";
import type { LinkItem, PublishState, Track } from "@/lib/types";

export const metadata = { title: "Edit Release" };

export default async function EditReleasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return null; // layout renders the Supabase setup screen

  const [{ data: release }, { data: artists }] = await Promise.all([
    supabase!.from("releases").select("*, tracks(*)").eq("id", id).maybeSingle(),
    supabase!.from("artists").select("id, name").order("name"),
  ]);
  if (!release) notFound();

  const links = (release.links as LinkItem[]) ?? [];
  const initial: Partial<WizardData> = {
    title: release.title,
    catalog_number: release.catalog_number,
    artist_id: release.artist_id,
    release_date: release.release_date ?? "",
    genre: release.genre ?? "",
    description: release.description ?? "",
    credits: release.credits ?? "",
    cover_url: release.cover_url,
    preview_url: release.preview_url,
    video_url: release.video_url ?? "",
    links_raw: links.map((l) => `${l.label} | ${l.url}`).join("\n"),
    featured: release.featured,
    digital_price: release.digital_price_cents ? String(release.digital_price_cents / 100) : "",
    master_url: release.master_url ?? null,
    tracks:
      ((release.tracks as Track[]) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((t) => ({
          title: t.title,
          bpm: t.bpm ? String(t.bpm) : "",
          musical_key: t.musical_key ?? "",
          preview_url: t.preview_url,
        })) || undefined,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="display-md text-cream">Edit Release</h1>
        <p className="mt-2 text-sm text-stone">
          {release.title} · {release.catalog_number} · currently <span className="text-gold">{release.state}</span>
        </p>
      </header>
      <ReleaseWizard
        artists={artists ?? []}
        releaseId={release.id}
        initial={initial}
        initialState={release.state as PublishState}
      />
    </div>
  );
}
