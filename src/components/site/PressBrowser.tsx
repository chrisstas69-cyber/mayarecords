"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import artworkSource from "../../../data/joeski-press-artwork.json";
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

const artwork: Record<string, { src: string; alt: string; source: string }> = artworkSource;

function PressEntry({ item }: { item: PressItem }) {
  const image = artwork[item.url];
  const [failedImage, setFailedImage] = useState(false);
  return (
    <article
      className="group flex min-w-0 flex-col overflow-hidden border border-line bg-surface transition-colors hover:border-gold/50"
      aria-label={`${item.outlet} — ${item.headline}`}
    >
      <div className="relative aspect-square overflow-hidden border-b border-line bg-night">
        {image && !failedImage ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw"
            className="object-contain transition-transform duration-500 motion-safe:group-hover:scale-105"
            onError={() => setFailedImage(true)}
          />
        ) : (
          <div className="relative flex h-full flex-col justify-between overflow-hidden p-7" aria-label={`${item.outlet} branded press artwork`}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-gold/15" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full border border-gold/15" />
            <p className="relative text-[0.6rem] uppercase tracking-[0.25em] text-gold">Joeski / Press archive</p>
            <p className="relative max-w-full break-words font-display text-4xl leading-tight text-cream">{item.outlet}</p>
            <p className="relative text-[0.6rem] uppercase tracking-[0.2em] text-sand">{item.type} · {pressDateLabel(item.date)}</p>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-6">
        <p className="mb-3 text-[0.65rem] font-medium uppercase leading-relaxed tracking-[0.12em] text-gold">
          {item.outlet} · {item.type}
        </p>
        <h3 className="font-display text-2xl leading-snug break-words text-cream">
          {item.headline}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-sand">
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
        <div className="mt-auto pt-5">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Read ${item.headline} (opens in a new tab)`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 justify-self-start border border-line px-5 py-2.5 text-[0.65rem] uppercase tracking-[0.1em] text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Read <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
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
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.entries.map((item, index) => (
                <PressEntry
                  key={`${item.date}:${item.outlet}:${item.headline}:${index}`}
                  item={item}
                />
              ))}
              </div>
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
