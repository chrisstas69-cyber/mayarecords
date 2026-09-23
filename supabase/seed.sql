-- Starter content for Joeski / Maya Records: mixes + merch.
-- The release catalog (240+ releases, artists, tracks, covers) is NOT here —
-- load it with: python3 scripts/sync-to-supabase.py  (see SETUP-TOMORROW.md)

-- Mixes
insert into public.mixes (title, slug, recorded_on, duration_seconds, description, cover_url, external_url, state, featured) values
  ('Latin Tribal Spearhead — Summer Session', 'latin-tribal-spearhead', '2026-06-01', 4980,
   'The definitive Latin/tribal set — drums up front, built for terraces and open-air floors.', '/images/live/hero-crowd-2.jpg', 'https://soundcloud.com/mayarecordings', 'published', true),
  ('Stereo Montréal — 4AM Journey', 'stereo-montreal-4am', '2026-04-18', 7620,
   'Recorded live during the Stereo residency. The deep end of the range.', '/images/live/hero-crowd-1.jpg', 'https://soundcloud.com/mayarecordings', 'published', false),
  ('Maya Sessions 014 — Pioneer DJ Radio', 'maya-sessions-014', '2026-01-15', 3600,
   'The long-running Maya Sessions podcast — new label material and unreleased edits.', '/images/press/joeski-3.jpg', 'https://soundcloud.com/mayarecordings', 'published', false)
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

