import type { Track } from "../types";

export const DEFAULT_TRACK_PRICE_CENTS = 199;

export function trackPrice(track: Pick<Track, "digital_price_cents">): number | null {
  return track.digital_price_cents === undefined ? DEFAULT_TRACK_PRICE_CENTS : track.digital_price_cents;
}

export function privateMasterPath(value: string | null | undefined): string | null {
  if (!value?.startsWith("masters/") || value !== value.trim() || /[%?#:\u0000-\u001f\u007f]/.test(value)) return null;
  const path = value.slice("masters/".length);
  if (!path || path.includes("\\") || path.split("/").some((p) => !p || p === "." || p === "..")) return null;
  return path;
}
