
comment on table item_variants is 'Size variants for each item. e.g. Kurtha Set in S, M, L, XL with 2 units each.';

comment on column item_variants.reserved_stock is 'Stock locked by active bookings (confirmed/out status)';

comment on column item_variants.available_stock is 'Stock available for new bookings';




-- RPC function for atomic stock locking
create or replace function lock_item_stock(p_variant_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
as $$
begin
  update item_variants
  set
    reserved_stock = reserved_stock + p_quantity,
    available_stock = available_stock - p_quantity,
    updated_at = now()
  where
    id = p_variant_id
    and available_stock >= p_quantity;

  if not found then
    raise exception 'Insufficient stock for variant %. Requested: %, Available: %',
      p_variant_id, p_quantity,
      (select available_stock from item_variants where id = p_variant_id)
    using errcode = 'P0001';
  end if;
end;
$$;


-- RPC function to release stock (on return or cancellation)
create or replace function release_item_stock(p_variant_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
as $$
begin
  update item_variants
  set
    reserved_stock = greatest(0, reserved_stock - p_quantity),
    available_stock = available_stock + p_quantity,
    updated_at = now()
  where id = p_variant_id;

  if not found then
    raise exception 'Variant % not found', p_variant_id
    using errcode = 'P0002';
  end if;
end;
$$;


create index idx_item_variants_item_id on item_variants(item_id);


-- ═══════════════════════════════════════════
-- TABLE 9: item_images
-- Multiple photos per item
-- ═══════════════════════════════════════════
create table item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  url text not null,
  is_cover boolean not null default false,
  display_order integer not null default 0,
  uploaded_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);




create index idx_item_images_item_id on item_images(item_id);

create index idx_item_images_is_cover on item_images(is_cover);


-- ═══════════════════════════════════════════
-- TABLE 10: bookings
-- Core booking records
-- ═══════════════════════════════════════════
create table bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  booking_number text unique not null,
  status text not null default 'pending'
    check (status in ('pending', 'booked', 'out', 'returned', 'closed', 'cancelled')),
  pickup_date date not null,
  return_date date not null,
  rental_days integer not null generated always as (
    greatest(return_date - pickup_date, 1)
  ) stored,
  subtotal numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  discount_reason text,
  tax_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  advance_amount numeric(12, 2) not null default 0,
  deposit_amount numeric(12, 2) not null default 0,
  balance_due numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  occasion text,
  booking_source text default 'walk_in'
    check (booking_source in ('walk_in', 'phone', 'whatsapp', 'referral', 'repeat')),
  notes text,
  staff_notes text,
  pickup_completed_at timestamptz,
  return_completed_at timestamptz,
  closed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid references staff(id) on delete set null,
  last_updated_by uuid references staff(id) on delete set null,
  notion_page_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_dates check (return_date >= pickup_date)
);


comment on table bookings is 'Core booking records. Status lifecycle: pending→booked→out→returned→closed';

comment on column bookings.booking_number is 'Human-readable ID e.g. TRT-260326-001';

comment on column bookings.rental_days is 'Auto-calculated from return_date - pickup_date, minimum 1';





create index idx_bookings_business_id on bookings(business_id);

create index idx_bookings_branch_id on bookings(branch_id);

create index idx_bookings_customer_id on bookings(customer_id);

create index idx_bookings_status on bookings(status);

create index idx_bookings_pickup_date on bookings(pickup_date);

create index idx_bookings_return_date on bookings(return_date);

create index idx_bookings_created_at on bookings(created_at desc);

create index idx_bookings_number on bookings(booking_number);


-- Booking number generation function
create or replace function generate_booking_number(p_branch_id uuid, p_date date)
returns text
language plpgsql
security definer
as $$
declare
  v_prefix text;
  v_date_part text;
  v_sequence integer;
  v_number text;
begin
  select prefix into v_prefix from branches where id = p_branch_id;
  v_prefix := coalesce(v_prefix, 'BRN');
  v_date_part := to_char(p_date, 'DDMMYY');
  select count(*) + 1 into v_sequence
  from bookings
  where branch_id = p_branch_id
  and pickup_date = p_date;
  v_number := v_prefix || '-' || v_date_part || '-' || lpad(v_sequence::text, 3, '0');
  return v_number;
end;
$$;


-- ═══════════════════════════════════════════
-- TABLE 11: booking_items
-- Items in each booking
-- ═══════════════════════════════════════════
create table booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  item_variant_id uuid not null references item_variants(id) on delete restrict,
  item_name text not null,
  item_sku text,
  size text not null,
  quantity integer not null default 1 check (quantity > 0),
  daily_rate numeric(10, 2) not null,
  rental_days integer not null,
  subtotal numeric(12, 2) not null generated always as (
    daily_rate * quantity * rental_days
  ) stored,
  condition_on_return text
    check (condition_on_return in ('excellent', 'good', 'fair', 'poor', 'damaged', 'missing')),
  condition_notes_on_return text,
  created_at timestamptz not null default now()
);


comment on table booking_items is 'Line items in each booking. Item name/SKU stored to preserve history if item is deleted.';




create index idx_booking_items_booking_id on booking_items(booking_id);

create index idx_booking_items_item_id on booking_items(item_id);


-- ═══════════════════════════════════════════
-- TABLE 12: booking_payments
-- Payment records for each booking
-- ═══════════════════════════════════════════
create table booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  type text not null
    check (type in ('advance', 'balance', 'deposit', 'deposit_refund', 'penalty', 'refund')),
  amount numeric(12, 2) not null check (amount > 0),
  method text not null
    check (method in ('cash', 'upi', 'bank_transfer', 'card', 'store_credit', 'online')),
  reference_number text,
  notes text,
  collected_by uuid references staff(id) on delete set null,
  is_voided boolean not null default false,
  voided_at timestamptz,
  voided_by uuid references staff(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now()
);


comment on table booking_payments is 'Individual payment transactions. Supports advance, balance, deposit, refund.';





create index idx_booking_payments_booking_id on booking_payments(booking_id);

create index idx_booking_payments_business_id on booking_payments(business_id);

create index idx_booking_payments_type on booking_payments(type);

create index idx_booking_payments_method on booking_payments(method);

create index idx_booking_payments_created_at on booking_payments(created_at desc);


-- ═══════════════════════════════════════════
-- TABLE 13: booking_drafts
-- Auto-saved booking wizard state
-- ═══════════════════════════════════════════
create table booking_drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  current_step integer not null default 1 check (current_step between 1 and 6),
  draft_data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);




create index idx_booking_drafts_staff_id on booking_drafts(staff_id);


-- ═══════════════════════════════════════════
-- TABLE 14: booking_timeline
-- Audit trail for every booking event
-- ═══════════════════════════════════════════
create table booking_timeline (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  event_type text not null,
  event_description text not null,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid references staff(id) on delete set null,
  performed_by_name text,
  created_at timestamptz not null default now()
);




create index idx_booking_timeline_booking_id on booking_timeline(booking_id);


-- ═══════════════════════════════════════════
-- TABLE 15: washing_queue
-- Washing/cleaning tracking
-- ═══════════════════════════════════════════
create table washing_queue (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  item_variant_id uuid references item_variants(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  stage text not null default 'in_washing'
    check (stage in ('in_washing', 'ready')),
  priority text not null default 'normal'
    check (priority in ('urgent', 'normal', 'low')),
  notes text,
  added_by uuid references staff(id) on delete set null,
  completed_by uuid references staff(id) on delete set null,
  completed_at timestamptz,
  next_booking_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


comment on table washing_queue is 'Two-stage washing: in_washing → ready. After ready, item status becomes available.';

comment on column washing_queue.priority is 'urgent=next booking < 48h, normal=default, low=no upcoming booking';





create index idx_washing_queue_business_id on washing_queue(business_id);

create index idx_washing_queue_branch_id on washing_queue(branch_id);

create index idx_washing_queue_stage on washing_queue(stage);