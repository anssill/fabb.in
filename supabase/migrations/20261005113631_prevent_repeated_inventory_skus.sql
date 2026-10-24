create or replace function public.prevent_duplicate_inventory_sku()
returns trigger language plpgsql security invoker set search_path = public, pg_temp as $$
declare normalized text;
begin
  normalized := nullif(upper(trim(new.sku)), '');
  if normalized is null then return new; end if;
  if tg_op = 'UPDATE' then
    if new.business_id = old.business_id and normalized is not distinct from nullif(upper(trim(old.sku)), '') then return new; end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.business_id::text || ':' || normalized, 0));
  if exists (select 1 from public.items i where i.business_id = new.business_id and upper(trim(i.sku)) = normalized and i.id is distinct from new.id) then
    raise exception 'SKU % is already in use. Choose the next available number.', normalized using errcode = '23505';
  end if;
  new.sku := normalized;
  return new;
end $$;
revoke all on function public.prevent_duplicate_inventory_sku() from public, anon;
grant execute on function public.prevent_duplicate_inventory_sku() to authenticated;
drop trigger if exists inventory_sku_unique on public.items;
create trigger inventory_sku_unique before insert or update of sku, business_id on public.items
for each row execute function public.prevent_duplicate_inventory_sku();
