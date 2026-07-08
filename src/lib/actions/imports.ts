"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeCatalog, slugify } from "@/lib/utils";
import type { ActionResult } from "./releases";
import type { ImportRowStatus, LinkItem } from "@/lib/types";

/** Fields the bulk importer can map CSV columns onto. */
export const IMPORT_FIELDS = [
  "title",
  "catalog_number",
  "artist_name",
  "release_date",
  "genre",
  "description",
  "credits",
  "tracklist",
  "beatport_url",
  "spotify_url",
  "soundcloud_url",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

interface MappedRow {
  title?: string;
  catalog_number?: string;
  artist_name?: string;
  release_date?: string;
  genre?: string;
  description?: string;
  credits?: string;
  tracklist?: string;
  beatport_url?: string;
  spotify_url?: string;
  soundcloud_url?: string;
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

/** Create an import job + raw rows from parsed CSV data. */
export async function createImportJob(
  filename: string,
  rows: Array<Record<string, string>>
): Promise<ActionResult<{ jobId: string }>> {
  const { supabase, user, error } = await requireStaff();
  if (error) return { ok: false, error };
  if (rows.length === 0) return { ok: false, error: "The file has no data rows." };
  if (rows.length > 2000) return { ok: false, error: "Imports are limited to 2,000 rows at a time." };

  const { data: job, error: jobError } = await supabase!
    .from("import_jobs")
    .insert({ filename, status: "mapping", row_count: rows.length, created_by: user!.id })
    .select("id")
    .single();
  if (jobError) return { ok: false, error: jobError.message };

  const { error: rowsError } = await supabase!.from("import_rows").insert(
    rows.map((raw, i) => ({ job_id: job.id, row_index: i, raw }))
  );
  if (rowsError) return { ok: false, error: rowsError.message };

  return { ok: true, data: { jobId: job.id } };
}

/** Apply a column mapping and validate every row. Returns per-status counts. */
export async function mapAndValidate(
  jobId: string,
  columnMap: Record<string, ImportField | "">
): Promise<ActionResult<{ valid: number; warnings: number; errors: number }>> {
  const { supabase, error } = await requireStaff();
  if (error) return { ok: false, error };

  const { data: rows, error: rowsError } = await supabase!
    .from("import_rows")
    .select("id, raw, row_index")
    .eq("job_id", jobId)
    .order("row_index");
  if (rowsError || !rows) return { ok: false, error: rowsError?.message ?? "Rows not found." };

  // Existing catalog numbers for duplicate detection
  const { data: existing } = await supabase!.from("releases").select("catalog_number_normalized, title");
  const existingCats = new Map((existing ?? []).map((r) => [r.catalog_number_normalized as string, r.title as string]));

  const seenInFile = new Map<string, number>();
  let valid = 0,
    warnings = 0,
    errors = 0;

  const updates = rows.map((row) => {
    const raw = row.raw as Record<string, string>;
    const mapped: MappedRow = {};
    for (const [column, field] of Object.entries(columnMap)) {
      if (field && raw[column] !== undefined) mapped[field as ImportField] = String(raw[column]).trim();
    }

    const issues: string[] = [];
    let status: ImportRowStatus = "valid";

    if (!mapped.title) issues.push("Missing title");
    if (!mapped.catalog_number) issues.push("Missing catalog number");
    if (!mapped.artist_name) issues.push("Missing artist name");
    if (mapped.release_date) {
      const d = new Date(mapped.release_date);
      if (Number.isNaN(d.getTime())) issues.push(`Unreadable date "${mapped.release_date}"`);
      else mapped.release_date = d.toISOString().slice(0, 10);
    }

    if (mapped.catalog_number) {
      const norm = normalizeCatalog(mapped.catalog_number);
      if (existingCats.has(norm)) {
        issues.push(`Catalog # already in catalog as “${existingCats.get(norm)}”`);
        status = "warning";
      }
      const firstSeen = seenInFile.get(norm);
      if (firstSeen !== undefined) {
        issues.push(`Duplicate of row ${firstSeen + 1} in this file`);
        status = "warning";
      } else {
        seenInFile.set(norm, row.row_index);
      }
    }

    if (issues.some((i) => i.startsWith("Missing") || i.startsWith("Unreadable"))) status = "error";
    if (status === "valid") valid++;
    else if (status === "warning") warnings++;
    else errors++;

    return { id: row.id, mapped, status, issues };
  });

  for (const u of updates) {
    await supabase!.from("import_rows").update({ mapped: u.mapped, status: u.status, issues: u.issues }).eq("id", u.id);
  }
  await supabase!
    .from("import_jobs")
    .update({ status: "review", column_map: columnMap, error_count: errors })
    .eq("id", jobId);

  return { ok: true, data: { valid, warnings, errors } };
}

/** Update one row's mapped fields from the review table, then revalidate it. */
export async function updateImportRow(rowId: string, mapped: MappedRow): Promise<ActionResult> {
  const { supabase, error } = await requireStaff();
  if (error) return { ok: false, error };
  const issues: string[] = [];
  if (!mapped.title?.trim()) issues.push("Missing title");
  if (!mapped.catalog_number?.trim()) issues.push("Missing catalog number");
  if (!mapped.artist_name?.trim()) issues.push("Missing artist name");
  const status: ImportRowStatus = issues.length > 0 ? "error" : "valid";
  const { error: dbError } = await supabase!
    .from("import_rows")
    .update({ mapped, status, issues })
    .eq("id", rowId);
  if (dbError) return { ok: false, error: dbError.message };
  return { ok: true };
}

/**
 * Commit an import: creates missing artists, then inserts every valid/warning
 * row as a DRAFT release (imports never auto-publish — review them in Drafts).
 */
export async function commitImport(jobId: string): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const { supabase, user, error } = await requireStaff();
  if (error) return { ok: false, error };

  const { data: rows } = await supabase!
    .from("import_rows")
    .select("*")
    .eq("job_id", jobId)
    .in("status", ["valid", "warning"])
    .order("row_index");
  if (!rows || rows.length === 0) return { ok: false, error: "No importable rows. Fix the errors first." };

  // Resolve artists by name (create missing ones)
  const { data: artists } = await supabase!.from("artists").select("id, name");
  const artistIds = new Map((artists ?? []).map((a) => [a.name.toLowerCase(), a.id as string]));

  let imported = 0,
    skipped = 0;

  for (const row of rows) {
    const m = row.mapped as MappedRow;
    const artistKey = (m.artist_name ?? "").toLowerCase();
    let artistId = artistIds.get(artistKey);
    if (!artistId) {
      const { data: newArtist, error: artistError } = await supabase!
        .from("artists")
        .insert({ name: m.artist_name!, slug: slugify(m.artist_name!) })
        .select("id")
        .single();
      if (artistError) {
        await supabase!.from("import_rows").update({ status: "skipped", issues: [artistError.message] }).eq("id", row.id);
        skipped++;
        continue;
      }
      artistId = newArtist.id;
      artistIds.set(artistKey, artistId!);
    }

    const links: LinkItem[] = [];
    if (m.beatport_url) links.push({ label: "Beatport", url: m.beatport_url });
    if (m.spotify_url) links.push({ label: "Spotify", url: m.spotify_url });
    if (m.soundcloud_url) links.push({ label: "SoundCloud", url: m.soundcloud_url });

    const slug = slugify(m.catalog_number || m.title || `import-${row.row_index}`);
    const { data: release, error: relError } = await supabase!
      .from("releases")
      .insert({
        title: m.title,
        slug: `${slug}`,
        catalog_number: m.catalog_number,
        artist_id: artistId,
        release_date: m.release_date || null,
        genre: m.genre || null,
        description: m.description || null,
        credits: m.credits || null,
        links,
        state: "draft",
        created_by: user!.id,
      })
      .select("id")
      .single();

    if (relError) {
      await supabase!.from("import_rows").update({ status: "skipped", issues: [relError.message] }).eq("id", row.id);
      skipped++;
      continue;
    }

    // Tracklist column: one track per line, "1. Title" or "Title"
    if (m.tracklist) {
      const trackRows = m.tracklist
        .split(/\r?\n|;/)
        .map((t) => t.replace(/^\s*\d+[.)]\s*/, "").trim())
        .filter(Boolean)
        .map((title, i) => ({ release_id: release.id, position: i + 1, title }));
      if (trackRows.length > 0) await supabase!.from("tracks").insert(trackRows);
    }

    await supabase!.from("import_rows").update({ status: "imported", release_id: release.id }).eq("id", row.id);
    imported++;
  }

  await supabase!.from("import_jobs").update({ status: "committed" }).eq("id", jobId);
  await supabase!.from("activity_log").insert({
    actor: user!.id,
    action: "import.commit",
    entity_type: "import_job",
    entity_id: jobId,
    detail: `${imported} releases imported as drafts, ${skipped} skipped`,
  });

  revalidatePath("/admin", "layout");
  return { ok: true, data: { imported, skipped } };
}
