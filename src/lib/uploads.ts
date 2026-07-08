"use client";

import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { AssetKind } from "@/lib/types";

const BUCKET_FOR_KIND: Record<AssetKind, string> = {
  cover: "covers",
  photo: "press",
  logo: "press",
  press: "press",
  audio: "audio",
  video: "video",
  document: "press",
};

export const ACCEPT_FOR_KIND: Record<"cover" | "audio" | "photo", string> = {
  cover: "image/jpeg,image/png,image/webp",
  audio: "audio/mpeg,audio/wav,audio/aiff,audio/x-aiff,audio/mp4,audio/flac",
  photo: "image/jpeg,image/png,image/webp",
};

export const MAX_SIZE_FOR_KIND: Record<"cover" | "audio" | "photo", number> = {
  cover: 15 * 1024 * 1024,
  audio: 250 * 1024 * 1024,
  photo: 25 * 1024 * 1024,
};

export interface UploadedAsset {
  publicUrl: string;
  storagePath: string;
  assetId: string | null;
}

function storagePathFor(file: File): string {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  return `${new Date().getFullYear()}/${slugify(file.name.replace(/\.[^.]+$/, "")) || "file"}-${Date.now().toString(36)}.${ext}`;
}

/** Full-length mix recordings → public `mixes` bucket (streamable in the site player). */
export async function uploadMixAudio(file: File, onProgress?: (pct: number) => void): Promise<UploadedAsset> {
  const supabase = createClient();
  const path = storagePathFor(file);
  onProgress?.(5);
  const { error } = await supabase.storage.from("mixes").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  onProgress?.(90);
  const {
    data: { publicUrl },
  } = supabase.storage.from("mixes").getPublicUrl(path);
  onProgress?.(100);
  return { publicUrl, storagePath: `mixes/${path}`, assetId: null };
}

/**
 * Sale masters (WAV/ZIP) → PRIVATE `masters` bucket. Returns the storage path
 * (saved on the release as master_url); buyers get signed URLs via /api/download.
 */
export async function uploadMasterFile(file: File, onProgress?: (pct: number) => void): Promise<{ storagePath: string }> {
  const supabase = createClient();
  const path = storagePathFor(file);
  onProgress?.(5);
  const { error } = await supabase.storage.from("masters").upload(path, file, {
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  onProgress?.(100);
  return { storagePath: `masters/${path}` };
}

/**
 * Uploads a file to Supabase storage and records it in media_assets.
 * Client-side so large audio files stream directly to storage.
 */
export async function uploadMediaFile(
  file: File,
  kind: AssetKind,
  opts: { releaseId?: string; artistId?: string; onProgress?: (pct: number) => void } = {}
): Promise<UploadedAsset> {
  const supabase = createClient();
  const bucket = BUCKET_FOR_KIND[kind];
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${new Date().getFullYear()}/${slugify(file.name.replace(/\.[^.]+$/, "")) || "file"}-${Date.now().toString(36)}.${ext}`;

  opts.onProgress?.(5);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  opts.onProgress?.(85);

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: asset } = await supabase
    .from("media_assets")
    .insert({
      kind,
      title: file.name,
      storage_path: `${bucket}/${path}`,
      public_url: publicUrl,
      mime_type: file.type || null,
      size_bytes: file.size,
      release_id: opts.releaseId ?? null,
      artist_id: opts.artistId ?? null,
      uploaded_by: user?.id ?? null,
    })
    .select("id")
    .single();

  opts.onProgress?.(100);
  return { publicUrl, storagePath: `${bucket}/${path}`, assetId: asset?.id ?? null };
}
