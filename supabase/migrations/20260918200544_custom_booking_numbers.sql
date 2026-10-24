-- Keep counters separate so unrelated settings saves cannot rewind them.
create table public.booking_number_settings (
  branch_id uuid primary key references public.branches(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  prefix text not null check (prefix ~ '^[A-Z0-9/_-]{1,20}$'),
  next_number bigint not null check (next_number between 1 and 9007199254740991),
  updated_at timestamptz not null default now()
);
alter table public.booking_number_settings enable row level security;
revoke all on public.booking_number_settings from public, anon, authenticated;
grant select on public.booking_number_settings to authenticated;
create policy booking_number_settings_read on public.booking_number_settings for select to authenticated
  using (private.can_access_branch(business_id, branch_id));

-- Only authorized routines can change counters; direct API writes are forbidden.
create function private.save_booking_number_settings(p_branch_id uuid, p_prefix text, p_next_number bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  business uuid; previous public.booking_number_settings%rowtype; saved public.booking_number_settings%rowtype;
  normalized text := upper(btrim(p_prefix));
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select business_id into business from public.branches where id = p_branch_id;
  if business is null or not private.can_access_branch(business, p_branch_id)
    or not private.has_business_permission(business, 'manage_settings') then
    raise exception 'Branch settings permission required';
  end if;
  if normalized is null or normalized !~ '^[A-Z0-9/_-]{1,20}$' then
    raise exception 'Prefix must contain 1 to 20 letters, numbers, hyphens, underscores or slashes';
  end if;
  if p_next_number is null or p_next_number < 1 or p_next_number > 9007199254740990 then
    raise exception 'Enter a whole next number between 1 and 9007199254740990';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('booking-number-branch:' || p_branch_id::text, 0));
  select * into previous from public.booking_number_settings where branch_id = p_branch_id;
  if found and p_next_number < previous.next_number then
    raise exception 'Next number cannot move backwards. Reload the latest counter and try again.';
  end if;
  insert into public.booking_number_settings(branch_id, business_id, prefix, next_number)
    values(p_branch_id, business, normalized, p_next_number)
    on conflict (branch_id) do update set prefix = excluded.prefix, next_number = excluded.next_number, updated_at = now()
    returning * into saved;
  insert into public.audit_log(business_id, branch_id, staff_id, action, table_name, record_id, old_value, new_value)
    values(business, p_branch_id, auth.uid(), 'booking.numbering_updated', 'booking_number_settings', p_branch_id, to_jsonb(previous), to_jsonb(saved));
  return to_jsonb(saved);
end $$;
revoke all on function private.save_booking_number_settings(uuid,text,bigint) from public, anon;
grant execute on function private.save_booking_number_settings(uuid,text,bigint) to authenticated;

create function public.save_booking_number_settings(p_branch_id uuid, p_prefix text, p_next_number bigint)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.save_booking_number_settings(p_branch_id, p_prefix, p_next_number);
$$;
revoke all on function public.save_booking_number_settings(uuid,text,bigint) from public, anon;
grant execute on function public.save_booking_number_settings(uuid,text,bigint) to authenticated;

-- Non-unique index preserves legacy values. New inserts check normalized references.
create index bookings_normalized_number_idx on public.bookings (upper(btrim(booking_number)));

-- Trigger allocation rolls back with a failed booking, including direct non-RPC inserts.
-- Definer rights are restricted to a protected counter and global duplicate lookup.
create function private.assign_booking_number()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  config public.booking_number_settings%rowtype;
  candidate text; branch_prefix text; is_manual boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not private.can_access_branch(new.business_id, new.branch_id)
    or not private.has_business_permission(new.business_id, 'manage_bookings') then
    raise exception 'Booking permission required for this branch';
  end if;
  candidate := nullif(upper(btrim(new.booking_number)), '');
  is_manual := candidate is not null;
  if is_manual and candidate !~ '^[A-Z0-9/_-]{1,40}$' then
    raise exception 'Booking number must contain 1 to 40 letters, numbers, hyphens, underscores or slashes';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('booking-number-branch:' || new.branch_id::text, 0));
  select * into config from public.booking_number_settings where branch_id = new.branch_id;
  select prefix into branch_prefix from public.branches where id = new.branch_id and business_id = new.business_id;
  if not found then raise exception 'Branch not found'; end if;
  loop
    if not is_manual then
      if config.branch_id is not null then
        if config.next_number > 9007199254740990 then raise exception 'Booking number counter is exhausted'; end if;
        candidate := config.prefix || '-' || config.next_number::text;
      else
        candidate := coalesce(branch_prefix, 'FAB') || '-' || to_char(current_date, 'YYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 8));
      end if;
    end if;
    -- Shared by manual and automatic inserts, even across different businesses.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('booking-number-value:' || candidate, 0));
    if not exists(select 1 from public.bookings where upper(btrim(booking_number)) = candidate) then exit; end if;
    if is_manual then raise exception 'This booking number is already in use. Choose another number or leave it blank for automatic numbering.'; end if;
    config.next_number := config.next_number + 1;
  end loop;
  if not is_manual and config.branch_id is not null then
    update public.booking_number_settings set next_number = config.next_number + 1, updated_at = now() where branch_id = new.branch_id;
  end if;
  new.booking_number := candidate;
  return new;
end $$;
revoke all on function private.assign_booking_number() from public, anon, authenticated;
create trigger assign_booking_number before insert on public.bookings
  for each row execute function private.assign_booking_number();

create function private.keep_booking_number()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.booking_number is distinct from old.booking_number then
    raise exception 'Booking numbers cannot be changed after creation';
  end if;
  return new;
end $$;
revoke all on function private.keep_booking_number() from public, anon, authenticated;
create trigger keep_booking_number before update of booking_number on public.bookings
  for each row execute function private.keep_booking_number();

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
    gross:=gross + round(rate*qty,2); discounts:=discounts + round(rate*qty*disc/100,2);
  end loop;
  if overbook and (not private.has_business_permission(s.business_id,'override_availability') or nullif(trim(dates->>'overbook_reason'),'') is null) then raise exception 'Stock is unavailable. An authorized overbooking reason is required.'; end if;
  if coalesce((rules->'invoice'->>'gst_enabled')::boolean,false) then tax:=round((gross-discounts)*coalesce((rules->'invoice'->>'gst_rate')::numeric,18)/100,2); end if;
  total:=gross-discounts+tax;
  advance:=round(coalesce((payment->>'advance_amount')::numeric,0),2); deposit:=round(coalesce((payment->>'deposit_amount')::numeric,0),2);
  if advance<0 or advance>total or advance::text='NaN' or deposit<0 or deposit>99999999 or deposit::text='NaN' then raise exception 'Advance must be between zero and the rental total; deposit must be non-negative'; end if;
  if advance<round(total*coalesce((rules->>'min_advance_pct')::numeric,0)/100,2) then raise exception 'Advance is below the branch minimum payment requirement'; end if;
  if (advance>0 or deposit>0) and not private.has_business_permission(s.business_id,'manage_payments') then raise exception 'Payment permission required to collect money'; end if;
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
    insert into public.booking_items(business_id,branch_id,booking_id,item_id,item_variant_id,item_name,item_sku,size,quantity,price,rental_days,discount_percent,rate_basis)
    values(s.business_id,branch,b.id,product.id,v.id,product.name,product.sku,v.size,(line->>'quantity')::integer,round((line->>'price')::numeric,2),1,round(coalesce((line->>'discount_percent')::numeric,0),2),'booking');
  end loop;
  if advance>0 then perform public.post_booking_payment(b.id,'advance',advance,coalesce(payment->>'method','cash'),payment->>'reference',payment->>'notes','booking:'||b.id||':advance'); end if;
  if deposit>0 then perform public.post_booking_payment(b.id,'deposit',deposit,coalesce(payment->>'method','cash'),payment->>'reference',payment->>'notes','booking:'||b.id||':deposit'); end if;
  update public.bookings set advance_amount=advance,amount_paid=advance,deposit_amount=deposit,balance_due=total-advance where id=b.id;
  insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,new_value) values(s.business_id,branch,s.id,'booking.created','bookings',b.id,jsonb_build_object('total',total,'discount_amount',discounts,'rate_basis','booking'));
  return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number);
end;
$$;
revoke all on function public.create_priced_booking(jsonb) from public,anon;
grant execute on function public.create_priced_booking(jsonb) to authenticated;
