-- Joeski Members: fan mailing list + edit catalog + subscriptions.

create table if not exists public.fans (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

alter table public.fans enable row level security;
-- Anyone can sign up; nobody but admins/service role can read the list.
create policy "fans: public insert" on public.fans for insert to anon, authenticated with check (true);
create policy "fans: admin read" on public.fans for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.edits (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  original_artist text not null,
  drop_date date not null,
  duration_seconds int,
  cover_url text,
  preview_url text,
  wav_path text,   -- path in the private `edits` bucket
  mp3_path text,
  created_at timestamptz not null default now()
);

alter table public.edits enable row level security;
create policy "edits: public read" on public.edits for select using (true);
create policy "edits: admin write" on public.edits for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tier text not null default 'members',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
-- No policies: service role only.

insert into storage.buckets (id, name, public) values ('edits', 'edits', false)
  on conflict (id) do nothing;
