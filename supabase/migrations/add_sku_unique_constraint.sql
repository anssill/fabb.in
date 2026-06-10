do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'items_sku_business_unique'
  ) then
    alter table public.items
      add constraint items_sku_business_unique unique (sku, business_id);
  end if;
end $$;
