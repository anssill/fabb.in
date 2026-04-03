-- Migration for Bookings Module
-- Extends the initial schema with advanced booking capabilities, variants, and related entities.

-- 1. Extend initial bookings table
ALTER TABLE public.bookings
  ADD COLUMN booking_source text,
  ADD COLUMN occasion text,
  ADD COLUMN balance_due numeric(10,2) default 0,
  ADD COLUMN price_override_amount numeric(10,2),
  ADD COLUMN price_override_reason text,
  ADD COLUMN cctv_timestamp timestamp with time zone,
  ADD COLUMN cctv_zone text,
  ADD COLUMN aadhaar_collected boolean default false,
  ADD COLUMN aadhaar_front_url text,
  ADD COLUMN aadhaar_back_url text,
  ADD COLUMN last_edited_by uuid references public.staff(id),
  ADD COLUMN last_edited_at timestamp with time zone,
  ADD COLUMN notion_page_id text,
  ADD COLUMN booking_id_display text unique;

-- 2. Item Variants (Needed for Availability/Stock Locking)
CREATE TABLE public.item_variants (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  item_id uuid references public.items(id) on delete cascade not null,
  size text,
  color text,
  available_count integer default 1,
  reserved_count integer default 0,
  created_at timestamp with time zone default now()
);
ALTER TABLE public.item_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view variants" ON public.item_variants
FOR SELECT USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid())
);
CREATE POLICY "Staff can update variants" ON public.item_variants
FOR UPDATE USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid())
);

-- 3. Booking Items
CREATE TABLE public.booking_items (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  item_id uuid references public.items(id) not null,
  variant_id uuid references public.item_variants(id),
  size text,
  quantity integer not null default 1,
  daily_rate numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  condition_before text, -- 'excellent', 'good', 'damaged', 'missing'
  condition_after text,
  before_photo_url text,
  added_at timestamp with time zone default now()
);
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branch staff policy booking_items" ON public.booking_items
FOR ALL USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid())
);

-- 4. Booking Accessories
CREATE TABLE public.booking_accessories (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  accessory_type text not null, -- 'dupatta', 'mojri', 'jewellery', 'belt'
  given_at_pickup boolean default false,
  returned_at_return boolean default false
);
ALTER TABLE public.booking_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branch staff policy booking_accessories" ON public.booking_accessories
FOR ALL USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid())
);

-- 5. Booking Payments
CREATE TABLE public.booking_payments (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  type text not null, -- 'advance', 'balance', 'deposit', 'penalty', 'void'
  amount numeric(10,2) not null,
  method text not null, -- 'cash', 'upi', 'bank', 'store_credit'
  staff_id uuid references public.staff(id),
  timestamp timestamp with time zone default now(),
  void_reason text,
  is_voided boolean default false
);
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branch staff policy booking_payments" ON public.booking_payments
FOR ALL USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid())
);

-- 6. Booking Notes
CREATE TABLE public.booking_notes (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  content text not null,
  created_by uuid references public.staff(id),
  created_at timestamp with time zone default now(),
  is_pinned boolean default false
);
ALTER TABLE public.booking_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff insert notes" ON public.booking_notes
FOR INSERT WITH CHECK (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid())
);
CREATE POLICY "Manager select notes" ON public.booking_notes
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND branch_id = booking_notes.branch_id AND role IN ('manager', 'super_admin'))
);

-- 7. Booking Timeline
CREATE TABLE public.booking_timeline (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  event_type text not null,
  description text,
  old_value jsonb,
  new_value jsonb,
  staff_id uuid references public.staff(id),
  staff_name text,
  timestamp timestamp with time zone default now()
);
ALTER TABLE public.booking_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branch staff policy booking_timeline" ON public.booking_timeline
FOR ALL USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid())
);

-- 8. Booking Drafts
CREATE TABLE public.booking_drafts (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  staff_id uuid references public.staff(id),
  current_step integer default 1,
  draft_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
ALTER TABLE public.booking_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff draft policy" ON public.booking_drafts
FOR ALL USING (
  staff_id = auth.uid()
);
