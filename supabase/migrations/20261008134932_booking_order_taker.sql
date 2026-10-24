-- Extend the installed function so newer preparation and payment rules survive.
alter table public.bookings add column order_taken_by text check (length(order_taken_by) <= 120);

do $migration$
declare definition text;
begin
  definition := pg_get_functiondef('public.create_priced_booking(jsonb)'::regprocedure);
  if position($anchor$  pickup := (dates->>'pickup_date')::date;$anchor$ in definition)=0
    or position($anchor$  return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number);$anchor$ in definition)=0 then
    raise exception 'Booking function has changed; review order taker migration before applying';
  end if;
  definition := replace(definition,$anchor$  pickup := (dates->>'pickup_date')::date;$anchor$,$replacement$  if length(trim(dates->>'order_taken_by')) > 120 then
    raise exception 'Order taker name must be 120 characters or fewer';
  end if;
  pickup := (dates->>'pickup_date')::date;$replacement$);
  definition := replace(definition,$anchor$  return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number);$anchor$,$replacement$  update public.bookings set order_taken_by=coalesce(nullif(trim(dates->>'order_taken_by'),''),s.name) where id=b.id;
  return jsonb_build_object('booking_id',b.id,'booking_number',b.booking_number);$replacement$);
  execute definition;
end;
$migration$;
