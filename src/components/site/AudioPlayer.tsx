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
import { ExternalLink, Pause, Play, Volume2, X } from "lucide-react";
import Image from "next/image";
import { formatDuration } from "@/lib/utils";
import { canonicalSoundCloudTrack, soundCloudEmbedUrl } from "@/lib/soundcloud";

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
  soundCloudTrack: NowPlaying | null;
  openSoundCloud: (track: NowPlaying) => void;
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
  const requestRef = useRef(0);
  const [soundCloudTrack, setSoundCloudTrack] = useState<NowPlaying | null>(
    null,
  );
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
    const request = ++requestRef.current;
    setSoundCloudTrack(null);
    if (audio.src !== new URL(track.url, window.location.href).href) {
      audio.src = track.url;
      setProgress(0);
      setDuration(0);
    }
    audio
      .play()
      .then(() => {
        if (requestRef.current === request) setIsPlaying(true);
      })
      .catch(() => {
        if (requestRef.current === request) setIsPlaying(false);
      });
    setNowPlaying(track);
  }, []);

  const openSoundCloud = useCallback((track: NowPlaying) => {
    const url = canonicalSoundCloudTrack(track.url);
    if (!url) return;
    ++requestRef.current;
    audioRef.current?.pause();
    setIsPlaying(false);
    setNowPlaying(null);
    setSoundCloudTrack({ ...track, url });
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;
    if (audio.paused) {
      const request = ++requestRef.current;
      audio
        .play()
        .then(() => {
          if (requestRef.current === request) setIsPlaying(true);
        })
        .catch(() => undefined);
    } else {
      ++requestRef.current;
      audio.pause();
      setIsPlaying(false);
    }
  }, [nowPlaying]);

  const close = useCallback(() => {
    ++requestRef.current;
    setSoundCloudTrack(null);
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
    () => ({
      nowPlaying,
      isPlaying,
      play,
      toggle,
      soundCloudTrack,
      openSoundCloud,
    }),
    [nowPlaying, isPlaying, play, toggle, soundCloudTrack, openSoundCloud],
  );
  const timeline = useMemo(
    () => ({ progress, duration, volume, seek, setVolume }),
    [progress, duration, volume, seek, setVolume],
  );

  return (
    <PlayerContext.Provider value={controls}>
      <PlayerTimelineContext.Provider value={timeline}>
        {children}
        {soundCloudTrack && <div className="h-[290px]" aria-hidden="true" />}
        {nowPlaying && (
          <div className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-night-2/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 sm:px-6">
              {nowPlaying.coverUrl && (
                <Image
                  src={nowPlaying.coverUrl}
                  unoptimized={nowPlaying.coverUrl.startsWith("https://")}
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
        {soundCloudTrack && (
          <section
            className="fixed inset-x-0 bottom-0 z-50 border-t border-gold/30 bg-night-2 shadow-[0_-15px_50px_rgba(0,0,0,0.4)]"
            aria-label="SoundCloud mix player"
          >
            <div className="mx-auto max-w-[1600px] px-4 pb-[env(safe-area-inset-bottom)] sm:px-6">
              <div className="flex min-h-14 items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-cream">
                    {soundCloudTrack.title}
                  </p>
                  <p className="text-xs text-sand">Full mix · SoundCloud</p>
                </div>
                <a
                  href={soundCloudTrack.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="catalog-action text-sand"
                  aria-label="Open this mix on SoundCloud"
                >
                  <ExternalLink size={15} />
                  <span className="hidden sm:inline">SoundCloud</span>
                </a>
                <button
                  type="button"
                  onClick={close}
                  className="catalog-action text-sand"
                  aria-label="Close SoundCloud player"
                >
                  <X size={18} />
                </button>
              </div>
              <iframe
                key={soundCloudTrack.url}
                src={soundCloudEmbedUrl(soundCloudTrack.url)!}
                title={`SoundCloud player: ${soundCloudTrack.title}`}
                width="100%"
                height="166"
                allow="autoplay"
                className="mb-3 block w-full border-0"
              />
              <p className="pb-3 text-[0.65rem] text-sand">
                Press play in the SoundCloud player. If playback is unavailable,
                open the mix on SoundCloud.
              </p>
            </div>
          </section>
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
