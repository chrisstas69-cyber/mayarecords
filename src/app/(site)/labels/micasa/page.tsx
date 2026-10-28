import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { MicasaArchive } from "@/components/site/MicasaArchive";
import { DiscographyTabs } from "@/components/site/DiscographyTabs";
import { homeSerif, homeSans } from "@/lib/home-fonts";
import "./micasa.css";

export const metadata: Metadata = {
  title: "Micasa — Vinyl Archive | Maya Records",
  description: "Micasa, co-founded by Chris and Joeski. Explore the original vinyl catalog, restored label artwork, tracklists and Discogs pressing references.",
  alternates: { canonical: "/labels/micasa" },
};

export default function MicasaPage() {
  return <div className={`micasa-page ${homeSerif.variable} ${homeSans.variable}`}>
    <div className="micasa-container">
      <div className="micasa-breadcrumb"><Link href="/releases">Maya Records</Link><span>/</span><span>Micasa</span></div>
      <header className="micasa-hero">
        <div className="micasa-identity"><Image src="/images/labels/micasa/logo.svg" alt="Micasa emblem" width={190} height={190} priority /><div><h1>Micasa</h1><p>A Maya Records imprint.</p></div></div>
        <div className="micasa-intro"><p>Co-founded by Chris and Joeski. Born on vinyl. Part of the Maya Records family.</p><p>Explore the original records, their artwork and the tracks that tell the label’s story.</p><a href="#vinyl-archive">Explore the archive <ArrowDown size={16} aria-hidden="true" /></a></div>
      </header>
      <DiscographyTabs active="micasa" />
      <MicasaArchive />
      <section className="micasa-next" aria-labelledby="next-heading"><div><h2 id="next-heading">The next chapter</h2><p>We’re bringing Micasa back, with new releases planned monthly. This is the original vinyl archive; new music will have its own place here when it’s announced.</p></div><Link href="/contact">Stay in touch <ArrowUpRight size={18} aria-hidden="true" /></Link></section>
    </div>
  </div>;
}
