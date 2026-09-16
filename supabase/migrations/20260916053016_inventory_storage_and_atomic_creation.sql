insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('images','images',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy business_images_read on storage.objects for select to authenticated
using (bucket_id='images' and exists (select 1 from public.staff s where s.id=auth.uid() and s.status='active' and s.business_id::text=(storage.foldername(name))[1]));
create policy business_images_insert on storage.objects for insert to authenticated
with check (bucket_id='images' and exists (select 1 from public.staff s where s.id=auth.uid() and s.status='active' and s.business_id::text=(storage.foldername(name))[1] and (((storage.foldername(name))[2]='items' and private.has_business_permission(s.business_id,'manage_inventory')) or ((storage.foldername(name))[2]='logos' and private.has_business_permission(s.business_id,'manage_settings')))));
create policy business_images_delete on storage.objects for delete to authenticated
using (bucket_id='images' and exists (select 1 from public.staff s where s.id=auth.uid() and s.status='active' and s.business_id::text=(storage.foldername(name))[1] and (((storage.foldername(name))[2]='items' and private.has_business_permission(s.business_id,'manage_inventory')) or ((storage.foldername(name))[2]='logos' and private.has_business_permission(s.business_id,'manage_settings')))));

create or replace function public.create_inventory_item(p_item jsonb,p_variants jsonb)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare s public.staff; v_item uuid; v_variant uuid; v jsonb; sku_value text;
begin
 select * into s from public.staff where id=auth.uid() and status='active';
 if s.business_id is null or s.branch_id is null or not private.has_business_permission(s.business_id,'manage_inventory') then raise exception 'Inventory permission and active branch required'; end if;
 if nullif(trim(p_item->>'name'),'') is null or nullif(trim(p_item->>'category'),'') is null or coalesce((p_item->>'price')::numeric,0)<=0 then raise exception 'Item name, category and a positive price are required'; end if;
 if jsonb_typeof(p_variants)<>'array' or jsonb_array_length(p_variants)=0 then raise exception 'At least one size is required'; end if;
 if exists(select 1 from jsonb_array_elements(p_variants) a where nullif(trim(a->>'size'),'') is null or coalesce((a->>'total_stock')::numeric,0)<1 or (a->>'total_stock')::numeric<>trunc((a->>'total_stock')::numeric) or (a->>'price_override')::numeric<0) then raise exception 'Each size needs whole-number stock and a valid price'; end if;
 if (select count(*) from jsonb_array_elements(p_variants))<>(select count(distinct lower(trim(a->>'size'))) from jsonb_array_elements(p_variants) a) then raise exception 'Each size must be unique'; end if;
 sku_value:=coalesce(nullif(trim(p_item->>'sku'),''),upper(left(p_item->>'category',3))||'-'||upper(left(gen_random_uuid()::text,8)));
 insert into public.items(business_id,branch_id,name,sku,category,description,price,deposit_amount,purchase_cost,storage_location,cover_image_url,tracking_mode,replacement_value,is_active,status,created_by)
 values(s.business_id,s.branch_id,trim(p_item->>'name'),sku_value,p_item->>'category',nullif(p_item->>'description',''),(p_item->>'price')::numeric,coalesce((p_item->>'deposit_amount')::numeric,0),(p_item->>'purchase_price')::numeric,nullif(p_item->>'storage_location',''),nullif(p_item->>'cover_image_url',''),coalesce((p_item->>'tracking_mode')::public.inventory_tracking_mode,'quantity'),coalesce((p_item->>'replacement_value')::numeric,0),true,'available',s.id) returning id into v_item;
 for v in select * from jsonb_array_elements(p_variants) loop
 insert into public.item_variants(business_id,branch_id,item_id,size,total_stock,price_override,status) values(s.business_id,s.branch_id,v_item,trim(v->>'size'),(v->>'total_stock')::integer,(v->>'price_override')::numeric,'available') returning id into v_variant;
 insert into public.inventory_movements(business_id,branch_id,item_id,item_variant_id,movement_type,quantity_delta,quantity_before,quantity_after,performed_by) values(s.business_id,s.branch_id,v_item,v_variant,'opening',(v->>'total_stock')::integer,0,(v->>'total_stock')::integer,s.id);
 end loop;
 if nullif(p_item->>'cover_image_url','') is not null then insert into public.item_images(item_id,url,is_cover,display_order,uploaded_by) values(v_item,p_item->>'cover_image_url',true,0,s.id); end if;
 insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,new_value) values(s.business_id,s.branch_id,s.id,'item.created','items',v_item,jsonb_build_object('name',p_item->>'name','sku',sku_value));
 return v_item;
end $$;
revoke all on function public.create_inventory_item(jsonb,jsonb) from public,anon;
grant execute on function public.create_inventory_item(jsonb,jsonb) to authenticated;
create policy customer_documents_read on storage.objects for select to authenticated
using (bucket_id='customer-private' and exists(select 1 from public.staff s where s.id=auth.uid() and s.status='active' and s.business_id::text=(storage.foldername(name))[1]));
create policy customer_documents_insert on storage.objects for insert to authenticated
with check (bucket_id='customer-private' and (storage.foldername(name))[2]='customers' and exists(select 1 from public.staff s where s.id=auth.uid() and s.status='active' and s.business_id::text=(storage.foldername(name))[1] and (private.has_business_permission(s.business_id,'manage_customers') or private.has_business_permission(s.business_id,'manage_bookings'))));

-- Enforce saved branch rules and GST for new bookings.
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
  select br.prefix into prefix from public.branches br where br.id=branch;
  booking_number:=coalesce(prefix,'FAB') || '-' || to_char(current_date,'YYMMDD') || '-' || upper(substr(gen_random_uuid()::text,1,8));
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
    update public.booking_items set price=rate,discount_percent=disc,updated_at=now() where id=(line->>'id')::uuid and booking_id=b.id;
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
