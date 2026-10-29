import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Headphones } from "lucide-react";
import type { ReleaseShowcase } from "@/lib/release-showcase";
import { SHOWCASE_NOTICE } from "@/lib/release-showcase";

export function ReleaseShowcaseFeature({ showcase, full = false }: { showcase: ReleaseShowcase; full?: boolean }) {
  const { release } = showcase;
  const price = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  return (
    <section className="release-feature" aria-label={`${showcase.label} sample release presentation`}>
      <div className="release-feature__art"><Image src={release.artwork[0].src} alt={`${release.title} — original ${release.catalogNumber} vinyl label, used for a design demonstration`} width={1200} height={1200} priority sizes="(max-width: 700px) 100vw, 45vw" /><span>Sample campaign · not a new release</span></div>
      <div className="release-feature__copy">
        <div className="release-feature__label"><Link href={showcase.labelHref}>{showcase.label}</Link><span>Demo edition</span></div>
        <p className="release-feature__artist">{release.artist}</p>
        <h2>{release.title}</h2>
        <p className="release-feature__intro">One release. Every mix. A direct connection to the label.</p>
        <p className="release-feature__provenance">Original archive: {release.catalogNumber} · {release.year}. Sample release date: not scheduled.</p>
        <div className="release-feature__actions">
          {full ? <button className="release-feature__buy" type="button" disabled>Full release · {price(showcase.exampleReleasePriceCents)} · Demo</button> : <Link className="release-feature__buy" href={`/showcase/${showcase.slug}`}>Explore sample release <ArrowUpRight size={18} aria-hidden="true" /></Link>}
          <a href={full ? "#sample-tracks" : `/showcase/${showcase.slug}#sample-tracks`}>View individual tracks <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
        <p className="release-feature__audio"><Headphones size={16} aria-hidden="true" />Preview audio not supplied. Artwork is the fallback until a cleared video or audio preview is added.</p>
        <p className="release-feature__notice">{SHOWCASE_NOTICE}</p>
      </div>
    </section>
  );
}

export function SampleTracklist({ showcase }: { showcase: ReleaseShowcase }) {
  return <section id="sample-tracks" className="sample-tracks" aria-labelledby="sample-tracks-heading">
    <div className="showcase-section-heading"><h2 id="sample-tracks-heading">Choose your tracks</h2><p>Illustrative MP3 + WAV purchase layout</p></div>
    <p className="sample-tracks__note">Example pricing only. Purchase controls are disabled; no payment or download is available.</p>
    <ol>{showcase.release.tracks.map((track, index) => <li key={`${track.position}-${index}`}>
      <span className="sample-tracks__number">{String(index + 1).padStart(2, "0")}</span>
      <div><h3>{track.title}</h3><p>{track.artist || showcase.release.artist}{track.duration ? ` · Original duration ${track.duration}` : ""}</p></div>
      <button type="button" disabled aria-label={`Sample purchase of ${track.title}, unavailable`}>${(showcase.exampleTrackPriceCents / 100).toFixed(2)} · Demo</button>
    </li>)}</ol>
    <div className="sample-tracks__footer"><p>Prefer the complete release?</p><button type="button" disabled>All {showcase.release.tracks.length} tracks · ${(showcase.exampleReleasePriceCents / 100).toFixed(2)} · Demo</button></div>
  </section>;
}
