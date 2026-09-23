import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Artist, Mix, Product, Release } from "@/lib/types";
import { SEED_ARTISTS, SEED_MIXES, SEED_PRODUCTS, SEED_RELEASES } from "./seed";

/**
 * Public-site data layer.
 * Reads from Supabase when configured; falls back to the bundled seed catalog
 * when Supabase is absent or the catalog is still empty, so the site never
 * renders blank during setup.
 */

type ReleaseRow = Omit<Release, "artist_name" | "artist_slug" | "tracks"> & {
  artists: { name: string; slug: string } | null;
  tracks: Release["tracks"] | null;
};

function shapeRelease(row: ReleaseRow): Release {
  return {
    ...row,
    artist_name: row.artists?.name,
    artist_slug: row.artists?.slug,
    links: (row.links as Release["links"]) ?? [],
    tracks: (row.tracks ?? []).sort((a, b) => a.position - b.position),
  };
}

const RELEASE_SELECT = "*, artists(name, slug), tracks(*)";

export async function getPublishedReleases(): Promise<Release[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase!
      .from("releases")
      .select(RELEASE_SELECT)
      .eq("state", "published")
      .order("release_date", { ascending: false, nullsFirst: false });
    if (!error && data && data.length > 0) return (data as unknown as ReleaseRow[]).map(shapeRelease);
  }
  return SEED_RELEASES;
}

export async function getFeaturedRelease(): Promise<Release | null> {
  const releases = await getPublishedReleases();
  return releases.find((r) => r.featured) ?? releases[0] ?? null;
}

export async function getReleaseBySlug(slug: string): Promise<Release | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase!
      .from("releases")
      .select(RELEASE_SELECT)
      .eq("slug", slug)
      .eq("state", "published")
      .maybeSingle();
    if (data) return shapeRelease(data as unknown as ReleaseRow);
  }
  return SEED_RELEASES.find((r) => r.slug === slug) ?? null;
}

export async function getPublishedMixes(): Promise<Mix[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase!
      .from("mixes")
      .select("*")
      .eq("state", "published")
      .order("recorded_on", { ascending: false, nullsFirst: false });
    if (!error && data && data.length > 0) return data as Mix[];
  }
  return SEED_MIXES;
}

export async function getActiveProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase!
      .from("products")
      .select("*")
      .eq("active", true)
      .order("sort");
    if (!error && data && data.length > 0)
      return data.map((p) => ({ ...(p as unknown as Product), sizes: (p.sizes as string[]) ?? [] }));
  }
  return SEED_PRODUCTS;
}

export interface SiteSettings {
  hero_headline: string;
  hero_subline: string;
  hero_media_url: string | null;
}

const DEFAULT_SETTINGS: SiteSettings = {
  hero_headline: "Music for the floor.",
  hero_subline: "Three decades of New York house lineage. Colombian roots. Maya Records. Resident at Stereo Montréal.",
  hero_media_url: null,
};

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase!.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (data) {
      return {
        hero_headline: data.hero_headline ?? DEFAULT_SETTINGS.hero_headline,
        hero_subline: data.hero_subline ?? DEFAULT_SETTINGS.hero_subline,
        hero_media_url: data.hero_media_url ?? null,
      };
    }
  }
  return DEFAULT_SETTINGS;
}

export async function getArtists(): Promise<Artist[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase!
      .from("artists")
      .select("*, releases(count)")
      .order("name");
    if (!error && data && data.length > 0) {
      return data
        .map((a) => ({
          ...(a as unknown as Artist),
          links: (a.links as Artist["links"]) ?? [],
          release_count: (a.releases as Array<{ count: number }> | null)?.[0]?.count ?? 0,
        }))
        .filter((a) => a.release_count > 0);
    }
  }
  return SEED_ARTISTS.map((a) => ({
    ...a,
    release_count: SEED_RELEASES.filter((r) => r.artist_id === a.id).length,
  })).filter((a) => a.release_count > 0);
}

export async function getArtistBySlug(slug: string): Promise<{ artist: Artist; releases: Release[] } | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase!.from("artists").select("*").eq("slug", slug).maybeSingle();
    if (data) {
      const artist = { ...(data as unknown as Artist), links: (data.links as Artist["links"]) ?? [] };
      const { data: rel } = await supabase!
        .from("releases")
        .select(RELEASE_SELECT)
        .eq("artist_id", artist.id)
        .eq("state", "published")
        .order("release_date", { ascending: false });
      return { artist, releases: ((rel ?? []) as unknown as ReleaseRow[]).map(shapeRelease) };
    }
  }
  const artist = SEED_ARTISTS.find((a) => a.slug === slug);
  if (!artist) return null;
  return { artist, releases: SEED_RELEASES.filter((r) => r.artist_id === artist.id) };
}
