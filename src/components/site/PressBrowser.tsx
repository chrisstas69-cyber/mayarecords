"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Search } from "lucide-react";
import artworkSource from "../../../data/joeski-press-artwork.json";
import { groupPressByYear, PRESS_SORTS, pressDateLabel, pressTypes, pressYear, selectPress } from "@/lib/coverage";
import type { PressItem, PressSort } from "@/lib/coverage";
const artwork: Record<string, {
    src: string;
    alt: string;
    source: string;
}> = artworkSource;
function PressEntry({ item }: {
    item: PressItem;
}) {
    const image = artwork[item.url];
    const [failed, setFailed] = useState(false);
    return <article className="press-archive-row" aria-label={`${item.outlet} — ${item.headline}`}>
    <div className="press-row-thumbnail">
      {image && !failed ? <Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 92px, 132px" className="object-contain" onError={() => setFailed(true)}/> :
            <div className="press-type-art" aria-label={`${item.outlet} branded press artwork`}><span>{item.type}</span><strong>{item.outlet.split(" ")[0]}</strong></div>}
    </div>
    <div className="press-row-copy">
      <p className="press-kicker">{item.outlet} · {item.type} · {pressYear(item.date) ? <time dateTime={item.date}>{pressDateLabel(item.date)}</time> : pressDateLabel(item.date)}</p>
      <h3>{item.headline}</h3>
      <p className="sr-only">{item.summary}</p>
      {item.status !== "Live" && <p className="press-row-status">{item.status}</p>}
    </div>
    {item.status === "Live" && item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`Read ${item.headline} (opens in a new tab)`} className="press-read">Read <ArrowUpRight size={14} aria-hidden="true"/></a> : item.status.startsWith("Offline") ? <p className="press-offline">Original page offline</p> : null}
  </article>;
}
export function PressBrowser({ items }: {
    items: PressItem[];
}) {
    const [query, setQuery] = useState("");
    const [type, setType] = useState("");
    const [year, setYear] = useState("");
    const [mayaOnly, setMayaOnly] = useState(false);
    const [sort, setSort] = useState<PressSort>("newest");
    const types = useMemo(() => pressTypes(items), [items]);
    const years = useMemo(() => [...new Set(items.map(item => pressYear(item.date) ?? "Undated"))].sort((a, b) => a === "Undated" ? 1 : b === "Undated" ? -1 : b.localeCompare(a)), [items]);
    const visible = useMemo(() => selectPress(items, query, type, sort, mayaOnly, year), [items, query, type, sort, mayaOnly, year]);
    const groups = useMemo(() => groupPressByYear(visible), [visible]);
    const hasFilters = Boolean(query || type || year || mayaOnly || sort !== "newest");
    const clear = () => { setQuery(""); setType(""); setYear(""); setMayaOnly(false); setSort("newest"); };
    return <section className="press-archive" aria-label="Press archive">
    <div className="press-toolbar">
      <h2>The Archive</h2>
      <label className="press-search"><Search size={18} aria-hidden="true"/><span className="sr-only">Search press</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search press archive…" aria-controls="press-results"/></label>
      <label className="press-filter"><span className="sr-only">Filter by year</span><select value={year} onChange={event => setYear(event.target.value)} aria-controls="press-results"><option value="">All years</option>{years.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="press-filter"><span className="sr-only">Filter by type</span><select value={type} onChange={event => setType(event.target.value)} aria-controls="press-results"><option value="">All types</option>{types.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className={`press-maya ${mayaOnly ? "active" : ""}`}><input type="checkbox" checked={mayaOnly} onChange={event => setMayaOnly(event.target.checked)} aria-controls="press-results"/><span className="sr-only">Maya Records focus</span><span aria-hidden="true">Maya</span></label>
      <label className="press-filter"><span className="sr-only">Sort press</span><select value={sort} onChange={event => setSort(event.target.value as PressSort)} aria-controls="press-results">{Object.entries(PRESS_SORTS).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
    </div>
    <div className="press-result-status"><p role="status" aria-live="polite">Showing {visible.length} of {items.length} items</p>{hasFilters && <button type="button" onClick={clear}>Clear filters</button>}</div>
    <div id="press-results">{groups.length ? groups.map(group => <section key={group.year} aria-label={`${group.year} press coverage`}><h2 className="press-year">{group.year}</h2>{group.entries.map((item, index) => <PressEntry key={`${item.date}:${item.outlet}:${item.headline}:${index}`} item={item}/>)}</section>) : <div className="press-empty"><h2>No press items found.</h2><p>Try another outlet, headline or keyword.</p><button type="button" onClick={clear}>Show all press</button></div>}</div>
  </section>;
}
