
alter table public.booking_items add column discount_flat numeric(12,2);
alter table public.booking_items alter column discount_amount drop expression;
alter table public.booking_items alter column line_total drop expression;
alter table public.bookings add column additional_contact_numbers jsonb not null default '[]'::jsonb;

create function public.booking_line_discount(gross numeric, percent numeric, flat numeric)
returns numeric language plpgsql immutable security invoker set search_path='' as $$
begin
 if flat is not null then
  if flat::text in ('NaN','Infinity','-Infinity') or flat<0 or round(flat,2)>gross then raise exception 'Rupee discount must be between zero and the item subtotal'; end if;
  return round(flat,2);
 end if;
 return round(gross*percent/100,2);
end $$;
revoke all on function public.booking_line_discount(numeric,numeric,numeric) from public,anon;
grant execute on function public.booking_line_discount(numeric,numeric,numeric) to authenticated;
create function public.calculate_booking_line_amounts() returns trigger language plpgsql security invoker set search_path='' as $$
declare gross numeric;
begin
 gross:=round(new.price*new.quantity*new.rental_days,2);
 new.discount_amount:=public.booking_line_discount(gross,new.discount_percent,new.discount_flat);
 new.line_total:=gross-new.discount_amount;
 return new;
end $$;
revoke all on function public.calculate_booking_line_amounts() from public,anon;
grant execute on function public.calculate_booking_line_amounts() to authenticated;
create trigger booking_line_amounts before insert or update on public.booking_items for each row execute function public.calculate_booking_line_amounts();

create function private.save_booking_extra_contacts(booking_id uuid, phones jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.bookings; s public.staff; value text; normalized text; saved jsonb:='[]'::jsonb;
begin
 select * into s from public.staff where id=auth.uid();
 select * into b from public.bookings where id=booking_id and business_id=s.business_id;
 if s.id is null or b.id is null or not private.has_business_permission(s.business_id,'manage_bookings') or not private.can_access_branch(b.business_id,b.branch_id) then raise exception 'Booking permission required'; end if;
 if jsonb_typeof(phones) is distinct from 'array' or jsonb_array_length(phones)>8 then raise exception 'Use up to eight additional contact numbers'; end if;
 for value in select jsonb_array_elements_text(phones) loop
  normalized:=regexp_replace(value,'[^0-9]','','g');
  if length(normalized) not between 10 and 15 then raise exception 'Enter a valid additional contact number'; end if;
  if not saved @> jsonb_build_array(normalized) then saved:=saved||jsonb_build_array(normalized); end if;
  if not exists(select 1 from public.customer_phones where customer_id=b.customer_id and regexp_replace(phone,'[^0-9]','','g')=normalized)
    and not exists(select 1 from public.customers where id=b.customer_id and regexp_replace(phone,'[^0-9]','','g')=normalized) then
   insert into public.customer_phones(business_id,customer_id,phone,label,is_primary) values(b.business_id,b.customer_id,normalized,'Additional contact',false);
  end if;
 end loop;
 update public.bookings set additional_contact_numbers=saved where id=b.id;
end $$;
revoke all on function private.save_booking_extra_contacts(uuid,jsonb) from public,anon;
grant execute on function private.save_booking_extra_contacts(uuid,jsonb) to authenticated;

create or replace view public.customer_branch_summary with (security_invoker=true) as
select c.id,c.business_id,br.id as branch_id,c.name,c.phone,c.email,c.address,c.id_type,c.id_number,c.id_proof_url,c.profile_photo_url,c.blacklisted,c.blacklist_reason as blacklisted_reason,c.blacklisted_at,c.created_at,c.archived_at,c.risk_status,
 (select count(*) from public.bookings b where b.customer_id=c.id and b.branch_id=br.id and b.status not in ('draft','quote','cancelled')) as total_bookings,
 coalesce((select sum(case when p.type in ('advance','balance','penalty') then p.amount when p.type='refund' then -p.amount else 0 end) from public.booking_payments p join public.bookings b on b.id=p.booking_id where b.customer_id=c.id and b.branch_id=br.id and not p.is_voided),0) as total_spent,
 coalesce((select sum(b.balance_due) from public.bookings b where b.customer_id=c.id and b.branch_id=br.id and b.status not in ('draft','quote','cancelled')),0) as outstanding_balance,
 (select max(b.created_at) from public.bookings b where b.customer_id=c.id and b.branch_id=br.id) as last_booking_at
from public.customers c join public.branches br on br.business_id=c.business_id
where br.id=c.branch_id or exists(select 1 from public.bookings b where b.customer_id=c.id and b.branch_id=br.id);
grant select on public.customer_branch_summary to authenticated;

create function public.search_booking_ids(p_branch_id uuid,p_term text) returns table(id uuid)
language sql stable security invoker set search_path='' as $$
 select b.id from public.bookings b join public.customers c on c.id=b.customer_id join public.branches br on br.id=b.branch_id
 where b.branch_id=p_branch_id and private.can_access_branch(b.business_id,b.branch_id)
 and (b.booking_number ilike '%'||p_term||'%' or b.physical_bill_number ilike '%'||p_term||'%'
 or (coalesce(br.settings->'invoice'->>'prefix','INV')||'-'||b.booking_number) ilike '%'||p_term||'%'
 or c.name ilike '%'||p_term||'%' or c.phone ilike '%'||p_term||'%'
 or exists(select 1 from public.customer_phones p where p.customer_id=c.id and p.phone ilike '%'||p_term||'%'))
 order by b.created_at desc limit 200;
$$;
revoke all on function public.search_booking_ids(uuid,text) from public,anon;
grant execute on function public.search_booking_ids(uuid,text) to authenticated;

create function public.search_business_customers(p_term text) returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(row), '[]'::jsonb) from (
  select c.id,c.name,c.phone,c.email,c.address,c.id_type,c.id_number,c.id_proof_url,c.blacklisted,c.branch_id,
  (select count(*) from public.bookings b where b.customer_id=c.id) as total_bookings,
  coalesce((select jsonb_agg(p.phone) from public.customer_phones p where p.customer_id=c.id and not p.is_primary),'[]'::jsonb) as additional_phones
  from public.customers c where c.archived_at is null and c.business_id=(select business_id from public.staff where id=auth.uid())
  and (c.name ilike '%'||p_term||'%' or c.phone ilike '%'||p_term||'%' or c.email ilike '%'||p_term||'%'
  or exists(select 1 from public.customer_phones p where p.customer_id=c.id and p.phone ilike '%'||p_term||'%'))
  order by c.name limit 10
 ) row;
$$;
revoke all on function public.search_business_customers(text) from public,anon;
grant execute on function public.search_business_customers(text) to authenticated;

create or replace function public.create_priced_booking(p_input jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  s public.staff%rowtype; b public.bookings%rowtype; v public.item_variants%rowtype; product public.items%rowtype;
  c uuid; branch uuid; request_id uuid; customer jsonb; payment jsonb; dates jsonb; line jsonb;
  pickup date; ret date; qty integer; rate numeric; disc numeric; gross numeric := 0; discounts numeric := 0; total numeric;
  rules jsonb; tax numeric:=0; business_today date;
  advance numeric; deposit numeric; shortage integer; overbook boolean := false; prefix text; booking_number text;
begin
  select * into s from public.staff where id=auth.uid();
  if s.id is null or not private.has_business_permission(s.business_id,'manage_bookings') then raise exception 'Booking permission required'; end if;
  branch := (p_input->>'branchId')::uuid;
  if branch is null or not private.can_access_branch(s.business_id,branch) then raise exception 'Branch access required'; end if;
  if (p_input->>'businessId')::uuid is distinct from s.business_id then raise exception 'Invalid business context'; end if;
  select settings into rules from public.branches where id=branch;
  select (now() at time zone coalesce(timezone,'Asia/Kolkata'))::date into business_today from public.businesses where id=s.business_id;
  request_id := (p_input->>'requestId')::uuid;
  if request_id is null then raise exception 'Booking request ID required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(s.business_id::text || request_id::text,0));
  select * into b from public.bookings where business_id=s.business_id and creation_request_id=request_id;
  if found then return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number); end if;
  customer := p_input->'customer'; payment := p_input->'payment'; dates := p_input->'dates';
  pickup := (dates->>'pickup_date')::date; ret := (dates->>'return_date')::date;
  if pickup is null or ret is null or ret < pickup then raise exception 'Choose a valid pickup and return period'; end if;
  if pickup > business_today + coalesce((rules->>'max_booking_window')::integer,730) then raise exception 'Pickup exceeds the maximum advance booking window'; end if;
  if greatest(1,ret-pickup-1)<coalesce((rules->>'min_rental_days')::integer,1) then raise exception 'Booking is shorter than the minimum rental duration'; end if;
  if jsonb_typeof(p_input->'items') is distinct from 'array' or jsonb_array_length(p_input->'items')=0 then raise exception 'Add at least one item'; end if;
  if (select count(*) <> count(distinct x->>'variant_id') from jsonb_array_elements(p_input->'items') x) then raise exception 'Combine repeated sizes into one item'; end if;
  -- Serialize competing reservations in a stable order, without requiring inventory-edit privileges.
  for line in select value from jsonb_array_elements(p_input->'items') order by value->>'variant_id' loop
    perform pg_advisory_xact_lock(hashtextextended(line->>'variant_id',0));
    qty := (line->>'quantity')::integer; rate := round((line->>'price')::numeric,2); disc := round(coalesce((line->>'discount_percent')::numeric,0),2);
    if qty is null or qty<1 or qty>100000 or (line->>'quantity')::numeric<>qty or rate is null or rate<0 or rate>99999999 or rate::text='NaN' or disc<0 or disc>100 or disc::text='NaN' then raise exception 'Invalid quantity, per-piece price or discount'; end if;
    select * into v from public.item_variants where id=(line->>'variant_id')::uuid and business_id=s.business_id and branch_id=branch and archived_at is null;
    if not found or v.item_id is distinct from (line->>'item_id')::uuid then raise exception 'Item size not available at this branch'; end if;
    select * into product from public.items where id=v.item_id and is_active and archived_at is null;
    if not found then raise exception 'Item is not active'; end if;
    select a.shortage_quantity into shortage from public.get_rental_availability(s.business_id,branch,pickup,ret,v.item_id,v.id,qty) a;
    if shortage is null then raise exception 'Could not check item availability'; end if;
    if shortage>0 then overbook:=true; end if;
    gross:=gross + round(rate*qty,2); discounts:=discounts + public.booking_line_discount(round(rate*qty,2),disc,(line->>'discount_flat')::numeric);
  end loop;
  if overbook and (not private.has_business_permission(s.business_id,'override_availability') or nullif(trim(dates->>'overbook_reason'),'') is null) then raise exception 'Stock is unavailable. An authorized overbooking reason is required.'; end if;
  if coalesce((rules->'invoice'->>'gst_enabled')::boolean,false) then tax:=round((gross-discounts)*coalesce((rules->'invoice'->>'gst_rate')::numeric,18)/100,2); end if;
  total:=gross-discounts+tax;
  advance:=round(coalesce((payment->>'advance_amount')::numeric,0),2); deposit:=round(coalesce((payment->>'deposit_amount')::numeric,0),2);
  if advance<0 or advance>total or advance::text='NaN' or deposit<0 or deposit>99999999 or deposit::text='NaN' then raise exception 'Advance must be between zero and the rental total; deposit must be non-negative'; end if;
  if (advance>0 or deposit>0) and not private.has_business_permission(s.business_id,'manage_payments') then raise exception 'Payment permission required to collect money'; end if;
  perform pg_advisory_xact_lock(hashtextextended(s.business_id::text || regexp_replace(customer->>'phone','[^0-9]','','g'),0));
  c:=nullif(customer->>'id','')::uuid;
  if c is not null then
    if not exists(select 1 from public.customers where id=c and business_id=s.business_id) then raise exception 'Customer not found'; end if;
  else
    if nullif(trim(customer->>'name'),'') is null or length(regexp_replace(customer->>'phone','[^0-9]','','g'))<10 then raise exception 'Enter a customer name and valid phone'; end if;
    select id into c from public.customers where business_id=s.business_id and regexp_replace(phone,'[^0-9]','','g')=regexp_replace(customer->>'phone','[^0-9]','','g') limit 1;
    if c is null then
      insert into public.customers(business_id,branch_id,name,phone,email,address,id_type,id_number,id_proof_url,created_by)
      values(s.business_id,branch,trim(customer->>'name'),customer->>'phone',nullif(customer->>'email',''),nullif(customer->>'address',''),nullif(customer->>'id_type',''),nullif(customer->>'id_number',''),nullif(customer->>'id_proof_url',''),s.id) returning id into c;
      insert into public.customer_phones(business_id,customer_id,phone,label,is_primary) values(s.business_id,c,customer->>'phone','Primary',true);
    end if;
  end if;
  booking_number:=nullif(trim(p_input->>'customBookingNumber'),'');
  insert into public.bookings(business_id,branch_id,customer_id,created_by,booking_number,status,pickup_date,return_date,event_date,fitting_date,subtotal,discount_amount,discount_reason,tax_amount,total_amount,advance_amount,amount_paid,deposit_amount,balance_due,occasion,booking_source,notes,physical_bill_number,overbook_reason,overbooked_by,overbooked_at,creation_request_id)
  values(s.business_id,branch,c,s.id,booking_number,'confirmed',pickup,ret,nullif(dates->>'event_date','')::date,nullif(dates->>'fitting_date','')::date,gross,discounts,case when discounts>0 then 'Per-item discounts' end,tax,total,0,0,0,total,nullif(dates->>'occasion',''),coalesce(nullif(dates->>'booking_source',''),'walk_in'),nullif(dates->>'notes',''),nullif(trim(payment->>'physical_bill_number'),''),case when overbook then trim(dates->>'overbook_reason') end,case when overbook then s.id end,case when overbook then now() end,request_id) returning * into b;
  for line in select value from jsonb_array_elements(p_input->'items') loop
    select * into v from public.item_variants where id=(line->>'variant_id')::uuid;
    select * into product from public.items where id=v.item_id;
    insert into public.booking_items(business_id,branch_id,booking_id,item_id,item_variant_id,item_name,item_sku,size,quantity,price,rental_days,discount_percent,discount_flat,rate_basis)
    values(s.business_id,branch,b.id,product.id,v.id,product.name,product.sku,v.size,(line->>'quantity')::integer,round((line->>'price')::numeric,2),1,round(coalesce((line->>'discount_percent')::numeric,0),2),(line->>'discount_flat')::numeric,'booking');
  end loop;
  perform private.save_booking_extra_contacts(b.id,coalesce(customer->'additional_phones','[]'::jsonb));
  if advance>0 then perform public.post_booking_payment_split(b.id,'advance',advance,coalesce(nullif(payment->'splits','null'::jsonb),jsonb_build_array(jsonb_build_object('amount',advance,'method',coalesce(payment->>'method','cash'),'reference',payment->>'reference'))),'booking:'||b.id||':advance',payment->>'notes'); end if;
  if deposit>0 then perform public.post_booking_payment_split(b.id,'deposit',deposit,coalesce(nullif(payment->'deposit_splits','null'::jsonb),jsonb_build_array(jsonb_build_object('amount',deposit,'method',coalesce(payment->>'deposit_method',payment->>'method','cash'),'reference',payment->>'deposit_reference'))),'booking:'||b.id||':deposit',payment->>'notes'); end if;
  update public.bookings set advance_amount=advance,amount_paid=advance,deposit_amount=deposit,balance_due=total-advance where id=b.id;
  insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,new_value) values(s.business_id,branch,s.id,'booking.created','bookings',b.id,jsonb_build_object('total',total,'discount_amount',discounts,'rate_basis','booking'));
  return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number);
end;
$$;
revoke all on function public.create_priced_booking(jsonb) from public,anon;
grant execute on function public.create_priced_booking(jsonb) to authenticated;


-- Edit the complete product list atomically. Existing line IDs and daily rates survive.
create or replace function public.update_booking_items(
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
      update public.booking_items set quantity=qty,price=rate,discount_percent=disc,discount_flat=(line->>'discount_flat')::numeric,updated_at=now() where id=old_line.id;
    else
      insert into public.booking_items(business_id,branch_id,booking_id,item_id,item_variant_id,item_name,item_sku,size,quantity,price,rental_days,discount_percent,discount_flat,rate_basis)
      values(b.business_id,b.branch_id,b.id,product.id,v.id,product.name,product.sku,v.size,qty,rate,1,disc,(line->>'discount_flat')::numeric,'booking');
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

create or replace function public.update_booking_item_pricing(p_booking_id uuid,p_items jsonb,p_expected_updated_at timestamptz)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare b public.bookings%rowtype; line jsonb; rate numeric; disc numeric; gross numeric; discounts numeric; old_discount numeric; paid numeric; total numeric; changed integer;
begin
  select * into b from public.bookings where id=p_booking_id for update;
  if b.id is null or auth.uid() is null or not private.has_business_permission(b.business_id,'manage_bookings') or not private.can_access_branch(b.business_id,b.branch_id) then raise exception 'Booking permission required'; end if;
  if b.status in ('closed','cancelled') then raise exception 'Closed or cancelled bookings cannot be repriced'; end if;
  if p_expected_updated_at is distinct from b.updated_at then raise exception 'This booking changed. Refresh before editing prices.'; end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)<> (select count(*) from public.booking_items where booking_id=b.id) or jsonb_array_length(p_items)=0 then raise exception 'Provide every booking item'; end if;
  if (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(p_items) x) then raise exception 'Duplicate booking item'; end if;
  select greatest(0,b.discount_amount-coalesce(sum(discount_amount),0)) into old_discount from public.booking_items where booking_id=b.id;
  for line in select value from jsonb_array_elements(p_items) loop
    rate:=round((line->>'price')::numeric,2); disc:=round((line->>'discount_percent')::numeric,2);
    if rate is null or rate<0 or rate>99999999 or rate::text='NaN' or disc is null or disc<0 or disc>100 or disc::text='NaN' then raise exception 'Enter a valid price and discount between 0 and 100%%'; end if;
    update public.booking_items set price=rate,discount_percent=disc,discount_flat=(line->>'discount_flat')::numeric,updated_at=now() where id=(line->>'id')::uuid and booking_id=b.id;
    get diagnostics changed=row_count;
    if changed<>1 then raise exception 'Booking item not found'; end if;
  end loop;
  select sum(subtotal),sum(discount_amount) into gross,discounts from public.booking_items where booking_id=b.id;
  discounts:=discounts+old_discount;
  if discounts>gross then raise exception 'Existing booking discount exceeds the new subtotal'; end if;
  b.tax_amount:=case when b.subtotal>b.discount_amount then round((gross-discounts)*b.tax_amount/(b.subtotal-b.discount_amount),2) else b.tax_amount end;
  total:=gross-discounts+b.tax_amount;
  select coalesce(sum(case when type in ('advance','balance') then amount when type='refund' then -amount else 0 end),0) into paid from public.booking_payments where booking_id=b.id and not is_voided;
  if total<paid then raise exception 'New rental total is below the amount already paid. Record the rental refund first.'; end if;
  update public.bookings set subtotal=gross,discount_amount=discounts,tax_amount=b.tax_amount,total_amount=total,amount_paid=paid,balance_due=total-paid,updated_at=clock_timestamp(),last_updated_by=auth.uid() where id=b.id;
  insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,old_value,new_value) values(b.business_id,b.branch_id,auth.uid(),'booking.pricing_updated','bookings',b.id,jsonb_build_object('total',b.total_amount,'discount_amount',b.discount_amount),jsonb_build_object('total',total,'discount_amount',discounts,'items',p_items));
end;
$$;
revoke all on function public.update_booking_item_pricing(uuid,jsonb,timestamptz) from public,anon;
grant execute on function public.update_booking_item_pricing(uuid,jsonb,timestamptz) to authenticated;
