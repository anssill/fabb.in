-- One collection can contain multiple methods. All ledger writes succeed or roll back together.
create or replace function private.post_booking_payment_split(p_booking_id uuid, p_payment_type text, p_total numeric, p_parts jsonb, p_key text, p_note text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.staff%rowtype; b public.bookings%rowtype; prior public.command_receipts%rowtype;
 payload jsonb; part jsonb; total numeric:=0; amount numeric; n integer:=0; entry uuid; ids jsonb:='[]'::jsonb; result jsonb;
begin
 select * into s from public.staff where id=auth.uid();
 if s.id is null or not private.has_business_permission(s.business_id,'manage_payments') then raise exception 'Payment permission required'; end if;
 select * into b from public.bookings where id=p_booking_id and business_id=s.business_id for update;
 if b.id is null or not private.can_access_branch(b.business_id,b.branch_id) then raise exception 'Booking not accessible'; end if;
 if p_key is null or length(p_key) not between 1 and 100 then raise exception 'Request identifier required (maximum 100 characters)'; end if;
 if p_payment_type is null or p_payment_type not in ('advance','balance','deposit','deposit_refund','penalty','refund') then raise exception 'Unsupported payment type'; end if;
 if p_total is null or p_total<=0 or p_total>99999999 or p_total::text in ('NaN','Infinity','-Infinity') or p_total<>round(p_total,2) then raise exception 'Enter a valid payment total'; end if;
 if jsonb_typeof(p_parts) is distinct from 'array' or jsonb_array_length(p_parts) not between 1 and 8 then raise exception 'Use between one and eight payment parts'; end if;
 for part in select value from jsonb_array_elements(p_parts) loop
  amount:=(part->>'amount')::numeric;
  if amount is null or amount<=0 or amount>99999999 or amount::text in ('NaN','Infinity','-Infinity') or amount<>round(amount,2) then raise exception 'Each payment part must be positive with at most two decimal places'; end if;
  if part->>'method' is null or part->>'method' not in ('cash','upi','card','bank_transfer') then raise exception 'Unsupported payment method'; end if;
  total:=total+amount;
 end loop;
 if total<>p_total then raise exception 'Payment parts must add up to the amount collected'; end if;
 payload:=jsonb_build_object('booking_id',p_booking_id,'type',p_payment_type,'total',p_total,'parts',p_parts,'note',p_note);
 perform pg_advisory_xact_lock(hashtextextended(s.business_id::text||p_key,0));
 select * into prior from public.command_receipts where business_id=s.business_id and idempotency_key=p_key;
 if found then
  if prior.command_name<>'payment.split' or prior.request_payload<>payload then raise exception 'Request identifier already used for another payment'; end if;
  return prior.response_payload;
 end if;
 for part in select value from jsonb_array_elements(p_parts) loop
  n:=n+1;
  entry:=public.post_booking_payment(b.id,p_payment_type,(part->>'amount')::numeric,part->>'method',nullif(trim(part->>'reference'),''),p_note,p_key||':split:'||n);
  ids:=ids||jsonb_build_array(entry);
 end loop;
 result:=jsonb_build_object('success',true,'financialEntryIds',ids);
 insert into public.command_receipts(business_id,idempotency_key,command_name,actor_id,request_payload,response_payload) values(b.business_id,p_key,'payment.split',s.id,payload,result);
 return result;
end $$;
revoke all on function private.post_booking_payment_split(uuid,text,numeric,jsonb,text,text) from public,anon;
grant execute on function private.post_booking_payment_split(uuid,text,numeric,jsonb,text,text) to authenticated;
create or replace function public.post_booking_payment_split(p_booking_id uuid,p_payment_type text,p_total numeric,p_parts jsonb,p_key text,p_note text default null)
returns jsonb language sql security invoker set search_path='' as $$ select private.post_booking_payment_split(p_booking_id,p_payment_type,p_total,p_parts,p_key,p_note) $$;
revoke all on function public.post_booking_payment_split(uuid,text,numeric,jsonb,text,text) from public,anon;
grant execute on function public.post_booking_payment_split(uuid,text,numeric,jsonb,text,text) to authenticated;

-- Advance is chosen per booking; the branch percentage is only a suggested preset.
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
  if advance>0 then perform public.post_booking_payment_split(b.id,'advance',advance,coalesce(nullif(payment->'splits','null'::jsonb),jsonb_build_array(jsonb_build_object('amount',advance,'method',coalesce(payment->>'method','cash'),'reference',payment->>'reference'))),'booking:'||b.id||':advance',payment->>'notes'); end if;
  if deposit>0 then perform public.post_booking_payment_split(b.id,'deposit',deposit,coalesce(nullif(payment->'deposit_splits','null'::jsonb),jsonb_build_array(jsonb_build_object('amount',deposit,'method',coalesce(payment->>'deposit_method',payment->>'method','cash'),'reference',payment->>'deposit_reference'))),'booking:'||b.id||':deposit',payment->>'notes'); end if;
  update public.bookings set advance_amount=advance,amount_paid=advance,deposit_amount=deposit,balance_due=total-advance where id=b.id;
  insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,new_value) values(s.business_id,branch,s.id,'booking.created','bookings',b.id,jsonb_build_object('total',total,'discount_amount',discounts,'rate_basis','booking'));
  return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number);
end;
$$;
revoke all on function public.create_priced_booking(jsonb) from public,anon;
grant execute on function public.create_priced_booking(jsonb) to authenticated;

-- Atomic rental transitions. Authorization is checked inside a private command boundary;
-- callers do not receive general inventory or ledger write privileges.
create or replace function private.apply_booking_command(p_booking_id uuid, p_input jsonb, p_key text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.bookings%rowtype; s public.staff%rowtype; bi public.booking_items%rowtype;
 line jsonb; qty integer; damaged integer; remaining integer; asset uuid; assets uuid[]; n integer;
 requested text:=p_input->>'status'; final_status text; receipt public.command_receipts%rowtype; output jsonb;
begin
 select * into s from public.staff where id=auth.uid();
 if s.id is null or not private.has_business_permission(s.business_id,'manage_bookings') then raise exception 'Booking permission required'; end if;
 if nullif(p_key,'') is null or length(p_key)>150 then raise exception 'Request identifier required'; end if;
 select * into b from public.bookings where id=p_booking_id and business_id=s.business_id for update;
 if b.id is null or not private.can_access_branch(b.business_id,b.branch_id) then raise exception 'Booking not accessible'; end if;
 perform pg_advisory_xact_lock(hashtextextended(s.business_id::text||p_key,0));
 select * into receipt from public.command_receipts where business_id=s.business_id and idempotency_key=p_key;
 if found then
  if receipt.command_name<>'booking.transition' or receipt.request_payload<>jsonb_build_object('booking_id',p_booking_id,'input',p_input) then raise exception 'Request identifier already used for another operation'; end if;
  return receipt.response_payload;
 end if;
 final_status:=requested;
 if requested='returned' then
  if b.status not in ('picked_up','partially_returned') then raise exception 'This booking is not awaiting a return'; end if;
  if jsonb_typeof(p_input->'returns') is distinct from 'array' or jsonb_array_length(p_input->'returns')=0 then raise exception 'Choose items to return'; end if;
  if (select count(*)<>count(distinct value->>'bookingItemId') from jsonb_array_elements(p_input->'returns')) then raise exception 'Duplicate return lines'; end if;
  n:=0;
  for line in select value from jsonb_array_elements(p_input->'returns') loop
   select * into bi from public.booking_items where id=(line->>'bookingItemId')::uuid and booking_id=b.id for update;
   if bi.id is null then raise exception 'Item does not belong to this booking'; end if;
   if (line->>'quantity')::numeric is null or (line->>'quantity')::numeric<>trunc((line->>'quantity')::numeric) then raise exception 'Return quantity must be a whole number'; end if;
   if coalesce((line->>'unavailableQuantity')::numeric,0)<>trunc(coalesce((line->>'unavailableQuantity')::numeric,0)) then raise exception 'Damaged quantity must be a whole number'; end if;
   qty:=(line->>'quantity')::integer; damaged:=coalesce((line->>'unavailableQuantity')::integer,0);
   remaining:=greatest(0,coalesce(nullif(bi.picked_up_quantity,0),bi.quantity)-bi.returned_quantity);
   if qty<0 or qty>remaining or damaged<0 or damaged>qty then raise exception 'Invalid return quantity'; end if;
   if qty=0 then continue; end if;
   if coalesce(line->>'reason','')='missing' then raise exception 'Missing items must remain outstanding. Enter only physically received quantities.'; end if;
   if damaged>0 and coalesce(line->>'reason','')<>'damaged' then raise exception 'Select a reason for damaged items'; end if;
   if (select tracking_mode='asset' from public.items where id=bi.item_id) then
    select coalesce(array_agg(value::uuid),'{}'::uuid[]) into assets from jsonb_array_elements_text(coalesce(line->'assetIds','[]'::jsonb));
    if cardinality(assets)<>qty or (select count(distinct x) from unnest(assets) x)<>qty then raise exception 'Select exactly the received asset pieces'; end if;
    for i in 1..qty loop
     asset:=assets[i];
     if not exists(select 1 from public.booking_item_assets ba join public.inventory_assets a on a.id=ba.asset_id where ba.booking_item_id=bi.id and ba.asset_id=asset and ba.released_at is null and a.status='out') then raise exception 'Asset is not issued on this booking'; end if;
     update public.inventory_assets set status=case when i<=damaged then 'damaged' else 'available' end,updated_at=now() where id=asset;
     if i<=damaged then insert into public.inventory_unavailability(business_id,branch_id,item_id,item_variant_id,inventory_asset_id,booking_item_id,reason,quantity,notes,recorded_by) values(b.business_id,b.branch_id,bi.item_id,bi.item_variant_id,asset,bi.id,'damaged',1,line->>'notes',s.id); end if;
    end loop;
    update public.booking_item_assets set released_at=now(),released_by=s.id where booking_item_id=bi.id and asset_id=any(assets) and released_at is null;
   elsif damaged>0 then
    insert into public.inventory_unavailability(business_id,branch_id,item_id,item_variant_id,booking_item_id,reason,quantity,notes,recorded_by) values(b.business_id,b.branch_id,bi.item_id,bi.item_variant_id,bi.id,'damaged',damaged,line->>'notes',s.id);
   end if;
   insert into public.booking_item_fulfilments(business_id,branch_id,booking_id,booking_item_id,event_type,quantity,performed_by,notes,idempotency_key) values(b.business_id,b.branch_id,b.id,bi.id,'return',qty,s.id,line->>'notes',p_key||':'||bi.id);
   update public.booking_items set returned_quantity=returned_quantity+qty where id=bi.id;
   n:=n+qty;
  end loop;
  if n=0 then raise exception 'Choose at least one physically received item'; end if;
  final_status:=case when not exists(select 1 from public.booking_items where booking_id=b.id and returned_quantity<coalesce(nullif(picked_up_quantity,0),quantity)) then 'returned' else 'partially_returned' end;
 elsif requested='picked_up' then
  if b.status not in ('confirmed','hold') then raise exception 'Booking is not ready for pickup'; end if;
  if jsonb_typeof(coalesce(p_input->'payments','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(p_input->'payments','[]'::jsonb))>16 then raise exception 'Invalid pickup payments'; end if;
  n:=0;
  for line in select value from jsonb_array_elements(coalesce(p_input->'payments','[]'::jsonb)) loop
   if line->>'type' is null or line->>'type' not in ('balance','deposit') then raise exception 'Invalid pickup payment type'; end if;
   n:=n+1;
   perform public.post_booking_payment(b.id,line->>'type',(line->>'amount')::numeric,line->>'method',line->>'reference',line->>'notes',p_key||':payment:'||n);
  end loop;
  if jsonb_typeof(coalesce(p_input->'pickupPhotos','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(p_input->'pickupPhotos','[]'::jsonb))>20 then raise exception 'Invalid pickup documents'; end if;
  update public.bookings set pickup_photos=array(select jsonb_array_elements_text(coalesce(p_input->'pickupPhotos','[]'::jsonb))) where id=b.id;
  for bi in select * from public.booking_items where booking_id=b.id for update loop
   qty:=bi.quantity-bi.picked_up_quantity;
   if qty<=0 then continue; end if;
   if (select tracking_mode='asset' from public.items where id=bi.item_id) then
    select array_agg(ba.asset_id) into assets from public.booking_item_assets ba join public.inventory_assets a on a.id=ba.asset_id where ba.booking_item_id=bi.id and ba.released_at is null and a.status in ('available','reserved');
    if coalesce(cardinality(assets),0)<>qty then raise exception 'Scan all asset tags before pickup'; end if;
    update public.inventory_assets set status='out',updated_at=now() where id=any(assets);
   end if;
   insert into public.booking_item_fulfilments(business_id,branch_id,booking_id,booking_item_id,event_type,quantity,performed_by,idempotency_key) values(b.business_id,b.branch_id,b.id,bi.id,'pickup',qty,s.id,p_key||':'||bi.id);
   update public.booking_items set picked_up_quantity=quantity where id=bi.id;
  end loop;
 elsif requested='cancelled' then
  if b.status not in ('draft','quote','hold','confirmed') then raise exception 'Only unissued bookings can be cancelled'; end if;
  select array_agg(ba.asset_id) into assets from public.booking_item_assets ba join public.booking_items i on i.id=ba.booking_item_id where i.booking_id=b.id and ba.released_at is null;
  update public.inventory_assets set status='available',updated_at=now() where id=any(assets) and status='reserved';
  update public.booking_item_assets set released_at=now(),released_by=s.id where asset_id=any(assets) and booking_item_id in(select id from public.booking_items where booking_id=b.id) and released_at is null;
 elsif requested='closed' then
  if b.status<>'returned' or b.balance_due>0 or not exists(select 1 from public.booking_items where booking_id=b.id) or exists(select 1 from public.booking_items where booking_id=b.id and returned_quantity<coalesce(nullif(picked_up_quantity,0),quantity)) then raise exception 'Receive all items and collect the rental balance first'; end if;
 elsif requested in ('hold','confirmed') then
  if b.status not in ('draft','quote','hold','confirmed') then raise exception 'Cannot change a completed or issued booking to this status'; end if;
 else raise exception 'Unsupported booking status'; end if;
 update public.bookings set status=final_status::public.rental_booking_status,last_updated_by=s.id,updated_at=now(),
 actual_pickup_at=case when requested='picked_up' then now() else actual_pickup_at end,
 pickup_completed_at=case when requested='picked_up' then now() else pickup_completed_at end,
 actual_return_at=case when final_status='returned' then now() else actual_return_at end,
 return_completed_at=case when final_status='returned' then now() else return_completed_at end,
 cancelled_at=case when requested='cancelled' then now() else cancelled_at end,
 closed_at=case when final_status='closed' then now() else closed_at end where id=b.id;
 if p_input->'settlement' is not null and p_input->'settlement'<>'null'::jsonb then
 perform private.settle_booking_deposit(b.id,(p_input->'settlement'->>'refund')::numeric,(p_input->'settlement'->>'deduction')::numeric,p_input->'settlement'->>'method',p_input->'settlement'->>'note',p_key||':deposit');
 end if;
 select jsonb_build_object('success',true,'booking',to_jsonb(x)) into output from public.bookings x where id=b.id;
 insert into public.command_receipts(business_id,idempotency_key,command_name,actor_id,request_payload,response_payload) values(b.business_id,p_key,'booking.transition',s.id,jsonb_build_object('booking_id',p_booking_id,'input',p_input),output);
 return output;
end $$;
revoke all on function private.apply_booking_command(uuid,jsonb,text) from public,anon;
grant execute on function private.apply_booking_command(uuid,jsonb,text) to authenticated;
create or replace function public.apply_booking_command(p_booking_id uuid,p_input jsonb,p_key text) returns jsonb language sql security invoker set search_path='' as $$ select private.apply_booking_command(p_booking_id,p_input,p_key) $$;
revoke all on function public.apply_booking_command(uuid,jsonb,text) from public,anon;
grant execute on function public.apply_booking_command(uuid,jsonb,text) to authenticated;
