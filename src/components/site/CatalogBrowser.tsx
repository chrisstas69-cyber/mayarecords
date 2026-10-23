"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Heart,
  List,
  Search,
  X,
} from "lucide-react";
import type { Release } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import {
  CATALOG_SORTS,
  EMPTY_CATALOG_FILTERS,
  catalogPage,
  selectCatalog,
} from "@/lib/catalog-browser";
import type { CatalogFilters, CatalogSort } from "@/lib/catalog-browser";
import { PreviewButton } from "./AudioPlayer";
import { BuyReleaseButton } from "./StoreFront";

function FavoriteButton({
  release,
  saved,
  toggle,
}: {
  release: Release;
  saved: boolean;
  toggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={`${saved ? "Unsave" : "Save"} ${release.title}`}
      className={cn(
        "catalog-action text-sand",
        saved && "border-gold/60 text-gold",
      )}
    >
      <Heart
        size={15}
        fill={saved ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );
}

function Cover({
  release,
  priority = false,
  small = false,
}: {
  release: Release;
  priority?: boolean;
  small?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const src =
    release.cover_url && failed !== release.cover_url
      ? release.cover_url
      : "/images/logos/maya-head-line.png";
  return (
    <Image
      src={src}
      alt={`${release.title} artwork`}
      fill
      priority={priority}
      sizes={
        small
          ? "48px"
          : "(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 240px"
      }
      unoptimized={src.startsWith("https://")}
      onError={() => setFailed(src)}
      className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
    />
  );
}

function ReleaseTile({
  release,
  saved,
  toggle,
  priority,
}: {
  release: Release;
  saved: boolean;
  toggle: () => void;
  priority: boolean;
}) {
  return (
    <article
      className="group min-w-0"
      aria-label={`${release.catalog_number}: ${release.title}`}
    >
      <div className="relative aspect-square overflow-hidden border border-line bg-surface transition-colors group-hover:border-gold/60">
        <Link
          href={`/releases/${release.slug}`}
          className="absolute inset-0"
          aria-label={`View ${release.title}`}
        >
          <Cover release={release} priority={priority} />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent" />
        <span className="absolute right-2 top-2 bg-night/85 px-2 py-1 text-[0.55rem] uppercase tracking-[0.13em] text-sand">
          MP3 + WAV
        </span>
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
          <div className="bg-night/90">
            <FavoriteButton release={release} saved={saved} toggle={toggle} />
          </div>
          {release.preview_url && (
            <div className="rounded-full bg-night/90">
              <PreviewButton
                url={release.preview_url}
                title={release.title}
                subtitle={`${release.artist_name} · ${release.catalog_number}`}
                coverUrl={release.cover_url}
                size={44}
              />
            </div>
          )}
          {release.digital_price_cents ? (
            <div className="bg-night/90">
              <BuyReleaseButton release={release} compact />
            </div>
          ) : null}
        </div>
      </div>
      <Link
        href={`/releases/${release.slug}`}
        className="mt-3 block text-sm font-medium leading-snug text-cream hover:text-gold"
      >
        {release.title}
      </Link>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-[0.65rem] text-sand">
        <span>{release.artist_name}</span>
        <span className="tracking-wider">{release.catalog_number}</span>
      </div>
      <Link
        href={`/releases/${release.slug}`}
        className="mt-2 inline-block min-h-7 text-xs text-sand underline decoration-line underline-offset-4 hover:text-gold"
      >
        Choose tracks <ArrowUpRight size={10} className="inline" />
      </Link>
    </article>
  );
}

function ReleaseActions({
  release,
  saved,
  toggle,
}: {
  release: Release;
  saved: boolean;
  toggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {release.preview_url && (
        <PreviewButton
          url={release.preview_url}
          title={release.title}
          subtitle={`${release.artist_name} · ${release.catalog_number}`}
          coverUrl={release.cover_url}
          size={44}
        />
      )}
      <FavoriteButton release={release} saved={saved} toggle={toggle} />
      <BuyReleaseButton release={release} compact />
      <Link
        href={`/releases/${release.slug}`}
        className="catalog-action text-sand"
        aria-label={`Choose individual tracks from ${release.title}`}
      >
        Tracks <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}

export function CatalogBrowser({ releases }: { releases: Release[] }) {
  const [filters, setFilters] = useState<CatalogFilters>(EMPTY_CATALOG_FILTERS);
  const [sort, setSort] = useState<CatalogSort>("cat-desc");
  const [view, setView] = useState<"grid" | "list">("list");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const archive = useRef<HTMLElement>(null);
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem("maya-saved-releases-v1") ?? "[]",
      );
      if (Array.isArray(value))
        setSaved([
          ...new Set(
            value.filter(
              (id): id is string =>
                typeof id === "string" &&
                releases.some((release) => release.id === id),
            ),
          ),
        ]);
    } catch {
      /* Browser storage may be disabled. */
    }
    setHydrated(true);
  }, [releases]);
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem("maya-saved-releases-v1", JSON.stringify(saved));
      } catch {
        /* Saving stays available for this visit. */
      }
    }
  }, [saved, hydrated]);
  const toggle = (id: string) =>
    setSaved((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  const change = (patch: Partial<CatalogFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const clear = () => {
    setFilters(EMPTY_CATALOG_FILTERS);
    setSort("cat-desc");
    setPage(1);
  };
  const genres = useMemo(
    () =>
      [
        ...new Set(
          releases
            .map((release) => release.genre)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [releases],
  );
  const artists = useMemo(
    () =>
      [
        ...new Set(
          releases
            .map((release) => release.artist_name)
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
    [releases],
  );
  const filtered = useMemo(
    () => selectCatalog(releases, filters, sort, saved),
    [releases, filters, sort, saved],
  );
  const { pages, current, visible } = catalogPage(filtered, page, pageSize);
  const chips = [
    { key: "query", label: filters.query },
    { key: "genre", label: filters.genre },
    { key: "artist", label: filters.artist },
    {
      key: "availability",
      label:
        filters.availability === "direct"
          ? "Buy direct"
          : filters.availability === "preview"
            ? "With previews"
            : "",
    },
  ] as const;
  const hasFilters =
    chips.some((chip) => chip.label) ||
    filters.savedOnly ||
    sort !== "cat-desc";
  const go = (next: number) => {
    setPage(next);
    archive.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  return (
    <div>
      <div className="catalog-toolbar" aria-label="Catalog filters">
        <label className="relative min-w-0 lg:col-span-2 xl:col-span-1">
          <span className="sr-only">Search the catalog</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sand"
          />
          <input
            type="search"
            value={filters.query}
            onChange={(event) => change({ query: event.target.value })}
            placeholder="Search title, artist, or cat #"
            className="catalog-input w-full pl-11"
            aria-controls="catalog-results"
          />
        </label>
        <select
          className="catalog-input"
          aria-label="Filter by availability"
          value={filters.availability}
          onChange={(event) => change({ availability: event.target.value })}
        >
          <option value="">All availability</option>
          <option value="direct">Buy direct · MP3 + WAV</option>
          <option value="preview">With audio previews</option>
        </select>
        <select
          className="catalog-input"
          aria-label="Filter by genre"
          value={filters.genre}
          onChange={(event) => change({ genre: event.target.value })}
        >
          <option value="">All genres</option>
          {genres.map((genre) => (
            <option key={genre}>{genre}</option>
          ))}
        </select>
        <select
          className="catalog-input"
          aria-label="Filter by artist"
          value={filters.artist}
          onChange={(event) => change({ artist: event.target.value })}
        >
          <option value="">All artists</option>
          {artists.map((artist) => (
            <option key={artist}>{artist}</option>
          ))}
        </select>
        <select
          className="catalog-input"
          aria-label="Sort catalog"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as CatalogSort);
            setPage(1);
          }}
        >
          {Object.entries(CATALOG_SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div
          className="flex gap-1 border border-line p-1"
          role="group"
          aria-label="Catalog view"
        >
          <button
            type="button"
            className={cn(
              "catalog-action",
              view === "grid" ? "bg-gold/15 text-gold" : "text-sand",
            )}
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
          >
            <Grid2X2 size={16} />
          </button>
          <button
            type="button"
            className={cn(
              "catalog-action",
              view === "list" ? "bg-gold/15 text-gold" : "text-sand",
            )}
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
          >
            <List size={16} />
          </button>
        </div>
      </div>
      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-sand" role="status">
          Showing{" "}
          {filtered.length
            ? (current - 1) * (pageSize || filtered.length) + 1
            : 0}
          –{Math.min(current * (pageSize || filtered.length), filtered.length)}{" "}
          of {filtered.length} releases
          {filtered.length !== releases.length
            ? ` · ${releases.length} in the catalog`
            : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {chips
            .filter((chip) => chip.label)
            .map((chip) => (
              <button
                type="button"
                key={chip.key}
                onClick={() => change({ [chip.key]: "" })}
                className="catalog-chip"
                aria-label={`Remove filter ${chip.label}`}
              >
                {chip.label}
                <X size={12} />
              </button>
            ))}
          <button
            type="button"
            onClick={() => change({ savedOnly: !filters.savedOnly })}
            aria-pressed={filters.savedOnly}
            className={cn(
              "catalog-chip min-h-11",
              filters.savedOnly && "text-gold",
            )}
          >
            <Heart
              size={13}
              fill={filters.savedOnly ? "currentColor" : "none"}
            />{" "}
            Saved ({saved.length})
          </button>
          {hasFilters && (
            <button
              type="button"
              className="min-h-11 px-2 text-xs text-gold underline underline-offset-4"
              onClick={clear}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
      {filtered.length ? (
        <>
          <section
            aria-label="New and recent releases"
            className="mt-8 border-b border-line pb-7"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-2 text-[0.6rem]">01 / Discovery</p>
                <h2 className="font-display text-2xl text-cream">
                  {hasFilters ? "From your selection" : "New & Recent Releases"}
                </h2>
              </div>
              <a href="#catalog-results" className="catalog-action text-sand">
                Explore catalog <ArrowUpRight size={12} />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-6">
              {filtered.slice(0, 6).map((release, index) => (
                <ReleaseTile
                  key={release.id}
                  release={release}
                  saved={saved.includes(release.id)}
                  toggle={() => toggle(release.id)}
                  priority={index < 6}
                />
              ))}
            </div>
          </section>
          <section
            id="catalog-results"
            ref={archive}
            aria-label="Catalog archive"
            className="scroll-mt-24 pt-7"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow mb-2 text-[0.6rem]">02 / Archive</p>
                <h2 className="font-display text-2xl text-cream">
                  The Complete Catalog
                </h2>
              </div>
              <label className="text-xs text-sand">
                Releases per page{" "}
                <select
                  aria-label="Releases per page"
                  className="catalog-input ml-2 min-h-10 py-2"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50, 0].map((size) => (
                    <option key={size} value={size}>
                      {size || "All"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {view === "grid" ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 xl:grid-cols-6">
                {visible.map((release) => (
                  <ReleaseTile
                    key={release.id}
                    release={release}
                    saved={saved.includes(release.id)}
                    toggle={() => toggle(release.id)}
                    priority={false}
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="hidden lg:block">
                  <table className="catalog-table w-full text-left">
                    <caption className="sr-only">
                      Maya Records catalog · full-release prices; choose tracks
                      for individual purchases
                    </caption>
                    <thead>
                      <tr>
                        {[
                          "Artwork / Title",
                          "Artist",
                          "Cat #",
                          "Genre",
                          "Released",
                          "BPM / Key",
                          "Full release / Tracks",
                        ].map((heading) => (
                          <th key={heading}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((release) => (
                        <tr key={release.id}>
                          <td>
                            <Link
                              href={`/releases/${release.slug}`}
                              className="flex items-center gap-3 text-cream hover:text-gold"
                            >
                              <span className="relative block h-11 w-11 shrink-0 overflow-hidden border border-line bg-surface">
                                <Cover release={release} small />
                              </span>
                              <span>
                                <span className="block font-medium">
                                  {release.title}
                                </span>
                                <span className="mt-1 block text-[0.6rem] text-sand">
                                  {release.tracks.length}{" "}
                                  {release.tracks.length === 1
                                    ? "track"
                                    : "tracks"}{" "}
                                  · MP3 + WAV
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="text-sand">{release.artist_name}</td>
                          <td className="whitespace-nowrap text-sand">
                            {release.catalog_number}
                          </td>
                          <td>
                            <span className="catalog-chip text-[0.6rem]">
                              {release.genre || "—"}
                            </span>
                          </td>
                          <td className="text-sand">
                            {formatDate(release.release_date)}
                          </td>
                          <td className="whitespace-nowrap text-xs text-sand">
                            {release.tracks[0]?.bpm
                              ? `${release.tracks[0].bpm} BPM`
                              : "—"}
                            <br />
                            {release.tracks[0]?.musical_key || "—"}
                          </td>
                          <td>
                            <ReleaseActions
                              release={release}
                              saved={saved.includes(release.id)}
                              toggle={() => toggle(release.id)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-line border-y border-line lg:hidden">
                  {visible.map((release) => (
                    <article key={release.id} className="py-4">
                      <div className="mb-3 flex items-center gap-3">
                        <Link
                          href={`/releases/${release.slug}`}
                          className="relative h-14 w-14 shrink-0 overflow-hidden border border-line bg-surface"
                          aria-label={`View ${release.title}`}
                        >
                          <Cover release={release} small />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={`/releases/${release.slug}`}
                            className="text-sm font-medium text-cream"
                          >
                            {release.title}
                          </Link>
                          <p className="mt-1 text-xs text-sand">
                            {release.artist_name} · {release.catalog_number}
                          </p>
                          <p className="mt-1 text-xs text-sand">
                            {release.tracks.length} tracks · MP3 + WAV
                          </p>
                        </div>
                      </div>
                      <ReleaseActions
                        release={release}
                        saved={saved.includes(release.id)}
                        toggle={() => toggle(release.id)}
                      />
                    </article>
                  ))}
                </div>
              </>
            )}
            {pages > 1 && (
              <nav
                aria-label="Catalog pages"
                className="mt-7 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={current === 1}
                  onClick={() => go(current - 1)}
                  className="catalog-action text-sand disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: pages }, (_, index) => index + 1)
                  .filter(
                    (number) =>
                      number === 1 ||
                      number === pages ||
                      Math.abs(number - current) <= 1,
                  )
                  .map((number, index, numbers) => (
                    <span key={number} className="flex items-center gap-2">
                      {index > 0 && number - numbers[index - 1] > 1 && (
                        <span className="text-sand">…</span>
                      )}
                      <button
                        type="button"
                        aria-label={`Page ${number}`}
                        aria-current={number === current ? "page" : undefined}
                        className={cn(
                          "catalog-action",
                          number === current
                            ? "border-gold bg-gold text-night"
                            : "text-sand",
                        )}
                        onClick={() => go(number)}
                      >
                        {number}
                      </button>
                    </span>
                  ))}
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={current === pages}
                  onClick={() => go(current + 1)}
                  className="catalog-action text-sand disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </section>
        </>
      ) : (
        <div
          id="catalog-results"
          className="border border-line bg-surface px-6 py-16 text-center"
        >
          <h2 className="display-sm text-cream">
            Nothing in the crate for that.
          </h2>
          <p className="mt-3 text-sm text-sand">
            Try another search, or clear your filters.
          </p>
          <button
            type="button"
            onClick={clear}
            className="catalog-action mt-6 text-gold"
          >
            Show all releases
          </button>
        </div>
      )}
    </div>
  );
}
