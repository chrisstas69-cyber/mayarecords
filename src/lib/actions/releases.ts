"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeCatalog, slugify } from "@/lib/utils";
import type { LinkItem, PublishState, ReleaseInput } from "@/lib/types";

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

async function requireStaff() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null, error: "Supabase is not configured." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Not signed in." };
  return { supabase, user, error: null };
}

function parseLinks(raw: string | undefined | null): LinkItem[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      const url = rest.join("|").trim() || label.trim();
      return { label: rest.length ? label.trim() : new URL(url).hostname.replace("www.", ""), url };
    })
    .filter((l) => /^https?:\/\//.test(l.url));
}

function validateRelease(input: ReleaseInput): string[] {
  const issues: string[] = [];
  if (!input.title?.trim()) issues.push("Title is required.");
  if (!input.catalog_number?.trim()) issues.push("Catalog number is required.");
  if (!input.artist_id) issues.push("Artist is required.");
  if (input.release_date && Number.isNaN(new Date(input.release_date).getTime()))
    issues.push("Release date is not a valid date.");
  return issues;
}

/** Check for an existing release with the same normalized catalog number. */
export async function checkCatalogNumber(catalog: string, excludeId?: string): Promise<ActionResult<{ duplicate: boolean; title?: string }>> {
  const { supabase, error } = await requireStaff();
  if (error) return { ok: false, error };
  const normalized = normalizeCatalog(catalog);
  let query = supabase!
    .from("releases")
    .select("id, title, catalog_number")
    .eq("catalog_number_normalized", normalized)
    .limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  if (data && data.length > 0) return { ok: true, data: { duplicate: true, title: data[0].title } };
  return { ok: true, data: { duplicate: false } };
}

export async function saveRelease(
  releaseId: string | null,
  input: ReleaseInput & { links_raw?: string }
): Promise<ActionResult<{ id: string }>> {
  const { supabase, user, error } = await requireStaff();
  if (error) return { ok: false, error };

  const issues = validateRelease(input);
  const isDraft = (input.state ?? "draft") === "draft";
  // Drafts may be incomplete except title; publishing enforces everything.
  if (!isDraft && issues.length > 0) return { ok: false, error: issues.join(" ") };
  if (isDraft && !input.title?.trim()) return { ok: false, error: "A title is required to save a draft." };

  if (input.catalog_number?.trim()) {
    const dup = await checkCatalogNumber(input.catalog_number, releaseId ?? undefined);
    if (dup.data?.duplicate && !isDraft)
      return { ok: false, error: `Catalog number ${input.catalog_number} is already used by “${dup.data.title}”.` };
  }

  const payload = {
    title: input.title.trim(),
    catalog_number: input.catalog_number?.trim() || `DRAFT-${Date.now().toString(36).toUpperCase()}`,
    artist_id: input.artist_id,
    release_date: input.release_date || null,
    genre: input.genre?.trim() || null,
    series: input.series?.trim() || null,
    description: input.description?.trim() || null,
    credits: input.credits?.trim() || null,
    cover_url: input.cover_url || null,
    preview_url: input.preview_url || null,
    video_url: input.video_url?.trim() || null,
    links: input.links ?? parseLinks(input.links_raw),
    state: (input.state ?? "draft") as PublishState,
    featured: input.featured ?? false,
    digital_price_cents: input.digital_price_cents ?? null,
    master_url: input.master_url ?? null,
  };

  if (releaseId) {
    const { error: updateError } = await supabase!.from("releases").update(payload).eq("id", releaseId);
    if (updateError) return { ok: false, error: friendlyDbError(updateError.message) };
    await replaceTracks(supabase!, releaseId, input.tracks);
    revalidateCatalog();
    return { ok: true, data: { id: releaseId } };
  }

  const { data, error: insertError } = await supabase!
    .from("releases")
    .insert({ ...payload, slug: await uniqueSlug(supabase!, payload.catalog_number, payload.title), created_by: user!.id })
    .select("id")
    .single();
  if (insertError) return { ok: false, error: friendlyDbError(insertError.message) };
  await replaceTracks(supabase!, data.id, input.tracks);
  revalidateCatalog();
  return { ok: true, data: { id: data.id } };
}

async function replaceTracks(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  releaseId: string,
  tracks?: ReleaseInput["tracks"]
) {
  if (!tracks) return;
  await supabase.from("tracks").delete().eq("release_id", releaseId);
  const rows = tracks
    .filter((t) => t.title?.trim())
    .map((t, i) => ({
      release_id: releaseId,
      position: t.position ?? i + 1,
      title: t.title.trim(),
      duration_seconds: t.duration_seconds ?? null,
      bpm: t.bpm ?? null,
      musical_key: t.musical_key ?? null,
      preview_url: t.preview_url ?? null,
    }));
  if (rows.length > 0) await supabase.from("tracks").insert(rows);
}

async function uniqueSlug(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  catalog: string,
  title: string
): Promise<string> {
  const base = slugify(catalog || title);
  const { data } = await supabase.from("releases").select("slug").ilike("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function setReleaseState(releaseId: string, state: PublishState): Promise<ActionResult> {
  const { supabase, error } = await requireStaff();
  if (error) return { ok: false, error };
  const { error: dbError } = await supabase!.from("releases").update({ state }).eq("id", releaseId);
  if (dbError) return { ok: false, error: friendlyDbError(dbError.message) };
  revalidateCatalog();
  return { ok: true };
}

export async function deleteRelease(releaseId: string): Promise<ActionResult> {
  const { supabase, error } = await requireStaff();
  if (error) return { ok: false, error };
  const { error: dbError } = await supabase!.from("releases").delete().eq("id", releaseId);
  if (dbError) return { ok: false, error: friendlyDbError(dbError.message) };
  revalidateCatalog();
  return { ok: true };
}

export async function saveArtist(
  artistId: string | null,
  input: { name: string; origin?: string; bio?: string; photo_url?: string; links_raw?: string }
): Promise<ActionResult<{ id: string }>> {
  const { supabase, error } = await requireStaff();
  if (error) return { ok: false, error };
  if (!input.name?.trim()) return { ok: false, error: "Artist name is required." };

  const payload = {
    name: input.name.trim(),
    origin: input.origin?.trim() || null,
    bio: input.bio?.trim() || null,
    photo_url: input.photo_url || null,
    links: parseLinks(input.links_raw),
  };

  if (artistId) {
    const { error: dbError } = await supabase!.from("artists").update(payload).eq("id", artistId);
    if (dbError) return { ok: false, error: friendlyDbError(dbError.message) };
    revalidateCatalog();
    return { ok: true, data: { id: artistId } };
  }
  const { data, error: dbError } = await supabase!
    .from("artists")
    .insert({ ...payload, slug: slugify(payload.name) })
    .select("id")
    .single();
  if (dbError) return { ok: false, error: friendlyDbError(dbError.message) };
  revalidateCatalog();
  return { ok: true, data: { id: data.id } };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

function friendlyDbError(message: string): string {
  if (message.includes("releases_catalog_unique")) return "That catalog number is already in use.";
  if (message.includes("releases_slug_key")) return "A release with that slug already exists.";
  if (message.includes("row-level security")) return "You don't have permission for that (ask an admin).";
  return message;
}

function revalidateCatalog() {
  revalidatePath("/", "layout");
}
