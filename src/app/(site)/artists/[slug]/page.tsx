import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ReleaseCard } from "@/components/site/ReleaseCard";
import { getArtistBySlug } from "@/lib/data/catalog";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getArtistBySlug(slug);
  if (!result) return { title: "Artist not found" };
  return {
    title: result.artist.name,
    description: result.artist.bio ?? `${result.artist.name} on Maya Records.`,
  };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const result = await getArtistBySlug(slug);
  if (!result) notFound();
  const { artist, releases } = result;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 sm:px-8 md:pt-36">
      <Link
        href="/artists"
        className="mb-10 inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.22em] text-stone transition-colors hover:text-gold"
      >
        <ArrowLeft size={13} /> Artists
      </Link>

      <div className="grid gap-12 md:grid-cols-5 md:gap-16">
        <div className="md:col-span-2">
          <div className="relative aspect-[4/5] overflow-hidden border border-line bg-surface">
            {artist.photo_url && (
              <Image
                src={artist.photo_url}
                alt={artist.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
        <div className="md:col-span-3">
          <p className="eyebrow mb-3">{artist.origin}</p>
          <h1 className="display-lg text-cream">{artist.name}</h1>
          {artist.bio && <p className="mt-6 max-w-2xl leading-relaxed text-sand">{artist.bio}</p>}
          {artist.links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {artist.links.map((link) => (
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
          )}
        </div>
      </div>

      <section className="mt-20 border-t border-line pt-14" aria-label={`Releases by ${artist.name}`}>
        <h2 className="display-md mb-10 text-cream">Releases on Maya</h2>
        {releases.length === 0 ? (
          <p className="text-stone">Catalog entries coming soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {releases.map((r) => (
              <ReleaseCard key={r.id} release={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
