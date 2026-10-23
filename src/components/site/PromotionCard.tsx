"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Pause, Play, Share2 } from "lucide-react";
import { usePlayer, usePlayerTimeline } from "./AudioPlayer";
import type { ResolvedPromotion } from "@/lib/promotion";
import { formatDate, formatDuration } from "@/lib/utils";

export function PromotionCard({ promotion }: { promotion: ResolvedPromotion }) {
  const player = usePlayer();
  const timeline = usePlayerTimeline();
  const [notice, setNotice] = useState("");
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const release = promotion.release;
  const preview = release?.preview_url;
  const current = Boolean(preview && player.nowPlaying?.url === preview);
  const active = current && player.isPlaying;
  const progress = current ? timeline.progress : 0;
  const duration = current ? timeline.duration : 0;
  const external = promotion.href.startsWith("https://");

  async function share() {
    const url = new URL(promotion.href, window.location.origin).href;
    try {
      if (navigator.share)
        await navigator.share({ title: promotion.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice("Link copied");
      }
    } catch {
      setNotice("Use the release link to share this promotion.");
    }
  }

  return (
    <aside className="catalog-spotlight" aria-label="Featured promotion">
      <div className="relative aspect-square w-28 shrink-0 self-start overflow-hidden border border-line bg-night sm:w-32">
        <Image
          src={
            promotion.image && failedImage !== promotion.image
              ? promotion.image
              : "/images/logos/maya-head-line.png"
          }
          alt={`${promotion.title} artwork`}
          fill
          priority
          sizes="160px"
          unoptimized={Boolean(promotion.image?.startsWith("https://"))}
          onError={() => setFailedImage(promotion.image)}
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.62rem] uppercase tracking-[0.28em] text-gold">
            Spotlight
          </p>
          <span className="border border-gold/35 bg-gold/5 px-2 py-1 text-[0.58rem] uppercase tracking-[0.16em] text-sand">
            {promotion.badge}
          </span>
        </div>
        <p className="mb-1 text-sm text-sand">{promotion.subtitle}</p>
        <h2 className="font-display text-2xl leading-tight text-cream">
          {promotion.title}
        </h2>
        {promotion.description && (
          <p className="mt-2 text-sm leading-relaxed text-sand">
            {promotion.description}
          </p>
        )}
        {release?.release_date && (
          <p className="mt-2 text-xs text-sand">
            {formatDate(release.release_date)}
          </p>
        )}
        {preview && (
          <div className="mt-2 flex items-center gap-2" aria-hidden="true">
            <span className="text-[0.6rem] tabular-nums text-sand">
              {progress ? formatDuration(progress) : "0:00"}
            </span>
            <div className="catalog-wave flex-1">
              {Array.from({ length: 34 }, (_, index) => (
                <i
                  key={index}
                  style={{
                    height: `${7 + ((index * 13 + 5) % 16)}px`,
                    opacity:
                      current && index / 34 <= progress / (duration || 1)
                        ? 1
                        : 0.26,
                  }}
                />
              ))}
            </div>
            <span className="text-[0.6rem] text-sand">Preview</span>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {preview && (
            <button
              type="button"
              className="catalog-action border-gold bg-gold font-medium text-night hover:bg-gold-bright"
              onClick={() =>
                current
                  ? player.toggle()
                  : player.play({
                      url: preview,
                      title: promotion.title,
                      subtitle: promotion.subtitle,
                      coverUrl: promotion.image,
                    })
              }
            >
              {active ? <Pause size={13} /> : <Play size={13} />}{" "}
              {active ? "Pause" : "Listen now"}
            </button>
          )}
          <Link
            href={promotion.href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className={`catalog-action ${preview ? "text-cream" : "border-gold bg-gold text-night hover:bg-gold-bright"}`}
          >
            {promotion.label} <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
          {promotion.secondaryHref && (
            <Link
              href={promotion.secondaryHref}
              target={
                promotion.secondaryHref.startsWith("https://")
                  ? "_blank"
                  : undefined
              }
              rel={
                promotion.secondaryHref.startsWith("https://")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="catalog-action text-cream"
            >
              {promotion.secondaryLabel}
            </Link>
          )}
          <button
            type="button"
            onClick={share}
            className="catalog-action text-sand"
            aria-label={`Share ${promotion.title}`}
          >
            <Share2 size={13} /> <span className="sr-only">Share</span>
          </button>
        </div>
        {notice && (
          <p className="mt-1 text-xs text-sand" role="status">
            {notice}
          </p>
        )}
      </div>
    </aside>
  );
}
