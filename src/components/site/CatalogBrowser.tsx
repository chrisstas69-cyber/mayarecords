"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Release } from "@/lib/types";
import { formatYear } from "@/lib/utils";
import { ReleaseCard } from "./ReleaseCard";

/** Client-side searchable/filterable catalog. Receives the published catalog from the server. */
export function CatalogBrowser({ releases }: { releases: Release[] }) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<string>("all");
  const [artist, setArtist] = useState<string>("all");

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

  const selectClass =
    "border border-line bg-surface px-4 py-3 text-sm text-cream outline-none transition-colors focus:border-gold/60";

  return (
    <div>
      <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
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
      </div>

      <p className="meta mb-8" role="status">
        {filtered.length} {filtered.length === 1 ? "release" : "releases"}
      </p>

      {filtered.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-20 text-center">
          <p className="display-sm text-stone">Nothing in the crate for that.</p>
          <p className="mt-3 text-sm text-faint">Try a different search or clear the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((release, i) => (
            <ReleaseCard key={release.id} release={release} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
