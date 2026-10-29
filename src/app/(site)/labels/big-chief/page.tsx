import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { VinylArchive } from "@/components/site/MicasaArchive";
import { DiscographyTabs } from "@/components/site/DiscographyTabs";
import { ReleaseShowcaseFeature } from "@/components/site/ReleaseShowcase";
import { RELEASE_SHOWCASES } from "@/lib/release-showcase";
import { homeSerif, homeSans } from "@/lib/home-fonts";
import releases from "../../../../../data/big-chief-releases.json";
import "../micasa/micasa.css";
import "../../new-releases/showcase.css";

export const metadata: Metadata = {
  title: "Big Chief — Vinyl Archive | Maya Records",
  description: "Big Chief, founded by Joeski & Stas. Original vinyl releases, restored artwork, tracklists and Discogs pressing references.",
  alternates: { canonical: "/labels/big-chief" },
};

export default function BigChiefPage() {
  return <div className={`micasa-page big-chief-page ${homeSerif.variable} ${homeSans.variable}`}>
    <div className="micasa-container">
      <div className="micasa-breadcrumb"><Link href="/new-releases">Maya Records family</Link><span>/</span><span>Big Chief</span></div>
      <header className="micasa-hero">
        <div className="micasa-identity"><div><h1>Big Chief</h1><p>A Maya Records imprint.</p></div></div>
        <div className="micasa-intro"><p>Founded by Joeski &amp; Stas. Original records, a shared history, and a new chapter with the Maya Records family.</p><a href="https://www.discogs.com/label/5300-Big-Chief" target="_blank" rel="noopener noreferrer">Big Chief on Discogs <ArrowUpRight size={16} aria-hidden="true" /></a></div>
      </header>
      <DiscographyTabs active="big-chief" />
      <div className="showcase-section-heading"><h2>A look at what comes next</h2><p>New-release layout · design demo</p></div>
      <ReleaseShowcaseFeature showcase={RELEASE_SHOWCASES[0]} />
      <VinylArchive releases={releases} label="Big Chief" labelUrl="https://www.discogs.com/label/5300-Big-Chief" />
      <section className="micasa-next"><div><h2>The next chapter</h2><p>New releases are planned monthly. The records above document the original vinyl catalog—not digital releases for sale. Future releases will be announced separately.</p></div><Link href="/new-releases">Across the labels <ArrowUpRight size={18} aria-hidden="true" /></Link></section>
    </div>
  </div>;
}
