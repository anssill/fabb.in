alter table public.booking_items
  add column if not exists updated_at timestamptz not null default now();

update public.booking_items
set updated_at = coalesce(created_at, now())
where updated_at is null;

comment on column public.booking_items.updated_at is 'Last time this booking line item was changed.';

notify pgrst, 'reload schema';
