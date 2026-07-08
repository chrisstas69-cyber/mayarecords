import Image from "next/image";
import Link from "next/link";
import type { Release } from "@/lib/types";
import { formatYear } from "@/lib/utils";
import { PreviewButton } from "./AudioPlayer";

export function ReleaseCard({ release, priority = false }: { release: Release; priority?: boolean }) {
  return (
    <Link href={`/releases/${release.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden border border-line bg-surface">
        {release.cover_url ? (
          <Image
            src={release.cover_url}
            alt={`${release.title} cover art`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-faint">
            <span className="display-sm">{release.catalog_number}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {release.preview_url && (
          <div className="absolute bottom-3 right-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <PreviewButton
              url={release.preview_url}
              title={release.title}
              subtitle={`${release.artist_name ?? ""} · ${release.catalog_number}`}
              coverUrl={release.cover_url}
            />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-medium text-cream transition-colors group-hover:text-gold">{release.title}</h3>
          <p className="truncate text-sm text-stone">{release.artist_name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="meta">{release.catalog_number}</p>
          <p className="text-xs text-faint">{formatYear(release.release_date)}</p>
        </div>
      </div>
    </Link>
  );
}
