/** Shared domain types — mirror of the Supabase schema in supabase/migrations. */

export type PublishState = "draft" | "scheduled" | "published" | "archived";
export type UserRole = "admin" | "artist";
export type AssetKind = "cover" | "photo" | "logo" | "press" | "audio" | "video" | "document";
export type ImportJobStatus = "mapping" | "validating" | "review" | "committed" | "cancelled";
export type ImportRowStatus = "pending" | "valid" | "warning" | "error" | "imported" | "skipped";

export interface Artist {
  id: string;
  name: string;
  slug: string;
  origin: string | null;
  bio: string | null;
  photo_url: string | null;
  links: LinkItem[];
  release_count?: number;
  created_at?: string;
}

export interface Track {
  id: string;
  release_id: string;
  position: number;
  title: string;
  duration_seconds: number | null;
  bpm: number | null;
  musical_key: string | null;
  isrc: string | null;
  preview_url: string | null;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface Release {
  id: string;
  title: string;
  slug: string;
  catalog_number: string;
  digital_price_cents?: number | null;
  master_url?: string | null;
  artist_id: string;
  artist_name?: string;
  artist_slug?: string;
  release_date: string | null;
  genre: string | null;
  series: string | null;
  description: string | null;
  credits: string | null;
  cover_url: string | null;
  preview_url: string | null;
  video_url: string | null;
  links: LinkItem[];
  state: PublishState;
  featured: boolean;
  tracks: Track[];
  created_at?: string;
  updated_at?: string;
}

export interface Mix {
  id: string;
  title: string;
  slug: string;
  recorded_on: string | null;
  duration_seconds: number | null;
  description: string | null;
  cover_url: string | null;
  audio_url: string | null;
  external_url: string | null;
  tracklist: string | null;
  state: PublishState;
  featured: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  sizes: string[];
  active: boolean;
  sort: number;
}

export type CartItem =
  | {
      kind: "merch";
      productId: string;
      name: string;
      priceCents: number;
      size: string | null;
      quantity: number;
      imageUrl: string | null;
    }
  | {
      kind: "digital_release";
      releaseId: string;
      name: string;
      artistName: string;
      catalogNumber: string;
      priceCents: number;
      coverUrl: string | null;
    };

export interface MediaAsset {
  id: string;
  kind: AssetKind;
  title: string | null;
  storage_path: string;
  public_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  artist_id: string | null;
  release_id: string | null;
  created_at: string;
}

export interface ImportJob {
  id: string;
  filename: string;
  status: ImportJobStatus;
  column_map: Record<string, string>;
  row_count: number;
  error_count: number;
  created_by: string;
  created_at: string;
}

export interface ImportRow {
  id: string;
  job_id: string;
  row_index: number;
  raw: Record<string, string>;
  mapped: Partial<ReleaseInput> | null;
  status: ImportRowStatus;
  issues: string[];
}

export interface ActivityEntry {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  detail: string | null;
  created_at: string;
}

/** Payload shape for creating/updating a release (forms, importer, server actions). */
export interface ReleaseInput {
  title: string;
  catalog_number: string;
  artist_id?: string;
  artist_name?: string;
  release_date?: string;
  genre?: string;
  series?: string;
  description?: string;
  credits?: string;
  cover_url?: string;
  preview_url?: string;
  video_url?: string;
  links?: LinkItem[];
  state?: PublishState;
  featured?: boolean;
  digital_price_cents?: number | null;
  master_url?: string | null;
  tracks?: Array<Pick<Track, "title" | "position"> & Partial<Track>>;
}
