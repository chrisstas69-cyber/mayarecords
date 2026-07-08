"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";

/**
 * Homepage hero. Supports a looping background video (heroVideoUrl) or a
 * dramatic still with slow drift + scroll parallax. Swap the media by setting
 * hero_media_url in admin → Settings (or replace HERO_IMAGE below).
 *
 * TODO: drop in the real "Joeski DJing to a crowd" image/video when provided —
 * pass it via the heroVideoUrl / heroImage props from the homepage.
 */
export function Hero({
  headline = "Music for the floor.",
  subline = "Three decades of New York house lineage. Colombian roots. Maya Records. Resident at Stereo Montréal.",
  heroImage = "/images/live/hero-crowd-1.jpg",
  heroVideoUrl,
}: {
  headline?: string;
  subline?: string;
  heroImage?: string;
  heroVideoUrl?: string | null;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Scroll parallax: media moves slower than the page
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          media.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const isVideo = Boolean(heroVideoUrl);

  return (
    <section ref={sectionRef} className="grain relative flex min-h-[100svh] items-end overflow-hidden bg-night">
      <div ref={mediaRef} className="absolute inset-0 will-change-transform">
        {isVideo ? (
          <video
            className="h-full w-full object-cover opacity-60"
            src={heroVideoUrl!}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
        ) : (
          <div className={`h-full w-full transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}>
            <Image
              src={heroImage}
              alt=""
              fill
              priority
              sizes="100vw"
              onLoad={() => setLoaded(true)}
              className="hero-drift object-cover object-[center_55%] opacity-65"
            />
          </div>
        )}
        {/* Cinematic grading: bottom fade + left column for type */}
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/45 to-night/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-night/85 via-night/25 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-40 sm:px-8 md:pb-32">
        <p className="eyebrow fade-up mb-6">New York · Est. 1991 · Beatport Top 100 · Hï Ibiza</p>
        <h1 className="display-xl fade-up fade-up-1 max-w-4xl text-cream">
          {headline.split(" ").slice(0, -1).join(" ")}{" "}
          <em className="not-italic text-gold">{headline.split(" ").slice(-1)}</em>
        </h1>
        <p className="fade-up fade-up-2 mt-7 max-w-md text-base leading-relaxed text-sand">{subline}</p>

        <div className="fade-up fade-up-3 mt-10 flex flex-wrap gap-4">
          <Link
            href="/releases"
            className="flex items-center gap-3 bg-gold px-8 py-4 text-[0.78rem] font-medium uppercase tracking-[0.22em] text-night transition-colors hover:bg-gold-bright"
          >
            <Play size={14} /> Explore the Catalog
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-3 border border-cream/25 px-8 py-4 text-[0.78rem] uppercase tracking-[0.22em] text-cream transition-colors hover:border-cream/60"
          >
            Bookings <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 hidden flex-col items-center gap-3 opacity-50 md:flex" aria-hidden>
        <div className="h-14 w-px bg-gradient-to-b from-transparent to-gold" />
        <span className="text-[0.58rem] uppercase tracking-[0.4em] text-gold [writing-mode:vertical-rl]">Scroll</span>
      </div>
    </section>
  );
}
