-- Existing bookings retain their stored rates, billable days and totals.
alter table public.booking_items
  add column discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  add column rate_basis text not null default 'day' check (rate_basis in ('day','booking')),
  add column discount_amount numeric(12,2) generated always as (round(price * quantity * rental_days * discount_percent / 100, 2)) stored,
  add column line_total numeric(12,2) generated always as (round(price * quantity * rental_days, 2) - round(price * quantity * rental_days * discount_percent / 100, 2)) stored;
alter table public.bookings add column creation_request_id uuid;
create unique index bookings_creation_request_idx on public.bookings(business_id, creation_request_id) where creation_request_id is not null;

create function public.create_priced_booking(p_input jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  s public.staff%rowtype; b public.bookings%rowtype; v public.item_variants%rowtype; product public.items%rowtype;
  c uuid; branch uuid; request_id uuid; customer jsonb; payment jsonb; dates jsonb; line jsonb;
  pickup date; ret date; qty integer; rate numeric; disc numeric; gross numeric := 0; discounts numeric := 0; total numeric;
  advance numeric; deposit numeric; shortage integer; overbook boolean := false; prefix text; booking_number text;
begin
  select * into s from public.staff where id=auth.uid();
  if s.id is null or not private.has_business_permission(s.business_id,'manage_bookings') then raise exception 'Booking permission required'; end if;
  branch := (p_input->>'branchId')::uuid;
  if branch is null or not private.can_access_branch(s.business_id,branch) then raise exception 'Branch access required'; end if;
  if (p_input->>'businessId')::uuid is distinct from s.business_id then raise exception 'Invalid business context'; end if;
  request_id := (p_input->>'requestId')::uuid;
  if request_id is null then raise exception 'Booking request ID required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(s.business_id::text || request_id::text,0));
  select * into b from public.bookings where business_id=s.business_id and creation_request_id=request_id;
  if found then return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number); end if;
  customer := p_input->'customer'; payment := p_input->'payment'; dates := p_input->'dates';
  pickup := (dates->>'pickup_date')::date; ret := (dates->>'return_date')::date;
  if pickup is null or ret is null or ret < pickup then raise exception 'Choose a valid pickup and return period'; end if;
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
  total:=gross-discounts;
  advance:=round(coalesce((payment->>'advance_amount')::numeric,0),2); deposit:=round(coalesce((payment->>'deposit_amount')::numeric,0),2);
  if advance<0 or advance>total or advance::text='NaN' or deposit<0 or deposit>99999999 or deposit::text='NaN' then raise exception 'Advance must be between zero and the rental total; deposit must be non-negative'; end if;
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
  select br.prefix into prefix from public.branches br where br.id=branch;
  booking_number:=coalesce(prefix,'FAB') || '-' || to_char(current_date,'YYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,8));
  insert into public.bookings(business_id,branch_id,customer_id,created_by,booking_number,status,pickup_date,return_date,event_date,fitting_date,subtotal,discount_amount,discount_reason,tax_amount,total_amount,advance_amount,amount_paid,deposit_amount,balance_due,occasion,booking_source,notes,physical_bill_number,overbook_reason,overbooked_by,overbooked_at,creation_request_id)
  values(s.business_id,branch,c,s.id,booking_number,'confirmed',pickup,ret,nullif(dates->>'event_date','')::date,nullif(dates->>'fitting_date','')::date,gross,discounts,case when discounts>0 then 'Per-item discounts' end,0,total,0,0,0,total,nullif(dates->>'occasion',''),coalesce(nullif(dates->>'booking_source',''),'walk_in'),nullif(dates->>'notes',''),nullif(trim(payment->>'physical_bill_number'),''),case when overbook then trim(dates->>'overbook_reason') end,case when overbook then s.id end,case when overbook then now() end,request_id) returning * into b;
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

create function public.update_booking_item_pricing(p_booking_id uuid,p_items jsonb,p_expected_updated_at timestamptz)
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
    update public.booking_items set price=rate,discount_percent=disc,updated_at=now() where id=(line->>'id')::uuid and booking_id=b.id;
    get diagnostics changed=row_count;
    if changed<>1 then raise exception 'Booking item not found'; end if;
  end loop;
  select sum(subtotal),sum(discount_amount) into gross,discounts from public.booking_items where booking_id=b.id;
  discounts:=discounts+old_discount;
  if discounts>gross then raise exception 'Existing booking discount exceeds the new subtotal'; end if;
  total:=gross-discounts+b.tax_amount;
  select coalesce(sum(case when type in ('advance','balance') then amount when type='refund' then -amount else 0 end),0) into paid from public.booking_payments where booking_id=b.id and not is_voided;
  if total<paid then raise exception 'New rental total is below the amount already paid. Record the rental refund first.'; end if;
  update public.bookings set subtotal=gross,discount_amount=discounts,total_amount=total,amount_paid=paid,balance_due=total-paid,updated_at=clock_timestamp(),last_updated_by=auth.uid() where id=b.id;
  insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,old_value,new_value) values(b.business_id,b.branch_id,auth.uid(),'booking.pricing_updated','bookings',b.id,jsonb_build_object('total',b.total_amount,'discount_amount',b.discount_amount),jsonb_build_object('total',total,'discount_amount',discounts,'items',p_items));
end;
$$;
revoke all on function public.update_booking_item_pricing(uuid,jsonb,timestamptz) from public,anon;
grant execute on function public.update_booking_item_pricing(uuid,jsonb,timestamptz) to authenticated;

create or replace function public.post_booking_payment(
  p_booking_id uuid,
  p_payment_type text,
  p_amount numeric,
  p_payment_method text,
  p_reference_number text default null,
  p_note text default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_staff public.staff%rowtype;
  v_entry_type public.financial_entry_type;
  v_financial_id uuid;
  v_paid numeric;
  v_deposit numeric;
begin
  if p_amount is null or p_amount <= 0 or p_amount::text in ('NaN','Infinity','-Infinity') then raise exception 'Payment amount must be greater than zero'; end if;
  if p_payment_type not in ('advance', 'balance', 'deposit', 'deposit_refund', 'penalty', 'refund') then
    raise exception 'Unsupported payment type';
  end if;
  if p_payment_method not in ('cash', 'upi', 'card', 'bank_transfer') then
    raise exception 'Unsupported payment method';
  end if;

  select * into v_staff from public.staff where id = auth.uid();
  if v_staff.id is null then raise exception 'Authenticated staff record required'; end if;
  if not private.has_business_permission(v_staff.business_id, 'manage_payments')
  then raise exception 'Payment permission required'; end if;

  select * into v_booking
  from public.bookings
  where id = p_booking_id and business_id = v_staff.business_id
  for update;
  if v_booking.id is null then raise exception 'Booking not found'; end if;

  if exists (
    select 1 from public.cash_sessions
    where branch_id = v_booking.branch_id and business_date = current_date and status = 'closed'
  ) then raise exception 'This branch day is closed; post a reversal or refund on an open day'; end if;

  if p_idempotency_key is not null then
    select id into v_financial_id
    from public.financial_entries
    where business_id = v_booking.business_id and idempotency_key = p_idempotency_key;
    if v_financial_id is not null then return v_financial_id; end if;
  end if;

  select coalesce(sum(case when type in ('advance','balance') then amount when type='refund' then -amount else 0 end),0),
    coalesce(sum(case when type='deposit' then amount when type='deposit_refund' then -amount else 0 end),0)
  into v_paid,v_deposit from public.booking_payments where booking_id=v_booking.id and not is_voided;
  if p_payment_type in ('advance','balance') and p_amount > greatest(0,v_booking.total_amount-v_paid) then raise exception 'Payment exceeds the rental balance'; end if;
  if p_payment_type='refund' and p_amount>v_paid then raise exception 'Refund exceeds rental payments collected'; end if;
  if p_payment_type='deposit_refund' and p_amount>v_deposit then raise exception 'Refund exceeds the deposit held'; end if;
  if v_booking.status in ('closed','cancelled') and p_payment_type in ('advance','balance','deposit') then raise exception 'Cannot collect payment for a closed or cancelled booking'; end if;
  p_amount:=round(p_amount,2);
  if p_amount<=0 then raise exception 'Payment must be at least 0.01'; end if;

  v_entry_type := case p_payment_type
    when 'deposit' then 'deposit_collection'::public.financial_entry_type
    when 'deposit_refund' then 'deposit_refund'::public.financial_entry_type
    when 'refund' then 'refund'::public.financial_entry_type
    else 'payment'::public.financial_entry_type
  end;

  insert into public.financial_entries (
    business_id, branch_id, booking_id, customer_id, entry_type, amount,
    payment_method, reference_number, note, posted_by, idempotency_key
  ) values (
    v_booking.business_id, v_booking.branch_id, v_booking.id, v_booking.customer_id,
    v_entry_type, p_amount, p_payment_method, p_reference_number, p_note, auth.uid(), p_idempotency_key
  ) returning id into v_financial_id;

  insert into public.booking_payments (
    booking_id, business_id, branch_id, type, amount, method,
    reference_number, notes, collected_by
  ) values (
    v_booking.id, v_booking.business_id, v_booking.branch_id, p_payment_type,
    p_amount, p_payment_method, p_reference_number, p_note, auth.uid()
  );

  if p_payment_type in ('deposit', 'deposit_refund') then
    insert into public.deposit_ledger (
      business_id, branch_id, booking_id, entry_type, amount,
      payment_method, reference_number, note, created_by
    ) values (
      v_booking.business_id, v_booking.branch_id, v_booking.id,
      case when p_payment_type = 'deposit' then 'collection' else 'refund' end,
      p_amount, p_payment_method, p_reference_number, p_note, auth.uid()
    );
  end if;

  insert into public.audit_log (
    business_id, branch_id, staff_id, action, table_name, record_id, new_value
  ) values (
    v_booking.business_id, v_booking.branch_id, auth.uid(), 'payment.posted',
    'financial_entries', v_financial_id,
    jsonb_build_object('booking_id', v_booking.id, 'payment_type', p_payment_type, 'amount', p_amount)
  );

  return v_financial_id;
end;
$$;

-- Derived payment summaries are maintained by a private trigger, never by a client payload.
-- The trigger has no callable public endpoint and only updates the affected, authorized booking.
create function private.sync_booking_payment_totals()
returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid; b public.bookings%rowtype; paid numeric; advance numeric; deposit numeric;
begin
  target:=case when TG_OP='DELETE' then old.booking_id else new.booking_id end;
  select * into b from public.bookings where id=target for update;
  if b.id is null then return null; end if;
  if auth.uid() is not null then
    if not private.can_access_branch(b.business_id,b.branch_id) or not private.has_business_permission(b.business_id,'manage_payments') then raise exception 'Payment permission required'; end if;
  elsif coalesce(current_setting('role',true),'') not in ('postgres','service_role','none') then
    raise exception 'Authenticated payment context required';
  end if;
  if TG_OP='UPDATE' and old.booking_id<>new.booking_id then raise exception 'Payments cannot move between bookings'; end if;
  select coalesce(sum(case when type in ('advance','balance') then amount when type='refund' then -amount else 0 end),0),
    coalesce(sum(case when type='advance' then amount else 0 end),0),
    coalesce(sum(case when type='deposit' then amount when type='deposit_refund' then -amount else 0 end),0)
    into paid,advance,deposit from public.booking_payments where booking_id=target and not is_voided;
  update public.bookings set amount_paid=paid,advance_amount=advance,deposit_amount=deposit,balance_due=greatest(0,total_amount-paid),updated_at=clock_timestamp() where id=target;
  return null;
end;
$$;
revoke all on function private.sync_booking_payment_totals() from public,anon,authenticated;
create trigger booking_payment_totals after insert or update or delete on public.booking_payments for each row execute function private.sync_booking_payment_totals();
