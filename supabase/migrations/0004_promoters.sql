-- Promoter-only EPK: promoters register to unlock /press. The label keeps the list.

create table if not exists public.promoters (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  company text not null,
  role text not null,
  city text not null,
  country text not null,
  phone text,
  website text,
  instagram text,
  event_details text,
  created_at timestamptz not null default now(),
  last_access_at timestamptz
);

alter table public.promoters enable row level security;

-- Rows are written server-side with the service role (bypasses RLS); only admins read the list.
create policy "promoters: admin read" on public.promoters for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Returning-promoter sign-in: confirms an email exists without exposing the table.
create or replace function public.promoter_exists(p_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.promoters where email = lower(p_email));
$$;

grant execute on function public.promoter_exists(text) to anon, authenticated;
