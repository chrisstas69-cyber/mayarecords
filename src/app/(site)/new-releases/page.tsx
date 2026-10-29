import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReleaseShowcaseFeature } from "@/components/site/ReleaseShowcase";
import { RELEASE_SHOWCASES } from "@/lib/release-showcase";
import { getPublishedReleases } from "@/lib/data/catalog";
import { latestHomeReleases } from "@/lib/homepage";
import { homeSerif, homeSans } from "@/lib/home-fonts";
import "./showcase.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "New from Maya — Release Showcase",
  description: "Discover Maya, Micasa and Big Chief. Preview the release-first experience alongside the current Maya catalog.",
  robots: { index: false, follow: false },
};

export default async function NewReleasesPage() {
  const latest = latestHomeReleases(await getPublishedReleases(), new Date().toISOString().slice(0, 10))[0];
  const micasa = RELEASE_SHOWCASES[1];
  return <div className={`showcase-page ${homeSerif.variable} ${homeSans.variable}`}><div className="showcase-container">
    <header className="showcase-heading"><h1>New from Maya.</h1><p>Three labels. One family. Music first.</p><nav aria-label="Label family"><Link href="/releases">Maya Records</Link><Link href="/labels/micasa">Micasa</Link><Link href="/labels/big-chief">Big Chief</Link></nav></header>
    <p className="showcase-demo-banner">Preview experience: Big Chief and Micasa campaigns below are design examples, not new releases. No purchase or audio is enabled for samples.</p>
    <ReleaseShowcaseFeature showcase={RELEASE_SHOWCASES[0]} />
    <section className="showcase-more" aria-labelledby="across-heading"><div className="showcase-section-heading"><h2 id="across-heading">Across the labels</h2><p>A place for each label’s next release</p></div><div className="showcase-secondary-grid">
      {latest && <article className="showcase-secondary"><div>{latest.cover_url ? <Image src={latest.cover_url} alt={`${latest.title} artwork`} width={500} height={500} unoptimized={latest.cover_url.startsWith("https:")} sizes="(max-width: 700px) 40vw, 220px" /> : <p>{latest.catalog_number}</p>}</div><div><p className="showcase-secondary__label">Maya Records · Current catalog</p><h3>{latest.title}</h3><p>{latest.artist_name}</p><p>{latest.catalog_number}{latest.release_date ? ` · ${latest.release_date}` : ""}</p><Link href={`/releases/${latest.slug}`}>View release <ArrowUpRight size={16} aria-hidden="true" /></Link></div></article>}
      <article className="showcase-secondary"><div><Image src={micasa.release.artwork[0].src} alt={`${micasa.release.title} original vinyl label`} width={500} height={500} sizes="(max-width: 700px) 40vw, 220px" /></div><div><p className="showcase-secondary__label">Micasa · Design demo</p><h3>{micasa.release.title}</h3><p>{micasa.release.artist}</p><p>Historical artwork · Not a new announcement</p><Link href={`/showcase/${micasa.slug}`}>Explore sample <ArrowUpRight size={16} aria-hidden="true" /></Link></div></article>
    </div></section>
    <section className="showcase-family"><h2>Find your label.</h2><div><Link href="/releases"><strong>Maya Records</strong><span>The digital catalog</span><ArrowUpRight size={20} aria-hidden="true" /></Link><Link href="/labels/micasa"><strong>Micasa</strong><span>The original vinyl archive</span><ArrowUpRight size={20} aria-hidden="true" /></Link><Link href="/labels/big-chief"><strong>Big Chief</strong><span>The original vinyl archive</span><ArrowUpRight size={20} aria-hidden="true" /></Link></div></section>
  </div></div>;
}
