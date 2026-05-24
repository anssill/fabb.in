create or replace function public.sync_booking_financials_for_id(p_booking_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_total_amount numeric(12, 2);
  v_advance_amount numeric(12, 2);
  v_rental_paid numeric(12, 2);
begin
  select total_amount
    into v_total_amount
  from public.bookings
  where id = p_booking_id;

  if not found then
    return;
  end if;

  select
    coalesce(sum(case when type = 'advance' then amount else 0 end), 0),
    coalesce(sum(case
      when type in ('advance', 'balance') then amount
      when type = 'refund' then -amount
      else 0
    end), 0)
    into v_advance_amount, v_rental_paid
  from public.booking_payments
  where booking_id = p_booking_id
    and is_voided = false;

  update public.bookings
  set
    advance_amount = greatest(v_advance_amount, 0),
    amount_paid = greatest(v_rental_paid, 0),
    balance_due = greatest(v_total_amount - v_rental_paid, 0),
    updated_at = now()
  where id = p_booking_id;
end;
$$;

create or replace function public.sync_booking_financials_from_payment_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    perform public.sync_booking_financials_for_id(new.booking_id);
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.sync_booking_financials_for_id(new.booking_id);
    if old.booking_id is distinct from new.booking_id then
      perform public.sync_booking_financials_for_id(old.booking_id);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    perform public.sync_booking_financials_for_id(old.booking_id);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists sync_booking_financials_after_payment on public.booking_payments;
create trigger sync_booking_financials_after_payment
after insert or update or delete on public.booking_payments
for each row execute function public.sync_booking_financials_from_payment_trigger();

do $$
declare
  booking_record record;
begin
  for booking_record in select id from public.bookings loop
    perform public.sync_booking_financials_for_id(booking_record.id);
  end loop;
end $$;
