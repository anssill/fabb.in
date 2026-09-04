-- FABB rental-first zero-state production schema.
-- business_id is the tenant key and branch_id scopes branch-owned records.

create extension if not exists pgcrypto;
-- Zero-state core schema for a brand-new Supabase project.
create table public.businesses (
  id uuid default gen_random_uuid() not null,
  name text not null,
  slug text not null,
  owner_id uuid,
  email text,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  country text default 'India'::text not null,
  currency text default 'INR'::text not null,
  timezone text default 'Asia/Kolkata'::text not null,
  gst_number text,
  pan_number text,
  logo_url text,
  status text default 'active'::text not null,
  settings jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint businesses_pkey PRIMARY KEY (id),
  constraint businesses_slug_key UNIQUE (slug),
  constraint businesses_status_check CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'trial'::text, 'churned'::text]))
);

create table public.branches (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  name text not null,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  prefix text default 'BRN'::text not null,
  gst_number text,
  lat numeric(10,7),
  lng numeric(10,7),
  gps_radius_metres integer default 100 not null,
  opening_hours jsonb default '{}'::jsonb not null,
  is_default boolean default false not null,
  status text default 'active'::text not null,
  settings jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint branches_pkey PRIMARY KEY (id),
  constraint branches_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]))
);

create table public.staff (
  id uuid not null,
  business_id uuid,
  branch_id uuid,
  email text not null,
  name text,
  phone text,
  role text default 'staff'::text not null,
  status text default 'active'::text not null,
  pin_hash text,
  profile_photo_url text,
  setup_completed boolean default false not null,
  last_login timestamp with time zone,
  permissions jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint staff_pkey PRIMARY KEY (id),
  constraint staff_role_check CHECK (role = ANY (ARRAY['super_admin'::text, 'owner'::text, 'manager'::text, 'staff'::text])),
  constraint staff_status_check CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'invited'::text]))
);

create table public.customers (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  branch_id uuid,
  name text not null,
  phone text not null,
  email text,
  total_bookings integer default 0 not null,
  total_spent numeric(12,2) default 0 not null,
  outstanding_balance numeric(12,2) default 0 not null,
  blacklisted boolean default false not null,
  blacklist_reason text,
  blacklisted_at timestamp with time zone,
  blacklisted_by uuid,
  notes text,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  address text,
  id_type text,
  id_number text,
  id_proof_url text,
  alternate_phone text,
  emergency_phone text,
  profile_photo_url text,
  constraint customers_pkey PRIMARY KEY (id)
);

create table public.items (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  branch_id uuid not null,
  name text not null,
  description text,
  category text not null,
  sku text,
  cover_image_url text,
  price numeric(10,2) default 0 not null,
  deposit_amount numeric(10,2) default 0 not null,
  purchase_cost numeric(10,2),
  purchase_date date,
  storage_location text,
  status text default 'available'::text not null,
  is_active boolean default true not null,
  total_rentals integer default 0 not null,
  total_revenue numeric(12,2) default 0 not null,
  last_rented_at timestamp with time zone,
  completeness_score integer default 0 not null,
  metadata jsonb default '{}'::jsonb not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint items_completeness_score_check CHECK (completeness_score >= 0 AND completeness_score <= 100),
  constraint items_pkey PRIMARY KEY (id),
  constraint items_status_check CHECK (status = ANY (ARRAY['available'::text, 'retired'::text, 'paused'::text]))
);

create table public.item_variants (
  id uuid default gen_random_uuid() not null,
  item_id uuid not null,
  size text not null,
  sku text,
  total_stock integer default 1 not null,
  status text default 'available'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  price_override numeric,
  constraint item_variants_pkey PRIMARY KEY (id),
  constraint item_variants_status_check CHECK (status = ANY (ARRAY['available'::text, 'unavailable'::text])),
  constraint item_variants_total_stock_check CHECK (total_stock >= 0)
);

create table public.item_images (
  id uuid default gen_random_uuid() not null,
  item_id uuid not null,
  url text not null,
  is_cover boolean default false not null,
  display_order integer default 0 not null,
  uploaded_by uuid,
  created_at timestamp with time zone default now() not null,
  constraint item_images_pkey PRIMARY KEY (id)
);

create table public.bookings (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  branch_id uuid not null,
  customer_id uuid,
  booking_number text not null,
  status text default 'draft'::text not null,
  pickup_date date not null,
  return_date date not null,
  rental_days integer generated always as (GREATEST((return_date - pickup_date), 1)) stored not null,
  subtotal numeric(12,2) default 0 not null,
  discount_amount numeric(12,2) default 0 not null,
  discount_reason text,
  tax_amount numeric(12,2) default 0 not null,
  total_amount numeric(12,2) default 0 not null,
  advance_amount numeric(12,2) default 0 not null,
  deposit_amount numeric(12,2) default 0 not null,
  balance_due numeric(12,2) default 0 not null,
  amount_paid numeric(12,2) default 0 not null,
  occasion text,
  booking_source text default 'walk_in'::text,
  notes text,
  staff_notes text,
  pickup_completed_at timestamp with time zone,
  return_completed_at timestamp with time zone,
  closed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  created_by uuid,
  last_updated_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  pickup_photos text[] default '{}'::text[],
  physical_bill_number text,
  constraint bookings_booking_number_key UNIQUE (booking_number),
  constraint bookings_booking_source_check CHECK (booking_source = ANY (ARRAY['walk_in'::text, 'phone'::text, 'whatsapp'::text, 'referral'::text, 'repeat'::text])),
  constraint bookings_pkey PRIMARY KEY (id),
  constraint bookings_status_check CHECK (status = ANY (ARRAY['draft'::text, 'quote'::text, 'hold'::text, 'confirmed'::text, 'picked_up'::text, 'partially_returned'::text, 'returned'::text, 'closed'::text, 'cancelled'::text])),
  constraint valid_dates CHECK (return_date >= pickup_date)
);

create table public.booking_items (
  id uuid default gen_random_uuid() not null,
  booking_id uuid not null,
  item_id uuid not null,
  item_variant_id uuid not null,
  item_name text not null,
  item_sku text,
  size text not null,
  quantity integer default 1 not null,
  price numeric(10,2) not null,
  rental_days integer not null,
  created_at timestamp with time zone default now() not null,
  subtotal numeric(12,2) generated always as (((price * (quantity)::numeric) * (rental_days)::numeric)) stored,
  updated_at timestamp with time zone default now() not null,
  constraint booking_items_pkey PRIMARY KEY (id),
  constraint booking_items_quantity_check CHECK (quantity > 0)
);

create table public.booking_payments (
  id uuid default gen_random_uuid() not null,
  booking_id uuid not null,
  business_id uuid not null,
  branch_id uuid not null,
  type text not null,
  amount numeric(12,2) not null,
  method text not null,
  reference_number text,
  notes text,
  collected_by uuid,
  is_voided boolean default false not null,
  voided_at timestamp with time zone,
  voided_by uuid,
  void_reason text,
  created_at timestamp with time zone default now() not null,
  constraint booking_payments_amount_check CHECK (amount > 0::numeric),
  constraint booking_payments_method_check CHECK (method = ANY (ARRAY['cash'::text, 'upi'::text, 'bank_transfer'::text, 'card'::text, 'store_credit'::text, 'online'::text])),
  constraint booking_payments_pkey PRIMARY KEY (id),
  constraint booking_payments_type_check CHECK (type = ANY (ARRAY['advance'::text, 'balance'::text, 'deposit'::text, 'deposit_refund'::text, 'penalty'::text, 'refund'::text]))
);

create table public.booking_timeline (
  id uuid default gen_random_uuid() not null,
  booking_id uuid not null,
  business_id uuid not null,
  event_type text not null,
  event_description text not null,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid,
  performed_by_name text,
  created_at timestamp with time zone default now() not null,
  constraint booking_timeline_pkey PRIMARY KEY (id)
);

create table public.booking_drafts (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  branch_id uuid not null,
  staff_id uuid not null,
  current_step integer default 1 not null,
  draft_data jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint booking_drafts_current_step_check CHECK (current_step >= 1 AND current_step <= 6),
  constraint booking_drafts_pkey PRIMARY KEY (id)
);

create table public.expenses (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  branch_id uuid not null,
  category text not null,
  amount numeric(12,2) not null,
  description text not null,
  expense_date date not null,
  receipt_url text,
  added_by uuid,
  created_at timestamp with time zone default now() not null,
  item_id uuid,
  staff_id uuid,
  payment_method text default 'cash'::text,
  notes text,
  updated_at timestamp with time zone default now(),
  constraint expenses_amount_check CHECK (amount > 0::numeric),
  constraint expenses_category_check CHECK (category = ANY (ARRAY['rent'::text, 'salary'::text, 'utilities'::text, 'maintenance'::text, 'transport'::text, 'marketing'::text, 'other'::text])),
  constraint expenses_payment_method_check CHECK (payment_method = ANY (ARRAY['cash'::text, 'upi'::text, 'bank_transfer'::text, 'card'::text])),
  constraint expenses_pkey PRIMARY KEY (id)
);

create table public.staff_attendance (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  branch_id uuid not null,
  staff_id uuid not null,
  date date not null,
  notes text,
  approved_by uuid,
  created_at timestamp with time zone default now() not null,
  constraint staff_attendance_pkey PRIMARY KEY (id),
  constraint staff_attendance_staff_id_date_key UNIQUE (staff_id, date)
);

create table public.audit_log (
  id uuid default gen_random_uuid() not null,
  business_id uuid,
  branch_id uuid,
  staff_id uuid,
  staff_name text,
  action text not null,
  table_name text not null,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  "timestamp" timestamp with time zone default now() not null,
  constraint audit_log_pkey PRIMARY KEY (id)
);

create table public.notifications (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  branch_id uuid,
  target_staff_id uuid,
  type text not null,
  title text not null,
  body text,
  action_url text,
  action_type text,
  action_data jsonb,
  is_read boolean default false not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  constraint notifications_pkey PRIMARY KEY (id)
);

create table public.sms_log (
  id uuid default gen_random_uuid() not null,
  business_id uuid not null,
  branch_id uuid,
  customer_id uuid,
  booking_id uuid,
  phone text not null,
  message text,
  template_id text,
  status text default 'pending'::text not null,
  provider_response jsonb,
  sent_by uuid,
  created_at timestamp with time zone default now() not null,
  constraint sms_log_pkey PRIMARY KEY (id),
  constraint sms_log_status_check CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'delivered'::text]))
);

alter table public.branches add constraint branches_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.staff add constraint staff_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
alter table public.staff add constraint staff_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.staff add constraint staff_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.customers add constraint customers_blacklisted_by_fkey FOREIGN KEY (blacklisted_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.customers add constraint customers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
alter table public.customers add constraint customers_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.customers add constraint customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.items add constraint items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
alter table public.items add constraint items_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.items add constraint items_created_by_fkey FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.item_variants add constraint item_variants_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;
alter table public.item_images add constraint item_images_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE;
alter table public.item_images add constraint item_images_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.bookings add constraint bookings_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
alter table public.bookings add constraint bookings_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.bookings add constraint bookings_created_by_fkey FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.bookings add constraint bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
alter table public.bookings add constraint bookings_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.booking_items add constraint booking_items_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
alter table public.booking_items add constraint booking_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT;
alter table public.booking_items add constraint booking_items_item_variant_id_fkey FOREIGN KEY (item_variant_id) REFERENCES item_variants(id) ON DELETE RESTRICT;
alter table public.booking_payments add constraint booking_payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
alter table public.booking_payments add constraint booking_payments_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
alter table public.booking_payments add constraint booking_payments_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.booking_payments add constraint booking_payments_collected_by_fkey FOREIGN KEY (collected_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.booking_payments add constraint booking_payments_voided_by_fkey FOREIGN KEY (voided_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.booking_timeline add constraint booking_timeline_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
alter table public.booking_timeline add constraint booking_timeline_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.booking_timeline add constraint booking_timeline_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.booking_drafts add constraint booking_drafts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
alter table public.booking_drafts add constraint booking_drafts_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.booking_drafts add constraint booking_drafts_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;
alter table public.expenses add constraint expenses_added_by_fkey FOREIGN KEY (added_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.expenses add constraint expenses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
alter table public.expenses add constraint expenses_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.expenses add constraint expenses_item_id_fkey FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;
alter table public.expenses add constraint expenses_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.staff_attendance add constraint staff_attendance_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.staff_attendance add constraint staff_attendance_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
alter table public.staff_attendance add constraint staff_attendance_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.staff_attendance add constraint staff_attendance_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;
alter table public.audit_log add constraint audit_log_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
alter table public.audit_log add constraint audit_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.audit_log add constraint audit_log_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;
alter table public.notifications add constraint notifications_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
alter table public.notifications add constraint notifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.notifications add constraint notifications_target_staff_id_fkey FOREIGN KEY (target_staff_id) REFERENCES staff(id) ON DELETE CASCADE;
alter table public.sms_log add constraint sms_log_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
alter table public.sms_log add constraint sms_log_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
alter table public.sms_log add constraint sms_log_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public.sms_log add constraint sms_log_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
alter table public.sms_log add constraint sms_log_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES staff(id) ON DELETE SET NULL;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

do $$ begin
  create type public.inventory_tracking_mode as enum ('quantity', 'asset');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.rental_unavailability_reason as enum ('damaged', 'missing');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.rental_transfer_status as enum ('requested', 'dispatched', 'in_transit', 'received', 'discrepancy', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.stock_movement_type as enum ('opening', 'adjustment', 'transfer_out', 'transfer_in', 'stocktake', 'archive', 'restore');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.fulfilment_event_type as enum ('pickup', 'return');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.financial_entry_type as enum ('payment', 'refund', 'reversal', 'deposit_collection', 'deposit_refund', 'deposit_deduction', 'customer_credit', 'customer_credit_applied');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.financial_document_type as enum ('quote', 'invoice', 'receipt', 'deposit_receipt', 'deposit_settlement', 'credit_note', 'debit_note', 'payslip');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.rental_booking_status as enum ('draft', 'quote', 'hold', 'confirmed', 'picked_up', 'partially_returned', 'returned', 'closed', 'cancelled');
exception when duplicate_object then null; end $$;

alter table public.businesses
  add column if not exists gst_mode text not null default 'non_gst' check (gst_mode in ('non_gst', 'gst')),
  add column if not exists price_tax_mode text not null default 'inclusive' check (price_tax_mode in ('inclusive', 'exclusive')),
  add column if not exists primary_colour text,
  add column if not exists locale text not null default 'en-IN',
  add column if not exists timezone text not null default 'Asia/Kolkata',
  add column if not exists closure_requested_at timestamptz,
  add column if not exists closure_scheduled_at timestamptz;

alter table public.branches
  add column if not exists legal_name text,
  add column if not exists gst_profile_id uuid,
  add column if not exists bank_details jsonb not null default '{}'::jsonb,
  add column if not exists document_prefixes jsonb not null default '{}'::jsonb;

alter table public.items
  add column if not exists tracking_mode public.inventory_tracking_mode not null default 'quantity',
  add column if not exists designer text,
  add column if not exists brand text,
  add column if not exists occasion text,
  add column if not exists fabric text,
  add column if not exists measurements jsonb not null default '{}'::jsonb,
  add column if not exists replacement_value numeric(12,2) not null default 0 check (replacement_value >= 0),
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.staff(id),
  add column if not exists is_bundle boolean not null default false;

alter table public.item_variants
  add column if not exists business_id uuid,
  add column if not exists branch_id uuid,
  add column if not exists archived_at timestamptz;

update public.item_variants v
set business_id = i.business_id, branch_id = i.branch_id
from public.items i
where i.id = v.item_id
  and (v.business_id is null or v.branch_id is null);

alter table public.item_variants
  alter column business_id set not null,
  alter column branch_id set not null;

do $$ begin
  alter table public.item_variants add constraint item_variants_business_id_fkey foreign key (business_id) references public.businesses(id);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.item_variants add constraint item_variants_branch_id_fkey foreign key (branch_id) references public.branches(id);
exception when duplicate_object then null; end $$;

alter table public.bookings
  add column if not exists event_date date,
  add column if not exists fitting_date date,
  add column if not exists hold_expires_at timestamptz,
  add column if not exists overbook_reason text,
  add column if not exists overbooked_by uuid references public.staff(id),
  add column if not exists overbooked_at timestamptz,
  add column if not exists actual_pickup_at timestamptz,
  add column if not exists actual_return_at timestamptz,
  add column if not exists cancellation_fee numeric(12,2) not null default 0,
  add column if not exists late_fee numeric(12,2) not null default 0,
  add column if not exists damage_charge numeric(12,2) not null default 0,
  add column if not exists alteration_notes text,
  add column if not exists archived_at timestamptz;

do $$
declare v_constraint record;
begin
  for v_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.bookings'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.bookings drop constraint %I', v_constraint.conname);
  end loop;
end $$;

alter table public.bookings alter column status drop default;
alter table public.bookings alter column status type public.rental_booking_status using (
  case status::text
    when 'pending' then 'hold'
    when 'booked' then 'confirmed'
    when 'out' then 'picked_up'
    else status::text
  end::public.rental_booking_status
);
alter table public.bookings alter column status set default 'draft'::public.rental_booking_status;

alter table public.booking_items
  add column if not exists business_id uuid,
  add column if not exists branch_id uuid,
  add column if not exists picked_up_quantity integer not null default 0 check (picked_up_quantity >= 0),
  add column if not exists returned_quantity integer not null default 0 check (returned_quantity >= 0),
  add column if not exists substituted_from_id uuid references public.booking_items(id),
  add column if not exists substitution_reason text,
  add column if not exists replacement_value numeric(12,2) not null default 0;

update public.booking_items bi
set business_id = b.business_id, branch_id = b.branch_id
from public.bookings b
where b.id = bi.booking_id
  and (bi.business_id is null or bi.branch_id is null);

alter table public.booking_items
  alter column business_id set not null,
  alter column branch_id set not null;

do $$ begin
  alter table public.booking_items add constraint booking_items_business_id_fkey foreign key (business_id) references public.businesses(id);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.booking_items add constraint booking_items_branch_id_fkey foreign key (branch_id) references public.branches(id);
exception when duplicate_object then null; end $$;

alter table public.customers
  add column if not exists preferences jsonb not null default '{}'::jsonb,
  add column if not exists risk_status text not null default 'normal' check (risk_status in ('normal', 'watch', 'blacklisted')),
  add column if not exists merged_into_id uuid references public.customers(id),
  add column if not exists archived_at timestamptz;

alter table public.staff_attendance
  add column if not exists attendance_status text not null default 'present' check (attendance_status in ('present', 'absent')),
  add column if not exists gps_warning boolean not null default false,
  add column if not exists gps_metadata jsonb not null default '{}'::jsonb,
  add column if not exists recorded_at timestamptz not null default now();

create or replace function public.record_daily_attendance(
  p_latitude numeric,
  p_longitude numeric,
  p_accuracy_metres numeric default null
)
returns public.staff_attendance
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_staff public.staff%rowtype;
  v_branch public.branches%rowtype;
  v_record public.staff_attendance%rowtype;
  v_distance numeric;
  v_radius numeric;
  v_timezone text;
  v_date date;
begin
  select * into v_staff from public.staff where id = auth.uid();
  if v_staff.id is null or v_staff.branch_id is null then raise exception 'Active branch required'; end if;
  select * into v_branch from public.branches where id = v_staff.branch_id and business_id = v_staff.business_id;
  if v_branch.id is null then raise exception 'Branch not found'; end if;
  select coalesce(timezone, 'Asia/Kolkata') into v_timezone from public.businesses where id = v_staff.business_id;
  v_date := (now() at time zone v_timezone)::date;
  v_radius := coalesce(v_branch.gps_radius_metres, 100);

  if v_branch.lat is not null and v_branch.lng is not null then
    v_distance := 6371000 * 2 * asin(sqrt(
      power(sin(radians((p_latitude - v_branch.lat) / 2)), 2) +
      cos(radians(v_branch.lat)) * cos(radians(p_latitude)) *
      power(sin(radians((p_longitude - v_branch.lng) / 2)), 2)
    ));
  end if;

  insert into public.staff_attendance (
    staff_id, business_id, branch_id, date, attendance_status, gps_warning, gps_metadata, recorded_at
  ) values (
    auth.uid(), v_staff.business_id, v_staff.branch_id, v_date, 'present',
    coalesce(v_distance > v_radius, false),
    jsonb_strip_nulls(jsonb_build_object(
      'latitude', p_latitude, 'longitude', p_longitude, 'accuracy_metres', p_accuracy_metres,
      'distance_from_branch_metres', round(v_distance), 'allowed_radius_metres', v_radius,
      'within_radius', case when v_distance is null then null else v_distance <= v_radius end
    )), now()
  )
  on conflict (staff_id, date) do update set
    attendance_status = 'present',
    branch_id = excluded.branch_id,
    gps_warning = excluded.gps_warning,
    gps_metadata = excluded.gps_metadata,
    recorded_at = excluded.recorded_at
  returning * into v_record;

  insert into public.audit_log (business_id, branch_id, staff_id, action, table_name, record_id, new_value)
  values (v_staff.business_id, v_staff.branch_id, auth.uid(), 'attendance.present', 'staff_attendance', v_record.id,
    jsonb_build_object('date', v_date, 'gps_warning', v_record.gps_warning));
  return v_record;
end;
$$;

revoke all on function public.record_daily_attendance(numeric, numeric, numeric) from public, anon;
grant execute on function public.record_daily_attendance(numeric, numeric, numeric) to authenticated, service_role;

-- Tenant roles and branch membership.
create table if not exists public.business_roles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  is_owner_role boolean not null default false,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.staff_branch_memberships (
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (staff_id, branch_id)
);

create table if not exists public.staff_role_assignments (
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  role_id uuid not null references public.business_roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, role_id)
);

-- Tax and pricing configuration.
create table if not exists public.gst_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  legal_name text not null,
  gstin text not null,
  state_code text not null,
  address text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, gstin)
);

do $$ begin
  alter table public.branches add constraint branches_gst_profile_id_fkey foreign key (gst_profile_id) references public.gst_profiles(id);
exception when duplicate_object then null; end $$;

create table if not exists public.tax_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  charge_type text not null,
  rate numeric(5,2) not null default 0 check (rate between 0 and 100),
  hsn_sac text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, charge_type)
);

create table if not exists public.rental_price_packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  item_id uuid references public.items(id) on delete cascade,
  category text,
  name text not null,
  rental_days integer not null check (rental_days > 0),
  price numeric(12,2) not null check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (not (item_id is not null and category is not null))
);

-- Physical assets and bundle composition.
create table if not exists public.inventory_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  item_id uuid not null references public.items(id),
  item_variant_id uuid not null references public.item_variants(id),
  asset_code text not null,
  status text not null default 'available' check (status in ('available', 'reserved', 'out', 'damaged', 'missing', 'in_transit', 'archived')),
  acquired_on date,
  acquisition_cost numeric(12,2),
  storage_location text,
  metadata jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, asset_code)
);

create table if not exists public.item_bundle_components (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  bundle_item_id uuid not null references public.items(id) on delete cascade,
  component_item_id uuid not null references public.items(id),
  component_variant_id uuid references public.item_variants(id),
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  required boolean not null default true,
  created_at timestamptz not null default now(),
  check (bundle_item_id <> component_item_id)
);

create table if not exists public.booking_item_assets (
  business_id uuid not null references public.businesses(id) on delete cascade,
  booking_item_id uuid not null references public.booking_items(id) on delete cascade,
  asset_id uuid not null references public.inventory_assets(id),
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.staff(id),
  released_at timestamptz,
  released_by uuid references public.staff(id),
  primary key (booking_item_id, asset_id)
);
create unique index if not exists booking_item_assets_one_active_rental_idx
  on public.booking_item_assets (asset_id) where released_at is null;

create table if not exists public.booking_item_fulfilments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  booking_item_id uuid not null references public.booking_items(id) on delete cascade,
  event_type public.fulfilment_event_type not null,
  quantity integer not null check (quantity > 0),
  occurred_at timestamptz not null default now(),
  performed_by uuid references public.staff(id),
  notes text,
  idempotency_key text,
  unique (business_id, idempotency_key)
);

create table if not exists public.inventory_unavailability (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  item_id uuid not null references public.items(id),
  item_variant_id uuid not null references public.item_variants(id),
  inventory_asset_id uuid references public.inventory_assets(id),
  booking_item_id uuid references public.booking_items(id),
  reason public.rental_unavailability_reason not null,
  quantity integer not null check (quantity > 0),
  restored_quantity integer not null default 0 check (restored_quantity >= 0 and restored_quantity <= quantity),
  notes text,
  recorded_by uuid references public.staff(id),
  recorded_at timestamptz not null default now(),
  restored_at timestamptz,
  restored_by uuid references public.staff(id)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  item_id uuid not null references public.items(id),
  item_variant_id uuid not null references public.item_variants(id),
  inventory_asset_id uuid references public.inventory_assets(id),
  movement_type public.stock_movement_type not null,
  quantity_delta integer not null,
  quantity_before integer,
  quantity_after integer,
  reference_type text,
  reference_id uuid,
  note text,
  performed_by uuid references public.staff(id),
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_transfers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  transfer_number text not null,
  source_branch_id uuid not null references public.branches(id),
  destination_branch_id uuid not null references public.branches(id),
  status public.rental_transfer_status not null default 'requested',
  requested_by uuid references public.staff(id),
  dispatched_by uuid references public.staff(id),
  received_by uuid references public.staff(id),
  requested_at timestamptz not null default now(),
  dispatched_at timestamptz,
  received_at timestamptz,
  notes text,
  unique (business_id, transfer_number),
  check (source_branch_id <> destination_branch_id)
);

create table if not exists public.inventory_transfer_lines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  transfer_id uuid not null references public.inventory_transfers(id) on delete cascade,
  item_id uuid not null references public.items(id),
  item_variant_id uuid not null references public.item_variants(id),
  destination_item_variant_id uuid references public.item_variants(id),
  inventory_asset_id uuid references public.inventory_assets(id),
  quantity integer not null check (quantity > 0),
  received_quantity integer not null default 0 check (received_quantity >= 0),
  discrepancy_note text
);

create or replace function public.create_inventory_transfer(
  p_destination_branch_id uuid,
  p_item_variant_id uuid,
  p_quantity integer,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_staff public.staff%rowtype;
  v_variant public.item_variants%rowtype;
  v_transfer_id uuid;
  v_available integer;
begin
  if p_quantity <= 0 then raise exception 'Transfer quantity must be positive'; end if;
  select * into v_staff from public.staff where id = auth.uid();
  if v_staff.id is null or v_staff.branch_id is null then raise exception 'Active branch required'; end if;
  if not private.has_business_permission(v_staff.business_id, 'manage_transfers') then raise exception 'Transfer permission required'; end if;
  if p_destination_branch_id = v_staff.branch_id then raise exception 'Choose a different destination branch'; end if;
  if not exists (select 1 from public.branches where id = p_destination_branch_id and business_id = v_staff.business_id and status = 'active') then raise exception 'Destination branch not found'; end if;

  select * into v_variant from public.item_variants where id = p_item_variant_id and business_id = v_staff.business_id and branch_id = v_staff.branch_id and archived_at is null for update;
  if v_variant.id is null then raise exception 'Source size not found'; end if;
  select available_quantity into v_available from public.get_rental_availability(v_staff.business_id, v_staff.branch_id, current_date, current_date, v_variant.item_id, v_variant.id, p_quantity);
  if coalesce(v_available, 0) < p_quantity then raise exception 'Insufficient available stock for transfer'; end if;

  insert into public.inventory_transfers (business_id, transfer_number, source_branch_id, destination_branch_id, requested_by, notes)
  values (v_staff.business_id, 'TR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), v_staff.branch_id, p_destination_branch_id, auth.uid(), p_note)
  returning id into v_transfer_id;
  insert into public.inventory_transfer_lines (business_id, transfer_id, item_id, item_variant_id, quantity)
  values (v_staff.business_id, v_transfer_id, v_variant.item_id, v_variant.id, p_quantity);
  insert into public.audit_log (business_id, branch_id, staff_id, action, table_name, record_id, new_value)
  values (v_staff.business_id, v_staff.branch_id, auth.uid(), 'transfer.requested', 'inventory_transfers', v_transfer_id, jsonb_build_object('quantity', p_quantity, 'destination_branch_id', p_destination_branch_id));
  return v_transfer_id;
end;
$$;

create or replace function public.advance_inventory_transfer(
  p_transfer_id uuid,
  p_action text,
  p_received_quantity integer default null,
  p_note text default null
)
returns public.inventory_transfers
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_staff public.staff%rowtype;
  v_transfer public.inventory_transfers%rowtype;
  v_line public.inventory_transfer_lines%rowtype;
  v_source public.item_variants%rowtype;
  v_destination_id uuid;
  v_received integer;
begin
  select * into v_staff from public.staff where id = auth.uid();
  if v_staff.id is null then raise exception 'Staff record required'; end if;
  if not private.has_business_permission(v_staff.business_id, 'manage_transfers') then raise exception 'Transfer permission required'; end if;
  select * into v_transfer from public.inventory_transfers where id = p_transfer_id and business_id = v_staff.business_id for update;
  if v_transfer.id is null then raise exception 'Transfer not found'; end if;

  if p_action = 'dispatch' then
    if v_transfer.status <> 'requested' then raise exception 'Only requested transfers can be dispatched'; end if;
    update public.inventory_transfers set status = 'dispatched', dispatched_by = auth.uid(), dispatched_at = now() where id = p_transfer_id returning * into v_transfer;
  elsif p_action = 'in_transit' then
    if v_transfer.status <> 'dispatched' then raise exception 'Only dispatched transfers can move in transit'; end if;
    update public.inventory_transfers set status = 'in_transit' where id = p_transfer_id returning * into v_transfer;
  elsif p_action = 'cancel' then
    if v_transfer.status not in ('requested', 'dispatched') then raise exception 'This transfer cannot be cancelled'; end if;
    update public.inventory_transfers set status = 'cancelled', notes = concat_ws(E'\n', notes, p_note) where id = p_transfer_id returning * into v_transfer;
  elsif p_action = 'receive' then
    if v_transfer.status not in ('dispatched', 'in_transit') then raise exception 'Only dispatched or in-transit stock can be received'; end if;
    if v_staff.role not in ('owner', 'super_admin') and v_staff.branch_id <> v_transfer.destination_branch_id and not exists (select 1 from public.staff_branch_memberships where staff_id = v_staff.id and branch_id = v_transfer.destination_branch_id) then raise exception 'Destination branch assignment required'; end if;
    for v_line in select * from public.inventory_transfer_lines where transfer_id = p_transfer_id for update loop
      v_received := coalesce(p_received_quantity, v_line.quantity);
      if v_received < 0 or v_received > v_line.quantity then raise exception 'Invalid received quantity'; end if;
      select * into v_source from public.item_variants where id = v_line.item_variant_id for update;
      if v_source.total_stock < v_received then raise exception 'Source stock changed; reconcile before receipt'; end if;
      select id into v_destination_id from public.item_variants where business_id = v_transfer.business_id and branch_id = v_transfer.destination_branch_id and item_id = v_line.item_id and size = v_source.size and archived_at is null for update;
      if v_destination_id is null then
        insert into public.item_variants (business_id, branch_id, item_id, size, total_stock, price_override, status)
        values (v_transfer.business_id, v_transfer.destination_branch_id, v_line.item_id, v_source.size, 0, v_source.price_override, 'available') returning id into v_destination_id;
      end if;
      update public.item_variants set total_stock = total_stock - v_received where id = v_source.id;
      update public.item_variants set total_stock = total_stock + v_received where id = v_destination_id;
      update public.inventory_transfer_lines set received_quantity = v_received, destination_item_variant_id = v_destination_id, discrepancy_note = case when v_received = quantity then null else p_note end where id = v_line.id;
      insert into public.inventory_movements (business_id, branch_id, item_id, item_variant_id, movement_type, quantity_delta, quantity_before, quantity_after, reference_type, reference_id, note, performed_by)
      values
        (v_transfer.business_id, v_transfer.source_branch_id, v_line.item_id, v_source.id, 'transfer_out', -v_received, v_source.total_stock, v_source.total_stock - v_received, 'inventory_transfer', p_transfer_id, p_note, auth.uid()),
        (v_transfer.business_id, v_transfer.destination_branch_id, v_line.item_id, v_destination_id, 'transfer_in', v_received, (select total_stock - v_received from public.item_variants where id = v_destination_id), (select total_stock from public.item_variants where id = v_destination_id), 'inventory_transfer', p_transfer_id, p_note, auth.uid());
    end loop;
    update public.inventory_transfers set status = case when exists (select 1 from public.inventory_transfer_lines where transfer_id = p_transfer_id and received_quantity <> quantity) then 'discrepancy'::public.rental_transfer_status else 'received'::public.rental_transfer_status end, received_by = auth.uid(), received_at = now(), notes = concat_ws(E'\n', notes, p_note) where id = p_transfer_id returning * into v_transfer;
  else
    raise exception 'Unsupported transfer action';
  end if;

  insert into public.audit_log (business_id, branch_id, staff_id, action, table_name, record_id, new_value)
  values (v_transfer.business_id, coalesce(v_staff.branch_id, v_transfer.source_branch_id), auth.uid(), 'transfer.' || p_action, 'inventory_transfers', v_transfer.id, jsonb_build_object('status', v_transfer.status, 'received_quantity', p_received_quantity, 'note', p_note));
  return v_transfer;
end;
$$;

revoke all on function public.create_inventory_transfer(uuid, uuid, integer, text) from public, anon;
grant execute on function public.create_inventory_transfer(uuid, uuid, integer, text) to authenticated, service_role;
revoke all on function public.advance_inventory_transfer(uuid, text, integer, text) from public, anon;
grant execute on function public.advance_inventory_transfer(uuid, text, integer, text) to authenticated, service_role;

create table if not exists public.stocktakes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  status text not null default 'draft' check (status in ('draft', 'counting', 'review', 'approved', 'cancelled')),
  blind_count boolean not null default true,
  started_by uuid references public.staff(id),
  approved_by uuid references public.staff(id),
  started_at timestamptz not null default now(),
  approved_at timestamptz,
  notes text
);

create table if not exists public.stocktake_lines (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  stocktake_id uuid not null references public.stocktakes(id) on delete cascade,
  item_variant_id uuid not null references public.item_variants(id),
  expected_quantity integer not null,
  counted_quantity integer,
  counted_by uuid references public.staff(id),
  counted_at timestamptz,
  note text,
  unique (stocktake_id, item_variant_id)
);

create or replace function public.start_stocktake(p_note text default null, p_blind_count boolean default true)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare v_staff public.staff%rowtype; v_stocktake_id uuid;
begin
  select * into v_staff from public.staff where id = auth.uid();
  if v_staff.id is null or v_staff.branch_id is null then raise exception 'Active branch required'; end if;
  if not private.has_business_permission(v_staff.business_id, 'manage_stocktakes') then raise exception 'Stocktake permission required'; end if;
  insert into public.stocktakes (business_id, branch_id, status, blind_count, started_by, notes)
  values (v_staff.business_id, v_staff.branch_id, 'counting', p_blind_count, auth.uid(), p_note) returning id into v_stocktake_id;
  insert into public.stocktake_lines (business_id, stocktake_id, item_variant_id, expected_quantity)
  select business_id, v_stocktake_id, id, total_stock from public.item_variants
  where business_id = v_staff.business_id and branch_id = v_staff.branch_id and archived_at is null;
  insert into public.audit_log (business_id, branch_id, staff_id, action, table_name, record_id, new_value)
  values (v_staff.business_id, v_staff.branch_id, auth.uid(), 'stocktake.started', 'stocktakes', v_stocktake_id, jsonb_build_object('blind_count', p_blind_count));
  return v_stocktake_id;
end;
$$;

create or replace function public.approve_stocktake(p_stocktake_id uuid, p_note text default null)
returns public.stocktakes
language plpgsql
security invoker
set search_path = public
as $$
declare v_staff public.staff%rowtype; v_stocktake public.stocktakes%rowtype; v_line record;
begin
  select * into v_staff from public.staff where id = auth.uid();
  if v_staff.id is null then raise exception 'Staff record required'; end if;
  if not private.has_business_permission(v_staff.business_id, 'manage_stocktakes') then raise exception 'Stocktake permission required'; end if;
  select * into v_stocktake from public.stocktakes where id = p_stocktake_id and business_id = v_staff.business_id and branch_id = v_staff.branch_id for update;
  if v_stocktake.id is null or v_stocktake.status not in ('counting', 'review') then raise exception 'Open stocktake not found'; end if;
  if exists (select 1 from public.stocktake_lines where stocktake_id = p_stocktake_id and counted_quantity is null) then raise exception 'Count every size before approval'; end if;
  for v_line in select l.*, v.item_id, v.total_stock from public.stocktake_lines l join public.item_variants v on v.id = l.item_variant_id where l.stocktake_id = p_stocktake_id for update of v loop
    if v_line.total_stock <> v_line.counted_quantity then
      update public.item_variants set total_stock = v_line.counted_quantity where id = v_line.item_variant_id;
      insert into public.inventory_movements (business_id, branch_id, item_id, item_variant_id, movement_type, quantity_delta, quantity_before, quantity_after, reference_type, reference_id, note, performed_by)
      values (v_stocktake.business_id, v_stocktake.branch_id, v_line.item_id, v_line.item_variant_id, 'stocktake', v_line.counted_quantity - v_line.total_stock, v_line.total_stock, v_line.counted_quantity, 'stocktake', p_stocktake_id, p_note, auth.uid());
    end if;
  end loop;
  update public.stocktakes set status = 'approved', approved_by = auth.uid(), approved_at = now(), notes = concat_ws(E'\n', notes, p_note) where id = p_stocktake_id returning * into v_stocktake;
  insert into public.audit_log (business_id, branch_id, staff_id, action, table_name, record_id, new_value)
  values (v_stocktake.business_id, v_stocktake.branch_id, auth.uid(), 'stocktake.approved', 'stocktakes', v_stocktake.id, jsonb_build_object('note', p_note));
  return v_stocktake;
end;
$$;

create or replace function public.record_stocktake_counts(p_stocktake_id uuid, p_counts jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare v_staff public.staff%rowtype; v_entry record; v_count integer := 0;
begin
  select * into v_staff from public.staff where id = auth.uid();
  if v_staff.id is null then raise exception 'Staff record required'; end if;
  if not private.has_business_permission(v_staff.business_id, 'manage_stocktakes') then raise exception 'Stocktake permission required'; end if;
  if not exists (select 1 from public.stocktakes where id = p_stocktake_id and business_id = v_staff.business_id and branch_id = v_staff.branch_id and status in ('counting', 'review')) then raise exception 'Open stocktake not found'; end if;
  for v_entry in select key, value from jsonb_each_text(p_counts) loop
    if v_entry.value !~ '^\d+$' then raise exception 'Counts must be whole numbers'; end if;
    update public.stocktake_lines set counted_quantity = v_entry.value::integer, counted_by = auth.uid(), counted_at = now()
    where id = v_entry.key::uuid and stocktake_id = p_stocktake_id;
    if found then v_count := v_count + 1; end if;
  end loop;
  update public.stocktakes set status = 'review' where id = p_stocktake_id;
  return v_count;
end;
$$;

revoke all on function public.start_stocktake(text, boolean) from public, anon;
grant execute on function public.start_stocktake(text, boolean) to authenticated, service_role;
revoke all on function public.approve_stocktake(uuid, text) from public, anon;
grant execute on function public.approve_stocktake(uuid, text) to authenticated, service_role;
revoke all on function public.record_stocktake_counts(uuid, jsonb) from public, anon;
grant execute on function public.record_stocktake_counts(uuid, jsonb) to authenticated, service_role;

-- Customer identity, phones, measurements, and credit.
create table if not exists public.customer_phones (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  phone text not null,
  label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists customer_phones_normalized_idx on public.customer_phones (business_id, regexp_replace(phone, '[^0-9]', '', 'g'));

create table if not exists public.customer_measurements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  measurements jsonb not null default '{}'::jsonb,
  notes text,
  measured_at timestamptz not null default now(),
  measured_by uuid references public.staff(id)
);

create table if not exists public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  document_type text not null,
  document_number text,
  storage_path text not null,
  uploaded_by uuid references public.staff(id),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_credit_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  customer_id uuid not null references public.customers(id),
  booking_id uuid references public.bookings(id),
  amount numeric(12,2) not null check (amount <> 0),
  entry_type text not null check (entry_type in ('credit', 'applied', 'refund', 'opening')),
  note text,
  created_by uuid references public.staff(id),
  created_at timestamptz not null default now()
);

-- Financial ledgers, documents, cash control, and payroll.
create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  booking_id uuid references public.bookings(id),
  customer_id uuid references public.customers(id),
  entry_type public.financial_entry_type not null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text,
  reference_number text,
  parent_entry_id uuid references public.financial_entries(id),
  note text,
  posted_at timestamptz not null default now(),
  posted_by uuid references public.staff(id),
  idempotency_key text,
  unique (business_id, idempotency_key)
);

create table if not exists public.deposit_ledger (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  booking_id uuid not null references public.bookings(id),
  entry_type text not null check (entry_type in ('collection', 'refund', 'deduction', 'transfer', 'opening')),
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text,
  reference_number text,
  note text,
  created_by uuid references public.staff(id),
  created_at timestamptz not null default now()
);

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
begin
  if p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;
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
  if v_booking.id is null then raise exception 'Booking not found'; end if;

  if exists (
    select 1 from public.cash_sessions
    where branch_id = v_booking.branch_id and business_date = current_date and status = 'closed'
  ) then raise exception 'This branch day is closed; post a reversal or refund on an open day'; end if;

  if p_idempotency_key is not null then
    select id into v_financial_id
    from public.financial_entries
    where business_id = v_booking.business_id and idempotency_key = p_idempotency_key;
    if v_financial_id is not null then return v_financial_id; end if;
  end if;

  v_entry_type := case p_payment_type
    when 'deposit' then 'deposit_collection'::public.financial_entry_type
    when 'deposit_refund' then 'deposit_refund'::public.financial_entry_type
    when 'refund' then 'refund'::public.financial_entry_type
    else 'payment'::public.financial_entry_type
  end;

  insert into public.financial_entries (
    business_id, branch_id, booking_id, customer_id, entry_type, amount,
    payment_method, reference_number, note, posted_by, idempotency_key
  ) values (
    v_booking.business_id, v_booking.branch_id, v_booking.id, v_booking.customer_id,
    v_entry_type, p_amount, p_payment_method, p_reference_number, p_note, auth.uid(), p_idempotency_key
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

revoke all on function public.post_booking_payment(uuid, text, numeric, text, text, text, text) from public, anon;
grant execute on function public.post_booking_payment(uuid, text, numeric, text, text, text, text) to authenticated, service_role;

create table if not exists public.financial_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  booking_id uuid references public.bookings(id),
  customer_id uuid references public.customers(id),
  document_type public.financial_document_type not null,
  document_number text not null,
  financial_year text not null,
  status text not null default 'draft' check (status in ('draft', 'posted', 'void')),
  gst_profile_id uuid references public.gst_profiles(id),
  place_of_supply text,
  tax_mode text check (tax_mode in ('non_gst', 'cgst_sgst', 'igst')),
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  linked_document_id uuid references public.financial_documents(id),
  posted_at timestamptz,
  posted_by uuid references public.staff(id),
  created_at timestamptz not null default now(),
  unique (branch_id, document_type, document_number)
);

create table if not exists public.branch_document_sequences (
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  document_type public.financial_document_type not null,
  financial_year text not null,
  prefix text not null,
  next_number bigint not null default 1 check (next_number > 0),
  primary key (branch_id, document_type, financial_year)
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  business_date date not null,
  opening_cash numeric(12,2) not null default 0,
  expected_closing_cash numeric(12,2),
  counted_closing_cash numeric(12,2),
  variance numeric(12,2),
  variance_reason text,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_by uuid references public.staff(id),
  closed_by uuid references public.staff(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (branch_id, business_date)
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  month date not null,
  status text not null default 'draft' check (status in ('draft', 'finalized', 'paid')),
  finalized_by uuid references public.staff(id),
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, month)
);

create table if not exists public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  staff_id uuid not null references public.staff(id),
  monthly_salary numeric(12,2) not null default 0,
  working_days integer not null default 0,
  present_days integer not null default 0,
  earnings jsonb not null default '{}'::jsonb,
  deductions jsonb not null default '{}'::jsonb,
  net_pay numeric(12,2) not null default 0,
  payment_method text,
  payment_reference text,
  paid_at timestamptz,
  unique (payroll_run_id, staff_id)
);

-- Notifications, exports, command idempotency, and read-only legacy archive.
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_type text not null,
  channel text not null check (channel in ('whatsapp', 'sms', 'in_app')),
  body text not null,
  enabled boolean not null default true,
  timing jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, event_type, channel)
);

create table if not exists public.message_outbox (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id),
  booking_id uuid references public.bookings(id),
  customer_id uuid references public.customers(id),
  channel text not null check (channel in ('whatsapp', 'sms', 'in_app')),
  recipient text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'delivered', 'failed')),
  provider_message_id text,
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.data_exports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  requested_by uuid references public.staff(id),
  export_type text not null,
  format text not null check (format in ('csv', 'xlsx', 'pdf', 'google_sheets', 'full')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'complete', 'failed')),
  storage_path text,
  external_url text,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.command_receipts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  idempotency_key text not null,
  command_name text not null,
  actor_id uuid references public.staff(id),
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  unique (business_id, idempotency_key)
);

create table if not exists public.legacy_bookings_archive (
  id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id),
  booking_number text,
  customer_name text,
  pickup_date date,
  return_date date,
  status text,
  total_amount numeric(12,2),
  amount_paid numeric(12,2),
  source_payload jsonb not null default '{}'::jsonb,
  archived_at timestamptz not null default now()
);

-- Performance indexes for tenant/date access patterns.
create index if not exists item_variants_business_branch_idx on public.item_variants (business_id, branch_id, item_id);
create index if not exists bookings_availability_idx on public.bookings (business_id, branch_id, pickup_date, return_date, status);
create index if not exists bookings_hold_expiry_idx on public.bookings (hold_expires_at) where status = 'hold';
create index if not exists booking_items_variant_idx on public.booking_items (business_id, branch_id, item_variant_id, booking_id);
create index if not exists fulfilments_item_date_idx on public.booking_item_fulfilments (booking_item_id, event_type, occurred_at);
create index if not exists unavailable_open_variant_idx on public.inventory_unavailability (business_id, branch_id, item_variant_id) where restored_quantity < quantity;
create index if not exists assets_lookup_idx on public.inventory_assets (business_id, branch_id, item_variant_id, status);
create index if not exists transfers_source_status_idx on public.inventory_transfers (business_id, source_branch_id, status);
create index if not exists financial_entries_booking_idx on public.financial_entries (business_id, booking_id, posted_at);
create index if not exists message_outbox_retry_idx on public.message_outbox (status, next_attempt_at) where status in ('queued', 'failed');

-- Authorization helpers live outside the exposed public schema.
create or replace function private.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select s.business_id from public.staff s where s.id = (select auth.uid()) and s.status in ('active', 'approved') limit 1
$$;

create or replace function private.can_access_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.staff s
    where s.id = (select auth.uid())
      and s.business_id = target_business_id
      and s.status in ('active', 'approved')
  )
$$;

create or replace function private.can_access_branch(target_business_id uuid, target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.staff s
    where s.id = (select auth.uid())
      and s.business_id = target_business_id
      and s.status in ('active', 'approved')
      and (
        s.role in ('owner', 'super_admin')
        or s.branch_id = target_branch_id
        or exists (
          select 1 from public.staff_branch_memberships sbm
          where sbm.staff_id = s.id and sbm.branch_id = target_branch_id
        )
      )
  )
$$;

create or replace function private.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.staff s
    where s.id = (select auth.uid())
      and s.status in ('active', 'approved')
      and (
        s.role in ('owner', 'super_admin')
        or coalesce((s.permissions ->> permission_key)::boolean, false)
        or exists (
          select 1
          from public.staff_role_assignments sra
          join public.business_roles br on br.id = sra.role_id and br.business_id = s.business_id
          where sra.staff_id = s.id and coalesce((br.permissions ->> permission_key)::boolean, false)
        )
      )
  )
$$;

create or replace function private.has_business_permission(target_business_id uuid, permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.staff s
    where s.id = (select auth.uid())
      and s.business_id = target_business_id
      and s.status in ('active', 'approved')
      and (
        s.role in ('owner', 'super_admin')
        or coalesce((s.permissions ->> permission_key)::boolean, false)
        or exists (
          select 1
          from public.staff_role_assignments sra
          join public.business_roles br on br.id = sra.role_id and br.business_id = target_business_id
          where sra.staff_id = s.id and coalesce((br.permissions ->> permission_key)::boolean, false)
        )
      )
  )
$$;

revoke all on function private.current_business_id() from public, anon;
revoke all on function private.can_access_business(uuid) from public, anon;
revoke all on function private.can_access_branch(uuid, uuid) from public, anon;
grant execute on function private.current_business_id() to authenticated, service_role;
grant execute on function private.can_access_business(uuid) to authenticated, service_role;
grant execute on function private.can_access_branch(uuid, uuid) to authenticated, service_role;
revoke all on function private.has_permission(text) from public, anon;
grant execute on function private.has_permission(text) to authenticated, service_role;
revoke all on function private.has_business_permission(uuid, text) from public, anon;
grant execute on function private.has_business_permission(uuid, text) to authenticated, service_role;

create or replace function private.guard_staff_privilege_changes()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if old.id = (select auth.uid())
    and not private.has_business_permission(old.business_id, 'manage_staff')
    and (
      new.business_id is distinct from old.business_id
      or new.branch_id is distinct from old.branch_id
      or new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.permissions is distinct from old.permissions
    )
  then
    raise exception 'Staff permission required to change role, branch, status or permissions';
  end if;
  return new;
end
$$;
revoke all on function private.guard_staff_privilege_changes() from public, anon, authenticated;
drop trigger if exists guard_staff_privilege_changes on public.staff;
create trigger guard_staff_privilege_changes
before update on public.staff
for each row execute function private.guard_staff_privilege_changes();

-- Date-range availability. Planned dates control capacity; same-day actual returns release
-- returned quantities. Overdue rentals remain operationally visible but do not extend dates.
create or replace function public.get_rental_availability(
  p_business_id uuid,
  p_branch_id uuid,
  p_from date,
  p_to date,
  p_item_id uuid default null,
  p_variant_id uuid default null,
  p_requested_quantity integer default 0
)
returns table (
  item_id uuid,
  variant_id uuid,
  size text,
  physical_stock integer,
  peak_booked integer,
  unavailable_quantity integer,
  out_quantity integer,
  available_quantity integer,
  shortage_quantity integer
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with days as (
    select d::date as day
    from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
    where p_from <= p_to
  ),
  variants as (
    select v.id as variant_id, v.item_id, v.size, v.total_stock::integer as physical_stock
    from public.item_variants v
    join public.items i on i.id = v.item_id
    where v.business_id = p_business_id
      and v.branch_id = p_branch_id
      and v.archived_at is null
      and i.archived_at is null
      and i.is_active = true
      and (p_item_id is null or i.id = p_item_id)
      and (p_variant_id is null or v.id = p_variant_id)
  ),
  reservations_by_day as (
    select v.variant_id, d.day,
      coalesce(sum(greatest(0, bi.quantity - coalesce((
        select sum(f.quantity)::integer
        from public.booking_item_fulfilments f
        where f.booking_item_id = bi.id
          and f.event_type = 'return'
          and f.occurred_at::date <= d.day
      ), 0))), 0)::integer as booked
    from variants v
    cross join days d
    left join public.bookings b on b.business_id = p_business_id
      and b.branch_id = p_branch_id
      and b.status in ('hold', 'confirmed', 'picked_up', 'partially_returned', 'returned')
      and (b.status <> 'hold' or b.hold_expires_at is null or b.hold_expires_at > now())
      and b.pickup_date <= d.day
      and b.return_date >= d.day
    left join public.booking_items bi on bi.booking_id = b.id and bi.item_variant_id = v.variant_id
    group by v.variant_id, d.day
  ),
  peak as (
    select variant_id, coalesce(max(booked), 0)::integer as peak_booked
    from reservations_by_day
    group by variant_id
  ),
  unavailable as (
    select u.item_variant_id as variant_id,
      coalesce(sum(u.quantity - u.restored_quantity), 0)::integer as unavailable_quantity
    from public.inventory_unavailability u
    where u.business_id = p_business_id
      and u.branch_id = p_branch_id
      and u.restored_quantity < u.quantity
    group by u.item_variant_id
  ),
  outgoing as (
    select l.item_variant_id as variant_id,
      coalesce(sum(l.quantity - l.received_quantity), 0)::integer as transfer_quantity
    from public.inventory_transfer_lines l
    join public.inventory_transfers t on t.id = l.transfer_id
    where t.business_id = p_business_id
      and t.source_branch_id = p_branch_id
      and t.status in ('dispatched', 'in_transit', 'discrepancy')
    group by l.item_variant_id
  ),
  currently_out as (
    select bi.item_variant_id as variant_id,
      coalesce(sum(greatest(0,
        coalesce((select sum(f.quantity)::integer from public.booking_item_fulfilments f where f.booking_item_id = bi.id and f.event_type = 'pickup'), bi.picked_up_quantity)
        - coalesce((select sum(f.quantity)::integer from public.booking_item_fulfilments f where f.booking_item_id = bi.id and f.event_type = 'return'), bi.returned_quantity)
      )), 0)::integer as out_quantity
    from public.booking_items bi
    join public.bookings b on b.id = bi.booking_id
    where bi.business_id = p_business_id and bi.branch_id = p_branch_id
      and b.status in ('picked_up', 'partially_returned')
    group by bi.item_variant_id
  )
  select v.item_id, v.variant_id, v.size, v.physical_stock,
    coalesce(p.peak_booked, 0),
    coalesce(u.unavailable_quantity, 0),
    coalesce(o.out_quantity, 0),
    greatest(0, v.physical_stock - coalesce(p.peak_booked, 0) - coalesce(u.unavailable_quantity, 0) - coalesce(t.transfer_quantity, 0))::integer,
    greatest(0, p_requested_quantity - greatest(0, v.physical_stock - coalesce(p.peak_booked, 0) - coalesce(u.unavailable_quantity, 0) - coalesce(t.transfer_quantity, 0)))::integer
  from variants v
  left join peak p on p.variant_id = v.variant_id
  left join unavailable u on u.variant_id = v.variant_id
  left join outgoing t on t.variant_id = v.variant_id
  left join currently_out o on o.variant_id = v.variant_id
  order by v.item_id, v.size
$$;

revoke all on function public.get_rental_availability(uuid, uuid, date, date, uuid, uuid, integer) from public, anon;
grant execute on function public.get_rental_availability(uuid, uuid, date, date, uuid, uuid, integer) to authenticated, service_role;

create or replace function private.expire_rental_holds()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare expired_count integer;
begin
  with expired as (
    update public.bookings
    set status = 'cancelled',
        cancellation_reason = 'Hold expired automatically',
        cancelled_at = now(),
        updated_at = now()
    where status = 'hold' and hold_expires_at is not null and hold_expires_at <= now()
    returning id, business_id, branch_id
  ), logged as (
    insert into public.audit_log (business_id, branch_id, action, table_name, record_id, new_value)
    select business_id, branch_id, 'booking.hold_expired', 'bookings', id, jsonb_build_object('status', 'cancelled')
    from expired
    returning 1
  )
  select count(*) into expired_count from logged;
  return expired_count;
end;
$$;
revoke all on function private.expire_rental_holds() from public, anon, authenticated;
grant execute on function private.expire_rental_holds() to service_role;

create or replace function public.restore_unavailable_stock(
  p_unavailability_id uuid,
  p_quantity integer,
  p_note text default null
)
returns public.inventory_unavailability
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  result public.inventory_unavailability;
begin
  if p_quantity <= 0 then raise exception 'Restore quantity must be positive'; end if;
  if not private.has_permission('manage_inventory') then raise exception 'Inventory permission required'; end if;
  update public.inventory_unavailability
  set restored_quantity = restored_quantity + p_quantity,
      restored_at = case when restored_quantity + p_quantity = quantity then now() else restored_at end,
      restored_by = (select auth.uid()),
      notes = case when p_note is null then notes else concat_ws(E'\n', notes, p_note) end
  where id = p_unavailability_id
    and restored_quantity + p_quantity <= quantity
  returning * into result;
  if result.id is null then raise exception 'Unavailable record not found or quantity exceeds outstanding amount'; end if;
  insert into public.inventory_movements (
    business_id, branch_id, item_id, item_variant_id, inventory_asset_id,
    movement_type, quantity_delta, reference_type, reference_id, note, performed_by
  ) values (
    result.business_id, result.branch_id, result.item_id, result.item_variant_id, result.inventory_asset_id,
    'restore', 0, 'inventory_unavailability', result.id, p_note, (select auth.uid())
  );
  insert into public.audit_log (business_id, branch_id, staff_id, action, table_name, record_id, new_value)
  values (result.business_id, result.branch_id, (select auth.uid()), 'inventory.unavailability_restored',
    'inventory_unavailability', result.id, jsonb_build_object('restored_quantity', p_quantity, 'note', p_note));
  return result;
end
$$;

revoke all on function public.restore_unavailable_stock(uuid, integer, text) from public, anon;
grant execute on function public.restore_unavailable_stock(uuid, integer, text) to authenticated, service_role;

-- RLS and explicit Data API grants. Anonymous clients receive no table access.
do $$
declare
  target_table text;
  access_expression text;
  select_expression text;
  write_expression text;
  permission_expression text;
  tenant_tables text[] := array[
    'business_roles','staff_branch_memberships','staff_role_assignments','gst_profiles','tax_rules','rental_price_packages',
    'inventory_assets','item_bundle_components','booking_item_assets','booking_item_fulfilments','inventory_unavailability',
    'inventory_movements','inventory_transfers','inventory_transfer_lines','stocktakes','stocktake_lines','customer_phones',
    'customer_measurements','customer_documents','customer_credit_entries','financial_entries','deposit_ledger','financial_documents',
    'branch_document_sequences','cash_sessions','payroll_runs','payroll_entries','message_templates','message_outbox','data_exports',
    'command_receipts','legacy_bookings_archive'
  ];
begin
  foreach target_table in array tenant_tables loop
    if target_table = 'inventory_transfers' then
      access_expression := '(private.can_access_branch(business_id, source_branch_id) or private.can_access_branch(business_id, destination_branch_id))';
    elsif target_table = 'inventory_transfer_lines' then
      access_expression := '(exists (select 1 from public.inventory_transfers t where t.id = inventory_transfer_lines.transfer_id and t.business_id = inventory_transfer_lines.business_id and (private.can_access_branch(t.business_id, t.source_branch_id) or private.can_access_branch(t.business_id, t.destination_branch_id))))';
    elsif target_table = 'stocktake_lines' then
      access_expression := '(exists (select 1 from public.stocktakes s where s.id = stocktake_lines.stocktake_id and s.business_id = stocktake_lines.business_id and private.can_access_branch(s.business_id, s.branch_id)))';
    elsif target_table in ('booking_item_assets', 'booking_item_fulfilments') then
      access_expression := format('(exists (select 1 from public.booking_items bi join public.bookings b on b.id = bi.booking_id where bi.id = %I.booking_item_id and b.business_id = %I.business_id and private.can_access_branch(b.business_id, b.branch_id)))', target_table, target_table);
    elsif target_table = 'message_outbox' then
      access_expression := '((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id))';
    elsif exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = target_table and c.column_name = 'branch_id'
    ) then
      access_expression := 'private.can_access_branch(business_id, branch_id)';
    else
      access_expression := 'private.can_access_business(business_id)';
    end if;

    permission_expression := case
      when target_table in ('business_roles','staff_branch_memberships','staff_role_assignments')
        then 'private.has_business_permission(business_id, ''manage_staff'')'
      when target_table in ('gst_profiles','tax_rules','rental_price_packages','branch_document_sequences','message_templates')
        then 'private.has_business_permission(business_id, ''manage_settings'')'
      when target_table in ('inventory_assets','item_bundle_components')
        then 'private.has_business_permission(business_id, ''manage_inventory'')'
      when target_table = 'inventory_movements'
        then '(private.has_business_permission(business_id, ''manage_inventory'') or private.has_business_permission(business_id, ''manage_transfers'') or private.has_business_permission(business_id, ''manage_stocktakes''))'
      when target_table = 'inventory_unavailability'
        then '(private.has_business_permission(business_id, ''manage_inventory'') or private.has_business_permission(business_id, ''manage_bookings''))'
      when target_table in ('inventory_transfers','inventory_transfer_lines')
        then 'private.has_business_permission(business_id, ''manage_transfers'')'
      when target_table in ('stocktakes','stocktake_lines')
        then 'private.has_business_permission(business_id, ''manage_stocktakes'')'
      when target_table in ('booking_item_assets','booking_item_fulfilments','message_outbox')
        then 'private.has_business_permission(business_id, ''manage_bookings'')'
      when target_table in ('customer_phones','customer_measurements','customer_documents')
        then 'private.has_business_permission(business_id, ''manage_customers'')'
      when target_table = 'customer_credit_entries'
        then 'private.has_business_permission(business_id, ''manage_payments'')'
      when target_table in ('financial_entries','financial_documents','cash_sessions')
        then 'private.has_business_permission(business_id, ''manage_payments'')'
      when target_table = 'deposit_ledger'
        then '(private.has_business_permission(business_id, ''settle_deposits'') or private.has_business_permission(business_id, ''manage_payments''))'
      when target_table in ('payroll_runs','payroll_entries')
        then 'private.has_business_permission(business_id, ''manage_payroll'')'
      when target_table = 'data_exports'
        then 'private.has_business_permission(business_id, ''manage_reports'')'
      when target_table = 'legacy_bookings_archive'
        then 'private.has_business_permission(business_id, ''view_legacy_archive'')'
      when target_table = 'command_receipts'
        then 'false'
      else 'false'
    end;

    select_expression := access_expression;
    if target_table = 'legacy_bookings_archive' then
      select_expression := '(' || access_expression || ') and (' || permission_expression || ')';
    end if;
    write_expression := '(' || access_expression || ') and (' || permission_expression || ')';
    execute format('alter table public.%I enable row level security', target_table);
    execute format('revoke all on table public.%I from anon, authenticated', target_table);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', target_table);
    execute format('grant select, insert, update, delete on table public.%I to service_role', target_table);
    execute format('drop policy if exists %I on public.%I', target_table || '_select', target_table);
    execute format('drop policy if exists %I on public.%I', target_table || '_insert', target_table);
    execute format('drop policy if exists %I on public.%I', target_table || '_update', target_table);
    execute format('drop policy if exists %I on public.%I', target_table || '_delete', target_table);
    execute format('create policy %I on public.%I for select to authenticated using (%s)', target_table || '_select', target_table, select_expression);
    execute format('create policy %I on public.%I for insert to authenticated with check (%s)', target_table || '_insert', target_table, write_expression);
    execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)', target_table || '_update', target_table, write_expression, write_expression);
    execute format('create policy %I on public.%I for delete to authenticated using (%s)', target_table || '_delete', target_table, write_expression);
  end loop;
end $$;

-- Replace legacy permissive policies on core operational tables. Policies are
-- intentionally split by operation so read access never implies mutation access.
do $$
declare
  target_table text;
  policy_record record;
  core_tables text[] := array[
    'businesses','branches','staff','customers','items','item_variants','item_images',
    'bookings','booking_items','booking_payments','booking_timeline','booking_drafts',
    'expenses','staff_attendance','audit_log','notifications','sms_log'
  ];
begin
  foreach target_table in array core_tables loop
    execute format('alter table public.%I enable row level security', target_table);
    for policy_record in
      select policyname from pg_policies where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy if exists %I on public.%I', policy_record.policyname, target_table);
    end loop;
  end loop;
end $$;

create policy businesses_select on public.businesses for select to authenticated
  using (owner_id = (select auth.uid()) or private.can_access_business(id));
create policy businesses_update on public.businesses for update to authenticated
  using (private.can_access_business(id) and private.has_business_permission(id, 'manage_settings'))
  with check (private.can_access_business(id) and private.has_business_permission(id, 'manage_settings'));

create policy branches_select on public.branches for select to authenticated
  using (private.can_access_branch(business_id, id));
create policy branches_insert on public.branches for insert to authenticated
  with check (private.can_access_business(business_id) and private.has_business_permission(business_id, 'manage_settings'));
create policy branches_update on public.branches for update to authenticated
  using (private.can_access_business(business_id) and private.has_business_permission(business_id, 'manage_settings'))
  with check (private.can_access_business(business_id) and private.has_business_permission(business_id, 'manage_settings'));
create policy branches_delete on public.branches for delete to authenticated
  using (private.can_access_business(business_id) and private.has_business_permission(business_id, 'manage_settings'));

create policy staff_select on public.staff for select to authenticated
  using (
    id = (select auth.uid())
    or (business_id is not null and branch_id is not null and private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_staff'))
  );
create policy staff_insert on public.staff for insert to authenticated
  with check (business_id is not null and private.can_access_business(business_id) and private.has_business_permission(business_id, 'manage_staff'));
create policy staff_update on public.staff for update to authenticated
  using (id = (select auth.uid()) or (business_id is not null and private.has_business_permission(business_id, 'manage_staff')))
  with check (id = (select auth.uid()) or (business_id is not null and private.has_business_permission(business_id, 'manage_staff')));
create policy staff_delete on public.staff for delete to authenticated
  using (business_id is not null and private.has_business_permission(business_id, 'manage_staff'));

create policy customers_select on public.customers for select to authenticated
  using ((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id));
create policy customers_insert on public.customers for insert to authenticated
  with check (
    ((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id))
    and (private.has_business_permission(business_id, 'manage_customers') or private.has_business_permission(business_id, 'manage_bookings'))
  );
create policy customers_update on public.customers for update to authenticated
  using (((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id)) and private.has_business_permission(business_id, 'manage_customers'))
  with check (((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id)) and private.has_business_permission(business_id, 'manage_customers'));
create policy customers_delete on public.customers for delete to authenticated
  using (((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id)) and private.has_business_permission(business_id, 'manage_customers'));

create policy items_select on public.items for select to authenticated
  using (private.can_access_business(business_id));
create policy items_insert on public.items for insert to authenticated
  with check (private.can_access_business(business_id) and private.has_business_permission(business_id, 'manage_inventory'));
create policy items_update on public.items for update to authenticated
  using (private.can_access_business(business_id) and private.has_business_permission(business_id, 'manage_inventory'))
  with check (private.can_access_business(business_id) and private.has_business_permission(business_id, 'manage_inventory'));
create policy items_delete on public.items for delete to authenticated
  using (private.can_access_business(business_id) and private.has_business_permission(business_id, 'manage_inventory'));

create policy item_variants_select on public.item_variants for select to authenticated
  using (private.can_access_branch(business_id, branch_id));
create policy item_variants_insert on public.item_variants for insert to authenticated
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_inventory'));
create policy item_variants_update on public.item_variants for update to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_inventory'))
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_inventory'));
create policy item_variants_delete on public.item_variants for delete to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_inventory'));

create policy item_images_select on public.item_images for select to authenticated
  using (exists (select 1 from public.items i where i.id = item_images.item_id and private.can_access_business(i.business_id)));
create policy item_images_insert on public.item_images for insert to authenticated
  with check (exists (select 1 from public.items i where i.id = item_images.item_id and private.can_access_business(i.business_id) and private.has_business_permission(i.business_id, 'manage_inventory')));
create policy item_images_update on public.item_images for update to authenticated
  using (exists (select 1 from public.items i where i.id = item_images.item_id and private.can_access_business(i.business_id) and private.has_business_permission(i.business_id, 'manage_inventory')))
  with check (exists (select 1 from public.items i where i.id = item_images.item_id and private.can_access_business(i.business_id) and private.has_business_permission(i.business_id, 'manage_inventory')));
create policy item_images_delete on public.item_images for delete to authenticated
  using (exists (select 1 from public.items i where i.id = item_images.item_id and private.can_access_business(i.business_id) and private.has_business_permission(i.business_id, 'manage_inventory')));

create policy bookings_select on public.bookings for select to authenticated
  using (private.can_access_branch(business_id, branch_id));
create policy bookings_insert on public.bookings for insert to authenticated
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_bookings'));
create policy bookings_update on public.bookings for update to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_bookings'))
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_bookings'));
create policy bookings_delete on public.bookings for delete to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_bookings'));

create policy booking_items_select on public.booking_items for select to authenticated
  using (private.can_access_branch(business_id, branch_id));
create policy booking_items_insert on public.booking_items for insert to authenticated
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_bookings'));
create policy booking_items_update on public.booking_items for update to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_bookings'))
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_bookings'));
create policy booking_items_delete on public.booking_items for delete to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_bookings'));

create policy booking_payments_select on public.booking_payments for select to authenticated
  using (private.can_access_branch(business_id, branch_id));
create policy booking_payments_insert on public.booking_payments for insert to authenticated
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_payments'));
create policy booking_payments_update on public.booking_payments for update to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_payments'))
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_payments'));
create policy booking_payments_delete on public.booking_payments for delete to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_payments'));

create policy booking_timeline_select on public.booking_timeline for select to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_timeline.booking_id and private.can_access_branch(b.business_id, b.branch_id)));
create policy booking_timeline_insert on public.booking_timeline for insert to authenticated
  with check (exists (select 1 from public.bookings b where b.id = booking_timeline.booking_id and private.can_access_branch(b.business_id, b.branch_id) and (private.has_business_permission(b.business_id, 'manage_bookings') or private.has_business_permission(b.business_id, 'manage_payments'))));

create policy booking_drafts_select on public.booking_drafts for select to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_bookings'));
create policy booking_drafts_insert on public.booking_drafts for insert to authenticated
  with check (private.can_access_branch(business_id, branch_id) and staff_id = (select auth.uid()) and private.has_business_permission(business_id, 'manage_bookings'));
create policy booking_drafts_update on public.booking_drafts for update to authenticated
  using (private.can_access_branch(business_id, branch_id) and staff_id = (select auth.uid()) and private.has_business_permission(business_id, 'manage_bookings'))
  with check (private.can_access_branch(business_id, branch_id) and staff_id = (select auth.uid()) and private.has_business_permission(business_id, 'manage_bookings'));
create policy booking_drafts_delete on public.booking_drafts for delete to authenticated
  using (private.can_access_branch(business_id, branch_id) and staff_id = (select auth.uid()) and private.has_business_permission(business_id, 'manage_bookings'));

create policy expenses_select on public.expenses for select to authenticated
  using (private.can_access_branch(business_id, branch_id));
create policy expenses_insert on public.expenses for insert to authenticated
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_expenses'));
create policy expenses_update on public.expenses for update to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_expenses'))
  with check (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_expenses'));
create policy expenses_delete on public.expenses for delete to authenticated
  using (private.can_access_branch(business_id, branch_id) and private.has_business_permission(business_id, 'manage_expenses'));

create policy staff_attendance_select on public.staff_attendance for select to authenticated
  using (private.can_access_branch(business_id, branch_id) and (staff_id = (select auth.uid()) or private.has_business_permission(business_id, 'manage_staff')));
create policy staff_attendance_insert on public.staff_attendance for insert to authenticated
  with check (private.can_access_branch(business_id, branch_id) and (staff_id = (select auth.uid()) or private.has_business_permission(business_id, 'manage_staff')));
create policy staff_attendance_update on public.staff_attendance for update to authenticated
  using (private.can_access_branch(business_id, branch_id) and (staff_id = (select auth.uid()) or private.has_business_permission(business_id, 'manage_staff')))
  with check (private.can_access_branch(business_id, branch_id) and (staff_id = (select auth.uid()) or private.has_business_permission(business_id, 'manage_staff')));

create policy audit_log_select on public.audit_log for select to authenticated
  using (
    business_id is not null
    and ((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id))
    and (private.has_business_permission(business_id, 'manage_settings') or private.has_business_permission(business_id, 'manage_reports'))
  );
create policy audit_log_insert on public.audit_log for insert to authenticated
  with check (
    business_id is not null
    and staff_id = (select auth.uid())
    and ((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id))
  );

create policy notifications_select on public.notifications for select to authenticated
  using (
    (target_staff_id is null or target_staff_id = (select auth.uid()))
    and ((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id))
  );
create policy notifications_insert on public.notifications for insert to authenticated
  with check ((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id));
create policy notifications_update on public.notifications for update to authenticated
  using (target_staff_id = (select auth.uid()) and private.can_access_business(business_id))
  with check (target_staff_id = (select auth.uid()) and private.can_access_business(business_id));
create policy notifications_delete on public.notifications for delete to authenticated
  using (target_staff_id = (select auth.uid()) and private.can_access_business(business_id));

create policy sms_log_select on public.sms_log for select to authenticated
  using (((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id)) and (private.has_business_permission(business_id, 'manage_bookings') or private.has_business_permission(business_id, 'manage_settings')));
create policy sms_log_insert on public.sms_log for insert to authenticated
  with check (((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id)) and (private.has_business_permission(business_id, 'manage_bookings') or private.has_business_permission(business_id, 'manage_settings')));
create policy sms_log_update on public.sms_log for update to authenticated
  using (((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id)) and private.has_business_permission(business_id, 'manage_settings'))
  with check (((branch_id is null and private.can_access_business(business_id)) or private.can_access_branch(business_id, branch_id)) and private.has_business_permission(business_id, 'manage_settings'));

-- Existing core tables remain directly used by supabase-js, so grants are explicit too.
grant select, insert, update, delete on public.businesses, public.branches, public.staff, public.customers,
  public.items, public.item_variants, public.item_images, public.bookings, public.booking_items,
  public.booking_payments, public.booking_timeline, public.booking_drafts, public.expenses,
  public.staff_attendance, public.audit_log, public.notifications, public.sms_log to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- Storage buckets remain private; signed URLs are issued server-side.
insert into storage.buckets (id, name, public)
values ('customer-private', 'customer-private', false), ('rental-evidence', 'rental-evidence', false), ('exports', 'exports', false)
on conflict (id) do update set public = excluded.public;

alter table public.customers
  drop column if exists alternate_phone,
  drop column if exists emergency_phone;

comment on function public.get_rental_availability is 'Tenant and branch scoped whole-day rental availability. Planned return controls capacity; actual early returns release same day.';

-- Cover every foreign key used by tenant, branch, inventory, booking and finance joins.
create index if not exists audit_log_branch_id_fkey_idx_7e589ae on public.audit_log (branch_id);
create index if not exists audit_log_business_id_fkey_idx_50cfe3a on public.audit_log (business_id);
create index if not exists audit_log_staff_id_fkey_idx_e98cd8e on public.audit_log (staff_id);
create index if not exists booking_drafts_branch_id_fkey_idx_116a8d2 on public.booking_drafts (branch_id);
create index if not exists booking_drafts_business_id_fkey_idx_66a619c on public.booking_drafts (business_id);
create index if not exists booking_drafts_staff_id_fkey_idx_5ee782d on public.booking_drafts (staff_id);
create index if not exists booking_item_assets_assigned_by_fkey_idx_ecda02b on public.booking_item_assets (assigned_by);
create index if not exists booking_item_assets_business_id_fkey_idx_f3965b9 on public.booking_item_assets (business_id);
create index if not exists booking_item_assets_released_by_fkey_idx_b1845d0 on public.booking_item_assets (released_by);
create index if not exists booking_item_fulfilments_booking_id_fkey_idx_e3c1ccd on public.booking_item_fulfilments (booking_id);
create index if not exists booking_item_fulfilments_branch_id_fkey_idx_95ddff5 on public.booking_item_fulfilments (branch_id);
create index if not exists booking_item_fulfilments_performed_by_fkey_idx_42b365d on public.booking_item_fulfilments (performed_by);
create index if not exists booking_items_booking_id_fkey_idx_72256cb on public.booking_items (booking_id);
create index if not exists booking_items_branch_id_fkey_idx_70f44f6 on public.booking_items (branch_id);
create index if not exists booking_items_item_id_fkey_idx_8c5dbca on public.booking_items (item_id);
create index if not exists booking_items_item_variant_id_fkey_idx_395beff on public.booking_items (item_variant_id);
create index if not exists booking_items_substituted_from_id_fkey_idx_c6991a3 on public.booking_items (substituted_from_id);
create index if not exists booking_payments_booking_id_fkey_idx_f3203ee on public.booking_payments (booking_id);
create index if not exists booking_payments_branch_id_fkey_idx_e9709fe on public.booking_payments (branch_id);
create index if not exists booking_payments_business_id_fkey_idx_5e24566 on public.booking_payments (business_id);
create index if not exists booking_payments_collected_by_fkey_idx_dc70689 on public.booking_payments (collected_by);
create index if not exists booking_payments_voided_by_fkey_idx_085b09f on public.booking_payments (voided_by);
create index if not exists booking_timeline_booking_id_fkey_idx_665f0ea on public.booking_timeline (booking_id);
create index if not exists booking_timeline_business_id_fkey_idx_cf6c00e on public.booking_timeline (business_id);
create index if not exists booking_timeline_performed_by_fkey_idx_5770ef4 on public.booking_timeline (performed_by);
create index if not exists bookings_branch_id_fkey_idx_c7e25ec on public.bookings (branch_id);
create index if not exists bookings_created_by_fkey_idx_b338451 on public.bookings (created_by);
create index if not exists bookings_customer_id_fkey_idx_660a93d on public.bookings (customer_id);
create index if not exists bookings_last_updated_by_fkey_idx_ea072c1 on public.bookings (last_updated_by);
create index if not exists bookings_overbooked_by_fkey_idx_5fe747c on public.bookings (overbooked_by);
create index if not exists branch_document_sequences_business_id_fkey_idx_cb8c666 on public.branch_document_sequences (business_id);
create index if not exists branches_business_id_fkey_idx_a2b6325 on public.branches (business_id);
create index if not exists branches_gst_profile_id_fkey_idx_6565c0d on public.branches (gst_profile_id);
create index if not exists cash_sessions_business_id_fkey_idx_6ff612d on public.cash_sessions (business_id);
create index if not exists cash_sessions_closed_by_fkey_idx_4498bec on public.cash_sessions (closed_by);
create index if not exists cash_sessions_opened_by_fkey_idx_0a808a8 on public.cash_sessions (opened_by);
create index if not exists command_receipts_actor_id_fkey_idx_c0b4b7c on public.command_receipts (actor_id);
create index if not exists customer_credit_entries_booking_id_fkey_idx_ead2250 on public.customer_credit_entries (booking_id);
create index if not exists customer_credit_entries_branch_id_fkey_idx_62b0c2a on public.customer_credit_entries (branch_id);
create index if not exists customer_credit_entries_business_id_fkey_idx_8ab5a94 on public.customer_credit_entries (business_id);
create index if not exists customer_credit_entries_created_by_fkey_idx_67cd9cc on public.customer_credit_entries (created_by);
create index if not exists customer_credit_entries_customer_id_fkey_idx_48ea1ed on public.customer_credit_entries (customer_id);
create index if not exists customer_documents_business_id_fkey_idx_bfd5ae9 on public.customer_documents (business_id);
create index if not exists customer_documents_customer_id_fkey_idx_55e8954 on public.customer_documents (customer_id);
create index if not exists customer_documents_uploaded_by_fkey_idx_4011129 on public.customer_documents (uploaded_by);
create index if not exists customer_measurements_business_id_fkey_idx_9a3d615 on public.customer_measurements (business_id);
create index if not exists customer_measurements_customer_id_fkey_idx_fb95719 on public.customer_measurements (customer_id);
create index if not exists customer_measurements_measured_by_fkey_idx_51e46b9 on public.customer_measurements (measured_by);
create index if not exists customer_phones_customer_id_fkey_idx_089ef2c on public.customer_phones (customer_id);
create index if not exists customers_blacklisted_by_fkey_idx_b2374b1 on public.customers (blacklisted_by);
create index if not exists customers_branch_id_fkey_idx_48450a6 on public.customers (branch_id);
create index if not exists customers_business_id_fkey_idx_1001f92 on public.customers (business_id);
create index if not exists customers_created_by_fkey_idx_a7d6ba9 on public.customers (created_by);
create index if not exists customers_merged_into_id_fkey_idx_3a057ea on public.customers (merged_into_id);
create index if not exists data_exports_business_id_fkey_idx_eca63fd on public.data_exports (business_id);
create index if not exists data_exports_requested_by_fkey_idx_72c15b8 on public.data_exports (requested_by);
create index if not exists deposit_ledger_booking_id_fkey_idx_e0e45b8 on public.deposit_ledger (booking_id);
create index if not exists deposit_ledger_branch_id_fkey_idx_639d09c on public.deposit_ledger (branch_id);
create index if not exists deposit_ledger_business_id_fkey_idx_e8be5b0 on public.deposit_ledger (business_id);
create index if not exists deposit_ledger_created_by_fkey_idx_d904ca9 on public.deposit_ledger (created_by);
create index if not exists expenses_added_by_fkey_idx_a5eb6ef on public.expenses (added_by);
create index if not exists expenses_branch_id_fkey_idx_e91cfee on public.expenses (branch_id);
create index if not exists expenses_business_id_fkey_idx_f9fc9b6 on public.expenses (business_id);
create index if not exists expenses_item_id_fkey_idx_d12cfad on public.expenses (item_id);
create index if not exists expenses_staff_id_fkey_idx_c43430d on public.expenses (staff_id);
create index if not exists financial_documents_booking_id_fkey_idx_1d8e052 on public.financial_documents (booking_id);
create index if not exists financial_documents_business_id_fkey_idx_9839f72 on public.financial_documents (business_id);
create index if not exists financial_documents_customer_id_fkey_idx_cd4bf7d on public.financial_documents (customer_id);
create index if not exists financial_documents_gst_profile_id_fkey_idx_f25a88f on public.financial_documents (gst_profile_id);
create index if not exists financial_documents_linked_document_id_fkey_idx_cbf6331 on public.financial_documents (linked_document_id);
create index if not exists financial_documents_posted_by_fkey_idx_af99d8f on public.financial_documents (posted_by);
create index if not exists financial_entries_booking_id_fkey_idx_dcf8ddd on public.financial_entries (booking_id);
create index if not exists financial_entries_branch_id_fkey_idx_bc1ad85 on public.financial_entries (branch_id);
create index if not exists financial_entries_customer_id_fkey_idx_6366d4c on public.financial_entries (customer_id);
create index if not exists financial_entries_parent_entry_id_fkey_idx_bb5dcd4 on public.financial_entries (parent_entry_id);
create index if not exists financial_entries_posted_by_fkey_idx_3724e5c on public.financial_entries (posted_by);
create index if not exists inventory_assets_branch_id_fkey_idx_37ec988 on public.inventory_assets (branch_id);
create index if not exists inventory_assets_item_id_fkey_idx_9df9c90 on public.inventory_assets (item_id);
create index if not exists inventory_assets_item_variant_id_fkey_idx_5d88650 on public.inventory_assets (item_variant_id);
create index if not exists inventory_movements_branch_id_fkey_idx_a86a6bf on public.inventory_movements (branch_id);
create index if not exists inventory_movements_business_id_fkey_idx_cf291a4 on public.inventory_movements (business_id);
create index if not exists inventory_movements_inventory_asset_id_fkey_idx_4a04ab0 on public.inventory_movements (inventory_asset_id);
create index if not exists inventory_movements_item_id_fkey_idx_b169546 on public.inventory_movements (item_id);
create index if not exists inventory_movements_item_variant_id_fkey_idx_3541fbe on public.inventory_movements (item_variant_id);
create index if not exists inventory_movements_performed_by_fkey_idx_a67b772 on public.inventory_movements (performed_by);
create index if not exists inventory_transfer_lines_business_id_fkey_idx_049a648 on public.inventory_transfer_lines (business_id);
create index if not exists inventory_transfer_lines_destination_item_variant_id_fk_1ac1f9a on public.inventory_transfer_lines (destination_item_variant_id);
create index if not exists inventory_transfer_lines_inventory_asset_id_fkey_idx_0581c3c on public.inventory_transfer_lines (inventory_asset_id);
create index if not exists inventory_transfer_lines_item_id_fkey_idx_d70e457 on public.inventory_transfer_lines (item_id);
create index if not exists inventory_transfer_lines_item_variant_id_fkey_idx_10fd094 on public.inventory_transfer_lines (item_variant_id);
create index if not exists inventory_transfer_lines_transfer_id_fkey_idx_31d18a4 on public.inventory_transfer_lines (transfer_id);
create index if not exists inventory_transfers_destination_branch_id_fkey_idx_96c5022 on public.inventory_transfers (destination_branch_id);
create index if not exists inventory_transfers_dispatched_by_fkey_idx_13944ef on public.inventory_transfers (dispatched_by);
create index if not exists inventory_transfers_received_by_fkey_idx_b59393b on public.inventory_transfers (received_by);
create index if not exists inventory_transfers_requested_by_fkey_idx_08da5ec on public.inventory_transfers (requested_by);
create index if not exists inventory_transfers_source_branch_id_fkey_idx_aa49e7e on public.inventory_transfers (source_branch_id);
create index if not exists inventory_unavailability_booking_item_id_fkey_idx_9e14d65 on public.inventory_unavailability (booking_item_id);
create index if not exists inventory_unavailability_branch_id_fkey_idx_60b5c0a on public.inventory_unavailability (branch_id);
create index if not exists inventory_unavailability_inventory_asset_id_fkey_idx_28fa383 on public.inventory_unavailability (inventory_asset_id);
create index if not exists inventory_unavailability_item_id_fkey_idx_3fe70f7 on public.inventory_unavailability (item_id);
create index if not exists inventory_unavailability_item_variant_id_fkey_idx_c1e40e4 on public.inventory_unavailability (item_variant_id);
create index if not exists inventory_unavailability_recorded_by_fkey_idx_8a631c1 on public.inventory_unavailability (recorded_by);
create index if not exists inventory_unavailability_restored_by_fkey_idx_5425976 on public.inventory_unavailability (restored_by);
create index if not exists item_bundle_components_bundle_item_id_fkey_idx_1fafee1 on public.item_bundle_components (bundle_item_id);
create index if not exists item_bundle_components_business_id_fkey_idx_ff076d1 on public.item_bundle_components (business_id);
create index if not exists item_bundle_components_component_item_id_fkey_idx_83ae8b5 on public.item_bundle_components (component_item_id);
create index if not exists item_bundle_components_component_variant_id_fkey_idx_bf149e1 on public.item_bundle_components (component_variant_id);
create index if not exists item_images_item_id_fkey_idx_4a265b2 on public.item_images (item_id);
create index if not exists item_images_uploaded_by_fkey_idx_0d29da0 on public.item_images (uploaded_by);
create index if not exists item_variants_branch_id_fkey_idx_6649e68 on public.item_variants (branch_id);
create index if not exists item_variants_item_id_fkey_idx_b5cf7fc on public.item_variants (item_id);
create index if not exists items_archived_by_fkey_idx_71219b1 on public.items (archived_by);
create index if not exists items_branch_id_fkey_idx_88e6ab7 on public.items (branch_id);
create index if not exists items_business_id_fkey_idx_4aea7ce on public.items (business_id);
create index if not exists items_created_by_fkey_idx_a9db3c4 on public.items (created_by);
create index if not exists legacy_bookings_archive_branch_id_fkey_idx_19dfeff on public.legacy_bookings_archive (branch_id);
create index if not exists legacy_bookings_archive_business_id_fkey_idx_0ae296b on public.legacy_bookings_archive (business_id);
create index if not exists message_outbox_booking_id_fkey_idx_0544d6f on public.message_outbox (booking_id);
create index if not exists message_outbox_branch_id_fkey_idx_2ee0ad1 on public.message_outbox (branch_id);
create index if not exists message_outbox_business_id_fkey_idx_5c047b9 on public.message_outbox (business_id);
create index if not exists message_outbox_customer_id_fkey_idx_2ffa2ad on public.message_outbox (customer_id);
create index if not exists notifications_branch_id_fkey_idx_93e3708 on public.notifications (branch_id);
create index if not exists notifications_business_id_fkey_idx_e1f3247 on public.notifications (business_id);
create index if not exists notifications_target_staff_id_fkey_idx_bfd1c5c on public.notifications (target_staff_id);
create index if not exists payroll_entries_business_id_fkey_idx_1d23162 on public.payroll_entries (business_id);
create index if not exists payroll_entries_staff_id_fkey_idx_3e380aa on public.payroll_entries (staff_id);
create index if not exists payroll_runs_finalized_by_fkey_idx_c1e1f27 on public.payroll_runs (finalized_by);
create index if not exists rental_price_packages_business_id_fkey_idx_f6c5d4a on public.rental_price_packages (business_id);
create index if not exists rental_price_packages_item_id_fkey_idx_d09222e on public.rental_price_packages (item_id);
create index if not exists sms_log_booking_id_fkey_idx_82b0f41 on public.sms_log (booking_id);
create index if not exists sms_log_branch_id_fkey_idx_7221131 on public.sms_log (branch_id);
create index if not exists sms_log_business_id_fkey_idx_8ed2451 on public.sms_log (business_id);
create index if not exists sms_log_customer_id_fkey_idx_838f549 on public.sms_log (customer_id);
create index if not exists sms_log_sent_by_fkey_idx_ac794a6 on public.sms_log (sent_by);
create index if not exists staff_branch_id_fkey_idx_6e8ed2e on public.staff (branch_id);
create index if not exists staff_business_id_fkey_idx_d86db3c on public.staff (business_id);
create index if not exists staff_attendance_approved_by_fkey_idx_1ba36b8 on public.staff_attendance (approved_by);
create index if not exists staff_attendance_branch_id_fkey_idx_41e1a28 on public.staff_attendance (branch_id);
create index if not exists staff_attendance_business_id_fkey_idx_f74b01d on public.staff_attendance (business_id);
create index if not exists staff_branch_memberships_branch_id_fkey_idx_1fad4e7 on public.staff_branch_memberships (branch_id);
create index if not exists staff_branch_memberships_business_id_fkey_idx_4fa7cd7 on public.staff_branch_memberships (business_id);
create index if not exists staff_role_assignments_business_id_fkey_idx_651df1f on public.staff_role_assignments (business_id);
create index if not exists staff_role_assignments_role_id_fkey_idx_2bf8019 on public.staff_role_assignments (role_id);
create index if not exists stocktake_lines_business_id_fkey_idx_aff00f3 on public.stocktake_lines (business_id);
create index if not exists stocktake_lines_counted_by_fkey_idx_d99915f on public.stocktake_lines (counted_by);
create index if not exists stocktake_lines_item_variant_id_fkey_idx_47b8687 on public.stocktake_lines (item_variant_id);
create index if not exists stocktakes_approved_by_fkey_idx_e50a257 on public.stocktakes (approved_by);
create index if not exists stocktakes_branch_id_fkey_idx_9bff1a5 on public.stocktakes (branch_id);
create index if not exists stocktakes_business_id_fkey_idx_fad3575 on public.stocktakes (business_id);
create index if not exists stocktakes_started_by_fkey_idx_cd8a821 on public.stocktakes (started_by);

-- Fail the zero-state migration if an excluded object slipped back into the
-- operational contract or a public table was left without RLS.
do $schema_contract$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and c.relname in ('washing_queue', 'quality_audits', 'booking_tasks', 'booking_signatures', 'subscriptions')
  ) then
    raise exception 'Excluded operational table exists';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and column_name in ('colour', 'available_stock', 'reserved_stock', 'condition_on_return', 'notion_page_id', 'prep_status', 'delivery_status')
  ) then
    raise exception 'Excluded operational column exists';
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  ) then
    raise exception 'Every public table must have row level security enabled';
  end if;

  if to_regprocedure('public.get_rental_availability(uuid,uuid,date,date,uuid,uuid,integer)') is null then
    raise exception 'Rental availability contract is missing';
  end if;
end
$schema_contract$;

