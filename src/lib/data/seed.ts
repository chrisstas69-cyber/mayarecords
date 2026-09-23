import type { Artist, Mix, Product, Release } from "@/lib/types";
import { ARCHIVE_RELEASES } from "./archive.generated";
import { ARCHIVE_ARTISTS } from "./artists.generated";

/**
 * Seed catalog — real Joeski / Maya Records history (bio-sourced) with
 * representative catalog entries. Used as public-site content until the
 * Supabase catalog is populated, and by supabase/seed.sql as the initial import.
 *
 * TODO: replace cover SVGs with real sleeve artwork and add real preview audio
 * via the admin Media Library once Supabase storage is connected.
 */

export const JOESKI_BIO_SHORT =
  "Change is inevitable, and nowhere is this more prevalent than in dance music. Analog gives way to digital, trends come and go — yet New York's Joeski remains at the top of his game, three decades deep as one of house music's most sought-after DJs, producers and remixers.";

export const JOESKI_BIO_LONG = [
  "Joeski's trajectory traces back to 1991, when he burst onto the New York house scene as a founding member of The Chocolate Factory DJ collective — delighting crowds at Limelight, Tunnel, Palladium and NASA, helping turn Save The Robots into an NYC afterhours institution, and earning his first residency at the Together parties at the legendary Roxy alongside Danny Tenaglia, Louie Vega and Roger Sanchez.",
  "In the late '90s he added production to his repertoire, building his own studio and mastering the craft. By 2000 he was on the charts with hit after hit on Electrik Soul, Siesta, Chez and Camouflage, emerging as one of the most in-demand DJs, remixers and producers in the scene.",
  "In 2001 he launched Maya Records. Releases like Hustler's Revenge and the DJ Chus collaboration El Amor propelled the label to the forefront of the U.S. house sound that became a global phenomenon. Production and remix credits followed for NRK, Ministry of Sound, Defected, Bedrock, Nervous, Cajual and KMS — plus releases on Crosstown Rebels, Relief and Poker Flat, with support from Pete Tong on BBC Radio 1 and a featured slot on John Digweed's Transitions.",
  "Maya Records continues a steady output of quality tribal, deep and tech house — fixtures on the Beatport and Traxsource charts — while Joeski's touring schedule keeps him headlining clubs from Brooklyn to Helsinki.",
];

export const SEED_ARTISTS: Artist[] = [
  {
    id: "seed-joeski",
    name: "Joeski",
    slug: "joeski",
    origin: "New York City, USA",
    bio: JOESKI_BIO_SHORT,
    photo_url: "/images/press/joeski-1.jpg",
    links: [
      { label: "SoundCloud", url: "https://soundcloud.com/mayarecordings" },
      { label: "Beatport", url: "https://www.beatport.com/artist/joeski/1638" },
      { label: "Resident Advisor", url: "https://ra.co/dj/joeski" },
      { label: "Instagram", url: "https://instagram.com/djjoeski" },
    ],
  },
  {
    id: "seed-amir-alexander",
    name: "Amir Alexander",
    slug: "amir-alexander",
    origin: "Detroit, USA",
    bio: "Detroit-rooted, globally recognized. His productions carry the weight of the Motor City's industrial heritage into deep, soulful territory.",
    photo_url: null,
    links: [],
  },
  {
    id: "seed-angel-alanis",
    name: "Angel Alanis",
    slug: "angel-alanis",
    origin: "Chicago, USA",
    bio: "Chicago native. Percussive, relentless, and deeply musical — a natural fit for the Maya catalog.",
    photo_url: null,
    links: [],
  },
  {
    id: "seed-mikel",
    name: "Mikel",
    slug: "mikel",
    origin: "Barcelona, ES",
    bio: "Barcelona-based producer with a warm, organic take on tribal rhythms. A rising voice on the label.",
    photo_url: null,
    links: [],
  },
  {
    id: "seed-hector-couto",
    name: "Hector Couto",
    slug: "hector-couto",
    origin: "Gran Canaria, ES",
    bio: "High-energy, sophisticated, always floor-ready — a unique Iberian edge on the Maya sound.",
    photo_url: null,
    links: [],
  },
  {
    id: "seed-doc-martin",
    name: "Doc Martin",
    slug: "doc-martin",
    origin: "San Francisco, USA",
    bio: "A West Coast underground legend and longtime Joeski collaborator.",
    photo_url: null,
    links: [],
  },
];

// Every artist seen on a Maya release (Discogs + the local archive), minus the
// hand-written bios above. Joeski himself is excluded — he already has one.
const KNOWN_SLUGS = new Set(SEED_ARTISTS.map((a) => a.slug));
for (const a of ARCHIVE_ARTISTS) {
  if (KNOWN_SLUGS.has(a.slug)) continue;
  KNOWN_SLUGS.add(a.slug);
  SEED_ARTISTS.push({ id: `archive-artist-${a.slug}`, name: a.name, slug: a.slug, origin: null, bio: null, photo_url: null, links: [] });
}


const FALLBACK_COVER = "/images/logos/maya-head-line.png";
const FEATURED_CAT = "MAYA188";

/** Real Maya catalog, generated from the label archive by scripts/import-archive.py. */
export const SEED_RELEASES: Release[] = [...ARCHIVE_RELEASES]
  .sort((a, b) => b.catalog_number.localeCompare(a.catalog_number))
  .map((r) => {
    const id = `archive-${r.catalog_number.toLowerCase()}`;
    const artistId = SEED_ARTISTS.find((a) => a.slug === r.artist_slug)?.id ?? "seed-joeski";
    return {
      id,
      title: r.title,
      slug: r.catalog_number.toLowerCase(),
      catalog_number: r.catalog_number,
      artist_id: artistId,
      artist_name: r.artist_name,
      artist_slug: r.artist_slug === "joeski" ? "joeski" : r.artist_slug,
      release_date: "release_date" in r ? r.release_date : null,
      genre: "genre" in r ? r.genre : null,
      series: null,
      description: "description" in r ? (r.description as string) : null,
      credits: null,
      cover_url: r.cover_url ?? FALLBACK_COVER,
      preview_url: (r.tracks as ReadonlyArray<{ preview_url?: string | null }>).find((t) => t.preview_url)?.preview_url ?? null,
      video_url: null,
      links: [
        { label: "Beatport", url: "https://www.beatport.com/label/maya-records/1035" },
        { label: "Traxsource", url: "https://www.traxsource.com/label/447/maya-records" },
        ...("discogs_url" in r && r.discogs_url ? [{ label: "Discogs", url: r.discogs_url }] : []),
      ],
      state: "published",
      featured: r.catalog_number === FEATURED_CAT,
      digital_price_cents: "digital_price_cents" in r ? (r.digital_price_cents as number | null) : null,
      tracks: r.tracks.map((t) => {
        const track = t as {
          position: number;
          title: string;
          duration_seconds?: number | null;
          preview_url?: string | null;
          isrc?: string | null;
        };
        return {
          id: `${id}-${track.position}`,
          release_id: id,
          position: track.position,
          title: track.title,
          duration_seconds: track.duration_seconds ?? null,
          bpm: null,
          musical_key: null,
          isrc: track.isrc ?? null,
          preview_url: track.preview_url ?? null,
        };
      }),
    } satisfies Release;
  });

export const SEED_LIVE_PHOTOS = [
  { src: "/images/live/hero-crowd-1.jpg", caption: "Joeski live — packed courtyard show" },
  { src: "/images/live/hero-crowd-2.jpg", caption: "JOESKI — projection over the crowd" },
];

export const SEED_PRESS_PHOTOS = [
  { src: "/images/press/joeski-1.jpg", caption: "Joeski — press portrait, B&W", w: 1600, h: 1065 },
  { src: "/images/press/joeski-2.jpg", caption: "Joeski — press portrait", w: 1600, h: 1065 },
  { src: "/images/press/joeski-3.jpg", caption: "Joeski — press portrait", w: 1600, h: 1069 },
  { src: "/images/press/joeski-4.jpg", caption: "Joeski — press portrait", w: 1065, h: 1600 },
  { src: "/images/press/joeski-2-b-w.jpg", caption: "Joeski — press portrait, B&W", w: 1600, h: 1065 },
  { src: "/images/press/joeski-5.jpg", caption: "Joeski — press portrait", w: 1064, h: 1600 },
];

export const SEED_FILM_PHOTOS = Array.from({ length: 16 }, (_, i) => ({
  src: `/images/film/film-${String(i + 1).padStart(2, "0")}.jpg`,
  caption: "Joeski shot on film by Andreas Hofweber",
  portrait: ![0, 1, 5].includes(i),
}));

/**
 * Seed mixes — real series from the bio/blueprint (Maya Sessions on Pioneer DJ
 * Radio; the "Stereo 4am" depth proof; the Latin/tribal spearhead set).
 * audio_url stays null until recordings are uploaded via admin → Mixes.
 */
export const SEED_MIXES: Mix[] = [
  {
    id: "seed-mix-1",
    title: "Latin Tribal Spearhead — Summer Session",
    slug: "latin-tribal-spearhead",
    recorded_on: "2026-06-01",
    duration_seconds: 4980,
    description:
      "The definitive Latin/tribal set — drums up front, built for terraces and open-air floors from Barcelona to Medellín.",
    cover_url: "/images/live/hero-crowd-2.jpg",
    audio_url: null,
    external_url: "https://soundcloud.com/mayarecordings",
    tracklist: null,
    state: "published",
    featured: true,
  },
  {
    id: "seed-mix-2",
    title: "Stereo Montréal — 4AM Journey",
    slug: "stereo-montreal-4am",
    recorded_on: "2026-04-18",
    duration_seconds: 7620,
    description:
      "Recorded live during the Stereo residency. The deep end of the range — patient, hypnotic, after-hours music for a room that never wants to leave.",
    cover_url: "/images/live/hero-crowd-1.jpg",
    audio_url: null,
    external_url: "https://soundcloud.com/mayarecordings",
    tracklist: null,
    state: "published",
    featured: false,
  },
  {
    id: "seed-mix-3",
    title: "Maya Sessions 014 — Pioneer DJ Radio",
    slug: "maya-sessions-014",
    recorded_on: "2026-01-15",
    duration_seconds: 3600,
    description:
      "The long-running Maya Sessions podcast — new label material, unreleased edits, and the records shaping the next quarter of the catalog.",
    cover_url: "/images/press/joeski-3.jpg",
    audio_url: null,
    external_url: "https://soundcloud.com/mayarecordings",
    tracklist: null,
    state: "published",
    featured: false,
  },
];

/** Seed merch — carried over from the original site concept. TODO: product photography. */
export const SEED_PRODUCTS: Product[] = [
  { id: "seed-prod-1", name: "Maya Records Cap", slug: "maya-records-cap", category: "hat", description: "Embroidered Maya head mark. One size, adjustable.", price_cents: 4500, currency: "usd", image_url: "/images/logos/maya-head-line.png", sizes: [], active: true, sort: 10 },
  { id: "seed-prod-2", name: "Joeski Snapback", slug: "joeski-snapback", category: "hat", description: "Joeski wordmark, black on black.", price_cents: 5000, currency: "usd", image_url: "/images/logos/joeski-logo-3.png", sizes: [], active: true, sort: 20 },
  { id: "seed-prod-3", name: "Maya Records Tee — Black", slug: "maya-tee-black", category: "apparel", description: "Heavyweight cotton, label mark front, catalog list back.", price_cents: 3800, currency: "usd", image_url: "/images/logos/maya-white.png", sizes: ["S", "M", "L", "XL", "XXL"], active: true, sort: 30 },
  { id: "seed-prod-4", name: "Joeski Classic Tee — Sand", slug: "joeski-tee-sand", category: "apparel", description: "Soft-washed sand tone with the Joeski wordmark.", price_cents: 3800, currency: "usd", image_url: "/images/logos/joeski-logo-2.png", sizes: ["S", "M", "L", "XL"], active: true, sort: 40 },
  { id: "seed-prod-5", name: "Label Crewneck", slug: "label-crewneck", category: "apparel", description: "Heavy fleece crewneck, embroidered Maya head.", price_cents: 8500, currency: "usd", image_url: "/images/logos/maya-white.png", sizes: ["S", "M", "L", "XL", "XXL"], active: true, sort: 50 },
  { id: "seed-prod-6", name: "MR Tote Bag", slug: "mr-tote", category: "accessory", description: "Canvas record tote — fits 25 twelves.", price_cents: 2800, currency: "usd", image_url: "/images/logos/maya-black.png", sizes: [], active: true, sort: 60 },
];

export const BOOKING = {
  agency: "Armigé Agency",
  agencyUrl: "https://www.armige.com",
  email: "bookings@armige.com", // TODO: confirm booking email with Armigé
  demos: "demos@mayarecords.com", // TODO: confirm demo submission address
};
