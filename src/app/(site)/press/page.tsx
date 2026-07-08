import type { Metadata } from "next";
import Image from "next/image";
import { Download } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SEED_FILM_PHOTOS, SEED_LIVE_PHOTOS, SEED_PRESS_PHOTOS } from "@/lib/data/seed";

export const metadata: Metadata = {
  title: "Press & Media",
  description: "Official Joeski press photos, logos, biography and tech rider.",
};

const PRESS_DOWNLOADS = [
  { label: "Biography (PDF)", href: "/press/joeski-biography.pdf" },
  { label: "Tech Rider (PDF)", href: "/press/joeski-tech-rider.pdf" },
  { label: "Joeski Logo Pack", href: "/images/logos/joeski-logo-2.png" },
  { label: "Maya Records Logo Pack", href: "/images/logos/maya-white.png" },
];

export default function PressPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-14">
        <p className="eyebrow mb-3">For promoters & press</p>
        <h1 className="display-lg text-cream">Press & Media</h1>
        <p className="mt-4 max-w-xl text-sand">
          Approved photography, logos and documents. High-resolution originals available on request via the booking
          agency.
        </p>
      </header>

      {/* Downloads */}
      <section aria-label="Press downloads" className="mb-20">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESS_DOWNLOADS.map((d) => (
            <a
              key={d.label}
              href={d.href}
              download
              className="flex items-center justify-between gap-3 border border-line bg-surface px-5 py-4 text-sm text-sand transition-all hover:border-gold hover:text-gold"
            >
              {d.label} <Download size={15} />
            </a>
          ))}
        </div>
      </section>

      {/* Live shots */}
      <section aria-label="Live photos" className="mb-20">
        <h2 className="display-md mb-8 text-cream">Live</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {SEED_LIVE_PHOTOS.map((photo, i) => (
            <Reveal key={photo.src} delay={i * 80}>
              <a href={photo.src} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="relative aspect-[3/2] overflow-hidden border border-line bg-surface">
                  <Image
                    src={photo.src}
                    alt={photo.caption}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Press portraits */}
      <section aria-label="Press photos" className="mb-20">
        <h2 className="display-md mb-8 text-cream">Press Photos</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {SEED_PRESS_PHOTOS.map((photo, i) => (
            <Reveal key={photo.src} delay={(i % 3) * 70}>
              <a href={photo.src} target="_blank" rel="noopener noreferrer" className="group block">
                <div className={`relative overflow-hidden border border-line bg-surface ${photo.w > photo.h ? "aspect-[3/2]" : "aspect-[3/4]"}`}>
                  <Image
                    src={photo.src}
                    alt={photo.caption}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Film series */}
      <section aria-label="Film photography series">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="display-md text-cream">On Film</h2>
          <p className="meta">Andreas Hofweber · 2026</p>
        </div>
        <div className="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
          {SEED_FILM_PHOTOS.map((photo, i) => (
            <Reveal key={photo.src} delay={(i % 4) * 50}>
              <a href={photo.src} target="_blank" rel="noopener noreferrer" className="group block">
                <div className={`relative overflow-hidden border border-line bg-surface ${photo.portrait ? "aspect-[2/3]" : "aspect-[3/2]"}`}>
                  <Image
                    src={photo.src}
                    alt={photo.caption}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
