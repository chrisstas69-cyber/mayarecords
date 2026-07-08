import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { PreviewButton } from "@/components/site/AudioPlayer";
import { Reveal } from "@/components/site/Reveal";
import { getPublishedMixes } from "@/lib/data/catalog";
import { formatDate, formatDuration } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Mixes",
  description: "DJ mixes and radio sessions — Maya Sessions, live recordings, and the Latin/tribal sets Joeski is known for.",
};

export default async function MixesPage() {
  const mixes = await getPublishedMixes();
  const [featured, ...rest] = mixes;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-14">
        <p className="eyebrow mb-3">Sessions & Recordings</p>
        <h1 className="display-lg text-cream">Mixes</h1>
        <p className="mt-4 max-w-xl text-sand">
          Latin and tribal house at the spearhead, 4am-deep underneath. Live recordings, the Maya Sessions radio show,
          and studio sets.
        </p>
      </header>

      {featured && (
        <Reveal className="mb-16 grid items-center gap-10 border border-line bg-surface p-6 sm:p-10 md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden border border-line md:aspect-[4/3]">
            {featured.cover_url && (
              <Image
                src={featured.cover_url}
                alt={featured.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>
          <div>
            <p className="eyebrow mb-3">Featured Mix</p>
            <h2 className="display-md text-cream">{featured.title}</h2>
            {featured.description && <p className="mt-4 leading-relaxed text-sand">{featured.description}</p>}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <p className="meta">Recorded</p>
                <p className="mt-1 text-sm text-cream">{formatDate(featured.recorded_on)}</p>
              </div>
              <div>
                <p className="meta">Length</p>
                <p className="mt-1 text-sm text-cream">{formatDuration(featured.duration_seconds)}</p>
              </div>
            </div>
            <div className="mt-8 flex items-center gap-4">
              {featured.audio_url ? (
                <PreviewButton
                  url={featured.audio_url}
                  title={featured.title}
                  subtitle="Joeski — DJ Mix"
                  coverUrl={featured.cover_url}
                  size={52}
                />
              ) : featured.external_url ? (
                <a
                  href={featured.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gold px-7 py-3.5 text-[0.75rem] font-medium uppercase tracking-[0.22em] text-night transition-colors hover:bg-gold-bright"
                >
                  Listen on SoundCloud <ExternalLink size={13} />
                </a>
              ) : null}
            </div>
          </div>
        </Reveal>
      )}

      <div className="divide-y divide-line border-y border-line">
        {rest.map((mix, i) => (
          <Reveal key={mix.id} delay={(i % 3) * 60} className="flex items-center gap-5 py-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-line bg-surface sm:h-24 sm:w-24">
              {mix.cover_url && (
                <Image src={mix.cover_url} alt="" fill sizes="96px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="display-sm truncate text-cream">{mix.title}</h3>
              <p className="mt-1 truncate text-sm text-stone">
                {formatDate(mix.recorded_on)} · {formatDuration(mix.duration_seconds)}
              </p>
              {mix.description && (
                <p className="mt-1.5 hidden max-w-2xl truncate text-sm text-sand sm:block">{mix.description}</p>
              )}
            </div>
            {mix.audio_url ? (
              <PreviewButton url={mix.audio_url} title={mix.title} subtitle="Joeski — DJ Mix" coverUrl={mix.cover_url} size={44} />
            ) : mix.external_url ? (
              <a
                href={mix.external_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Listen to ${mix.title} externally`}
                className="flex shrink-0 items-center gap-2 border border-line px-4 py-2.5 text-[0.68rem] uppercase tracking-[0.18em] text-sand transition-all hover:border-gold hover:text-gold"
              >
                Listen <ExternalLink size={11} />
              </a>
            ) : null}
          </Reveal>
        ))}
      </div>

      <p className="mt-8 text-xs text-faint">
        Full recordings stream in-page once uploaded to the label&apos;s media library; external links point to SoundCloud
        in the meantime.
      </p>
    </div>
  );
}
