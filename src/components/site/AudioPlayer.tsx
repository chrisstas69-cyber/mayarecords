"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pause, Play, Volume2, X } from "lucide-react";
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

interface PlayerTimelineValue {
  progress: number;
  duration: number;
  volume: number;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);
const PlayerTimelineContext = createContext<PlayerTimelineValue | null>(null);

export function usePlayerTimeline() {
  const ctx = useContext(PlayerTimelineContext);
  if (!ctx)
    throw new Error("usePlayerTimeline must be used inside <PlayerProvider>");
  return ctx;
}

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
  const [volume, updateVolume] = useState(1);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
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
    if (audio.src !== new URL(track.url, window.location.href).href) {
      audio.src = track.url;
      setProgress(0);
      setDuration(0);
    }
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
    setNowPlaying(track);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => undefined);
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

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || !Number.isFinite(seconds))
      return;
    const position = Math.min(Math.max(0, seconds), audio.duration);
    audio.currentTime = position;
    setProgress(position);
  }, []);

  const setVolume = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.min(1, Math.max(0, value));
    if (audioRef.current) audioRef.current.volume = next;
    updateVolume(next);
  }, []);

  const controls = useMemo(
    () => ({ nowPlaying, isPlaying, play, toggle }),
    [nowPlaying, isPlaying, play, toggle],
  );
  const timeline = useMemo(
    () => ({ progress, duration, volume, seek, setVolume }),
    [progress, duration, volume, seek, setVolume],
  );

  return (
    <PlayerContext.Provider value={controls}>
      <PlayerTimelineContext.Provider value={timeline}>
        {children}
        {nowPlaying && (
          <div className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-night-2/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6">
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
                {isPlaying ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} className="ml-0.5" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-cream">
                  {nowPlaying.title}
                </p>
                <p className="truncate text-xs text-stone">
                  {nowPlaying.subtitle}
                </p>
              </div>
              <div className="hidden flex-1 items-center gap-3 sm:flex">
                <span className="w-10 text-right text-xs tabular-nums text-stone">
                  {progress > 0 ? formatDuration(Math.floor(progress)) : "0:00"}
                </span>
                <div className="relative flex-1">
                  <div className="catalog-wave mb-1" aria-hidden="true">
                    {Array.from({ length: 48 }, (_, index) => (
                      <i
                        key={index}
                        style={{
                          height: `${20 + ((index * 17 + 11) % 30)}px`,
                          opacity:
                            index / 48 <= progress / (duration || 1) ? 1 : 0.22,
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    className="scrub block w-full"
                    min={0}
                    max={duration || 1}
                    step={0.5}
                    value={progress}
                    aria-label="Seek"
                    onChange={(e) => seek(Number(e.target.value))}
                  />
                </div>
                <span className="w-10 text-xs tabular-nums text-stone">
                  {formatDuration(duration)}
                </span>
              </div>
              <label className="hidden items-center gap-2 lg:flex">
                <Volume2 size={16} className="text-sand" aria-hidden="true" />
                <span className="sr-only">Preview volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="scrub w-20"
                />
              </label>
              <button
                onClick={close}
                aria-label="Close player"
                className="flex h-11 w-11 shrink-0 items-center justify-center text-sand transition-colors hover:text-cream"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </PlayerTimelineContext.Provider>
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
      aria-label={
        isCurrent && isPlaying ? `Pause ${title}` : `Play preview of ${title}`
      }
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCurrent) toggle();
        else play({ url, title, subtitle, coverUrl });
      }}
      className="flex shrink-0 items-center justify-center rounded-full border border-gold/60 text-gold transition-all hover:border-gold hover:bg-gold hover:text-night"
      style={{ width: size, height: size }}
    >
      {isCurrent && isPlaying ? (
        <Pause size={size * 0.38} />
      ) : (
        <Play size={size * 0.38} className="ml-0.5" />
      )}
    </button>
  );
}
