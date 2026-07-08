-- ============================================================
-- Joeski / Maya Records platform — initial schema
-- Run with: supabase db push   (or paste into the SQL editor)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type publish_state as enum ('draft', 'scheduled', 'published', 'archived');
create type user_role as enum ('admin', 'artist');
create type asset_kind as enum ('cover', 'photo', 'logo', 'press', 'audio', 'video', 'document');
create type import_job_status as enum ('mapping', 'validating', 'review', 'committed', 'cancelled');
create type import_row_status as enum ('pending', 'valid', 'warning', 'error', 'imported', 'skipped');

-- ---------- profiles / roles ----------
-- One row per auth user. Role gates admin abilities via RLS below.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role user_role not null default 'artist',
  artist_id uuid, -- set for artist accounts: which artist they manage
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- ---------- artists ----------
create table public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  origin text,
  bio text,
  photo_url text,
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_artist_fk foreign key (artist_id) references public.artists (id) on delete set null;

-- ---------- releases ----------
create table public.releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  catalog_number text not null,
  -- normalized form enforces uniqueness across "MYA-089" / "mya 089" / "MYA089"
  catalog_number_normalized text generated always as (upper(regexp_replace(catalog_number, '[^a-zA-Z0-9]', '', 'g'))) stored,
  artist_id uuid not null references public.artists (id) on delete restrict,
  release_date date,
  genre text,
  series text,
  description text,
  credits text,
  cover_url text,
  preview_url text,
  video_url text,
  links jsonb not null default '[]'::jsonb,
  state publish_state not null default 'draft',
  featured boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint releases_catalog_unique unique (catalog_number_normalized)
);

create index releases_state_idx on public.releases (state, release_date desc);
create index releases_artist_idx on public.releases (artist_id);

-- ---------- tracks ----------
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases (id) on delete cascade,
  position int not null default 1,
  title text not null,
  duration_seconds int,
  bpm int,
  musical_key text,
  isrc text,
  preview_url text,
  created_at timestamptz not null default now()
);

create index tracks_release_idx on public.tracks (release_id, position);

-- ---------- media assets (covers, photos, press, audio, video, documents) ----------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  kind asset_kind not null,
  title text,
  storage_path text not null,
  public_url text not null,
  mime_type text,
  size_bytes bigint,
  artist_id uuid references public.artists (id) on delete set null,
  release_id uuid references public.releases (id) on delete set null,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index media_kind_idx on public.media_assets (kind, created_at desc);

-- ---------- bulk import ----------
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  status import_job_status not null default 'mapping',
  column_map jsonb not null default '{}'::jsonb,
  row_count int not null default 0,
  error_count int not null default 0,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.import_jobs (id) on delete cascade,
  row_index int not null,
  raw jsonb not null,
  mapped jsonb,
  status import_row_status not null default 'pending',
  issues jsonb not null default '[]'::jsonb,
  release_id uuid references public.releases (id) on delete set null
);

create index import_rows_job_idx on public.import_rows (job_id, row_index);

-- ---------- activity log (audit trail) ----------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references public.profiles (id),
  actor_email text,
  action text not null,          -- e.g. release.publish, release.create, import.commit
  entity_type text not null,     -- release | artist | media | import_job | settings
  entity_id uuid,
  detail text,
  created_at timestamptz not null default now()
);

create index activity_created_idx on public.activity_log (created_at desc);

-- ---------- site settings (single-row CMS-ish config) ----------
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  hero_headline text default 'Music for the floor.',
  hero_subline text default 'Three decades of New York house lineage. Colombian roots. Maya Records. Resident at Stereo Montréal.',
  hero_media_url text,           -- image or video for the homepage hero
  booking_email text,
  demo_email text,
  social_links jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict do nothing;

-- ---------- updated_at maintenance ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger touch_artists before update on public.artists for each row execute function public.touch_updated_at();
create trigger touch_releases before update on public.releases for each row execute function public.touch_updated_at();
create trigger touch_settings before update on public.site_settings for each row execute function public.touch_updated_at();

-- ---------- activity trigger on releases ----------
create or replace function public.log_release_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select email into v_email from public.profiles where id = auth.uid();
  if tg_op = 'INSERT' then
    insert into public.activity_log (actor, actor_email, action, entity_type, entity_id, detail)
    values (auth.uid(), v_email, 'release.create', 'release', new.id, new.title || ' (' || new.catalog_number || ')');
  elsif tg_op = 'UPDATE' and old.state is distinct from new.state then
    insert into public.activity_log (actor, actor_email, action, entity_type, entity_id, detail)
    values (auth.uid(), v_email, 'release.' || new.state, 'release', new.id, new.title || ' → ' || new.state);
  elsif tg_op = 'DELETE' then
    insert into public.activity_log (actor, actor_email, action, entity_type, entity_id, detail)
    values (auth.uid(), v_email, 'release.delete', 'release', old.id, old.title || ' (' || old.catalog_number || ')');
    return old;
  end if;
  return new;
end $$;

create trigger log_releases
  after insert or update or delete on public.releases
  for each row execute function public.log_release_activity();

-- ============================================================
-- Row Level Security
--   Public (anon): read published releases + artists + their tracks/media.
--   Staff (any authenticated profile): full read.
--   Artists: write own artist's releases while in draft.
--   Admins: full write.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.releases enable row level security;
alter table public.tracks enable row level security;
alter table public.media_assets enable row level security;
alter table public.import_jobs enable row level security;
alter table public.import_rows enable row level security;
alter table public.activity_log enable row level security;
alter table public.site_settings enable row level security;

-- profiles
create policy "read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "admin manages profiles" on public.profiles for update using (public.is_admin());

-- artists
create policy "public reads artists" on public.artists for select using (true);
create policy "staff writes artists" on public.artists for insert with check (public.is_admin());
create policy "staff updates artists" on public.artists for update using (
  public.is_admin() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.artist_id = artists.id
  )
);
create policy "admin deletes artists" on public.artists for delete using (public.is_admin());

-- releases
create policy "public reads published releases" on public.releases for select using (
  state = 'published' or public.is_staff()
);
create policy "staff creates releases" on public.releases for insert with check (
  public.is_admin() or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.artist_id = releases.artist_id
  )
);
create policy "staff updates releases" on public.releases for update using (
  public.is_admin() or (
    state in ('draft', 'scheduled') and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.artist_id = releases.artist_id
    )
  )
);
create policy "admin deletes releases" on public.releases for delete using (public.is_admin());

-- tracks follow their release
create policy "public reads tracks of published" on public.tracks for select using (
  public.is_staff() or exists (
    select 1 from public.releases r where r.id = tracks.release_id and r.state = 'published'
  )
);
create policy "staff writes tracks" on public.tracks for all using (
  public.is_admin() or exists (
    select 1 from public.releases r join public.profiles p on p.artist_id = r.artist_id
    where r.id = tracks.release_id and p.id = auth.uid()
  )
) with check (
  public.is_admin() or exists (
    select 1 from public.releases r join public.profiles p on p.artist_id = r.artist_id
    where r.id = tracks.release_id and p.id = auth.uid()
  )
);

-- media assets
create policy "public reads media" on public.media_assets for select using (true);
create policy "staff uploads media" on public.media_assets for insert with check (public.is_staff());
create policy "staff updates own media" on public.media_assets for update using (uploaded_by = auth.uid() or public.is_admin());
create policy "admin deletes media" on public.media_assets for delete using (public.is_admin() or uploaded_by = auth.uid());

-- import jobs/rows: staff only, own jobs unless admin
create policy "staff reads jobs" on public.import_jobs for select using (created_by = auth.uid() or public.is_admin());
create policy "staff creates jobs" on public.import_jobs for insert with check (public.is_staff());
create policy "staff updates jobs" on public.import_jobs for update using (created_by = auth.uid() or public.is_admin());
create policy "staff deletes jobs" on public.import_jobs for delete using (created_by = auth.uid() or public.is_admin());
create policy "staff reads rows" on public.import_rows for select using (
  exists (select 1 from public.import_jobs j where j.id = import_rows.job_id and (j.created_by = auth.uid() or public.is_admin()))
);
create policy "staff writes rows" on public.import_rows for all using (
  exists (select 1 from public.import_jobs j where j.id = import_rows.job_id and (j.created_by = auth.uid() or public.is_admin()))
) with check (
  exists (select 1 from public.import_jobs j where j.id = import_rows.job_id and (j.created_by = auth.uid() or public.is_admin()))
);

-- activity log: staff read, inserts happen via security-definer trigger
create policy "staff reads activity" on public.activity_log for select using (public.is_staff());

-- settings: public read (hero copy etc.), admin write
create policy "public reads settings" on public.site_settings for select using (true);
create policy "admin updates settings" on public.site_settings for update using (public.is_admin());

-- ============================================================
-- Storage buckets
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('covers', 'covers', true),
  ('audio', 'audio', true),
  ('press', 'press', true),
  ('video', 'video', true)
on conflict (id) do nothing;

create policy "public reads storage" on storage.objects for select using (
  bucket_id in ('covers', 'audio', 'press', 'video')
);
create policy "staff uploads storage" on storage.objects for insert with check (
  bucket_id in ('covers', 'audio', 'press', 'video') and auth.uid() is not null
);
create policy "staff updates storage" on storage.objects for update using (
  bucket_id in ('covers', 'audio', 'press', 'video') and auth.uid() is not null
);
create policy "staff deletes storage" on storage.objects for delete using (
  bucket_id in ('covers', 'audio', 'press', 'video') and auth.uid() is not null
);

-- ============================================================
-- After running this migration:
-- 1. Create your admin user in Authentication → Users (or sign up via /admin/login).
-- 2. Promote it:  update public.profiles set role = 'admin' where email = 'you@example.com';
-- 3. Optionally run supabase/seed.sql for the starter catalog.
-- ============================================================
