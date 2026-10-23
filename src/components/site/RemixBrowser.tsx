"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Disc3, Search } from "lucide-react";
import { REMIX_SORTS, remixDisplayTitle, remixLabels, selectRemixes } from "@/lib/remixes";
import type { Remix, RemixSort } from "@/lib/remixes";

function RemixCard({ remix, priority }: { remix: Remix; priority: boolean }) {
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const title = remixDisplayTitle(remix);
  const stores = [
    { name: "Traxsource", url: remix.traxsource_url },
    ...(remix.beatport_url ? [{ name: "Beatport", url: remix.beatport_url }] : []),
  ];

  return (
    <article className="group flex h-full min-w-0 flex-col" aria-label={`${remix.artist} — ${title} (${remix.joeski_mix})`}>
      <a
        href={remix.traxsource_url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-square overflow-hidden border border-line bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        aria-label={`View ${title} (${remix.joeski_mix}) on Traxsource (opens in a new tab)`}
      >
        {remix.cover_url && failedCover !== remix.cover_url ? (
          <Image
            src={remix.cover_url}
            alt={`${remix.artist} — ${title} release artwork`}
            fill
            priority={priority}
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 300px"
            onError={() => setFailedCover(remix.cover_url)}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center text-sand">
            <Disc3 size={42} strokeWidth={1} aria-hidden="true" />
            <span className="text-xs uppercase tracking-[0.16em]">Artwork unavailable</span>
          </div>
        )}
        <span className="absolute bottom-3 left-3 border border-line bg-night/90 px-2.5 py-1 text-xs tracking-[0.16em] text-cream">
          {remix.date.slice(0, 4)}
        </span>
      </a>
      <div className="flex flex-1 flex-col pt-4">
        <p className="mb-2 text-[0.65rem] font-medium uppercase leading-relaxed tracking-[0.12em] text-gold">{remix.joeski_mix}</p>
        <h2 className="text-base font-medium leading-snug text-cream">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-sand">{remix.artist}</p>
        <p className="mt-2 text-xs leading-relaxed text-sand">{remix.label}</p>
        {title !== remix.title && !remix.display_title && <p className="mt-2 text-xs text-sand">EP listing · original track title unconfirmed</p>}
        <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row sm:flex-wrap">
          {stores.map((store) => (
            <a
              key={store.name}
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${store.name}: ${title} (${remix.joeski_mix}) (opens in a new tab)`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 border border-line px-2.5 py-2.5 text-[0.65rem] uppercase tracking-[0.1em] text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {store.name} <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

export function RemixBrowser({ remixes }: { remixes: Remix[] }) {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [sort, setSort] = useState<RemixSort>("newest");
  const labels = useMemo(() => remixLabels(remixes), [remixes]);
  const visible = useMemo(() => selectRemixes(remixes, query, label, sort), [remixes, query, label, sort]);
  const hasFilters = Boolean(query || label || sort !== "newest");

  const clear = () => {
    setQuery("");
    setLabel("");
    setSort("newest");
  };
  const selectClass = "min-h-12 w-full border border-line bg-surface px-4 py-3 text-sm text-cream outline-none focus:border-gold sm:w-auto";

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="min-w-0 sm:min-w-60 sm:flex-1">
          <span className="mb-2 block text-xs text-sand">Search remixes</span>
          <span className="relative block">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sand" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Artist, track, mix or label…"
              aria-controls="remix-results"
              className="min-h-12 w-full border border-line bg-surface py-3 pl-11 pr-4 text-sm text-cream placeholder:text-stone outline-none focus:border-gold"
            />
          </span>
        </label>
        <label className="min-w-0">
          <span className="mb-2 block text-xs text-sand">Label</span>
          <select aria-label="Filter by label" value={label} onChange={(event) => setLabel(event.target.value)} className={`${selectClass} sm:max-w-64`} aria-controls="remix-results">
            <option value="">All labels</option>
            {labels.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs text-sand">Sort remixes</span>
          <select aria-label="Sort remixes" value={sort} onChange={(event) => setSort(event.target.value as RemixSort)} className={selectClass} aria-controls="remix-results">
            {Object.entries(REMIX_SORTS).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-8 flex min-h-8 flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-xs uppercase tracking-[0.16em] text-sand">
          Showing {visible.length} of {remixes.length} remixes
        </p>
        {hasFilters && <button type="button" onClick={clear} className="min-h-11 text-sm text-gold underline underline-offset-4 hover:text-gold-bright">Clear filters</button>}
      </div>

      <div id="remix-results">
        {visible.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((remix, index) => <RemixCard key={remix.id} remix={remix} priority={index < 4} />)}
          </div>
        ) : (
          <div className="border border-line bg-surface px-6 py-20 text-center">
            <h2 className="display-sm text-cream">No remixes found.</h2>
            <p className="mt-3 text-sm text-sand">Try another artist, track or label.</p>
            <button type="button" onClick={clear} className="mt-6 min-h-11 border border-gold px-5 py-3 text-sm text-gold hover:bg-gold hover:text-night">Show all remixes</button>
          </div>
        )}
      </div>
    </div>
  );
}
