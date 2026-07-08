-- Starter catalog for Joeski / Maya Records.
-- Mirrors src/lib/data/seed.ts. Cover URLs point at the app's bundled
-- placeholder sleeves; replace via the admin Media Library.

insert into public.artists (name, slug, origin, bio, photo_url, links) values
  ('Joeski', 'joeski', 'New York City, USA',
   'New York house music since 1991. Founding member of The Chocolate Factory collective, resident of the legendary Roxy Together parties, and founder of Maya Records.',
   '/images/press/joeski-1.jpg',
   '[{"label":"SoundCloud","url":"https://soundcloud.com/mayarecordings"},{"label":"Beatport","url":"https://www.beatport.com/artist/joeski/1638"},{"label":"Resident Advisor","url":"https://ra.co/dj/joeski"}]'::jsonb),
  ('Amir Alexander', 'amir-alexander', 'Detroit, USA', 'Detroit-rooted, globally recognized.', null, '[]'::jsonb),
  ('Angel Alanis', 'angel-alanis', 'Chicago, USA', 'Percussive, relentless, and deeply musical.', null, '[]'::jsonb),
  ('Mikel', 'mikel', 'Barcelona, ES', 'A warm, organic take on tribal rhythms.', null, '[]'::jsonb),
  ('Hector Couto', 'hector-couto', 'Gran Canaria, ES', 'High-energy, sophisticated, always floor-ready.', null, '[]'::jsonb),
  ('Doc Martin', 'doc-martin', 'San Francisco, USA', 'A West Coast underground legend.', null, '[]'::jsonb)
on conflict (slug) do nothing;

with a as (select id, slug from public.artists)
insert into public.releases (title, slug, catalog_number, artist_id, release_date, genre, description, credits, cover_url, links, state, featured)
select r.title, r.slug, r.cat, a.id, r.rdate::date, r.genre, r.descr,
       'Written & produced for Maya Records, New York.',
       '/images/covers/' || r.slug || '.svg',
       '[{"label":"Beatport","url":"https://www.beatport.com/label/maya-records/1035"},{"label":"Traxsource","url":"https://www.traxsource.com/label/447/maya-records"}]'::jsonb,
       'published', r.feat
from (values
  ('Roots & Wire',        'mya-150', 'MYA-150', 'joeski',         '2026-06-12', 'Tribal House', 'Two cuts of raw, drum-forward house built for peak time.', true),
  ('Night Bodega',        'mya-146', 'MYA-146', 'joeski',         '2026-03-20', 'Tech House',   'Late-night corner-store energy: swung hats and a bassline that walks.', false),
  ('Tribute to the Drum', 'mya-142', 'MYA-142', 'joeski',         '2025-11-07', 'Tribal House', 'A percussion suite in three movements.', false),
  ('El Barrio EP',        'mya-138', 'MYA-138', 'hector-couto',   '2025-08-15', 'Tech House',   'Iberian swing on the Maya sound.', false),
  ('Mind Function',       'mya-133', 'MYA-133', 'joeski',         '2025-04-04', 'Deep House',   'A Traxsource Tech House top-10.', false),
  ('Dem Tings',           'mya-127', 'MYA-127', 'joeski',         '2024-12-06', 'Tribal House', 'Joeski with Harry Romero as HR+Ski.', false),
  ('Lessons in Dub',      'mya-119', 'MYA-119', 'joeski',         '2024-07-19', 'Deep House',   'Space, delay, and patience.', false),
  ('Warehouse Theory',    'mya-112', 'MYA-112', 'amir-alexander', '2024-02-09', 'Deep Techno',  'Detroit weight on Maya.', false),
  ('Obatala Rhythms',     'mya-104', 'MYA-104', 'joeski',         '2023-09-01', 'Tribal House', 'Companion to the Crosstown Rebels Tribute to Obatala.', false),
  ('Deep Elements',       'mya-096', 'MYA-096', 'mikel',          '2023-03-17', 'Deep House',   'The Barcelona connection.', false),
  ('Percussion Protocol', 'mya-088', 'MYA-088', 'angel-alanis',   '2022-10-14', 'Tech House',   'Drums through the Chicago filter.', false),
  ('Sacred Ground',       'mya-071', 'MYA-071', 'joeski',         '2021-06-25', 'Deep House',   'Recorded in a single week with Doc Martin on the B-side.', false),
  ('Midnight Transit',    'mya-054', 'MYA-054', 'joeski',         '2019-11-08', 'Tribal House', 'The late train home as a rhythm section.', false),
  ('El Amor',             'mya-032', 'MYA-032', 'joeski',         '2004-05-10', 'Tribal House', 'The DJ Chus collaboration that propelled Maya worldwide.', false),
  ('Hustler''s Revenge',  'mya-001', 'MYA-001', 'joeski',         '2001-09-03', 'Tribal House', 'Where it all started — Maya catalog number one.', false)
) as r(title, slug, cat, artist_slug, rdate, genre, descr, feat)
join a on a.slug = r.artist_slug
on conflict (slug) do nothing;

-- Default digital price so the store has stock (adjust per release in admin)
update public.releases set digital_price_cents = 299 where digital_price_cents is null;

-- Mixes
insert into public.mixes (title, slug, recorded_on, duration_seconds, description, cover_url, external_url, state, featured) values
  ('Latin Tribal Spearhead — Summer Session', 'latin-tribal-spearhead', '2026-06-01', 4980,
   'The definitive Latin/tribal set — drums up front, built for terraces and open-air floors.', '/images/live/hero-crowd-2.jpg', 'https://soundcloud.com/mayarecordings', 'published', true),
  ('Stereo Montréal — 4AM Journey', 'stereo-montreal-4am', '2026-04-18', 7620,
   'Recorded live during the Stereo residency. The deep end of the range.', '/images/live/hero-crowd-1.jpg', 'https://soundcloud.com/mayarecordings', 'published', false),
  ('Maya Sessions 014 — Pioneer DJ Radio', 'maya-sessions-014', '2026-01-15', 3600,
   'The long-running Maya Sessions podcast — new label material and unreleased edits.', '/images/covers/mya-150.svg', 'https://soundcloud.com/mayarecordings', 'published', false)
on conflict (slug) do nothing;

-- Merch
insert into public.products (name, slug, category, description, price_cents, image_url, sizes, sort) values
  ('Maya Records Cap', 'maya-records-cap', 'hat', 'Embroidered Maya head mark. One size, adjustable.', 4500, '/images/logos/maya-head-line.png', '[]'::jsonb, 10),
  ('Joeski Snapback', 'joeski-snapback', 'hat', 'Joeski wordmark, black on black.', 5000, '/images/logos/joeski-logo-3.png', '[]'::jsonb, 20),
  ('Maya Records Tee — Black', 'maya-tee-black', 'apparel', 'Heavyweight cotton, label mark front.', 3800, '/images/logos/maya-white.png', '["S","M","L","XL","XXL"]'::jsonb, 30),
  ('Joeski Classic Tee — Sand', 'joeski-tee-sand', 'apparel', 'Soft-washed sand tone with the Joeski wordmark.', 3800, '/images/logos/joeski-logo-2.png', '["S","M","L","XL"]'::jsonb, 40),
  ('Label Crewneck', 'label-crewneck', 'apparel', 'Heavy fleece crewneck, embroidered Maya head.', 8500, '/images/logos/maya-white.png', '["S","M","L","XL","XXL"]'::jsonb, 50),
  ('MR Tote Bag', 'mr-tote', 'accessory', 'Canvas record tote — fits 25 twelves.', 2800, '/images/logos/maya-black.png', '[]'::jsonb, 60)
on conflict (slug) do nothing;

-- Two tracks per release as a starting point
insert into public.tracks (release_id, position, title, bpm, musical_key)
select id, 1, title, 125, 'A min' from public.releases
on conflict do nothing;
insert into public.tracks (release_id, position, title, bpm, musical_key)
select id, 2, title || ' (Dub)', 124, 'A min' from public.releases
on conflict do nothing;
