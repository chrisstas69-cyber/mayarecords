export interface RemixSource {
  id: number;
  artist: string;
  title: string;
  joeski_mix: string;
  label: string;
  release: string;
  date: string;
  traxsource_url: string;
  beatport_url: string | null;
  beatport_status: "verified" | "different_mix" | "not_on_beatport";
}

export interface Remix extends RemixSource {
  cover_url: string | null;
  display_title?: string;
}

export const REMIX_SORTS = {
  newest: "Newest first",
  oldest: "Oldest first",
  title: "Title A–Z",
  artist: "Artist A–Z",
} as const;

export type RemixSort = keyof typeof REMIX_SORTS;

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function selectRemixes(
  remixes: readonly Remix[],
  query: string,
  label: string,
  sort: RemixSort,
): Remix[] {
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return remixes.filter((remix) => {
    if (label && remix.label !== label) return false;
    const text = normalize([remix.artist, remix.title, remix.display_title ?? "", remix.joeski_mix, remix.label, remix.release].join(" "));
    return words.every((word) => text.includes(word));
  }).sort((a, b) => {
    switch (sort) {
      case "oldest": return a.date.localeCompare(b.date) || a.id - b.id;
      case "title": return remixDisplayTitle(a).localeCompare(remixDisplayTitle(b), "en") || a.id - b.id;
      case "artist": return a.artist.localeCompare(b.artist, "en") || a.id - b.id;
      default: return b.date.localeCompare(a.date) || a.id - b.id;
    }
  });
}

export function remixLabels(remixes: readonly Remix[]): string[] {
  return [...new Set(remixes.map((remix) => remix.label))].sort((a, b) => a.localeCompare(b, "en"));
}

export function remixYearRange(remixes: readonly Remix[]): string {
  const years = remixes.map((remix) => remix.date.slice(0, 4)).sort();
  return years.length ? `${years[0]}–${years[years.length - 1]}` : "";
}

export function remixDisplayTitle(remix: RemixSource & { display_title?: string }): string {
  if (remix.display_title) return remix.display_title;
  // The supplied archive explicitly flags this row's missing original title.
  return remix.title.startsWith("(Traxsource lists") ? remix.release : remix.title;
}
