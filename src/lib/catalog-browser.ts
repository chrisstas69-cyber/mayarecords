import type { Release } from "./types";

export const CATALOG_SORTS = {
  "cat-desc": "Cat # — newest first",
  "cat-asc": "Cat # — oldest first",
  "date-desc": "Release date — newest",
  "date-asc": "Release date — oldest",
  "title-asc": "Title A–Z",
  "artist-asc": "Artist A–Z",
} as const;
export type CatalogSort = keyof typeof CATALOG_SORTS;
export interface CatalogFilters {
  query: string;
  genre: string;
  artist: string;
  availability: string;
  savedOnly: boolean;
}
export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  query: "",
  genre: "",
  artist: "",
  availability: "",
  savedOnly: false,
};
const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const number = (release: Release) =>
  /^MAYA\d+$/i.test(release.catalog_number)
    ? Number(release.catalog_number.slice(4))
    : null;

export function selectCatalog(
  releases: Release[],
  filters: CatalogFilters,
  sort: CatalogSort,
  saved: string[],
) {
  const words = normalized(filters.query.trim()).split(/\s+/).filter(Boolean);
  return releases
    .filter((release) => {
      if (filters.genre && release.genre !== filters.genre) return false;
      if (filters.artist && release.artist_name !== filters.artist)
        return false;
      if (filters.savedOnly && !saved.includes(release.id)) return false;
      if (filters.availability === "direct" && !release.digital_price_cents)
        return false;
      if (filters.availability === "preview" && !release.preview_url)
        return false;
      const haystack = normalized(
        [
          release.title,
          release.artist_name,
          release.catalog_number,
          release.genre,
          ...release.tracks.map((track) => track.title),
        ].join(" "),
      );
      return words.every((word) => haystack.includes(word));
    })
    .sort((a, b) => {
      if (sort.startsWith("cat")) {
        const an = number(a),
          bn = number(b);
        if (an === null || bn === null)
          return an === bn
            ? a.title.localeCompare(b.title)
            : an === null
              ? 1
              : -1;
        return sort === "cat-asc" ? an - bn : bn - an;
      }
      if (sort.startsWith("date")) {
        if (!a.release_date || !b.release_date)
          return a.release_date === b.release_date
            ? 0
            : a.release_date
              ? -1
              : 1;
        return sort === "date-asc"
          ? a.release_date.localeCompare(b.release_date)
          : b.release_date.localeCompare(a.release_date);
      }
      return sort === "artist-asc"
        ? (a.artist_name ?? "").localeCompare(b.artist_name ?? "") ||
            a.title.localeCompare(b.title)
        : a.title.localeCompare(b.title);
    });
}

export function catalogPage<T>(rows: T[], page: number, size: number) {
  const pages = size ? Math.max(1, Math.ceil(rows.length / size)) : 1;
  const current = Math.min(Math.max(page, 1), pages);
  return {
    pages,
    current,
    visible: size ? rows.slice((current - 1) * size, current * size) : rows,
  };
}
