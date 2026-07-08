import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/site/Hero";
import { Reveal } from "@/components/site/Reveal";
import { ReleaseCard } from "@/components/site/ReleaseCard";
import { PreviewButton } from "@/components/site/AudioPlayer";
import { getFeaturedRelease, getPublishedMixes, getPublishedReleases, getSiteSettings } from "@/lib/data/catalog";
import { JOESKI_BIO_SHORT } from "@/lib/data/seed";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

const PILLARS = [
  {
    label: "DJ",
    sub: "Stereo Montréal resident · Hï Ibiza",
    copy: "Latin and tribal house at the spearhead, 4am-deep range underneath. From founding NYC's Chocolate Factory collective in 1991 to residencies and headline rooms across the Americas and Europe.",
  },
  {
    label: "Producer",
    sub: "Perpetual Beatport Top 100",
    copy: "Colombian roots, New York discipline. Originals and remixes for Crosstown Rebels, Defected, Poker Flat, fabric and Cajual — with support from Pete Tong and John Digweed.",
  },
  {
    label: "Maya Records",
    sub: "Independent since 2001",
    copy: "The label built to release music on its own terms. A steady output of tribal, deep and tech house — fixtures on the Beatport and Traxsource charts.",
  },
];

export default async function HomePage() {
  const [featured, releases, settings, mixes] = await Promise.all([
    getFeaturedRelease(),
    getPublishedReleases(),
    getSiteSettings(),
    getPublishedMixes(),
  ]);
  const latestMix = mixes[0];
  const latest = releases.filter((r) => r.id !== featured?.id).slice(0, 8);
  const heroIsVideo = /\.(mp4|webm|mov)(\?|$)/i.test(settings.hero_media_url ?? "");

  return (
    <>
      <Hero
        headline={settings.hero_headline}
        subline={settings.hero_subline}
        heroVideoUrl={heroIsVideo ? settings.hero_media_url : null}
        heroImage={!heroIsVideo && settings.hero_media_url ? settings.hero_media_url : undefined}
      />

      {/* Identity strip — one ecosystem, three pillars */}
      <section className="border-y border-line" aria-label="Joeski: DJ, Producer, Maya Records">
        <div className="mx-auto grid max-w-7xl md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal
              key={p.label}
              delay={i * 90}
              className={`px-5 py-14 sm:px-10 ${i < 2 ? "md:border-r md:border-line" : ""} ${i > 0 ? "border-t border-line md:border-t-0" : ""}`}
            >
              <p className="eyebrow mb-4">{p.sub}</p>
              <h2 className="display-md mb-5 text-cream">{p.label}</h2>
              <p className="text-[0.95rem] leading-relaxed text-sand">{p.copy}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Featured release */}
      {featured && (
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28" aria-label="Featured release">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <Reveal className="relative aspect-square overflow-hidden border border-line bg-surface">
              {featured.cover_url && (
                <Image
                  src={featured.cover_url}
                  alt={`${featured.title} cover art`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </Reveal>
            <Reveal delay={120}>
              <p className="eyebrow mb-4">Latest Release</p>
              <h2 className="display-lg text-cream">{featured.title}</h2>
              <p className="mt-3 text-lg text-sand">{featured.artist_name}</p>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
                <div>
                  <p className="meta">Cat No.</p>
                  <p className="mt-1 text-sm text-cream">{featured.catalog_number}</p>
                </div>
                <div>
                  <p className="meta">Released</p>
                  <p className="mt-1 text-sm text-cream">{formatDate(featured.release_date)}</p>
                </div>
                {featured.genre && (
                  <div>
                    <p className="meta">Genre</p>
                    <p className="mt-1 text-sm text-cream">{featured.genre}</p>
                  </div>
                )}
              </div>
              {featured.description && (
                <p className="mt-6 max-w-lg leading-relaxed text-sand">{featured.description}</p>
              )}
              <div className="mt-8 flex items-center gap-4">
                {featured.preview_url && (
                  <PreviewButton
                    url={featured.preview_url}
                    title={featured.title}
                    subtitle={`${featured.artist_name} · ${featured.catalog_number}`}
                    coverUrl={featured.cover_url}
                    size={52}
                  />
                )}
                <Link
                  href={`/releases/${featured.slug}`}
                  className="flex items-center gap-3 border border-gold/50 px-7 py-3.5 text-[0.75rem] uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-night"
                >
                  Full Release <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <div className="waveline mx-auto max-w-5xl" aria-hidden />

      {/* Catalog block */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28" aria-label="Recent catalog">
        <Reveal className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">Maya Records</p>
            <h2 className="display-lg text-cream">From the Catalog</h2>
          </div>
          <Link
            href="/releases"
            className="hidden shrink-0 items-center gap-2 text-[0.72rem] uppercase tracking-[0.22em] text-stone transition-colors hover:text-gold sm:flex"
          >
            All Releases <ArrowRight size={13} />
          </Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {latest.map((release, i) => (
            <Reveal key={release.id} delay={(i % 4) * 70}>
              <ReleaseCard release={release} />
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center sm:hidden">
          <Link href="/releases" className="text-[0.72rem] uppercase tracking-[0.22em] text-gold">
            All Releases →
          </Link>
        </div>
      </section>

      {/* Latest mix + store strip */}
      <section className="border-t border-line" aria-label="Mixes and store">
        <div className="mx-auto grid max-w-7xl md:grid-cols-2">
          {latestMix && (
            <Reveal className="border-b border-line px-5 py-14 sm:px-10 md:border-b-0 md:border-r">
              <p className="eyebrow mb-3">Latest Mix</p>
              <h2 className="display-md text-cream">{latestMix.title}</h2>
              {latestMix.description && (
                <p className="mt-4 max-w-md text-sm leading-relaxed text-sand">{latestMix.description}</p>
              )}
              <Link
                href="/mixes"
                className="mt-7 inline-flex items-center gap-3 border border-gold/50 px-6 py-3 text-[0.72rem] uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-night"
              >
                All Mixes <ArrowRight size={13} />
              </Link>
            </Reveal>
          )}
          <Reveal delay={100} className="px-5 py-14 sm:px-10">
            <p className="eyebrow mb-3">Direct from the label</p>
            <h2 className="display-md text-cream">Store</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-sand">
              Official merch, plus every Maya release as MP3 + WAV — bought direct, delivered instantly, no middlemen.
            </p>
            <Link
              href="/store"
              className="mt-7 inline-flex items-center gap-3 border border-gold/50 px-6 py-3 text-[0.72rem] uppercase tracking-[0.22em] text-gold transition-all hover:bg-gold hover:text-night"
            >
              Enter the Store <ArrowRight size={13} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Editorial / about teaser with film photography */}
      <section className="border-t border-line bg-night-2" aria-label="About Joeski">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-5 md:py-28">
          <Reveal className="md:col-span-3">
            <p className="eyebrow mb-4">The Story</p>
            <h2 className="display-lg mb-6 text-cream">
              Change is inevitable.<br />
              <span className="text-gold">The groove is not.</span>
            </h2>
            <p className="max-w-xl leading-relaxed text-sand">{JOESKI_BIO_SHORT}</p>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-3 border border-cream/25 px-7 py-3.5 text-[0.75rem] uppercase tracking-[0.22em] text-cream transition-colors hover:border-gold hover:text-gold"
            >
              Read the Biography <ArrowRight size={14} />
            </Link>
          </Reveal>
          <Reveal delay={120} className="md:col-span-2">
            <div className="relative aspect-[4/3] overflow-hidden border border-line">
              <Image
                src="/images/live/hero-crowd-2.jpg"
                alt="JOESKI projected over a packed courtyard crowd"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            </div>
            <div className="relative mt-4 aspect-[3/2] overflow-hidden border border-line">
              <Image
                src="/images/film/film-02.jpg"
                alt="Joeski shot on film by Andreas Hofweber"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
