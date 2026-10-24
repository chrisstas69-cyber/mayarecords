"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { usePlayer } from "./AudioPlayer";
import type { Mix } from "@/lib/types";
import { canonicalSoundCloudTrack } from "@/lib/soundcloud";
export function InteriorFooter({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? null : children;
}
export function FeaturedMixPlay({ mix }: { mix: Mix }) {
  const { openSoundCloud, soundCloudTrack } = usePlayer();
  const url = canonicalSoundCloudTrack(mix.external_url);
  if (!url)
    return (
      <Link href="/mixes" className="home-button">
        Browse mixes
      </Link>
    );
  const selected = soundCloudTrack?.url === url;
  return (
    <div className="featured-mix__actions">
      <button
        type="button"
        className="featured-mix__play"
        aria-label={`Listen to ${mix.title}`}
        onClick={() =>
          openSoundCloud({
            url,
            title: mix.title,
            subtitle: "Joeski · DJ Mix",
            coverUrl: mix.cover_url,
          })
        }
      >
        {selected ? <ArrowUpRight size={23} /> : <Play size={23} />}
      </button>
      <span role="status">
        {selected ? "SoundCloud player open below" : "Listen on SoundCloud"}
      </span>
    </div>
  );
}
