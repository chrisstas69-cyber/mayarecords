import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PreviewButton } from "@/components/site/AudioPlayer";
import { ReleaseCard } from "@/components/site/ReleaseCard";
import { BuyReleaseButton } from "@/components/site/StoreFront";
import { getPublishedReleases, getReleaseBySlug } from "@/lib/data/catalog";
import { formatDate, formatDuration } from "@/lib/utils";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) return { title: "Release not found" };
  return {
    title: `${release.title} — ${release.artist_name} (${release.catalog_number})`,
    description: release.description ?? `${release.title} by ${release.artist_name} on Maya Records.`,
    openGraph: release.cover_url ? { images: [release.cover_url] } : undefined,
  };
}

export default async function ReleasePage({ params }: Props) {
  const { slug } = await params;
  const release = await getReleaseBySlug(slug);
  if (!release) notFound();

  const all = await getPublishedReleases();
  const more = all.filter((r) => r.id !== release.id && r.artist_id === release.artist_id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 md:pt-36">
      <Link
        href="/releases"
        className="mb-10 inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.22em] text-stone transition-colors hover:text-gold"
      >
        <ArrowLeft size={13} /> Catalog
      </Link>

      <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
        {/* Cover + streaming links */}
        <div className="lg:col-span-2">
          <div className="relative aspect-square overflow-hidden border border-line bg-surface">
            {release.cover_url ? (
              <Image
                src={release.cover_url}
                alt={`${release.title} cover art`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-faint">
                <span className="display-sm">{release.catalog_number}</span>
              </div>
            )}
          </div>
          {release.digital_price_cents ? (
            <div className="mt-6">
              <BuyReleaseButton release={release} />
              <p className="mt-2 text-center text-[0.65rem] text-faint">
                Direct from the label · instant MP3 + WAV download
              </p>
            </div>
          ) : null}
          {release.links.length > 0 && (
            <div className="mt-6">
              <p className="meta mb-4">Listen / Buy</p>
              <div className="flex flex-wrap gap-3">
                {release.links.map((link) => (
                  <a
                    key={link.url + link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border border-line px-5 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-sand transition-all hover:border-gold hover:text-gold"
                  >
                    {link.label} <ExternalLink size={11} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-3">
          <p className="eyebrow mb-3">{release.catalog_number}</p>
          <h1 className="display-lg text-cream">{release.title}</h1>
          <Link
            href={`/artists/${release.artist_slug ?? ""}`}
            className="mt-3 inline-block text-lg text-sand transition-colors hover:text-gold"
          >
            {release.artist_name}
          </Link>

          <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-y border-line py-5">
            <div>
              <p className="meta">Released</p>
              <p className="mt-1 text-sm text-cream">{formatDate(release.release_date)}</p>
            </div>
            {release.genre && (
              <div>
                <p className="meta">Genre</p>
                <p className="mt-1 text-sm text-cream">{release.genre}</p>
              </div>
            )}
            {release.series && (
              <div>
                <p className="meta">Series</p>
                <p className="mt-1 text-sm text-cream">{release.series}</p>
              </div>
            )}
            <div>
              <p className="meta">Label</p>
              <p className="mt-1 text-sm text-cream">Maya Records</p>
            </div>
          </div>

          {release.description && (
            <p className="mt-7 max-w-2xl leading-relaxed text-sand">{release.description}</p>
          )}

          {/* Tracklist */}
          {release.tracks.length > 0 && (
            <div className="mt-10">
              <p className="meta mb-4">Tracklist</p>
              <ol className="divide-y divide-line border-y border-line">
                {release.tracks.map((track) => (
                  <li key={track.id} className="flex items-center gap-4 py-3.5">
                    <span className="w-6 text-right text-sm tabular-nums text-faint">{track.position}</span>
                    {track.preview_url ? (
                      <PreviewButton
                        url={track.preview_url}
                        title={track.title}
                        subtitle={`${release.artist_name} · ${release.catalog_number}`}
                        coverUrl={release.cover_url}
                        size={34}
                      />
                    ) : (
                      <span className="w-[34px]" aria-hidden />
                    )}
                    <span className="flex-1 text-[0.95rem] text-cream">{track.title}</span>
                    {track.bpm && <span className="hidden text-xs text-stone sm:block">{track.bpm} BPM</span>}
                    {track.musical_key && (
                      <span className="hidden w-14 text-xs text-stone sm:block">{track.musical_key}</span>
                    )}
                    <span className="text-xs tabular-nums text-faint">{formatDuration(track.duration_seconds)}</span>
                  </li>
                ))}
              </ol>
              {!release.tracks.some((t) => t.preview_url) && !release.preview_url && (
                <p className="mt-3 text-xs text-faint">Audio previews coming soon — listen on the platforms above.</p>
              )}
            </div>
          )}

          {release.credits && (
            <div className="mt-10">
              <p className="meta mb-3">Credits</p>
              <p className="max-w-xl text-sm leading-relaxed text-stone">{release.credits}</p>
            </div>
          )}

          {release.video_url && (
            <div className="mt-10">
              <p className="meta mb-4">Video</p>
              <div className="aspect-video border border-line bg-surface">
                <iframe
                  src={release.video_url}
                  title={`${release.title} video`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {more.length > 0 && (
        <section className="mt-24 border-t border-line pt-14" aria-label={`More from ${release.artist_name}`}>
          <h2 className="display-md mb-10 text-cream">More from {release.artist_name}</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {more.map((r) => (
              <ReleaseCard key={r.id} release={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
