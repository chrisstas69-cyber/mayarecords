export interface MicasaRelease {
  catalogNumber: string;
  artist: string;
  title: string;
  year: number;
  tracks: { title: string }[];
}

export function selectMicasa<T extends MicasaRelease>(releases: readonly T[], query: string, year: string, sort: string): T[] {
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return releases.filter(release => (year === "all" || String(release.year) === year) && terms.every(term => normalize([release.catalogNumber, release.artist, release.title, ...release.tracks.map(track => track.title)].join(" ")).includes(term)))
    .sort((a, b) => sort === "newest" ? b.year - a.year || b.catalogNumber.localeCompare(a.catalogNumber) : a.catalogNumber.localeCompare(b.catalogNumber));
}
