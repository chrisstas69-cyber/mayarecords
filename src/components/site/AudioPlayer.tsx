"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import Image from "next/image";
import { formatDuration } from "@/lib/utils";

interface NowPlaying {
  url: string;
  title: string;
  subtitle: string;
  coverUrl?: string | null;
}

interface PlayerContextValue {
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  play: (track: NowPlaying) => void;
  toggle: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

/** Site-wide audio preview player: context + persistent bottom bar. */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const play = useCallback((track: NowPlaying) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.src !== track.url) {
      audio.src = track.url;
      setProgress(0);
    }
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    setNowPlaying(track);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    if (audio.paused) {
      audio.play().then(() => setIsPlaying(true)).catch(() => undefined);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [nowPlaying]);

  const close = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setNowPlaying(null);
  }, []);

  return (
    <PlayerContext.Provider value={{ nowPlaying, isPlaying, play, toggle }}>
      {children}
      {nowPlaying && (
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-night-2/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
            {nowPlaying.coverUrl && (
              <Image
                src={nowPlaying.coverUrl}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 object-cover"
              />
            )}
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pause preview" : "Play preview"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold text-gold transition-colors hover:bg-gold hover:text-night"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-cream">{nowPlaying.title}</p>
              <p className="truncate text-xs text-stone">{nowPlaying.subtitle}</p>
            </div>
            <div className="hidden flex-1 items-center gap-3 sm:flex">
              <span className="w-10 text-right text-xs tabular-nums text-stone">{formatDuration(progress)}</span>
              <input
                type="range"
                className="scrub flex-1"
                min={0}
                max={duration || 1}
                step={0.5}
                value={progress}
                aria-label="Seek"
                onChange={(e) => {
                  const t = Number(e.target.value);
                  if (audioRef.current) audioRef.current.currentTime = t;
                  setProgress(t);
                }}
              />
              <span className="w-10 text-xs tabular-nums text-stone">{formatDuration(duration)}</span>
            </div>
            <button onClick={close} aria-label="Close player" className="text-stone transition-colors hover:text-cream">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}

/** Small play button that feeds the global player. Renders nothing without a preview URL. */
export function PreviewButton({
  url,
  title,
  subtitle,
  coverUrl,
  size = 40,
}: NowPlaying & { size?: number }) {
  const { play, toggle, nowPlaying, isPlaying } = usePlayer();
  const isCurrent = nowPlaying?.url === url;
  return (
    <button
      aria-label={isCurrent && isPlaying ? `Pause ${title}` : `Play preview of ${title}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCurrent) toggle();
        else play({ url, title, subtitle, coverUrl });
      }}
      className="flex shrink-0 items-center justify-center rounded-full border border-gold/60 text-gold transition-all hover:border-gold hover:bg-gold hover:text-night"
      style={{ width: size, height: size }}
    >
      {isCurrent && isPlaying ? <Pause size={size * 0.38} /> : <Play size={size * 0.38} className="ml-0.5" />}
    </button>
  );
}
