import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { JOESKI_BIO_LONG } from "@/lib/data/seed";

export const metadata: Metadata = {
  title: "About",
  description:
    "Joeski — New York house music since 1991. Founding member of The Chocolate Factory, Roxy resident, and founder of Maya Records.",
};

const MILESTONES = [
  { year: "1991", text: "Bursts onto the NYC scene as a founding member of The Chocolate Factory DJ collective — Limelight, Tunnel, Palladium, NASA." },
  { year: "1990s", text: "Helps turn Save The Robots into an NYC afterhours institution; first residency at the Together parties at the legendary Roxy, alongside Danny Tenaglia, Louie Vega and Roger Sanchez." },
  { year: "2000", text: "Charts with hit after hit on Electrik Soul, Siesta, Chez and Camouflage after years mastering the studio craft." },
  { year: "2001", text: "Launches Maya Records. Hustler's Revenge and the DJ Chus collaboration El Amor push the label to the front of the U.S. house sound." },
  { year: "2000s–10s", text: "Productions and remixes for NRK, Ministry of Sound, Defected, Bedrock, Nervous, Cajual and KMS. Releases on Crosstown Rebels, Relief and Poker Flat." },
  { year: "2017", text: "Tribute to Obatala dropped by Pete Tong on BBC Radio 1; all three tracks chart the Beatport Tech House Top 100 at once. Featured on John Digweed's Transitions." },
  { year: "Today", text: "Maya Records continues its steady output — chart fixtures on Beatport and Traxsource — while Joeski headlines clubs from Brooklyn to Helsinki." },
];

export default function AboutPage() {
  return (
    <div className="pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <header className="mb-16 max-w-3xl">
          <p className="eyebrow mb-3">Biography</p>
          <h1 className="display-lg text-cream">
            Three decades deep.<br />
            <span className="text-gold">Still at the top of his game.</span>
          </h1>
        </header>

        <div className="grid gap-14 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            {JOESKI_BIO_LONG.map((paragraph, i) => (
              <Reveal key={i} delay={i * 60}>
                <p className="leading-relaxed text-sand">{paragraph}</p>
              </Reveal>
            ))}
            <Reveal delay={280}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/press"
                  className="inline-flex items-center gap-3 border border-gold/50 px-7 py-3.5 text-[0.75rem] uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-night"
                >
                  Press Kit & Photos <ArrowRight size={14} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 border border-cream/25 px-7 py-3.5 text-[0.75rem] uppercase tracking-[0.22em] text-cream transition-colors hover:border-cream/60"
                >
                  Bookings
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="space-y-5 lg:col-span-2">
            <Reveal className="relative aspect-[3/4] overflow-hidden border border-line">
              <Image
                src="/images/film/film-14.jpg"
                alt="Joeski shot on film by Andreas Hofweber"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </Reveal>
            <Reveal delay={100} className="relative aspect-[3/2] overflow-hidden border border-line">
              <Image
                src="/images/film/film-02.jpg"
                alt="Joeski at home, shot on film"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </Reveal>
            <p className="text-xs text-faint">Photography: Andreas Hofweber, shot on film</p>
          </div>
        </div>

        {/* Timeline */}
        <section className="mt-24 border-t border-line pt-14" aria-label="Career milestones">
          <h2 className="display-md mb-12 text-cream">Milestones</h2>
          <ol className="space-y-0">
            {MILESTONES.map((m, i) => (
              <Reveal key={m.year + i} as="li" delay={(i % 3) * 70} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[120px_1fr] sm:gap-8">
                <span className="display-sm text-gold">{m.year}</span>
                <p className="leading-relaxed text-sand">{m.text}</p>
              </Reveal>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
