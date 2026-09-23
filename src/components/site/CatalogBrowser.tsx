"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Release } from "@/lib/types";
import { formatYear } from "@/lib/utils";
import { ReleaseCard } from "./ReleaseCard";

const catNumber = (r: Release) => Number(r.catalog_number.replace(/\D/g, "")) || 0;
const time = (r: Release) => (r.release_date ? new Date(r.release_date).getTime() : 0);

const SORTS = {
  "cat-desc": { label: "Cat # — newest first", fn: (a: Release, b: Release) => catNumber(b) - catNumber(a) },
  "cat-asc": { label: "Cat # — oldest first", fn: (a: Release, b: Release) => catNumber(a) - catNumber(b) },
  "date-desc": { label: "Release date — newest", fn: (a: Release, b: Release) => time(b) - time(a) || catNumber(b) - catNumber(a) },
  "date-asc": { label: "Release date — oldest", fn: (a: Release, b: Release) => (time(a) || Infinity) - (time(b) || Infinity) },
  "title-asc": { label: "Title A–Z", fn: (a: Release, b: Release) => a.title.localeCompare(b.title) },
  "artist-asc": { label: "Artist A–Z", fn: (a: Release, b: Release) => (a.artist_name ?? "").localeCompare(b.artist_name ?? "") },
} as const;
type SortKey = keyof typeof SORTS;

const PAGE_SIZES = [10, 20, 50, 0] as const; // 0 = show all

/** Client-side searchable/filterable catalog. Receives the published catalog from the server. */
export function CatalogBrowser({ releases }: { releases: Release[] }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [artist, setArtist] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("cat-desc");
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(1);

  const genres = useMemo(
    () => Array.from(new Set(releases.map((r) => r.genre).filter((g): g is string => Boolean(g)))).sort(),
    [releases]
  );
  const artists = useMemo(
    () => Array.from(new Set(releases.map((r) => r.artist_name).filter((a): a is string => Boolean(a)))).sort(),
    [releases]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return releases.filter((r) => {
      if (genre !== "all" && r.genre !== genre) return false;
      if (artist !== "all" && r.artist_name !== artist) return false;
      if (!q) return true;
      return [r.title, r.catalog_number, r.artist_name, r.genre, formatYear(r.release_date)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [releases, query, genre, artist]);

  const sorted = useMemo(() => [...filtered].sort(SORTS[sort].fn), [filtered, sort]);
  const pageCount = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const visible = pageSize ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  // Any change to what's being listed starts back at page 1.
  useEffect(() => setPage(1), [query, genre, artist, sort, pageSize]);

  const goTo = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectClass =
    "border border-line bg-surface px-4 py-3 text-sm text-cream outline-none transition-colors focus:border-gold/60";

  return (
    <div>
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative min-w-[16rem] flex-1">
          <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone" />
          <span className="sr-only">Search the catalog</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, artist, or cat #…"
            className="w-full border border-line bg-surface py-3 pl-11 pr-4 text-sm text-cream placeholder:text-faint outline-none transition-colors focus:border-gold/60"
          />
        </label>
        <label>
          <span className="sr-only">Filter by artist</span>
          <select value={artist} onChange={(e) => setArtist(e.target.value)} className={selectClass}>
            <option value="all">All artists</option>
            {artists.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by genre</span>
          <select value={genre} onChange={(e) => setGenre(e.target.value)} className={selectClass}>
            <option value="all">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClass}>
            {Object.entries(SORTS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Releases per page</span>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className={selectClass}>
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n ? `Show ${n}` : "Show all"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="meta mb-8" role="status">
        {filtered.length} {filtered.length === 1 ? "release" : "releases"}
        {pageSize > 0 && filtered.length > pageSize &&
          ` · showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)}`}
      </p>

      {filtered.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-20 text-center">
          <p className="display-sm text-stone">Nothing in the crate for that.</p>
          <p className="mt-3 text-sm text-faint">Try a different search or clear the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((release, i) => (
            <ReleaseCard key={release.id} release={release} priority={i < 4} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav aria-label="Catalog pages" className="mt-14 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="border border-line p-2.5 text-sand transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === pageCount || Math.abs(n - page) <= 2)
            .map((n, i, arr) => (
              <span key={n} className="flex items-center gap-2">
                {i > 0 && n - arr[i - 1] > 1 && <span className="text-faint">…</span>}
                <button
                  onClick={() => goTo(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={
                    n === page
                      ? "min-w-10 border border-gold bg-gold px-3 py-2 text-sm text-night"
                      : "min-w-10 border border-line px-3 py-2 text-sm text-sand transition-colors hover:border-gold hover:text-gold"
                  }
                >
                  {n}
                </button>
              </span>
            ))}
          <button
            onClick={() => goTo(page + 1)}
            disabled={page === pageCount}
            aria-label="Next page"
            className="border border-line p-2.5 text-sand transition-colors hover:border-gold hover:text-gold disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
