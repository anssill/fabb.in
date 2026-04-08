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