alter table public.washing_queue add column if not exists condition_after text;

alter table public.washing_queue drop constraint if exists washing_queue_stage_check;
alter table public.washing_queue
  add constraint washing_queue_stage_check
  check (stage in ('in_washing', 'in_fitting', 'maintenance', 'ready'));

comment on table public.washing_queue is 'Garment lifecycle queue: in_washing, in_fitting, maintenance, then ready.';

create or replace function public.return_item_from_booking(p_variant_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.item_variants
  set
    reserved_stock = greatest(0, reserved_stock - p_quantity),
    updated_at = now()
  where id = p_variant_id;

  if not found then
    raise exception 'Variant % not found', p_variant_id
    using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.cancel_booking_stock(p_variant_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.item_variants
  set
    reserved_stock = greatest(0, reserved_stock - p_quantity),
    available_stock = least(total_stock, available_stock + p_quantity),
    updated_at = now()
  where id = p_variant_id;

  if not found then
    raise exception 'Variant % not found', p_variant_id
    using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.complete_washing(p_variant_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.item_variants
  set
    available_stock = available_stock + p_quantity,
    updated_at = now()
  where
    id = p_variant_id
    and available_stock + reserved_stock + p_quantity <= total_stock;

  if not found then
    raise exception 'Cannot complete washing for variant %. Stock would exceed total stock.',
      p_variant_id
    using errcode = 'P0003';
  end if;
end;
$$;
