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
  if jsonb_typeof(coalesce(p_input->'payments','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(p_input->'payments','[]'::jsonb))>2 then raise exception 'Invalid pickup payments'; end if;
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

-- Only activity after this migration triggers closing; no historical backfill.
create or replace function private.close_completed_booking() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='returned' and new.balance_due=0 and (new.status is distinct from old.status or new.balance_due is distinct from old.balance_due)
 and exists(select 1 from public.booking_items where booking_id=new.id)
 and not exists(select 1 from public.booking_items where booking_id=new.id and returned_quantity<coalesce(nullif(picked_up_quantity,0),quantity)) then
  new.status:='closed'; new.closed_at:=clock_timestamp();
 end if;
 if new.status='closed' and old.status<>'closed' and (new.balance_due<>0 or not exists(select 1 from public.booking_items where booking_id=new.id) or exists(select 1 from public.booking_items where booking_id=new.id and returned_quantity<coalesce(nullif(picked_up_quantity,0),quantity))) then raise exception 'Receive all issued items and complete rental payment before closing'; end if;
 return new;
end $$;
revoke all on function private.close_completed_booking() from public,anon,authenticated;
create trigger close_completed_booking before update on public.bookings for each row execute function private.close_completed_booking();
create or replace function private.audit_booking_transition() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.status is distinct from new.status then
 insert into public.booking_timeline(booking_id,business_id,event_type,event_description,performed_by,old_values,new_values) values(new.id,new.business_id,'status.'||new.status,'Booking changed from '||old.status||' to '||new.status,auth.uid(),jsonb_build_object('status',old.status),jsonb_build_object('status',new.status));
 insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,old_value,new_value) values(new.business_id,new.branch_id,auth.uid(),'booking.status_changed','bookings',new.id,jsonb_build_object('status',old.status),jsonb_build_object('status',new.status));
 end if; return null;
end $$;
revoke all on function private.audit_booking_transition() from public,anon,authenticated;
create trigger audit_booking_transition after update on public.bookings for each row execute function private.audit_booking_transition();
-- Deposit settlement remains available after automatic closure.
create or replace function private.settle_booking_deposit(p_booking_id uuid,p_refund numeric,p_deduction numeric,p_method text,p_note text,p_key text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.bookings%rowtype; held numeric; payload jsonb; prior public.command_receipts%rowtype;
begin
 select * into b from public.bookings where id=p_booking_id for update;
 if b.id is null or not private.can_access_branch(b.business_id,b.branch_id) or not (private.has_business_permission(b.business_id,'settle_deposits') or private.has_business_permission(b.business_id,'manage_payments')) then raise exception 'Deposit settlement permission required'; end if;
 if p_key is null or length(p_key) not between 1 and 150 then raise exception 'Request identifier required'; end if;
 payload:=jsonb_build_object('booking_id',p_booking_id,'refund',p_refund,'deduction',p_deduction,'method',p_method,'note',p_note);
 perform pg_advisory_xact_lock(hashtextextended(b.business_id::text||p_key,0));
 select * into prior from public.command_receipts where business_id=b.business_id and idempotency_key=p_key;
 if found then if prior.command_name<>'deposit.settle' or prior.request_payload<>payload then raise exception 'Request identifier already used'; end if; return prior.response_payload; end if;
 if p_refund is null or p_deduction is null or p_refund<0 or p_deduction<0 or p_refund+p_deduction<=0 or p_refund::text in ('NaN','Infinity') or p_deduction::text in ('NaN','Infinity') then raise exception 'Enter valid settlement amounts'; end if;
 if p_refund<>round(p_refund,2) or p_deduction<>round(p_deduction,2) then raise exception 'Use at most two decimal places'; end if;
 if p_method is null or p_method not in ('cash','upi','card','bank_transfer') then raise exception 'Choose a payment method'; end if;
 if p_deduction>0 and nullif(trim(p_note),'') is null then raise exception 'Deduction reason required'; end if;
 select coalesce(sum(case when type='deposit' then amount when type='deposit_refund' then -amount else 0 end),0) into held from public.booking_payments where booking_id=b.id and not is_voided;
 held:=held-coalesce((select sum(amount) from public.deposit_ledger where booking_id=b.id and entry_type='deduction'),0);
 if round(p_refund+p_deduction,2)>held then raise exception 'Settlement exceeds deposit held'; end if;
 if p_deduction>0 then
 insert into public.financial_entries(business_id,branch_id,booking_id,customer_id,entry_type,amount,note,posted_by,idempotency_key) values(b.business_id,b.branch_id,b.id,b.customer_id,'deposit_deduction',p_deduction,p_note,auth.uid(),'settlement-deduction:'||p_key);
 insert into public.deposit_ledger(business_id,branch_id,booking_id,entry_type,amount,note,created_by) values(b.business_id,b.branch_id,b.id,'deduction',round(p_deduction,2),p_note,auth.uid()); end if;
 if p_refund>0 then
 insert into public.financial_entries(business_id,branch_id,booking_id,customer_id,entry_type,amount,payment_method,note,posted_by,idempotency_key) values(b.business_id,b.branch_id,b.id,b.customer_id,'deposit_refund',round(p_refund,2),p_method,p_note,auth.uid(),'settlement:'||p_key);
 insert into public.booking_payments(booking_id,business_id,branch_id,type,amount,method,notes,collected_by) values(b.id,b.business_id,b.branch_id,'deposit_refund',round(p_refund,2),p_method,p_note,auth.uid());
 insert into public.deposit_ledger(business_id,branch_id,booking_id,entry_type,amount,payment_method,note,created_by) values(b.business_id,b.branch_id,b.id,'refund',round(p_refund,2),p_method,p_note,auth.uid());
 end if;
 update public.bookings set deposit_amount=held-round(p_refund+p_deduction,2),updated_at=now() where id=b.id;
 insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,new_value) values(b.business_id,b.branch_id,auth.uid(),'deposit.settled','bookings',b.id,payload);
 insert into public.command_receipts(business_id,idempotency_key,command_name,actor_id,request_payload,response_payload) values(b.business_id,p_key,'deposit.settle',auth.uid(),payload,jsonb_build_object('success',true));
 return jsonb_build_object('success',true);
end $$;
revoke all on function private.settle_booking_deposit(uuid,numeric,numeric,text,text,text) from public,anon;
grant execute on function private.settle_booking_deposit(uuid,numeric,numeric,text,text,text) to authenticated;
create or replace function public.settle_booking_deposit(p_booking_id uuid,p_refund numeric,p_deduction numeric,p_method text,p_note text,p_key text) returns jsonb language sql security invoker set search_path='' as $$ select private.settle_booking_deposit(p_booking_id,p_refund,p_deduction,p_method,p_note,p_key) $$;
revoke all on function public.settle_booking_deposit(uuid,numeric,numeric,text,text,text) from public,anon;
grant execute on function public.settle_booking_deposit(uuid,numeric,numeric,text,text,text) to authenticated;

-- Current-branch customer facts: no independently drifting counters.
create or replace view public.customer_branch_summary with (security_invoker=true) as
select c.id,c.business_id,c.branch_id,c.name,c.phone,c.email,c.address,c.id_type,c.id_number,c.id_proof_url,c.profile_photo_url,c.blacklisted,c.blacklist_reason as blacklisted_reason,c.blacklisted_at,c.created_at,c.archived_at,c.risk_status,
 (select count(*) from public.bookings b where b.customer_id=c.id and b.branch_id=c.branch_id and b.status not in ('draft','quote','cancelled')) as total_bookings,
 coalesce((select sum(case when p.type in ('advance','balance','penalty') then p.amount when p.type='refund' then -p.amount else 0 end) from public.booking_payments p join public.bookings b on b.id=p.booking_id where b.customer_id=c.id and b.branch_id=c.branch_id and not p.is_voided),0) as total_spent,
 coalesce((select sum(b.balance_due) from public.bookings b where b.customer_id=c.id and b.branch_id=c.branch_id and b.status not in ('draft','quote','cancelled')),0) as outstanding_balance,
 (select max(b.created_at) from public.bookings b where b.customer_id=c.id and b.branch_id=c.branch_id) as last_booking_at
from public.customers c;
grant select on public.customer_branch_summary to authenticated;

create or replace function private.sync_booking_payment_totals()
returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid; b public.bookings%rowtype; paid numeric; advance numeric; deposit numeric;
begin
  target:=case when TG_OP='DELETE' then old.booking_id else new.booking_id end;
  select * into b from public.bookings where id=target for update;
  if b.id is null then return null; end if;
  if auth.uid() is not null then
    if not private.can_access_branch(b.business_id,b.branch_id) or not (private.has_business_permission(b.business_id,'manage_payments') or (TG_OP='INSERT' and new.type='deposit_refund' and private.has_business_permission(b.business_id,'settle_deposits'))) then raise exception 'Payment permission required'; end if;
  elsif coalesce(current_setting('role',true),'') not in ('postgres','service_role','none') then
    raise exception 'Authenticated payment context required';
  end if;
  if TG_OP='UPDATE' and old.booking_id<>new.booking_id then raise exception 'Payments cannot move between bookings'; end if;
  select coalesce(sum(case when type in ('advance','balance') then amount when type='refund' then -amount else 0 end),0),
    coalesce(sum(case when type='advance' then amount else 0 end),0),
    coalesce(sum(case when type='deposit' then amount when type='deposit_refund' then -amount else 0 end),0)
    into paid,advance,deposit from public.booking_payments where booking_id=target and not is_voided;
  update public.bookings set amount_paid=paid,advance_amount=advance,deposit_amount=greatest(0,deposit-coalesce((select sum(amount) from public.deposit_ledger where booking_id=target and entry_type='deduction'),0)),balance_due=greatest(0,total_amount-paid),updated_at=clock_timestamp() where id=target;
  return null;
end;
$$;
revoke all on function private.sync_booking_payment_totals() from public,anon,authenticated;
-- Home assignment is an access grant; active branch selection is not.
alter table public.staff add column home_branch_id uuid references public.branches(id);
update public.staff set home_branch_id=branch_id;
create index staff_home_branch_idx on public.staff(home_branch_id);
create or replace function private.can_access_branch(target_business_id uuid,target_branch_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff s join public.branches b on b.id=target_branch_id and b.business_id=s.business_id and b.status='active'
 where s.id=auth.uid() and s.business_id=target_business_id and s.status in ('active','approved')
 and (s.role in ('owner','super_admin') or s.home_branch_id=target_branch_id or (coalesce((s.permissions->>'switch_branches')::boolean,false)
 and exists(select 1 from public.staff_branch_memberships m where m.staff_id=s.id and m.business_id=s.business_id and m.branch_id=target_branch_id))))
$$;
-- Even staff managers cannot give themselves branch-switching privileges.
create or replace function private.guard_staff_branch_grants() returns trigger language plpgsql security definer set search_path='' as $$
declare owner_actor boolean;
begin
 if TG_OP='INSERT' and new.home_branch_id is null then new.home_branch_id:=new.branch_id; end if;
 if new.home_branch_id is not null and not exists(select 1 from public.branches where id=new.home_branch_id and business_id=new.business_id) then raise exception 'Home branch must belong to the staff business'; end if;
 if auth.uid() is null then return new; end if;
 select exists(select 1 from public.staff s where s.id=auth.uid() and s.business_id=new.business_id and s.role in ('owner','super_admin') and s.status in ('active','approved')) into owner_actor;
 if TG_OP='INSERT' then
  if new.home_branch_id is null then new.home_branch_id:=new.branch_id; end if;
  if coalesce((new.permissions->>'switch_branches')::boolean,false) and not owner_actor then raise exception 'Only the owner can grant branch switching'; end if;
 elsif (new.home_branch_id is distinct from old.home_branch_id or (new.permissions->'switch_branches') is distinct from (old.permissions->'switch_branches')) and not owner_actor then raise exception 'Only the owner can change branch access'; end if;
 return new;
end $$;
revoke all on function private.guard_staff_branch_grants() from public,anon,authenticated;
create trigger guard_staff_branch_grants before insert or update on public.staff for each row execute function private.guard_staff_branch_grants();
create or replace function private.set_staff_branch_access(p_staff_id uuid,p_home uuid,p_switch boolean,p_branches uuid[])
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.staff%rowtype; target public.staff%rowtype;
begin
 select * into actor from public.staff where id=auth.uid();
 if actor.id is null or actor.role not in ('owner','super_admin') or actor.status not in ('active','approved') then raise exception 'Owner access required'; end if;
 select * into target from public.staff where id=p_staff_id and business_id=actor.business_id for update;
 if target.id is null or target.role in ('owner','super_admin') then raise exception 'Choose a staff account in your business'; end if;
 if p_home is null or not exists(select 1 from public.branches where id=p_home and business_id=actor.business_id and status='active') then raise exception 'Choose an active home branch'; end if;
 if exists(select 1 from unnest(coalesce(p_branches,'{}'::uuid[])) x where not exists(select 1 from public.branches where id=x and business_id=actor.business_id and status='active')) then raise exception 'Invalid allowed branch'; end if;
 delete from public.staff_branch_memberships where staff_id=target.id and business_id=actor.business_id;
 insert into public.staff_branch_memberships(staff_id,business_id,branch_id) select target.id,actor.business_id,x from (select distinct unnest(coalesce(p_branches,'{}'::uuid[])) x) t where p_switch;
 update public.staff set home_branch_id=p_home, permissions=jsonb_set(coalesce(permissions,'{}'::jsonb),'{switch_branches}',to_jsonb(coalesce(p_switch,false))),
 branch_id=case when branch_id=p_home or (p_switch and branch_id=any(coalesce(p_branches,'{}'::uuid[]))) then branch_id else p_home end where id=target.id;
 insert into public.audit_log(business_id,branch_id,staff_id,action,table_name,record_id,new_value) values(actor.business_id,p_home,actor.id,'staff.branch_access_changed','staff',target.id,jsonb_build_object('home_branch_id',p_home,'switch_branches',p_switch,'branches',p_branches));
end $$;
revoke all on function private.set_staff_branch_access(uuid,uuid,boolean,uuid[]) from public,anon;
grant execute on function private.set_staff_branch_access(uuid,uuid,boolean,uuid[]) to authenticated;
create function public.set_staff_branch_access(p_staff_id uuid,p_home uuid,p_switch boolean,p_branches uuid[]) returns void language sql security invoker set search_path='' as $$ select private.set_staff_branch_access(p_staff_id,p_home,p_switch,p_branches) $$;
revoke all on function public.set_staff_branch_access(uuid,uuid,boolean,uuid[]) from public,anon;
grant execute on function public.set_staff_branch_access(uuid,uuid,boolean,uuid[]) to authenticated;

create function public.save_branch(p_id uuid,p_input jsonb) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare s public.staff%rowtype; result public.branches%rowtype; prefix_value text; manager uuid;
begin
 select * into s from public.staff where id=auth.uid();
 if s.id is null or not private.has_business_permission(s.business_id,'manage_settings') then raise exception 'Settings permission required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(s.business_id::text||':branches',0));
 if length(trim(coalesce(p_input->>'name','')))<2 then raise exception 'Branch name must contain at least two characters'; end if;
 prefix_value:=upper(trim(p_input->>'prefix'));
 if prefix_value is null or prefix_value!~'^[A-Z0-9]{2,8}$' then raise exception 'Prefix must have 2 to 8 letters or numbers'; end if;
 if exists(select 1 from public.branches where business_id=s.business_id and upper(prefix)=prefix_value and (p_id is null or id<>p_id)) then raise exception 'This booking prefix is already in use'; end if;
 manager:=nullif(p_input->>'manager_id','')::uuid;
 if manager is not null and not exists(select 1 from public.staff where id=manager and business_id=s.business_id and status in ('active','approved')) then raise exception 'Choose an active staff member'; end if;
 if coalesce(p_input->>'email','')<>'' and p_input->>'email'!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Enter a valid email'; end if;
 if coalesce((p_input->>'is_default')::boolean,false) then update public.branches set is_default=false where business_id=s.business_id and is_default; end if;
 if p_id is null then
 insert into public.branches(business_id,name,prefix,city,address,phone,email,is_default,settings) values(s.business_id,trim(p_input->>'name'),prefix_value,nullif(p_input->>'city',''),nullif(p_input->>'address',''),nullif(p_input->>'phone',''),nullif(p_input->>'email',''),coalesce((p_input->>'is_default')::boolean,false),jsonb_build_object('manager_id',manager)) returning * into result;
 else
 update public.branches set name=trim(p_input->>'name'),prefix=prefix_value,city=nullif(p_input->>'city',''),address=nullif(p_input->>'address',''),phone=nullif(p_input->>'phone',''),email=nullif(p_input->>'email',''),is_default=coalesce((p_input->>'is_default')::boolean,false),settings=coalesce(settings,'{}'::jsonb)||jsonb_build_object('manager_id',manager) where id=p_id and business_id=s.business_id returning * into result;
 if result.id is null then raise exception 'Branch not accessible'; end if;
 end if;
 if not exists(select 1 from public.branches where business_id=s.business_id and is_default) then raise exception 'Keep one default branch'; end if;
 return to_jsonb(result);
end $$;
revoke all on function public.save_branch(uuid,jsonb) from public,anon;
grant execute on function public.save_branch(uuid,jsonb) to authenticated;

-- Web Push subscriptions are private to the signed-in staff member.
create table public.push_subscriptions (
 id uuid primary key default gen_random_uuid(), staff_id uuid not null references public.staff(id) on delete cascade,
 business_id uuid not null references public.businesses(id) on delete cascade,
 endpoint text not null unique, p256dh text not null, auth_key text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index push_subscriptions_staff_idx on public.push_subscriptions(staff_id);
create index push_subscriptions_business_idx on public.push_subscriptions(business_id);
alter table public.push_subscriptions enable row level security;
create policy push_subscription_own_read on public.push_subscriptions for select to authenticated using(staff_id=auth.uid() and private.can_access_business(business_id));
create policy push_subscription_own_insert on public.push_subscriptions for insert to authenticated with check(staff_id=auth.uid() and private.can_access_business(business_id));
create policy push_subscription_own_update on public.push_subscriptions for update to authenticated using(staff_id=auth.uid() and private.can_access_business(business_id)) with check(staff_id=auth.uid() and private.can_access_business(business_id));
create policy push_subscription_own_delete on public.push_subscriptions for delete to authenticated using(staff_id=auth.uid());
grant select,insert,update,delete on public.push_subscriptions to authenticated,service_role;
alter table public.message_outbox drop constraint message_outbox_channel_check;
alter table public.message_outbox add constraint message_outbox_channel_check check(channel in ('sms','whatsapp','in_app','push'));
alter table public.message_outbox add column dedupe_key text unique;
alter table public.notifications add column dedupe_key text unique;
create or replace function private.staff_receives_event(p_staff uuid,p_business uuid,p_branch uuid,p_event text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.staff s where s.id=p_staff and s.business_id=p_business and s.status in ('active','approved')
 and exists(select 1 from public.branches b where b.id=p_branch and b.business_id=p_business and b.status='active')
 and (s.role in ('owner','super_admin') or s.home_branch_id=p_branch or (coalesce((s.permissions->>'switch_branches')::boolean,false) and exists(select 1 from public.staff_branch_memberships m where m.staff_id=s.id and m.business_id=p_business and m.branch_id=p_branch)))
 and (s.role in ('owner','super_admin') or coalesce((s.permissions->>case when p_event='payment' then 'manage_payments' else 'manage_bookings' end)::boolean,false)
 or exists(select 1 from public.staff_role_assignments a join public.business_roles r on r.id=a.role_id where a.staff_id=s.id and r.business_id=p_business and coalesce((r.permissions->>case when p_event='payment' then 'manage_payments' else 'manage_bookings' end)::boolean,false))))
$$;
revoke all on function private.staff_receives_event(uuid,uuid,uuid,text) from public,anon,authenticated;
create or replace function private.enqueue_booking_push(p_booking uuid,p_event text,p_key text,p_schedule jsonb default null) returns void language plpgsql security definer set search_path='' as $$
declare b public.bookings%rowtype; branch public.branches%rowtype; member record; subscription record; title text; payload jsonb;
begin
 select * into b from public.bookings where id=p_booking; if b.id is null then return; end if;
 select * into branch from public.branches where id=b.branch_id;
 if not coalesce((branch.settings->'push'->>'enabled')::boolean,true) or not coalesce((branch.settings->'push'->'events'->>p_event)::boolean,true) then return; end if;
 title:=case p_event when 'booking' then 'New booking' when 'payment' then 'Payment recorded' when 'pickup' then 'Items picked up' when 'return' then 'Items received' when 'pickup_reminder' then 'Pickup reminder' when 'return_reminder' then 'Return reminder' when 'overdue' then 'Overdue return' else null end;
 if title is null then return; end if;
 payload:=jsonb_build_object('event',p_event,'title',title,'body',branch.name,'url','/bookings/'||b.id,'schedule',p_schedule);
 for member in select s.id from public.staff s where private.staff_receives_event(s.id,b.business_id,b.branch_id,p_event) loop
  insert into public.notifications(business_id,branch_id,target_staff_id,type,title,body,action_url,dedupe_key) values(b.business_id,b.branch_id,member.id,p_event,title,branch.name,'/bookings/'||b.id,p_key||':'||member.id) on conflict(dedupe_key) do nothing;
  for subscription in select id from public.push_subscriptions where staff_id=member.id and business_id=b.business_id loop
   insert into public.message_outbox(business_id,branch_id,booking_id,channel,recipient,payload,dedupe_key,next_attempt_at) values(b.business_id,b.branch_id,b.id,'push',subscription.id::text,payload,p_key||':'||subscription.id,now()) on conflict(dedupe_key) do nothing;
  end loop;
 end loop;
end $$;
revoke all on function private.enqueue_booking_push(uuid,text,text,jsonb) from public,anon,authenticated;
create function private.booking_push_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_TABLE_NAME='financial_entries' then
  if new.booking_id is not null and new.entry_type in ('payment','refund','deposit_collection','deposit_refund') then perform private.enqueue_booking_push(new.booking_id,'payment','payment:'||new.id); end if;
 elsif TG_OP='INSERT' then
  if new.status='confirmed' then perform private.enqueue_booking_push(new.id,'booking','booking:'||new.id); end if;
 else
  if new.status='confirmed' and old.status in ('draft','quote','hold') then perform private.enqueue_booking_push(new.id,'booking','booking:'||new.id); end if;
  if new.status='picked_up' and old.status<>new.status then perform private.enqueue_booking_push(new.id,'pickup','pickup:'||new.id); end if;
  if new.return_completed_at is not null and old.return_completed_at is null then perform private.enqueue_booking_push(new.id,'return','return:'||new.id); end if;
 end if; return null;
end $$;
revoke all on function private.booking_push_event() from public,anon,authenticated;
create trigger booking_push_event after insert or update on public.bookings for each row execute function private.booking_push_event();
create trigger payment_push_event after insert on public.financial_entries for each row execute function private.booking_push_event();
create function public.enqueue_push_reminders() returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare row record; reminder jsonb; due timestamptz; event_date date; local_day date; schedule jsonb;
begin
 for row in select b.id,b.status,b.pickup_date,b.return_date,br.settings,coalesce(biz.timezone,'Asia/Kolkata') as tz from public.bookings b join public.branches br on br.id=b.branch_id join public.businesses biz on biz.id=b.business_id where b.status in ('confirmed','hold','picked_up','partially_returned') and br.status='active' loop
  local_day:=(now() at time zone row.tz)::date;
  for reminder in select value from jsonb_array_elements(coalesce(row.settings->'push'->'reminders','[{"event":"pickup_reminder","days_before":1,"time":"18:00"},{"event":"return_reminder","days_before":1,"time":"18:00"},{"event":"overdue","days_before":0,"time":"18:00"}]'::jsonb)) loop
   if reminder->>'event'='pickup_reminder' and row.status in ('confirmed','hold') then event_date:=row.pickup_date;
   elsif reminder->>'event'='return_reminder' and row.status in ('picked_up','partially_returned') then event_date:=row.return_date;
   elsif reminder->>'event'='overdue' and row.status in ('picked_up','partially_returned') and row.return_date<local_day then event_date:=local_day;
   else continue; end if;
   due:=((event_date-coalesce((reminder->>'days_before')::integer,0))+(reminder->>'time')::time) at time zone row.tz;
   if due<=now() and due>now()-interval '24 hours' then
    schedule:=jsonb_build_object('rule',reminder,'pickup_date',row.pickup_date,'return_date',row.return_date,'due',due);
    perform private.enqueue_booking_push(row.id,reminder->>'event','reminder:'||row.id||':'||(reminder->>'event')||':'||due::text,schedule);
   end if;
  end loop;
 end loop;
end $$;
revoke all on function public.enqueue_push_reminders() from public,anon,authenticated;
grant execute on function public.enqueue_push_reminders() to service_role;
grant execute on function private.enqueue_booking_push(uuid,text,text,jsonb) to service_role;
create function public.claim_push_deliveries() returns setof public.message_outbox language sql security invoker set search_path=public,pg_temp as $$
 update public.message_outbox set status='sending',attempt_count=attempt_count+1,next_attempt_at=now()+interval '5 minutes' where id in (
 select id from public.message_outbox where channel='push' and status in ('queued','failed','sending') and coalesce(next_attempt_at,created_at)<=now() and attempt_count<5 order by created_at for update skip locked limit 50) returning *
$$;
revoke all on function public.claim_push_deliveries() from public,anon,authenticated;
grant execute on function public.claim_push_deliveries() to service_role;
create function public.push_recipient_allowed(p_staff uuid,p_business uuid,p_branch uuid,p_event text) returns boolean language sql security invoker set search_path='' as $$select private.staff_receives_event(p_staff,p_business,p_branch,p_event)$$;
revoke all on function public.push_recipient_allowed(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.push_recipient_allowed(uuid,uuid,uuid,text) to service_role;
grant execute on function private.staff_receives_event(uuid,uuid,uuid,text) to service_role;

-- Membership edits are owner-controlled even when a manager can administer staff.
create function private.guard_branch_membership_owner() returns trigger language plpgsql security definer set search_path='' as $$
declare target_business uuid;
begin
 target_business:=case when TG_OP='DELETE' then old.business_id else new.business_id end;
 if auth.uid() is not null and not exists(select 1 from public.staff where id=auth.uid() and business_id=target_business and role in ('owner','super_admin') and status in ('active','approved')) then raise exception 'Only the owner can change branch access'; end if;
 if TG_OP='DELETE' then return old; end if;
 if not exists(select 1 from public.staff s join public.branches b on b.business_id=s.business_id where s.id=new.staff_id and b.id=new.branch_id and s.business_id=new.business_id) then raise exception 'Branch and staff must belong to the same business'; end if;
 return new;
end $$;
revoke all on function private.guard_branch_membership_owner() from public,anon,authenticated;
create trigger guard_branch_membership_owner before insert or update or delete on public.staff_branch_memberships for each row execute function private.guard_branch_membership_owner();

create function public.save_push_settings(p_branch uuid,p_settings jsonb) returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare b public.branches%rowtype; rule jsonb;
begin
 select * into b from public.branches where id=p_branch for update;
 if b.id is null or not private.can_access_branch(b.business_id,b.id) or not private.has_business_permission(b.business_id,'manage_settings') then raise exception 'Settings permission required'; end if;
 if jsonb_typeof(p_settings->'enabled') is distinct from 'boolean' or jsonb_typeof(p_settings->'events') is distinct from 'object' or jsonb_typeof(p_settings->'reminders') is distinct from 'array' then raise exception 'Invalid notification settings'; end if;
 if jsonb_array_length(p_settings->'reminders')>10 then raise exception 'At most 10 reminder schedules are allowed'; end if;
 if exists(select 1 from jsonb_each(p_settings->'events') e where e.key not in ('booking','payment','pickup','return','pickup_reminder','return_reminder','overdue') or jsonb_typeof(e.value)<>'boolean') then raise exception 'Invalid event setting'; end if;
 for rule in select value from jsonb_array_elements(p_settings->'reminders') loop
  if rule->>'event' is null or rule->>'event' not in ('pickup_reminder','return_reminder','overdue') or coalesce(rule->>'time','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or coalesce(rule->>'days_before','') !~ '^[0-9]{1,2}$' or (rule->>'days_before')::integer>30 then raise exception 'Choose a valid reminder event, time and days (0–30)'; end if;
  if rule->>'event'='overdue' and (rule->>'days_before')::integer<>0 then raise exception 'Overdue reminders use zero days before'; end if;
 end loop;
 update public.branches set settings=jsonb_set(coalesce(settings,'{}'::jsonb),'{push}',p_settings),updated_at=now() where id=b.id;
end $$;
revoke all on function public.save_push_settings(uuid,jsonb) from public,anon;
grant execute on function public.save_push_settings(uuid,jsonb) to authenticated;

alter table public.financial_entries add column payment_request jsonb;
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
  v_request jsonb;
  v_deposit numeric;
begin
  if p_idempotency_key is null or length(p_idempotency_key) not between 1 and 150 then raise exception 'Request identifier required'; end if;
  if p_amount<>round(p_amount,2) then raise exception 'Use at most two decimal places'; end if;
  v_request:=jsonb_build_object('booking_id',p_booking_id,'type',p_payment_type,'amount',p_amount,'method',p_payment_method,'reference',p_reference_number,'note',p_note);
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
  if v_booking.id is not null and not private.can_access_branch(v_booking.business_id,v_booking.branch_id) then raise exception 'Booking not accessible'; end if;
  if v_booking.id is null then raise exception 'Booking not found'; end if;

  if exists (
    select 1 from public.cash_sessions
    where branch_id = v_booking.branch_id and business_date = current_date and status = 'closed'
  ) then raise exception 'This branch day is closed; post a reversal or refund on an open day'; end if;

  perform pg_advisory_xact_lock(hashtextextended(v_booking.business_id::text||p_idempotency_key,0));
  if p_idempotency_key is not null then
    select id into v_financial_id
    from public.financial_entries
    where business_id = v_booking.business_id and idempotency_key = p_idempotency_key;
    if v_financial_id is not null then
      if not exists(select 1 from public.financial_entries where id=v_financial_id and payment_request=v_request) then raise exception 'Request identifier already used for another payment'; end if;
      return v_financial_id;
    end if;
  end if;

  select coalesce(sum(case when type in ('advance','balance') then amount when type='refund' then -amount else 0 end),0),
    coalesce(sum(case when type='deposit' then amount when type='deposit_refund' then -amount else 0 end),0)
  into v_paid,v_deposit from public.booking_payments where booking_id=v_booking.id and not is_voided;
  if p_payment_type in ('advance','balance') and p_amount > greatest(0,v_booking.total_amount-v_paid) then raise exception 'Payment exceeds the rental balance'; end if;
  if p_payment_type='refund' and p_amount>v_paid then raise exception 'Refund exceeds rental payments collected'; end if;
  v_deposit:=v_deposit-coalesce((select sum(amount) from public.deposit_ledger where booking_id=v_booking.id and entry_type='deduction'),0);
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
    payment_method, reference_number, note, posted_by, idempotency_key, payment_request
  ) values (
    v_booking.business_id, v_booking.branch_id, v_booking.id, v_booking.customer_id,
    v_entry_type, p_amount, p_payment_method, p_reference_number, p_note, auth.uid(), p_idempotency_key, v_request
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


create function private.current_staff_receives_event(p_business uuid,p_branch uuid,p_event text) returns boolean language sql stable security definer set search_path='' as $$ select private.staff_receives_event(auth.uid(),p_business,p_branch,p_event) $$;
revoke all on function private.current_staff_receives_event(uuid,uuid,text) from public,anon;
grant execute on function private.current_staff_receives_event(uuid,uuid,text) to authenticated;
alter policy notifications_select on public.notifications using (
 (target_staff_id is null or target_staff_id=(select auth.uid())) and
 ((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id,branch_id)) and
 (dedupe_key is null or private.current_staff_receives_event(business_id,branch_id,type))
);
