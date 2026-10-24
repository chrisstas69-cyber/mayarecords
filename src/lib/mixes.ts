import type { Mix } from "./types";

export type MixSort = "newest" | "oldest" | "title" | "longest";
export type MixLength = "" | "short" | "medium" | "long";

export function mixDate(mix: Mix) {
  return mix.recorded_on || mix.published_on || mix.archive_date || "";
}

export function mixDateLabel(mix: Mix) {
  return mix.recorded_on
    ? "Recorded"
    : mix.published_on
      ? "Published"
      : "Archive date";
}

export function mixDuration(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds) || seconds < 0)
    return "Length unavailable";
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
    : `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function selectMixes(
  mixes: Mix[],
  query = "",
  year = "",
  length: MixLength = "",
  sort: MixSort = "newest",
) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return mixes
    .filter((mix) => {
      const text = normalize(
        `${mix.title} ${mix.description || ""} ${mix.tracklist || ""}`,
      );
      const seconds = mix.duration_seconds;
      return (
        words.every((word) => text.includes(word)) &&
        (!year || mixDate(mix).slice(0, 4) === year) &&
        (!length ||
          (seconds != null &&
            (length === "short"
              ? seconds < 3600
              : length === "medium"
                ? seconds >= 3600 && seconds < 7200
                : seconds >= 7200)))
      );
    })
    .sort((a, b) => {
      const tie =
        a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id);
      if (sort === "title") return tie;
      if (sort === "longest")
        return (b.duration_seconds || 0) - (a.duration_seconds || 0) || tie;
      return (
        (sort === "oldest"
          ? mixDate(a).localeCompare(mixDate(b))
          : mixDate(b).localeCompare(mixDate(a))) || tie
      );
    });
}

export function mixYears(mixes: Mix[]) {
  return [
    ...new Set(mixes.map((mix) => mixDate(mix).slice(0, 4)).filter(Boolean)),
  ]
    .sort()
    .reverse();
}
