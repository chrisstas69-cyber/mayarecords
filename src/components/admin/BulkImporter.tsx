"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { AlertTriangle, Check, FileSpreadsheet, Pencil, X } from "lucide-react";
import {
  createImportJob,
  commitImport,
  mapAndValidate,
  updateImportRow,
  IMPORT_FIELDS,
  type ImportField,
} from "@/lib/actions/imports";
import { Button, Field, Notice, Select, Spinner, TextInput } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import type { ImportRowStatus } from "@/lib/types";

/**
 * Desktop bulk importer for the back catalog:
 * 1. Upload CSV  →  2. Map columns  →  3. Review & fix rows  →  4. Commit as drafts
 */

type Phase = "upload" | "mapping" | "validating" | "review" | "done";

interface ParsedCsv {
  headers: string[];
  rows: Array<Record<string, string>>;
  preview: Array<Record<string, string>>;
}

export interface ReviewRowData {
  id: string;
  row_index: number;
  status: ImportRowStatus;
  issues: string[];
  mapped: Record<string, string | undefined>;
}

const FIELD_LABELS: Record<ImportField, string> = {
  title: "Release title *",
  catalog_number: "Catalog number *",
  artist_name: "Artist name *",
  release_date: "Release date",
  genre: "Genre",
  description: "Description",
  credits: "Credits",
  tracklist: "Tracklist (one per line)",
  beatport_url: "Beatport URL",
  spotify_url: "Spotify URL",
  soundcloud_url: "SoundCloud URL",
};

/** Guess a mapping from CSV header names. */
function guessField(header: string): ImportField | "" {
  const h = header.toLowerCase().replace(/[^a-z]/g, "");
  if (/^(title|release|releasetitle|name)$/.test(h)) return "title";
  if (/cat(alog|alogue)?(no|num|number|)$/.test(h) || h === "cat") return "catalog_number";
  if (/artist/.test(h)) return "artist_name";
  if (/date|year|released/.test(h)) return "release_date";
  if (/genre|style/.test(h)) return "genre";
  if (/desc|notes|about|press/.test(h)) return "description";
  if (/credit/.test(h)) return "credits";
  if (/track/.test(h)) return "tracklist";
  if (/beatport/.test(h)) return "beatport_url";
  if (/spotify/.test(h)) return "spotify_url";
  if (/soundcloud/.test(h)) return "soundcloud_url";
  return "";
}

export function BulkImporter() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const [csv, setCsv] = useState<ParsedCsv | null>(null);
  const [filename, setFilename] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, ImportField | "">>({});
  const [counts, setCounts] = useState<{ valid: number; warnings: number; errors: number } | null>(null);
  const [reviewRows, setReviewRows] = useState<ReviewRowData[]>([]);
  const [editingRow, setEditingRow] = useState<ReviewRowData | null>(null);
  const [committed, setCommitted] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();

  /* ── Phase 1: parse the file ── */
  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
      setError("Use a CSV file. Exporting from Excel/Numbers/Sheets: File → Download → CSV.");
      return;
    }
    setFilename(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (result) => {
        const headers = (result.meta.fields ?? []).filter(Boolean);
        if (headers.length === 0) {
          setError("Couldn't find a header row in that file.");
          return;
        }
        const rows = result.data;
        setCsv({ headers, rows, preview: rows.slice(0, 3) });
        setColumnMap(Object.fromEntries(headers.map((h) => [h, guessField(h)])));
        setPhase("mapping");
      },
      error: (err) => setError(`Couldn't read the file: ${err.message}`),
    });
  }, []);

  const mappedFields = useMemo(() => new Set(Object.values(columnMap).filter(Boolean)), [columnMap]);
  const requiredCovered = mappedFields.has("title") && mappedFields.has("catalog_number") && mappedFields.has("artist_name");

  /* ── Phase 2 → 3: create job, map, validate ── */
  function runValidation() {
    if (!csv) return;
    setError(null);
    setPhase("validating");
    startTransition(async () => {
      let id = jobId;
      if (!id) {
        const jobResult = await createImportJob(filename, csv.rows);
        if (!jobResult.ok || !jobResult.data) {
          setError(jobResult.error ?? "Could not start the import.");
          setPhase("mapping");
          return;
        }
        id = jobResult.data.jobId;
        setJobId(id);
      }
      const result = await mapAndValidate(id, columnMap);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Validation failed.");
        setPhase("mapping");
        return;
      }
      setCounts(result.data);
      await loadReviewRows(id);
      setPhase("review");
    });
  }

  async function loadReviewRows(id: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data } = await supabase
      .from("import_rows")
      .select("id, row_index, status, issues, mapped")
      .eq("job_id", id)
      .order("row_index");
    setReviewRows(
      (data ?? []).map((r) => ({
        id: r.id,
        row_index: r.row_index,
        status: r.status as ImportRowStatus,
        issues: (r.issues as string[]) ?? [],
        mapped: (r.mapped as Record<string, string>) ?? {},
      }))
    );
  }

  /* ── Phase 3: fix a row ── */
  function saveRowEdit(row: ReviewRowData) {
    startTransition(async () => {
      const result = await updateImportRow(row.id, row.mapped);
      if (!result.ok) {
        setError(result.error ?? "Could not update the row.");
        return;
      }
      setEditingRow(null);
      if (jobId) await loadReviewRows(jobId);
    });
  }

  /* ── Phase 4: commit ── */
  function commit() {
    if (!jobId) return;
    setError(null);
    startTransition(async () => {
      const result = await commitImport(jobId);
      if (!result.ok || !result.data) {
        setError(result.error ?? "Import failed.");
        return;
      }
      setCommitted(result.data);
      setPhase("done");
      router.refresh();
    });
  }

  const importable = reviewRows.filter((r) => r.status === "valid" || r.status === "warning").length;

  /* ─────────────── render ─────────────── */

  if (phase === "done" && committed) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ok text-ok">
          <Check size={28} />
        </div>
        <h2 className="display-md mb-3 text-cream">Imported as drafts</h2>
        <p className="mb-2 text-sand">
          {committed.imported} release{committed.imported === 1 ? "" : "s"} added to Drafts.
          {committed.skipped > 0 && ` ${committed.skipped} skipped (see the job log).`}
        </p>
        <p className="mb-8 text-sm text-stone">Nothing goes public until you review and publish it.</p>
        <div className="flex flex-col gap-3">
          <Link href="/admin/drafts" className="bg-gold px-6 py-3.5 text-[0.78rem] font-medium uppercase tracking-[0.16em] text-night transition-colors hover:bg-gold-bright">
            Review Drafts
          </Link>
          <button onClick={() => window.location.reload()} className="border border-line px-6 py-3.5 text-[0.78rem] uppercase tracking-[0.16em] text-sand transition-colors hover:border-cream/40">
            Import Another File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-5">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {/* ── Upload ── */}
      {phase === "upload" && (
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={cn(
              "flex min-h-[220px] w-full flex-col items-center justify-center gap-3 border border-dashed px-6 py-12 transition-colors",
              dragOver ? "border-gold bg-gold/5" : "border-line hover:border-gold/50"
            )}
          >
            <FileSpreadsheet size={34} strokeWidth={1.2} className="text-gold" />
            <p className="text-cream">Drop a CSV of the back catalog here, or click to choose</p>
            <p className="max-w-md text-xs leading-relaxed text-stone">
              One row per release. Any column names work — you&apos;ll map them to fields next. Include artwork/audio
              later via each release&apos;s edit page or the Media Library.
            </p>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />

          <div className="mt-8 border border-line bg-surface p-5">
            <p className="meta mb-3">Example CSV</p>
            <pre className="overflow-x-auto text-xs leading-relaxed text-stone">
{`Title,Cat No,Artist,Date,Genre,Tracklist
Roots & Wire,MYA-150,Joeski,2026-06-12,Tribal House,"1. Roots & Wire
2. Wire Dub"
El Barrio EP,MYA-138,Hector Couto,2025-08-15,Tech House,"1. El Barrio
2. Calle Ocho"`}
            </pre>
          </div>
        </div>
      )}

      {/* ── Column mapping ── */}
      {(phase === "mapping" || phase === "validating") && csv && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-cream">{filename}</p>
              <p className="text-xs text-stone">
                {csv.rows.length} rows · {csv.headers.length} columns
              </p>
            </div>
            <button onClick={() => window.location.reload()} className="flex items-center gap-1 text-xs text-stone hover:text-error">
              <X size={13} /> Start over
            </button>
          </div>

          <p className="mb-4 text-sm text-sand">
            Match each CSV column to a release field. <span className="text-gold">Title, catalog number and artist are required.</span>
          </p>

          <div className="space-y-3">
            {csv.headers.map((header) => (
              <div key={header} className="grid items-center gap-3 border border-line bg-surface p-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-cream">{header}</p>
                  <p className="mt-0.5 truncate text-xs text-faint">
                    e.g. {csv.preview.map((r) => r[header]).filter(Boolean).slice(0, 2).join(" · ") || "—"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <Select
                    value={columnMap[header] ?? ""}
                    onChange={(e) => setColumnMap({ ...columnMap, [header]: e.target.value as ImportField | "" })}
                    aria-label={`Map column ${header}`}
                  >
                    <option value="">Don&apos;t import</option>
                    {IMPORT_FIELDS.map((f) => (
                      <option key={f} value={f} disabled={mappedFields.has(f) && columnMap[header] !== f}>
                        {FIELD_LABELS[f]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <Button onClick={runValidation} disabled={!requiredCovered || pending}>
              {phase === "validating" ? "Validating…" : "Validate Rows"}
            </Button>
            {!requiredCovered && <p className="text-xs text-error">Map title, catalog number and artist first.</p>}
            {phase === "validating" && <Spinner label="Checking every row…" />}
          </div>
        </div>
      )}

      {/* ── Review ── */}
      {phase === "review" && counts && (
        <div>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="border border-ok/40 bg-surface px-5 py-4">
              <p className="display-md text-ok">{counts.valid}</p>
              <p className="meta mt-1">Ready</p>
            </div>
            <div className="border border-gold/40 bg-surface px-5 py-4">
              <p className="display-md text-gold">{counts.warnings}</p>
              <p className="meta mt-1">Warnings</p>
            </div>
            <div className="border border-error/40 bg-surface px-5 py-4">
              <p className="display-md text-error">{counts.errors}</p>
              <p className="meta mt-1">Errors — won&apos;t import</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[0.65rem] uppercase tracking-[0.18em] text-stone">
                  <th className="px-4 py-3">#</th>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Cat #</th>
                  <th className="px-3 py-3">Artist</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {reviewRows.map((row) => (
                  <tr key={row.id} className={cn(row.status === "error" && "bg-error/5")}>
                    <td className="px-4 py-2.5 text-faint">{row.row_index + 1}</td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-cream">{row.mapped.title || "—"}</td>
                    <td className="px-3 py-2.5 text-stone">{row.mapped.catalog_number || "—"}</td>
                    <td className="px-3 py-2.5 text-sand">{row.mapped.artist_name || "—"}</td>
                    <td className="px-3 py-2.5 text-stone">{row.mapped.release_date || "—"}</td>
                    <td className="px-3 py-2.5">
                      {row.status === "valid" ? (
                        <span className="flex items-center gap-1.5 text-xs text-ok">
                          <Check size={12} /> Ready
                        </span>
                      ) : (
                        <span
                          className={cn("flex items-center gap-1.5 text-xs", row.status === "warning" ? "text-gold" : "text-error")}
                          title={row.issues.join("; ")}
                        >
                          <AlertTriangle size={12} /> {row.issues[0] ?? row.status}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => setEditingRow(row)}
                        className="p-1.5 text-stone transition-colors hover:text-gold"
                        aria-label={`Edit row ${row.row_index + 1}`}
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button onClick={commit} disabled={pending || importable === 0}>
              {pending ? "Importing…" : `Import ${importable} as Drafts`}
            </Button>
            <p className="text-xs text-stone">
              Rows with errors stay behind. Everything imports as a <span className="text-gold">draft</span> — publish from
              the Releases screen when ready.
            </p>
          </div>
        </div>
      )}

      {/* ── Row edit modal ── */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg border border-line bg-night-2 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="display-sm text-cream">Fix row {editingRow.row_index + 1}</h2>
              <button onClick={() => setEditingRow(null)} aria-label="Close" className="p-2 text-stone hover:text-cream">
                <X size={18} />
              </button>
            </div>
            {editingRow.issues.length > 0 && (
              <div className="mb-4">
                <Notice tone="error">{editingRow.issues.join(" · ")}</Notice>
              </div>
            )}
            <div className="space-y-4">
              {(["title", "catalog_number", "artist_name", "release_date", "genre"] as const).map((field) => (
                <Field key={field} label={FIELD_LABELS[field]}>
                  <TextInput
                    value={editingRow.mapped[field] ?? ""}
                    onChange={(e) => setEditingRow({ ...editingRow, mapped: { ...editingRow.mapped, [field]: e.target.value } })}
                  />
                </Field>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button disabled={pending} onClick={() => saveRowEdit(editingRow)} className="flex-1">
                {pending ? "Saving…" : "Save Row"}
              </Button>
              <Button variant="ghost" onClick={() => setEditingRow(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
