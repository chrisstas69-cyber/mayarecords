begin;

alter table public.site_settings
  add column promotion jsonb not null default '{}'::jsonb
  constraint site_settings_promotion_object check (jsonb_typeof(promotion) = 'object');

commit;
