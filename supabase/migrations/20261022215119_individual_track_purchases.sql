begin;

alter table public.tracks
  add column digital_price_cents integer default 199
    check (digital_price_cents is null or digital_price_cents > 0);

alter table public.order_items
  drop constraint order_items_item_type_check,
  add constraint order_items_item_type_check
    check (item_type in ('merch', 'digital_release', 'digital_track')),
  add column track_id uuid references public.tracks (id) on delete restrict,
  add column stripe_line_item_id text,
  add constraint order_items_stripe_line_unique unique (order_id, stripe_line_item_id),
  add constraint order_items_track_shape check (
    (item_type = 'digital_track' and track_id is not null and release_id is not null)
    or (item_type <> 'digital_track' and track_id is null)
  );

alter table public.download_tokens
  add column track_id uuid references public.tracks (id) on delete restrict,
  add column item_type text not null default 'digital_release'
    check (item_type in ('digital_release', 'digital_track')),
  add column master_url text,
  add constraint download_tokens_order_item_unique unique (order_item_id),
  add constraint download_tokens_track_shape check (
    (item_type = 'digital_track' and track_id is not null and nullif(master_url, '') is not null)
    or (item_type = 'digital_release' and track_id is null)
  );

create index order_items_track_idx on public.order_items (track_id) where track_id is not null;
create index download_tokens_track_idx on public.download_tokens (track_id) where track_id is not null;

-- Payment verification and master-path resolution happen on the server before this RPC.
-- Locks also revalidate the catalog here so changes during that round trip cannot leak an EP.
create function public.fulfill_paid_checkout(
  p_stripe_session_id text,
  p_email text,
  p_amount_total_cents integer,
  p_currency text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_item_id uuid;
  v_release_state public.publish_state;
  v_track_release_id uuid;
  v_master text;
  v_path text;
begin
  if nullif(btrim(p_stripe_session_id), '') is null then
    raise exception 'Missing Stripe session ID';
  end if;

  -- The unique session constraint remains the final backstop; this lock serializes retries.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_stripe_session_id, 0));
  select * into v_order from public.orders
    where stripe_session_id = p_stripe_session_id for update;
  if found then
    if v_order.status = 'fulfilled' then
      return v_order.id;
    end if;
    if v_order.status not in ('pending', 'paid') then
      raise exception 'Order cannot be fulfilled in its current state';
    end if;
    -- Never guess how to repair a partial order written by the previous non-atomic code.
    if exists (select 1 from public.order_items where order_id = v_order.id) then
      raise exception 'Incomplete legacy order requires support';
    end if;
  end if;

  if p_amount_total_cents is null or p_amount_total_cents < 0
    or p_currency is null or p_currency !~ '^[a-z]{3}$' then
    raise exception 'Invalid paid order totals';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Expected checkout items';
  end if;
  if jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'Checkout must contain between 1 and 50 items';
  end if;
  if (select count(distinct value->>'stripe_line_item_id') from jsonb_array_elements(p_items))
      <> jsonb_array_length(p_items) then
    raise exception 'Duplicate or missing Stripe line item ID';
  end if;

  if v_order.id is null then
    insert into public.orders (email, stripe_session_id, status, amount_total_cents, currency)
      values (p_email, p_stripe_session_id, 'paid', p_amount_total_cents, p_currency)
      returning * into v_order;
  else
    update public.orders set email = p_email, status = 'paid',
      amount_total_cents = p_amount_total_cents, currency = p_currency
      where id = v_order.id;
  end if;

  for v_item in
    select * from jsonb_to_recordset(p_items) as item(
      stripe_line_item_id text, item_type text, product_id uuid, release_id uuid, track_id uuid,
      title text, variant text, quantity integer, unit_price_cents integer, master_url text
    )
  loop
    if nullif(btrim(v_item.stripe_line_item_id), '') is null
      or v_item.item_type is null or v_item.item_type not in ('merch', 'digital_release', 'digital_track')
      or nullif(btrim(v_item.title), '') is null
      or v_item.quantity is null or v_item.quantity < 1
      or v_item.unit_price_cents is null or v_item.unit_price_cents < 0 then
      raise exception 'Invalid checkout line item';
    end if;

    if v_item.item_type = 'merch' then
      if v_item.product_id is null or v_item.release_id is not null
        or v_item.track_id is not null or v_item.master_url is not null then
        raise exception 'Invalid merchandise item';
      end if;
    else
      if v_item.release_id is null or v_item.product_id is not null or v_item.quantity <> 1 then
        raise exception 'Invalid digital item';
      end if;
      select state, master_url into v_release_state, v_master from public.releases
        where id = v_item.release_id for share;
      if not found or v_release_state <> 'published' then
        raise exception 'Purchased release is not published';
      end if;
      if v_item.item_type = 'digital_track' then
        if v_item.track_id is null then
          raise exception 'Missing purchased track';
        end if;
        select release_id, master_url into v_track_release_id, v_master from public.tracks
          where id = v_item.track_id for share;
        if not found or v_track_release_id <> v_item.release_id then
          raise exception 'Purchased track does not belong to release';
        end if;
      elsif v_item.track_id is not null then
        raise exception 'Release item cannot include a track';
      end if;

      v_path := regexp_replace(v_master, '^masters/', '');
      if v_path is null or v_path = '' or v_master !~ '^masters/' or v_master <> btrim(v_master)
        or v_path ~ '[[:cntrl:]%?#:]' or strpos(v_path, chr(92)) > 0
        or v_path ~ '(^|/)(\.{1,2})?(/|$)'
        or v_item.master_url is distinct from ('masters/' || v_path) then
        raise exception 'Purchased master is missing, unsafe, or changed; retry fulfillment';
      end if;
    end if;

    insert into public.order_items (
      order_id, stripe_line_item_id, item_type, product_id, release_id, track_id,
      title, variant, quantity, unit_price_cents
    ) values (
      v_order.id, v_item.stripe_line_item_id, v_item.item_type, v_item.product_id, v_item.release_id,
      v_item.track_id, v_item.title, v_item.variant, v_item.quantity, v_item.unit_price_cents
    ) returning id into v_item_id;

    if v_item.item_type in ('digital_release', 'digital_track') then
      insert into public.download_tokens (order_item_id, release_id, track_id, item_type, master_url)
        values (v_item_id, v_item.release_id, v_item.track_id, v_item.item_type, v_item.master_url);
    end if;
  end loop;

  update public.orders set status = 'fulfilled' where id = v_order.id;
  return v_order.id;
end;
$$;

revoke all on function public.fulfill_paid_checkout(text, text, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.fulfill_paid_checkout(text, text, integer, text, jsonb)
  to service_role;

commit;
