-- ============================================================
-- Commerce + Mixes: store (merch + digital MP3/WAV), DJ mixes
-- Run after 0001_init.sql
-- ============================================================

-- ---------- mixes ----------
create table public.mixes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  recorded_on date,
  duration_seconds int,
  description text,
  cover_url text,
  audio_url text,           -- hosted recording (mixes bucket) → in-site player
  external_url text,        -- SoundCloud/Mixcloud fallback or canonical link
  tracklist text,           -- freeform, one line per track
  state publish_state not null default 'draft',
  featured boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mixes_state_idx on public.mixes (state, recorded_on desc);
create trigger touch_mixes before update on public.mixes for each row execute function public.touch_updated_at();

-- ---------- merch products ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null default 'apparel',   -- apparel | hat | accessory | vinyl
  description text,
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'usd',
  image_url text,
  sizes jsonb not null default '[]'::jsonb,   -- e.g. ["S","M","L","XL"]; empty = one-size
  active boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_products before update on public.products for each row execute function public.touch_updated_at();

-- ---------- digital sales on releases ----------
alter table public.releases
  add column digital_price_cents int check (digital_price_cents is null or digital_price_cents >= 0),
  add column master_url text;  -- storage path in the PRIVATE masters bucket (wav/zip). Never public.

alter table public.tracks
  add column master_url text;

-- ---------- orders ----------
create type order_status as enum ('pending', 'paid', 'fulfilled', 'refunded', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  email text,
  stripe_session_id text unique,
  status order_status not null default 'pending',
  amount_total_cents int,
  currency text default 'usd',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger touch_orders before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_type text not null check (item_type in ('merch', 'digital_release')),
  product_id uuid references public.products (id) on delete set null,
  release_id uuid references public.releases (id) on delete set null,
  title text not null,          -- denormalized for order history
  variant text,                 -- size for merch, format note for digital
  quantity int not null default 1 check (quantity > 0),
  unit_price_cents int not null
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------- digital delivery tokens ----------
create table public.download_tokens (
  token uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_downloads int not null default 5,
  download_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.mixes enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.download_tokens enable row level security;

-- mixes: public reads published, staff manages
create policy "public reads published mixes" on public.mixes for select using (
  state = 'published' or public.is_staff()
);
create policy "staff writes mixes" on public.mixes for all using (public.is_staff()) with check (public.is_staff());

-- products: public reads active, admin manages
create policy "public reads active products" on public.products for select using (active or public.is_staff());
create policy "admin writes products" on public.products for all using (public.is_admin()) with check (public.is_admin());

-- orders & tokens: created/fulfilled by the server (service role bypasses RLS);
-- staff can read for support.
create policy "staff reads orders" on public.orders for select using (public.is_staff());
create policy "staff reads order items" on public.order_items for select using (public.is_staff());
create policy "staff reads tokens" on public.download_tokens for select using (public.is_staff());

-- ============================================================
-- Storage: public mixes bucket, PRIVATE masters bucket
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('mixes', 'mixes', true),
  ('masters', 'masters', false)
on conflict (id) do nothing;

create policy "public reads mixes bucket" on storage.objects for select using (bucket_id = 'mixes');
create policy "staff writes mixes bucket" on storage.objects for insert with check (bucket_id = 'mixes' and auth.uid() is not null);
create policy "staff updates mixes bucket" on storage.objects for update using (bucket_id = 'mixes' and auth.uid() is not null);
create policy "staff deletes mixes bucket" on storage.objects for delete using (bucket_id = 'mixes' and auth.uid() is not null);

-- masters: NO public read policy. Staff uploads; buyers get short-lived signed
-- URLs minted by the server (service role) through /api/download/[token].
create policy "staff reads masters" on storage.objects for select using (bucket_id = 'masters' and auth.uid() is not null);
create policy "staff writes masters" on storage.objects for insert with check (bucket_id = 'masters' and auth.uid() is not null);
create policy "staff deletes masters" on storage.objects for delete using (bucket_id = 'masters' and auth.uid() is not null);
