create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";
create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════
-- TABLE 1: businesses
-- Root table for multi-tenancy
-- ═══════════════════════════════════════════
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid,
  email text,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  country text not null default 'India',
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  gst_number text,
  pan_number text,
  logo_url text,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'trial', 'churned')),
  trial_ends_at timestamptz,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table businesses is 'Root tenant table. Every business is one row here.';
comment on column businesses.slug is 'URL-safe business identifier e.g. raj-bridal-collections';
comment on column businesses.settings is 'Business-wide settings JSONB blob';





create index idx_businesses_slug on businesses(slug);
create index idx_businesses_status on businesses(status);

-- ═══════════════════════════════════════════
-- TABLE 2: branches
-- Each business can have multiple branches
-- ═══════════════════════════════════════════
create table branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  prefix text not null default 'BRN',
  gst_number text,
  lat numeric(10, 7),
  lng numeric(10, 7),
  gps_radius_metres integer not null default 100,
  opening_hours jsonb not null default '{}',
  is_default boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table branches is 'One or more physical locations per business';
comment on column branches.prefix is '3-letter code used in booking numbers e.g. TRT for Thrissur';
comment on column branches.settings is 'Branch-specific settings: booking rules, invoice config, SMS config, etc.';





create index idx_branches_business_id on branches(business_id);

-- ═══════════════════════════════════════════
-- TABLE 3: staff
-- All users of the system (owner, manager, staff)
-- ═══════════════════════════════════════════
create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  email text not null,
  name text,
  phone text,
  role text not null default 'staff'
    check (role in ('super_admin', 'owner', 'manager', 'staff')),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'invited')),
  password_hash text,
  pin_hash text,
  profile_photo_url text,
  setup_completed boolean not null default false,
  last_login timestamptz,
  login_locked_until timestamptz,
  failed_login_attempts integer not null default 0,
  permissions jsonb not null default '{}',
  push_subscription jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table staff is 'All system users. Includes super_admin (Ansil), business owners, managers, and floor staff.';
comment on column staff.permissions is 'Custom permission overrides for this staff member';
comment on column staff.pin_hash is 'Bcrypt hash of 4-digit PIN for screen lock feature';







create index idx_staff_business_id on staff(business_id);
create index idx_staff_email on staff(email);
create index idx_staff_role on staff(role);
create index idx_staff_status on staff(status);

-- ═══════════════════════════════════════════
-- TABLE 4: login_attempts
-- Rate limiting for email login
-- ═══════════════════════════════════════════
create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_address text,
  user_agent text,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

-- No RLS policies = only service_role can access (used in API route with admin client)

create index idx_login_attempts_email on login_attempts(email);
create index idx_login_attempts_attempted_at on login_attempts(attempted_at);

-- ═══════════════════════════════════════════
-- TABLE 5: password_reset_tokens
-- One-time password reset tokens
-- ═══════════════════════════════════════════
create table password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- No RLS policies = only service_role can access

-- ═══════════════════════════════════════════
-- TABLE 6: customers
-- Customer profiles (name + phone only per spec)
-- ═══════════════════════════════════════════
create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  total_bookings integer not null default 0,
  total_spent numeric(12, 2) not null default 0,
  outstanding_balance numeric(12, 2) not null default 0,
  blacklisted boolean not null default false,
  blacklist_reason text,
  blacklisted_at timestamptz,
  blacklisted_by uuid references staff(id) on delete set null,
  notes text,
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table customers is 'Customer profiles. Minimal data: name + phone only (as per product spec).';
comment on column customers.outstanding_balance is 'Unpaid balance across all bookings';
comment on column customers.total_spent is 'Lifetime spend with this business';




create index idx_customers_business_id on customers(business_id);
create index idx_customers_phone on customers(phone);
create index idx_customers_name on customers(name);

-- ═══════════════════════════════════════════
-- TABLE 7: items
-- Inventory items
-- ═══════════════════════════════════════════
create table items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  sku text,
  cover_image_url text,
  daily_rate numeric(10, 2) not null default 0,
  deposit_amount numeric(10, 2) not null default 0,
  purchase_cost numeric(10, 2),
  purchase_date date,
  condition text not null default 'good'
    check (condition in ('excellent', 'good', 'fair', 'poor')),
  condition_notes text,
  storage_location text,
  status text not null default 'available'
    check (status in ('available', 'in_washing', 'maintenance', 'retired', 'paused')),
  is_active boolean not null default true,
  total_rentals integer not null default 0,
  total_revenue numeric(12, 2) not null default 0,
  last_rented_at timestamptz,
  completeness_score integer not null default 0 check (completeness_score between 0 and 100),
  metadata jsonb not null default '{}',
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table items is 'Inventory items. Each item can have multiple size variants.';
comment on column items.completeness_score is 'Auto-calculated 0-100 score based on filled fields and photos';
comment on column items.metadata is 'Additional flexible fields: colour, fabric, occasion tags, etc.';





create index idx_items_business_id on items(business_id);
create index idx_items_branch_id on items(branch_id);
create index idx_items_category on items(category);
create index idx_items_status on items(status);
create index idx_items_sku on items(sku);

-- ═══════════════════════════════════════════
-- TABLE 8: item_variants
-- Size variants for each item
-- ═══════════════════════════════════════════
create table item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  size text not null,
  colour text,
  sku text,
  total_stock integer not null default 1 check (total_stock >= 0),
  available_stock integer not null default 1 check (available_stock >= 0),
  reserved_stock integer not null default 0 check (reserved_stock >= 0),
  status text not null default 'available'
    check (status in ('available', 'unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_check check (available_stock + reserved_stock <= total_stock)
);

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
create index idx_washing_queue_item_id on washing_queue(item_id);

-- ═══════════════════════════════════════════
-- TABLE 16: notifications
-- In-app notifications
-- ═══════════════════════════════════════════
create table notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  target_staff_id uuid references staff(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  action_url text,
  action_type text,
  action_data jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);





create index idx_notifications_target_staff on notifications(target_staff_id);
create index idx_notifications_business_id on notifications(business_id);
create index idx_notifications_is_read on notifications(is_read);
create index idx_notifications_created_at on notifications(created_at desc);

-- ═══════════════════════════════════════════
-- TABLE 17: audit_log
-- System-wide audit trail
-- ═══════════════════════════════════════════
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  staff_id uuid references staff(id) on delete set null,
  staff_name text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

comment on table audit_log is 'Immutable audit trail. Never update or delete rows. Insert only.';





create index idx_audit_log_business_id on audit_log(business_id);
create index idx_audit_log_entity on audit_log(entity_type, entity_id);
create index idx_audit_log_created_at on audit_log(created_at desc);

-- ═══════════════════════════════════════════
-- TABLE 18: sms_log
-- Record of all SMS sent
-- ═══════════════════════════════════════════
create table sms_log (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  phone text not null,
  message text,
  template_id text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'delivered')),
  provider_response jsonb,
  sent_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);



create index idx_sms_log_business_id on sms_log(business_id);
create index idx_sms_log_booking_id on sms_log(booking_id);

-- ═══════════════════════════════════════════
-- TABLE 19: expenses
-- Business expenses tracking
-- ═══════════════════════════════════════════
create table expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  category text not null
    check (category in ('rent', 'salary', 'utilities', 'maintenance', 'washing', 'transport', 'marketing', 'other')),
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  expense_date date not null,
  receipt_url text,
  added_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now()
);



create index idx_expenses_business_id on expenses(business_id);
create index idx_expenses_date on expenses(expense_date desc);

-- ═══════════════════════════════════════════
-- TABLE 20: staff_attendance
-- GPS clock-in/out records
-- ═══════════════════════════════════════════
create table staff_attendance (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  date date not null,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  clock_in_lat numeric(10, 7),
  clock_in_lng numeric(10, 7),
  distance_from_branch numeric(8, 2),
  is_valid_location boolean,
  hours_worked numeric(5, 2),
  notes text,
  approved_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(staff_id, date)
);




create index idx_attendance_staff_id on staff_attendance(staff_id);
create index idx_attendance_date on staff_attendance(date desc);

-- ═══════════════════════════════════════════
-- TABLE 21: staff_performance_targets
-- Monthly targets for staff
-- ═══════════════════════════════════════════
create table staff_performance_targets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  month date not null,
  revenue_target numeric(12, 2),
  bookings_target integer,
  set_by uuid references staff(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(staff_id, month)
);




-- ═══════════════════════════════════════════
-- pg_cron JOBS
-- ═══════════════════════════════════════════

-- Job 1: Mark overdue bookings at midnight IST (18:30 UTC)
select cron.schedule(
  'fabb-overdue-check',
  '30 18 * * *',
  $$
  update bookings
  set status = 'out', updated_at = now()
  where status = 'booked'
  and return_date < current_date;

  insert into notifications (business_id, branch_id, type, title, body, action_url, created_at)
  select
    b.business_id,
    b.branch_id,
    'overdue_booking',
    'Booking Overdue: ' || b.booking_number,
    c.name || '''s items were due yesterday. Please follow up.',
    '/bookings/' || b.id,
    now()
  from bookings b
  left join customers c on b.customer_id = c.id
  where b.status = 'out'
  and b.return_date < current_date;
  $$
);

-- Job 2: Clean up expired booking drafts (older than 7 days)
select cron.schedule(
  'fabb-cleanup-drafts',
  '0 19 * * *',
  $$
  delete from booking_drafts
  where updated_at < now() - interval '7 days';
  $$
);




-- RLS AND POLICIES --

alter table businesses enable row level security;

create policy "superadmin_full_access_businesses" on businesses
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "own_business_read" on businesses
  for select using (
    id in (select business_id from staff where id = auth.uid() and status = 'active')
  );

create policy "owner_update_business" on businesses
  for update using (
    id in (select business_id from staff where id = auth.uid()
           and role in ('owner', 'super_admin') and status = 'active')
  );

alter table branches enable row level security;

create policy "superadmin_full_access_branches" on branches
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "branch_access_by_business" on branches
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create policy "owner_manager_update_branch" on branches
  for update using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));

alter table staff enable row level security;

create policy "superadmin_full_access_staff" on staff
  using (exists (select 1 from staff s2 where s2.id = auth.uid() and s2.role = 'super_admin'));

create policy "own_staff_row_read" on staff
  for select using (id = auth.uid());

create policy "same_business_staff_read" on staff
  for select using (
    business_id in (
      select business_id from staff s2 where s2.id = auth.uid()
      and s2.role in ('owner', 'manager') and s2.status = 'active'
    )
  );

create policy "owner_manager_update_staff" on staff
  for update using (
    business_id in (
      select business_id from staff s2 where s2.id = auth.uid()
      and s2.role in ('owner', 'manager', 'super_admin') and s2.status = 'active'
    )
  );

create policy "insert_own_staff" on staff
  for insert with check (id = auth.uid());

alter table login_attempts enable row level security;

alter table password_reset_tokens enable row level security;

alter table customers enable row level security;

create policy "superadmin_customers" on customers
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_customers" on customers
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table items enable row level security;

create policy "superadmin_items" on items
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_items" on items
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create policy "staff_update_items" on items
  for update using (
    branch_id in (select branch_id from staff where id = auth.uid() and status = 'active')
  );

alter table item_variants enable row level security;

create policy "variants_via_items" on item_variants
  using (item_id in (
    select id from items where business_id in (
      select business_id from staff where id = auth.uid() and status = 'active'
    )
  ));

alter table item_images enable row level security;

create policy "item_images_via_items" on item_images
  using (item_id in (
    select id from items where business_id in (
      select business_id from staff where id = auth.uid() and status = 'active'
    )
  ));

alter table bookings enable row level security;

create policy "superadmin_bookings" on bookings
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_bookings" on bookings
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table booking_items enable row level security;

create policy "booking_items_via_bookings" on booking_items
  using (booking_id in (
    select id from bookings where business_id in (
      select business_id from staff where id = auth.uid() and status = 'active'
    )
  ));

alter table booking_payments enable row level security;

create policy "superadmin_payments" on booking_payments
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_payments" on booking_payments
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table booking_drafts enable row level security;

create policy "own_drafts" on booking_drafts
  using (staff_id = auth.uid());

alter table booking_timeline enable row level security;

create policy "business_staff_timeline" on booking_timeline
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table washing_queue enable row level security;

create policy "superadmin_washing" on washing_queue
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_washing" on washing_queue
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table notifications enable row level security;

create policy "own_notifications" on notifications
  for select using (
    target_staff_id = auth.uid()
    or (
      target_staff_id is null
      and branch_id in (select branch_id from staff where id = auth.uid() and status = 'active')
    )
  );

create policy "insert_notifications" on notifications
  for insert with check (true);

create policy "update_own_notifications" on notifications
  for update using (target_staff_id = auth.uid());

alter table audit_log enable row level security;

create policy "superadmin_audit_log" on audit_log
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "owner_manager_audit_read" on audit_log
  for select using (
    business_id in (
      select business_id from staff where id = auth.uid()
      and role in ('owner', 'manager') and status = 'active'
    )
  );

create policy "insert_audit_log" on audit_log
  for insert with check (true);

alter table sms_log enable row level security;

create policy "business_staff_sms_log" on sms_log
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table expenses enable row level security;

create policy "owner_manager_expenses" on expenses
  using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));

alter table staff_attendance enable row level security;

create policy "own_attendance" on staff_attendance
  for select using (staff_id = auth.uid());

create policy "manager_owner_attendance" on staff_attendance
  using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));

alter table staff_performance_targets enable row level security;

create policy "own_targets" on staff_performance_targets
  for select using (staff_id = auth.uid());

create policy "manager_set_targets" on staff_performance_targets
  using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));