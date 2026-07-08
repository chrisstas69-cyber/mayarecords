import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArtists } from "@/lib/data/catalog";
import { Reveal } from "@/components/site/Reveal";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Artists",
  description: "The artists of Maya Records — from New York to Barcelona.",
};

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 sm:px-8 md:pt-40">
      <header className="mb-14">
        <p className="eyebrow mb-3">Maya Records</p>
        <h1 className="display-lg text-cream">Artists</h1>
        <p className="mt-4 max-w-xl text-sand">
          The family — label boss included. Voices from New York, Detroit, Chicago and beyond.
        </p>
      </header>

      <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist, i) => (
          <Reveal key={artist.id} delay={(i % 3) * 80}>
            <Link href={`/artists/${artist.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden border border-line bg-surface">
                {artist.photo_url ? (
                  <Image
                    src={artist.photo_url}
                    alt={artist.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="display-md text-faint">{artist.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="display-sm text-cream transition-colors group-hover:text-gold">{artist.name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-sand">{artist.origin}</p>
                </div>
              </div>
              <p className="meta mt-3">
                {artist.release_count ?? 0} {artist.release_count === 1 ? "release" : "releases"} on Maya
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
