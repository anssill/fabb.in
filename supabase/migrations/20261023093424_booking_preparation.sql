-- Optional preparation is saved in the same transaction as the booking.
alter table public.bookings add column condition_notes text check (length(condition_notes)<=4000),
  add column condition_photos text[] not null default '{}' check (cardinality(condition_photos)<=10);

-- Branch-scoped private evidence also supports uploads before booking confirmation.
create policy booking_condition_read on storage.objects for select to authenticated
using (bucket_id='rental-evidence' and (storage.foldername(objects.name))[2]='condition'
  and exists(select 1 from public.branches b where b.business_id::text=(storage.foldername(objects.name))[1]
    and b.id::text=(storage.foldername(objects.name))[3] and private.can_access_branch(b.business_id,b.id)));
create policy booking_condition_insert on storage.objects for insert to authenticated
with check (bucket_id='rental-evidence' and (storage.foldername(objects.name))[2]='condition'
  and exists(select 1 from public.branches b where b.business_id::text=(storage.foldername(objects.name))[1]
    and b.id::text=(storage.foldername(objects.name))[3] and private.can_access_branch(b.business_id,b.id)
    and private.has_business_permission(b.business_id,'manage_bookings')));

-- Extend the installed booking function without replacing unrelated production rules.
do $migration$
declare definition text;
begin
  definition := pg_get_functiondef('public.create_priced_booking(jsonb)'::regprocedure);
  if position($anchor1$  pickup := (dates->>'pickup_date')::date;$anchor1$ in definition)=0 or position($anchor2$  return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number);$anchor2$ in definition)=0 then
    raise exception 'Booking function has changed; review preparation migration before applying';
  end if;
  definition := replace(definition,$anchor1$  pickup := (dates->>'pickup_date')::date;$anchor1$,$replacement$  if length(coalesce(dates->>'alteration_notes','')) > 4000 or length(coalesce(dates->>'condition_notes','')) > 4000 then
    raise exception 'Alteration and condition notes must be 4000 characters or fewer';
  end if;
  if dates ? 'condition_photos' then
    if jsonb_typeof(dates->'condition_photos') is distinct from 'array' then raise exception 'Condition photos must be a list'; end if;
    if jsonb_array_length(dates->'condition_photos') > 10 then raise exception 'Maximum 10 condition photos'; end if;
    if exists (select 1 from jsonb_array_elements_text(dates->'condition_photos') photo
      where photo is null or photo !~ ('^/api/rental-evidence\?path=' || s.business_id || '%2Fcondition%2F' || branch || '%2F' || request_id || '%2F[0-9a-f-]{36}\.(jpeg|png|webp)$')) then
      raise exception 'Invalid condition photo path';
    end if;
  end if;
  pickup := (dates->>'pickup_date')::date;$replacement$);
  definition := replace(definition,$anchor2$  return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number);$anchor2$,$replacement$  update public.bookings set alteration_notes=nullif(trim(dates->>'alteration_notes'),''),
    condition_notes=nullif(trim(dates->>'condition_notes'),''),
    condition_photos=array(select jsonb_array_elements_text(coalesce(dates->'condition_photos','[]'::jsonb))) where id=b.id;
  return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number);$replacement$);
  execute definition;
end;
$migration$;
