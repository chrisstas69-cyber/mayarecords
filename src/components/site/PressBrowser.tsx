"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import {
  groupPressByYear,
  PRESS_SORTS,
  pressDateLabel,
  pressTypes,
  pressYear,
  selectPress,
} from "@/lib/coverage";
import type { PressItem, PressSort } from "@/lib/coverage";

function PressEntry({ item }: { item: PressItem }) {
  return (
    <article
      className="grid min-w-0 gap-5 border-b border-line py-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
      aria-label={`${item.outlet} — ${item.headline}`}
    >
      <div className="min-w-0">
        <p className="mb-3 text-[0.65rem] font-medium uppercase leading-relaxed tracking-[0.12em] text-gold">
          {item.outlet} · {item.type}
        </p>
        <h3 className="font-display text-2xl leading-snug break-words text-cream sm:text-3xl">
          {item.headline}
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sand">
          {item.summary}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-sand">
          {pressYear(item.date) ? (
            <time dateTime={item.date}>{pressDateLabel(item.date)}</time>
          ) : (
            <span>{pressDateLabel(item.date)}</span>
          )}
          {item.status !== "Live" && <span> · {item.status}</span>}
        </p>
      </div>
      {item.url ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Read ${item.headline} (opens in a new tab)`}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 justify-self-start border border-line px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.1em] text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:justify-self-end"
        >
          Read <ArrowUpRight size={12} aria-hidden="true" />
        </a>
      ) : null}
    </article>
  );
}

export function PressBrowser({ items }: { items: PressItem[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState<PressSort>("newest");
  const types = useMemo(() => pressTypes(items), [items]);
  const visible = useMemo(
    () => selectPress(items, query, type, sort),
    [items, query, type, sort],
  );
  const groups = useMemo(() => groupPressByYear(visible), [visible]);
  const hasFilters = Boolean(query || type || sort !== "newest");
  const clear = () => {
    setQuery("");
    setType("");
    setSort("newest");
  };
  const selectClass =
    "min-h-12 w-full border border-line bg-surface px-4 py-3 text-sm text-cream outline-none focus:border-gold sm:w-auto";

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="min-w-0 sm:min-w-60 sm:flex-1">
          <span className="mb-2 block text-xs text-sand">Search press</span>
          <span className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sand"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Outlet, headline or keyword…"
              aria-controls="press-results"
              className="min-h-12 w-full border border-line bg-surface py-3 pl-11 pr-4 text-sm text-cream placeholder:text-stone outline-none focus:border-gold"
            />
          </span>
        </label>
        <label className="min-w-0">
          <span className="mb-2 block text-xs text-sand">Type</span>
          <select
            aria-label="Filter by type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={`${selectClass} sm:max-w-64`}
            aria-controls="press-results"
          >
            <option value="">All types</option>
            {types.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-xs text-sand">Sort press</span>
          <select
            aria-label="Sort press"
            value={sort}
            onChange={(event) => setSort(event.target.value as PressSort)}
            className={selectClass}
            aria-controls="press-results"
          >
            {Object.entries(PRESS_SORTS).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-8 flex min-h-8 flex-wrap items-center justify-between gap-3">
        <p
          role="status"
          aria-live="polite"
          className="text-xs uppercase tracking-[0.16em] text-sand"
        >
          Showing {visible.length} of {items.length} items
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="min-h-11 text-sm text-gold underline underline-offset-4 hover:text-gold-bright"
          >
            Clear filters
          </button>
        )}
      </div>
      <div id="press-results">
        {groups.length ? (
          groups.map((group) => (
            <section
              key={group.year}
              className="mb-12"
              aria-label={`${group.year} press coverage`}
            >
              <h2 className="border-b border-line pb-4 font-display text-4xl text-cream">
                {group.year}
              </h2>
              {group.entries.map((item, index) => (
                <PressEntry
                  key={`${item.date}:${item.outlet}:${item.headline}:${index}`}
                  item={item}
                />
              ))}
            </section>
          ))
        ) : (
          <div className="border border-line bg-surface px-6 py-20 text-center">
            <h2 className="display-sm text-cream">No press items found.</h2>
            <p className="mt-3 text-sm text-sand">
              Try another outlet, headline or keyword.
            </p>
            <button
              type="button"
              onClick={clear}
              className="mt-6 min-h-11 border border-gold px-5 py-3 text-sm text-gold hover:bg-gold hover:text-night"
            >
              Show all press
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
