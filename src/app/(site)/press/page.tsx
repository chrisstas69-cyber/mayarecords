import type { Metadata } from "next";
import Image from "next/image";
import { Download, FileText, Image as ImageIcon, Lock, Mic2, Music } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { ExitEpkButton, PromoterRegisterForm, ReturningPromoterForm } from "@/components/epk/EpkForms";
import { getPromoterEmail } from "@/lib/epk";
import {
  BOOKING,
  JOESKI_BIO_LONG,
  JOESKI_BIO_SHORT,
  SEED_FILM_PHOTOS,
  SEED_LIVE_PHOTOS,
  SEED_PRESS_PHOTOS,
} from "@/lib/data/seed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Press Kit",
  description: "Joeski's electronic press kit — for promoters, venues, agents and press.",
};

const PRESS_DOWNLOADS = [
  { label: "Biography (PDF)", href: "/api/epk/joeski-biography.pdf" },
  { label: "Tech Rider (PDF)", href: "/api/epk/joeski-tech-rider.pdf" },
  { label: "Joeski Logo", href: "/images/logos/joeski-logo-2.png" },
  { label: "Maya Records Logo", href: "/images/logos/maya-white.png" },
];

const HIGHLIGHTS = [
  "30+ years behind the decks — Limelight, Tunnel, Palladium, The Roxy",
  "Founder of Maya Records (2001) — 240+ releases",
  "Releases & remixes on Defected, Ministry of Sound, Crosstown Rebels, Poker Flat, Bedrock",
  "Supported by Pete Tong (BBC Radio 1); featured on John Digweed's Transitions",
  "Beatport & Traxsource chart regular — tribal, deep and tech house",
];

const INCLUDED = [
  { icon: FileText, label: "Full biography & one-sheet" },
  { icon: Mic2, label: "Technical rider" },
  { icon: ImageIcon, label: "Hi-res press & live photography" },
  { icon: Music, label: "Logos & booking contacts" },
];

function LockedPress() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-14 grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <p className="eyebrow mb-3">For promoters, venues & press</p>
          <h1 className="display-lg text-cream">Press Kit</h1>
          <p className="mt-5 max-w-xl leading-relaxed text-sand">{JOESKI_BIO_SHORT}</p>
        </div>
        <div className="relative aspect-[3/2] overflow-hidden border border-line">
          <Image src={SEED_LIVE_PHOTOS[0].src} alt={SEED_LIVE_PHOTOS[0].caption} fill sizes="40vw" className="object-cover" />
        </div>
      </header>

      <div className="mb-16 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {INCLUDED.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-4 bg-night p-6">
            <Icon size={20} className="text-gold" />
            <span className="text-sm text-sand">{label}</span>
            <Lock size={13} className="ml-auto text-faint" />
          </div>
        ))}
      </div>

      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section className="border border-line bg-surface p-6 sm:p-10">
          <h2 className="display-sm text-cream">Get access</h2>
          <p className="mb-8 mt-2 text-sand">Register once — the full kit unlocks instantly on this device.</p>
          <PromoterRegisterForm />
        </section>
        <section className="self-start border border-line p-6 sm:p-10">
          <h2 className="display-sm text-cream">Already registered?</h2>
          <p className="mb-6 mt-2 text-sand">Sign back in with the email you used.</p>
          <ReturningPromoterForm />
          <p className="mt-10 text-sm text-stone">
            Booking enquiries go straight to{" "}
            <a href={BOOKING.agencyUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright">
              {BOOKING.agency}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

export default async function PressPage() {
  const promoter = await getPromoterEmail();
  if (!promoter) return <LockedPress />;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Electronic Press Kit</p>
          <h1 className="display-lg text-cream">Joeski</h1>
          <p className="mt-4 max-w-xl text-sand">
            Approved biography, rider, photography and logos. Signed in as {promoter}.
          </p>
        </div>
        <ExitEpkButton />
      </header>

      <section aria-label="Biography" className="mb-20 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5 leading-relaxed text-sand">
          {JOESKI_BIO_LONG.map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
        <aside className="self-start border border-line bg-surface p-7">
          <p className="eyebrow mb-4">Highlights</p>
          <ul className="space-y-3 text-sm text-cream">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="border-l border-gold/50 pl-3">{h}</li>
            ))}
          </ul>
          <p className="eyebrow mb-2 mt-8">Bookings</p>
          <p className="text-sm text-sand">
            <a href={BOOKING.agencyUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-bright">
              {BOOKING.agency}
            </a>
            <br />
            <a href={`mailto:${BOOKING.email}`} className="hover:text-gold">{BOOKING.email}</a>
          </p>
        </aside>
      </section>

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
