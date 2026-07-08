import type { Artist, Mix, Product, Release } from "@/lib/types";

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

function rel(
  n: number,
  cat: string,
  title: string,
  artistId: string,
  date: string,
  genre: string,
  description: string,
  tracks: Array<[string, number, number | null, string | null]>,
  extra?: Partial<Release>
): Release {
  return {
    id: `seed-release-${n}`,
    title,
    slug: cat.toLowerCase(),
    catalog_number: cat,
    artist_id: artistId,
    artist_name: SEED_ARTISTS.find((a) => a.id === artistId)?.name,
    artist_slug: SEED_ARTISTS.find((a) => a.id === artistId)?.slug,
    release_date: date,
    genre,
    series: null,
    description,
    credits: "Written & produced by " + (SEED_ARTISTS.find((a) => a.id === artistId)?.name ?? "Joeski") + ". Mastered for Maya Records, New York.",
    cover_url: `/images/covers/${cat.toLowerCase()}.svg`,
    preview_url: null,
    video_url: null,
    links: [
      { label: "Beatport", url: "https://www.beatport.com/label/maya-records/1035" },
      { label: "Traxsource", url: "https://www.traxsource.com/label/447/maya-records" },
      { label: "SoundCloud", url: "https://soundcloud.com/mayarecordings" },
    ],
    state: "published",
    featured: false,
    digital_price_cents: 299, // default per-release download price; overridden per release in admin
    tracks: tracks.map(([t, pos, bpm, key], i) => ({
      id: `seed-track-${n}-${i}`,
      release_id: `seed-release-${n}`,
      position: pos,
      title: t,
      duration_seconds: 360 + ((n * 37 + i * 53) % 180),
      bpm,
      musical_key: key,
      isrc: null,
      preview_url: null,
    })),
    ...extra,
  };
}

export const SEED_RELEASES: Release[] = [
  rel(1, "MYA-150", "Roots & Wire", "seed-joeski", "2026-06-12", "Tribal House",
    "Two cuts of raw, drum-forward house built for peak time. The title track pairs a live conga loop recorded in the Brooklyn studio with a sub-heavy groove; Wire Dub strips it back to the skeleton.",
    [["Roots & Wire", 1, 126, "A min"], ["Wire Dub", 2, 126, "A min"]],
    { featured: true }),
  rel(2, "MYA-146", "Night Bodega", "seed-joeski", "2026-03-20", "Tech House",
    "Late-night corner-store energy: swung hats, a bassline that walks, and a vocal chop lifted from the city itself.",
    [["Night Bodega", 1, 127, "F# min"], ["After Hours Mix", 2, 124, "F# min"]]),
  rel(3, "MYA-142", "Tribute to the Drum", "seed-joeski", "2025-11-07", "Tribal House",
    "A percussion suite in three movements — Joeski's love letter to the drum, from batá patterns to warehouse-scale toms.",
    [["Movement I — Call", 1, 125, "D min"], ["Movement II — Response", 2, 126, "D min"], ["Movement III — Release", 3, 128, "G min"]]),
  rel(4, "MYA-138", "El Barrio EP", "seed-hector-couto", "2025-08-15", "Tech House",
    "Hector Couto brings Iberian swing to the Maya sound. Rolling, warm, relentlessly danceable.",
    [["El Barrio", 1, 125, "C min"], ["Calle Ocho", 2, 126, "E min"]]),
  rel(5, "MYA-133", "Mind Function", "seed-joeski", "2025-04-04", "Deep House",
    "A Traxsource Tech House top-10. Hypnotic stab work over a deceptively simple drum bed — a DJ's tool in the best sense.",
    [["Mind Function", 1, 124, "A# min"], ["Function Dub", 2, 124, "A# min"]]),
  rel(6, "MYA-127", "Dem Tings", "seed-joeski", "2024-12-06", "Tribal House",
    "Joeski teams up with Harry Romero as HR+Ski. Two heavyweights, one drum room, no filler.",
    [["Dem Tings (feat. Harry Romero)", 1, 127, "G min"]],
    { credits: "Written & produced by Joeski & Harry Romero (HR+Ski). Mastered for Maya Records, New York." }),
  rel(7, "MYA-119", "Lessons in Dub", "seed-joeski", "2024-07-19", "Deep House",
    "Space, delay, and patience. Originally road-tested for Poker Flat sets, finished for Maya.",
    [["Lessons in Dub", 1, 122, "B min"], ["Lesson Two", 2, 121, "B min"]]),
  rel(8, "MYA-112", "Warehouse Theory", "seed-amir-alexander", "2024-02-09", "Deep Techno",
    "Amir Alexander's Detroit weight on Maya. Concrete-room techno with a soul underneath.",
    [["Warehouse Theory", 1, 130, "C# min"], ["Theory Applied", 2, 131, "C# min"]]),
  rel(9, "MYA-104", "Obatala Rhythms", "seed-joeski", "2023-09-01", "Tribal House",
    "A companion piece to the Crosstown Rebels 'Tribute to Obatala' — dropped by Pete Tong on BBC Radio 1. All three original cuts charted simultaneously on Beatport's Tech House Top 100.",
    [["Obatala Rhythms", 1, 125, "D min"], ["Santo", 2, 126, "F min"], ["Ellegua's Dance", 3, 127, "D min"]]),
  rel(10, "MYA-096", "Deep Elements", "seed-mikel", "2023-03-17", "Deep House",
    "Mikel's warm, organic take on tribal rhythms — the Barcelona connection.",
    [["Deep Elements", 1, 123, "E min"], ["Elemental", 2, 122, "G# min"]]),
  rel(11, "MYA-088", "Percussion Protocol", "seed-angel-alanis", "2022-10-14", "Tech House",
    "Angel Alanis runs the drums through the Chicago filter. Percussive, relentless, deeply musical.",
    [["Percussion Protocol", 1, 129, "A min"], ["Protocol B", 2, 128, "A min"]]),
  rel(12, "MYA-071", "Sacred Ground", "seed-joeski", "2021-06-25", "Deep House",
    "Recorded in a single week back home after a Mexico tour — with Doc Martin jamming on the B-side.",
    [["Sacred Ground", 1, 120, "C min"], ["Sacred Dub (with Doc Martin)", 2, 120, "C min"]]),
  rel(13, "MYA-054", "Midnight Transit", "seed-joeski", "2019-11-08", "Tribal House",
    "The late train home as a rhythm section. A catalog staple that still turns up in sets worldwide.",
    [["Midnight Transit", 1, 124, "G min"], ["Express Mix", 2, 126, "G min"]]),
  rel(14, "MYA-032", "El Amor", "seed-joeski", "2004-05-10", "Tribal House",
    "The DJ Chus collaboration that propelled Maya to the forefront of the U.S. house sound — worldwide acclaim from clubbers and DJs alike.",
    [["El Amor (feat. DJ Chus)", 1, 126, "A min"], ["El Amor (Dub)", 2, 126, "A min"]],
    { credits: "Written & produced by Joeski & DJ Chus. Mastered for Maya Records, New York." }),
  rel(15, "MYA-001", "Hustler's Revenge", "seed-joeski", "2001-09-03", "Tribal House",
    "Where it all started. The first Maya Records catalog number — the label built to release music on its own terms.",
    [["Hustler's Revenge", 1, 125, "E min"], ["Revenge Reprise", 2, 123, "E min"]]),
];

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
    cover_url: "/images/covers/mya-150.svg",
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
