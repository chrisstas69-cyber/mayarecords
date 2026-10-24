"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowUpRight,
  Disc3,
  Headphones,
  Search,
  X,
} from "lucide-react";
import { PreviewButton, usePlayer } from "@/components/site/AudioPlayer";
import { canonicalSoundCloudTrack } from "@/lib/soundcloud";
import {
  mixDate,
  mixDateLabel,
  mixDuration,
  mixYears,
  selectMixes,
  type MixLength,
  type MixSort,
} from "@/lib/mixes";
import { formatDate } from "@/lib/utils";
import type { Mix } from "@/lib/types";

function MixListen({ mix }: { mix: Mix }) {
  const { soundCloudTrack, openSoundCloud } = usePlayer();
  const url = canonicalSoundCloudTrack(mix.external_url);
  const selected = !!url && soundCloudTrack?.url === url;
  if (mix.audio_url)
    return (
      <PreviewButton
        url={mix.audio_url}
        title={mix.title}
        subtitle="Joeski · DJ mix"
        coverUrl={mix.cover_url}
      />
    );
  if (!url)
    return <span className="text-xs text-stone">SoundCloud link pending</span>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-label={`Open player for ${mix.title}`}
        aria-pressed={selected}
        onClick={() =>
          openSoundCloud({
            url,
            title: mix.title,
            subtitle: "Joeski · DJ mix",
            coverUrl: mix.cover_url,
          })
        }
        className={`catalog-action min-h-11 ${selected ? "bg-gold text-night" : "border border-gold/50 text-gold hover:bg-gold/10"}`}
      >
        <Headphones size={15} />
        {selected ? "Player open" : "Listen"}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${mix.title} on SoundCloud`}
        className="catalog-action min-h-11 text-sand hover:text-gold"
      >
        SoundCloud <ArrowUpRight size={14} />
      </a>
    </div>
  );
}

function Artwork({ mix, featured = false }: { mix: Mix; featured?: boolean }) {
  return (
    <div className="relative aspect-square overflow-hidden border border-line bg-night-2">
      {mix.cover_url ? (
        <Image
          src={mix.cover_url}
          alt={`Artwork for ${mix.title}`}
          fill
          priority={featured}
          unoptimized={mix.cover_url.startsWith("https://")}
          sizes={
            featured
              ? "(max-width: 768px) 100vw, 360px"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
          }
          className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
        />
      ) : (
        <Disc3 className="absolute inset-0 m-auto text-gold/40" size={72} />
      )}
    </div>
  );
}

function Details({ mix }: { mix: Mix }) {
  return (
    <p className="text-xs text-sand">
      {mixDuration(mix.duration_seconds)}
      <span className="mx-2 text-gold/40">/</span>
      {mixDate(mix)
        ? `${mixDateLabel(mix)} ${formatDate(mixDate(mix))}`
        : "Date unavailable"}
    </p>
  );
}

const PAGE_SIZE = 12;
export function MixLibrary({ mixes }: { mixes: Mix[] }) {
  const browseRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [length, setLength] = useState<MixLength>("");
  const [sort, setSort] = useState<MixSort>("newest");
  const [page, setPage] = useState(1);
  const years = useMemo(() => mixYears(mixes), [mixes]);
  const result = useMemo(
    () => selectMixes(mixes, query, year, length, sort),
    [mixes, query, year, length, sort],
  );
  const latest = useMemo(
    () =>
      selectMixes(mixes).find(
        (mix) => canonicalSoundCloudTrack(mix.external_url) || mix.audio_url,
      ),
    [mixes],
  );
  const pages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = result.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const active = !!(query || year || length);
  const streamable = mixes.filter(
    (mix) => canonicalSoundCloudTrack(mix.external_url) || mix.audio_url,
  ).length;
  function goToPage(value: number) {
    setPage(value);
    browseRef.current?.scrollIntoView({ block: "start" });
  }
  const hours = Math.floor(
    mixes.reduce((sum, mix) => sum + (mix.duration_seconds || 0), 0) / 3600,
  );
  function reset() {
    setQuery("");
    setYear("");
    setLength("");
    setSort("newest");
    setPage(1);
  }
  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-28 pt-28 sm:px-8 md:pt-36">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">From the booth / Joeski</p>
          <h1 className="display-lg text-cream">DJ Mixes & Radio</h1>
          <p className="mt-4 max-w-2xl text-sand">
            Long nights. Deep grooves. Live sets, radio shows and studio
            sessions from the Joeski archives.
          </p>
        </div>
        <div className="flex gap-8 border-l border-gold/40 pl-6">
          <div>
            <p className="text-3xl text-cream">{mixes.length}</p>
            <p className="meta mt-1">Mixes</p>
          </div>
          <div>
            <p className="text-3xl text-cream">{hours}+</p>
            <p className="meta mt-1">Hours</p>
          </div>
          <div>
            <p className="text-3xl text-cream">
              {years.length > 1
                ? `${years.at(-1)}–${years[0]}`
                : years[0] || "—"}
            </p>
            <p className="meta mt-1">The archive</p>
          </div>
        </div>
      </header>
      {latest && (
        <section
          aria-label="Featured mix"
          className="mb-12 grid gap-7 border border-line bg-surface p-5 sm:p-7 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-10"
        >
          <Artwork mix={latest} featured />
          <div className="flex min-w-0 flex-col justify-center">
            <p className="eyebrow mb-4 text-gold">Latest session</p>
            <h2 className="display-md break-words text-cream">
              {latest.title}
            </h2>
            <div className="my-5">
              <Details mix={latest} />
            </div>
            {latest.description && (
              <p className="mb-6 max-w-2xl text-sand">{latest.description}</p>
            )}
            <MixListen mix={latest} />
            <p className="mt-5 text-xs text-stone">
              Full-length listening via SoundCloud. Open the player, then press
              play.
            </p>
          </div>
        </section>
      )}
      <p className="mb-5 text-xs text-stone">
        {streamable} ready to listen
        {streamable < mixes.length
          ? ` · ${mixes.length - streamable} SoundCloud links pending`
          : ""}
      </p>
      <section
        ref={browseRef}
        aria-label="Browse DJ mixes"
        className="scroll-mt-24"
      >
        <div className="mb-6 grid gap-3 border-y border-line py-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr]">
          <label className="relative">
            <span className="sr-only">Search mixes</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-3.5 text-stone"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search sessions, venues, series…"
              className="catalog-input w-full pl-10"
            />
          </label>
          <label>
            <span className="sr-only">Year</span>
            <select
              aria-label="Year"
              className="catalog-input w-full"
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All years</option>
              {years.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Mix length</span>
            <select
              aria-label="Mix length"
              className="catalog-input w-full"
              value={length}
              onChange={(event) => {
                setLength(event.target.value as MixLength);
                setPage(1);
              }}
            >
              <option value="">Any length</option>
              <option value="short">Under 1 hour</option>
              <option value="medium">1–2 hours</option>
              <option value="long">2 hours or more</option>
            </select>
          </label>
          <label className="relative">
            <ArrowDownUp
              size={14}
              className="pointer-events-none absolute left-3 top-4 text-stone"
            />
            <select
              aria-label="Sort mixes"
              className="catalog-input w-full pl-9"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as MixSort);
                setPage(1);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A–Z</option>
              <option value="longest">Longest first</option>
            </select>
          </label>
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-sand">
            {result.length
              ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, result.length)} of ${result.length} mixes`
              : "No mixes found"}
          </p>
          {active && (
            <button className="catalog-action text-gold" onClick={reset}>
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
        {visible.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((mix) => (
              <article
                key={mix.id}
                className="group flex min-w-0 flex-col border border-line bg-surface"
              >
                <Artwork mix={mix} />
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <Details mix={mix} />
                  <h2 className="break-words text-lg leading-snug text-cream">
                    {mix.title}
                  </h2>
                  <div className="mt-auto pt-1">
                    <MixListen mix={mix} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-line py-16 text-center">
            <p className="display-sm mb-3 text-cream">
              No sessions match those filters.
            </p>
            <button className="catalog-action text-gold" onClick={reset}>
              Show all mixes
            </button>
          </div>
        )}
        {pages > 1 && (
          <nav
            aria-label="Mixes pagination"
            className="mt-8 flex items-center justify-center gap-5"
          >
            <button
              className="catalog-action min-h-11 border border-line text-sand disabled:opacity-30"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              Previous
            </button>
            <span className="text-sm tabular-nums text-sand">
              Page {currentPage} of {pages}
            </span>
            <button
              className="catalog-action min-h-11 border border-line text-sand disabled:opacity-30"
              disabled={currentPage === pages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </section>
      <p className="mt-10 max-w-3xl text-xs leading-relaxed text-stone">
        Dates are labeled as published, recorded or archive dates where known.
        SoundCloud availability may vary by region; any unverified links are
        marked pending rather than pointing to a different set.
      </p>
    </div>
  );
}
