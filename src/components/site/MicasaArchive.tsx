"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { selectMicasa } from "@/lib/micasa";
import releases from "../../../data/micasa-releases.json";

export interface ArchiveRelease {
  catalogNumber: string; artist: string; title: string; year: number; format: string;
  discogsId: number; discogsUrl: string;
  tracks: { position: string; title: string; duration: string; artist: string }[];
  artwork: { src: string; alt: string; sourceFilename: string; caption?: string }[];
  pressings: { id: number; format: string; url: string }[];
}

function ArchiveEntry({ release, fallbackLogo }: { release: ArchiveRelease; fallbackLogo?: string }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const artwork = release.artwork[imageIndex];
  return (
    <article className="micasa-release" aria-labelledby={`${release.catalogNumber}-title`}>
      <div className="micasa-release__art">
        {artwork && !failed ? (
          <Image src={artwork.src} alt={artwork.alt} width={1200} height={1200}
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            onError={() => setFailed(true)} />
        ) : (
          <div className="micasa-release__missing">
            {fallbackLogo && <Image src={fallbackLogo} width={120} height={120} alt="" />}
            <span>Original artwork not recovered</span>
          </div>
        )}
      </div>
      {release.artwork.length > 1 && (
        <div className="micasa-art-switch" aria-label={`Artwork for ${release.catalogNumber}`}>
          {release.artwork.map((art, index) => (
            <button type="button" key={art.src} aria-pressed={index === imageIndex}
              onClick={() => { setImageIndex(index); setFailed(false); }}>
              {art.caption ?? (index === 0 ? "Printed label" : "Other side")}
            </button>
          ))}
        </div>
      )}
      <div className="micasa-release__meta"><span>{release.catalogNumber}</span><span>{release.year} · {release.format}</span></div>
      <h3 id={`${release.catalogNumber}-title`}>{release.title}</h3>
      <p className="micasa-release__artist">{release.artist}</p>
      <details className="micasa-tracklist">
        <summary>Tracklist <span>{release.tracks.length} tracks</span></summary>
        <ol>
          {release.tracks.map((track, index) => (
            <li key={`${track.position}-${index}`}><span>{track.position}</span><div>{track.title}{track.artist && <small>{track.artist}</small>}</div>{track.duration && <span>{track.duration}</span>}</li>
          ))}
        </ol>
        {release.pressings.length > 1 && <p className="micasa-pressings">Other documented pressings: {release.pressings.filter(p => p.id !== release.discogsId).map((p, index) => <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">{index > 0 ? " · " : ""}{p.format}<span className="sr-only"> (opens in a new tab)</span></a>)}</p>}
      </details>
      <a className="micasa-discogs" href={release.discogsUrl} target="_blank" rel="noopener noreferrer"
        aria-label={`View ${release.catalogNumber} — ${release.title} on Discogs (opens in a new tab)`}>
        View on Discogs <ArrowUpRight size={16} aria-hidden="true" />
      </a>
    </article>
  );
}

export function MicasaArchive() {
  return <VinylArchive releases={releases} label="Micasa" labelUrl="https://www.discogs.com/label/13754-Mi-Casa" fallbackLogo="/images/labels/micasa/logo.svg" />;
}

export function VinylArchive({ releases, label, labelUrl, fallbackLogo }: { releases: ArchiveRelease[]; label: string; labelUrl: string; fallbackLogo?: string }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState("catalog");
  const years = [...new Set(releases.map(r => r.year))].sort((a, b) => a - b);
  const visible = selectMicasa(releases, query, year, sort);
  const reset = () => { setQuery(""); setYear("all"); setSort("catalog"); };
  return (
    <section id="vinyl-archive" className="micasa-archive" aria-labelledby="vinyl-heading">
      <div className="micasa-section-heading"><h2 id="vinyl-heading">The vinyl archive</h2><p>{years.length ? `${Math.min(...years)}–${Math.max(...years)} · ` : ""}Original pressings</p></div>
      <div className="micasa-controls">
        <div className="micasa-search"><Search size={18} aria-hidden="true" /><label className="sr-only" htmlFor={`${id}-search`}>Search {label} archive</label><input id={`${id}-search`} type="search" placeholder="Artist, release, track or catalog number…" value={query} onChange={e => setQuery(e.target.value)} /></div>
        <label><span className="sr-only">Filter by release year</span><select value={year} onChange={e => setYear(e.target.value)}><option value="all">All years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></label>
        <label><span className="sr-only">Sort {label} archive</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="catalog">Catalog order</option><option value="newest">Newest first</option></select></label>
      </div>
      <div className="micasa-results"><p role="status" aria-live="polite">Showing {visible.length} of {releases.length} releases</p>{(query || year !== "all" || sort !== "catalog") && <button type="button" onClick={reset}>Clear filters</button>}</div>
      <div className="micasa-grid">{visible.map(r => <ArchiveEntry key={r.catalogNumber} release={r} fallbackLogo={fallbackLogo} />)}</div>
      {visible.length === 0 && <div className="micasa-empty"><h3>No releases match.</h3><p>Try another artist, track or catalog number.</p><button type="button" onClick={reset}>Show all releases</button></div>}
      <p className="micasa-source">Release details and pressing references: <a href={labelUrl} target="_blank" rel="noopener noreferrer">Discogs — {label}<ArrowUpRight size={14} aria-hidden="true" /></a>. Restored label photographs from the original vinyl archive. These records are not available as digital downloads here. Discogs is an external catalog and marketplace; availability varies.</p>
    </section>
  );
}
