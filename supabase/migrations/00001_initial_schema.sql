-- Phase 1 Foundation: Echo Initial Core Schema

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Enums
create type staff_status as enum ('pending', 'approved', 'suspended', 'rejected');
create type user_role as enum ('super_admin', 'manager', 'floor_staff', 'auditor', 'custom');

-- 1. Businesses (Multi-tenant root)
create table public.businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subdomain text unique not null,
  owner_id uuid references auth.users(id),
  plan text default 'trial',
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- 2. Branches
create table public.branches (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  address text,
  gst_number text,
  contact_phone text,
  created_at timestamp with time zone default now()
);

-- 3. Staff
create table public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  full_name text not null,
  role user_role not null default 'floor_staff',
  status staff_status not null default 'pending',
  pin_code text, 
  created_at timestamp with time zone default now()
);

-- 4. Customers
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  email text,
  tier text default 'Standard',
  risk_score text default 'Low',
  created_at timestamp with time zone default now()
);

-- 5. Items (Inventory)
create table public.items (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  sku text not null,
  name text not null,
  category text not null,
  daily_rate numeric not null,
  condition_grade text default 'A',
  storage_location text,
  created_at timestamp with time zone default now()
);

-- 6. Bookings
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  customer_id uuid references public.customers(id) not null,
  status text not null default 'draft',
  pickup_date date not null,
  return_date date not null,
  total_amount numeric not null default 0,
  advance_paid numeric not null default 0,
  deposit_collected numeric not null default 0,
  created_by uuid references public.staff(id),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.businesses enable row level security;
alter table public.branches enable row level security;
alter table public.staff enable row level security;
alter table public.customers enable row level security;
alter table public.items enable row level security;
alter table public.bookings enable row level security;

-- Basic RLS Policies (Draft for Phase 1)
-- Staff can view customers for their branch
create policy "Staff can view customers" on public.customers
for select using (
  branch_id in (select branch_id from public.staff where id = auth.uid())
);

-- Staff can view items for their branch
create policy "Staff can view items" on public.items
for select using (
  branch_id in (select branch_id from public.staff where id = auth.uid())
);

-- Self-view policy for staff
create policy "Staff can view their own profile" on public.staff
for select using (
  id = auth.uid()
);
