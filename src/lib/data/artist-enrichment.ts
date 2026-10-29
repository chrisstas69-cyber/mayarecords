import enrichment from './artists-enrichment.json';
import type { Artist, LinkItem } from '@/lib/types';

interface ArtistEnrichment {
  slug: string;
  name: string;
  origin: string | null;
  bio: string | null;
  photo_url: string | null;
  links: LinkItem[];
}
const BY_SLUG = new Map((enrichment as ArtistEnrichment[]).map(record => [record.slug, record]));
const empty = (value: string | null | undefined) => !value?.trim();
function safeLink(link: LinkItem): boolean {
  try { return ['https:', 'http:'].includes(new URL(link.url).protocol); } catch { return false; }
}
export function enrichArtist(artist: Artist): Artist {
  const record = BY_SLUG.get(artist.slug);
  if (!record) return artist;
  return {
    ...artist,
    name: empty(artist.name) ? record.name : artist.name,
    origin: empty(artist.origin) ? record.origin : artist.origin,
    bio: empty(artist.bio) ? record.bio : artist.bio,
    photo_url: empty(artist.photo_url) ? record.photo_url : artist.photo_url,
    links: artist.links?.length ? artist.links : record.links.filter(safeLink),
  };
}
