"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Pencil, Eye, Archive, Trash2, Upload } from "lucide-react";
import { deleteRelease, setReleaseState } from "@/lib/actions/releases";
import { Button, Notice, Select, StateBadge, TextInput } from "@/components/admin/ui";
import type { PublishState } from "@/lib/types";
import { formatYear } from "@/lib/utils";

export interface AdminReleaseRow {
  id: string;
  title: string;
  slug: string;
  catalog_number: string;
  artist_name: string;
  release_date: string | null;
  genre: string | null;
  cover_url: string | null;
  state: PublishState;
  updated_at: string;
}

/**
 * Desktop-dense releases table with filters, bulk state actions, and per-row
 * quick actions. Collapses to cards on small screens.
 */
export function ReleasesTable({ releases }: { releases: AdminReleaseRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"all" | PublishState>("all");
  const [artist, setArtist] = useState("all");
  const [year, setYear] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const artists = useMemo(() => Array.from(new Set(releases.map((r) => r.artist_name))).sort(), [releases]);
  const years = useMemo(
    () => Array.from(new Set(releases.map((r) => formatYear(r.release_date)).filter(Boolean))).sort().reverse(),
    [releases]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return releases.filter((r) => {
      if (state !== "all" && r.state !== state) return false;
      if (artist !== "all" && r.artist_name !== artist) return false;
      if (year !== "all" && formatYear(r.release_date) !== year) return false;
      if (!q) return true;
      return [r.title, r.catalog_number, r.artist_name].some((f) => f.toLowerCase().includes(q));
    });
  }, [releases, query, state, artist, year]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkSetState(target: PublishState) {
    setError(null);
    startTransition(async () => {
      for (const id of selected) {
        const result = await setReleaseState(id, target);
        if (!result.ok) {
          setError(result.error ?? "Failed to update.");
          break;
        }
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  function remove(id: string, title: string) {
    if (!window.confirm(`Delete “${title}” permanently? This can't be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteRelease(id);
      if (!result.ok) setError(result.error ?? "Failed to delete.");
      router.refresh();
    });
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone" />
          <span className="sr-only">Search releases</span>
          <TextInput
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, artist, cat #…"
            className="pl-10"
          />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Select value={state} onChange={(e) => setState(e.target.value as typeof state)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
          <Select value={artist} onChange={(e) => setArtist(e.target.value)} aria-label="Filter by artist">
            <option value="all">All artists</option>
            {artists.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Filter by year">
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </Select>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 border border-gold/40 bg-surface px-4 py-3">
          <span className="text-sm text-cream">{selected.size} selected</span>
          <Button variant="secondary" className="min-h-[38px] px-4 py-1.5" disabled={pending} onClick={() => bulkSetState("published")}>
            <Upload size={13} /> Publish
          </Button>
          <Button variant="ghost" className="min-h-[38px] px-4 py-1.5" disabled={pending} onClick={() => bulkSetState("draft")}>
            Back to Draft
          </Button>
          <Button variant="ghost" className="min-h-[38px] px-4 py-1.5" disabled={pending} onClick={() => bulkSetState("archived")}>
            <Archive size={13} /> Archive
          </Button>
        </div>
      )}

      <p className="meta mb-4" role="status">
        {filtered.length} {filtered.length === 1 ? "release" : "releases"}
      </p>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto border border-line bg-surface md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[0.65rem] uppercase tracking-[0.18em] text-stone">
              <th className="px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </th>
              <th className="px-3 py-3">Release</th>
              <th className="px-3 py-3">Cat #</th>
              <th className="px-3 py-3">Artist</th>
              <th className="px-3 py-3">Year</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-surface-2">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                    aria-label={`Select ${r.title}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden bg-night">
                      {r.cover_url && <Image src={r.cover_url} alt="" fill sizes="36px" className="object-cover" />}
                    </div>
                    <span className="max-w-[220px] truncate text-cream">{r.title}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-stone">{r.catalog_number}</td>
                <td className="px-3 py-3 text-sand">{r.artist_name}</td>
                <td className="px-3 py-3 text-stone">{formatYear(r.release_date) || "—"}</td>
                <td className="px-3 py-3">
                  <StateBadge state={r.state} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {r.state === "published" && (
                      <Link
                        href={`/releases/${r.slug}`}
                        target="_blank"
                        className="p-2 text-stone transition-colors hover:text-cream"
                        aria-label={`View ${r.title} on site`}
                      >
                        <Eye size={15} />
                      </Link>
                    )}
                    <Link
                      href={`/admin/releases/${r.id}`}
                      className="p-2 text-stone transition-colors hover:text-gold"
                      aria-label={`Edit ${r.title}`}
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => remove(r.id, r.title)}
                      className="p-2 text-stone transition-colors hover:text-error"
                      aria-label={`Delete ${r.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="px-4 py-12 text-center text-stone">No releases match those filters.</p>}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((r) => (
          <Link key={r.id} href={`/admin/releases/${r.id}`} className="flex items-center gap-4 border border-line bg-surface p-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-night">
              {r.cover_url && <Image src={r.cover_url} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-cream">{r.title}</p>
              <p className="text-xs text-stone">
                {r.artist_name} · {r.catalog_number}
              </p>
            </div>
            <StateBadge state={r.state} />
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="border border-line bg-surface px-4 py-12 text-center text-sm text-stone">
            No releases match those filters.
          </p>
        )}
      </div>
    </div>
  );
}
