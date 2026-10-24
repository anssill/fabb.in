-- Edit the complete product list atomically. Existing line IDs and daily rates survive.
create function public.update_booking_items(
  p_booking_id uuid, p_items jsonb, p_expected_updated_at timestamptz,
  p_overbook_reason text default null
) returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  b public.bookings%rowtype; old_line public.booking_items%rowtype;
  v public.item_variants%rowtype; product public.items%rowtype;
  line jsonb; lock_id text; qty integer; rate numeric; disc numeric; extra integer; shortage integer;
  gross numeric; discounts numeric; legacy_discount numeric; paid numeric; total numeric; tax numeric;
  overbook boolean := false; before_items jsonb;
begin
  select * into b from public.bookings where id=p_booking_id for update;
  if b.id is null or auth.uid() is null or not private.has_business_permission(b.business_id,'manage_bookings')
    or not private.can_access_branch(b.business_id,b.branch_id) then raise exception 'Booking permission required'; end if;
  if b.status not in ('draft','quote','hold','confirmed') then raise exception 'Products can only be changed before pickup. Item prices can still be edited separately.'; end if;
  if p_expected_updated_at is distinct from b.updated_at then raise exception 'This booking changed. Refresh before editing products.'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)=0 then raise exception 'Add at least one product'; end if;
  if (select count(*)<>count(distinct x->>'variant_id') from jsonb_array_elements(p_items) x) then raise exception 'Combine repeated sizes into one line'; end if;
  if (select count(x->>'booking_item_id')<>count(distinct x->>'booking_item_id') from jsonb_array_elements(p_items) x) then raise exception 'Duplicate booking line'; end if;
  if exists(select 1 from public.booking_items bi where bi.booking_id=b.id and
    (bi.picked_up_quantity>0 or bi.returned_quantity>0 or exists(select 1 from public.booking_item_fulfilments f where f.booking_item_id=bi.id)))
    then raise exception 'Products with pickup or return history cannot be replaced'; end if;
  select greatest(0,b.discount_amount-coalesce(sum(discount_amount),0)),jsonb_agg(to_jsonb(bi))
    into legacy_discount,before_items from public.booking_items bi where booking_id=b.id;
  -- Match creation's lock order to serialize competing reservations.
  for lock_id in select variant from (
    select item_variant_id::text as variant from public.booking_items where booking_id=b.id
    union select x->>'variant_id' from jsonb_array_elements(p_items) x
  ) locks order by variant loop
    perform pg_advisory_xact_lock(hashtextextended(lock_id,0));
  end loop;
  for line in select value from jsonb_array_elements(p_items) loop
    qty := (line->>'quantity')::integer; rate := round((line->>'price')::numeric,2);
    disc := round(coalesce((line->>'discount_percent')::numeric,0),2);
    if qty is null or qty<1 or qty>100000 or (line->>'quantity')::numeric<>qty
      or rate is null or rate<0 or rate>99999999 or rate::text in ('NaN','Infinity','-Infinity')
      or disc<0 or disc>100 or disc::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid quantity, price or discount'; end if;
    old_line := null;
    if line->>'booking_item_id' is not null then
      select * into old_line from public.booking_items where id=(line->>'booking_item_id')::uuid and booking_id=b.id;
      if old_line.id is null or old_line.item_variant_id is distinct from (line->>'variant_id')::uuid
        or old_line.item_id is distinct from (line->>'item_id')::uuid then raise exception 'Booking item not found'; end if;
    elsif exists(select 1 from public.booking_items where booking_id=b.id and item_variant_id=(line->>'variant_id')::uuid) then
      raise exception 'Retain the existing booking line for this size';
    end if;
    extra := qty-coalesce(old_line.quantity,0);
    if old_line.id is null or extra>0 then
      select * into v from public.item_variants where id=(line->>'variant_id')::uuid
        and business_id=b.business_id and branch_id=b.branch_id and archived_at is null;
      if v.id is null or v.item_id is distinct from (line->>'item_id')::uuid then raise exception 'Item size not available at this branch'; end if;
      select * into product from public.items where id=v.item_id and business_id=b.business_id and is_active and archived_at is null;
      if product.id is null then raise exception 'Item is not active'; end if;
      -- A draft/quote/expired hold has no capacity reserved to credit back.
      if b.status not in ('confirmed','hold') or (b.status='hold' and b.hold_expires_at<=now()) then extra:=qty; end if;
      select a.shortage_quantity into shortage from public.get_rental_availability(b.business_id,b.branch_id,b.pickup_date,b.return_date,v.item_id,v.id,extra) a;
      if shortage is null then raise exception 'Could not check item availability'; end if;
      if shortage>0 then overbook:=true; end if;
    end if;
    if old_line.id is not null then
      update public.booking_items set quantity=qty,price=rate,discount_percent=disc,updated_at=now() where id=old_line.id;
    else
      insert into public.booking_items(business_id,branch_id,booking_id,item_id,item_variant_id,item_name,item_sku,size,quantity,price,rental_days,discount_percent,rate_basis)
      values(b.business_id,b.branch_id,b.id,product.id,v.id,product.name,product.sku,v.size,qty,rate,1,disc,'booking');
    end if;
  end loop;
  if overbook and (not private.has_business_permission(b.business_id,'override_availability') or nullif(trim(p_overbook_reason),'') is null)
    then raise exception 'Stock is unavailable. An authorized overbooking reason is required.'; end if;
  delete from public.booking_items bi where bi.booking_id=b.id
    and not exists(select 1 from jsonb_array_elements(p_items) x where (x->>'variant_id')::uuid=bi.item_variant_id);
  select sum(subtotal),sum(discount_amount) into gross,discounts from public.booking_items where booking_id=b.id;
  discounts:=discounts+legacy_discount;
  if discounts>gross then raise exception 'Existing booking discount exceeds the new subtotal'; end if;
  tax:=case when b.subtotal>b.discount_amount then round((gross-discounts)*b.tax_amount/(b.subtotal-b.discount_amount),2) else b.tax_amount end;
  total:=gross-discounts+tax;
  select coalesce(sum(case when type in ('advance','balance') then amount when type='refund' then -amount else 0 end),0)
    into paid from public.booking_payments where booking_id=b.id and not is_voided;
  if total<paid then raise exception 'New rental total is below the amount already paid. Record the rental refund first.'; end if;
  update public.bookings set subtotal=gross,discount_amount=discounts,tax_amount=tax,total_amount=total,
    amount_paid=paid,balance_due=total-paid,updated_at=clock_timestamp(),last_updated_by=auth.uid(),
    overbook_reason=case when overbook then trim(p_overbook_reason) else overbook_reason end,
    overbooked_by=case when overbook then auth.uid() else overbooked_by end,
    overbooked_at=case when overbook then now() else overbooked_at end where id=b.id;
  insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,old_value,new_value)
    values(b.business_id,b.branch_id,auth.uid(),'booking.items_updated','bookings',b.id,
      jsonb_build_object('total',b.total_amount,'items',before_items),
      jsonb_build_object('total',total,'items',p_items,'overbook_reason',case when overbook then trim(p_overbook_reason) end));
end;
$$;
revoke all on function public.update_booking_items(uuid,jsonb,timestamptz,text) from public,anon;
grant execute on function public.update_booking_items(uuid,jsonb,timestamptz,text) to authenticated;
