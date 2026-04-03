-- Migration for Agent 4 Modules (Customers, Payments, Analytics, Staff, Expenses)

-- 1. Alter Customers Table
ALTER TABLE public.customers RENAME COLUMN full_name TO name;

ALTER TABLE public.customers
  ADD COLUMN aadhaar_front_url text,
  ADD COLUMN aadhaar_back_url text,
  ADD COLUMN risk_level text default 'low',
  ADD COLUMN blacklist_level integer default 0,
  ADD COLUMN blacklist_reason text,
  ADD COLUMN blacklisted_by uuid references public.staff(id),
  ADD COLUMN blacklisted_at timestamp with time zone,
  ADD COLUMN vip_flag boolean default false,
  ADD COLUMN vip_set_by uuid references public.staff(id),
  ADD COLUMN loyalty_points integer default 0,
  ADD COLUMN debt_amount numeric(10,2) default 0,
  ADD COLUMN family_group_id uuid,
  ADD COLUMN total_spend numeric(10,2) default 0,
  ADD COLUMN total_bookings integer default 0,
  ADD COLUMN avg_booking_value numeric(10,2) default 0,
  ADD COLUMN created_by uuid references public.staff(id);

-- Update risk_score column if it exists as text, we'll cast it to integer.
-- In initial schema it was created as: risk_score text default 'Low'
ALTER TABLE public.customers ALTER COLUMN risk_score DROP DEFAULT;
ALTER TABLE public.customers ALTER COLUMN risk_score TYPE integer USING (CASE WHEN risk_score = 'Low' THEN 10 WHEN risk_score = 'Medium' THEN 50 WHEN risk_score = 'High' THEN 90 ELSE 0 END);
ALTER TABLE public.customers ALTER COLUMN risk_score SET DEFAULT 0;

-- Update tier default to 'bronze'
ALTER TABLE public.customers ALTER COLUMN tier SET DEFAULT 'bronze';

-- 2. Customer Groups
CREATE TABLE public.customer_groups (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade not null,
  name text not null,
  type text not null, -- vip/bridal/regular/lapsed/custom
  created_at timestamp with time zone default now()
);
ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branch staff policy customer_groups" ON public.customer_groups
FOR ALL USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved')
);

CREATE TABLE public.customer_group_memberships (
  business_id uuid references public.businesses(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade,
  group_id uuid references public.customer_groups(id) on delete cascade,
  primary key (customer_id, group_id)
);
ALTER TABLE public.customer_group_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branch staff policy cg_memberships" ON public.customer_group_memberships
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.staff WHERE id = auth.uid() AND status = 'approved')
);

-- 3. Loyalty Ledger (Append Only)
CREATE TABLE public.loyalty_ledger (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  customer_id uuid references public.customers(id),
  branch_id uuid references public.branches(id),
  type text not null, -- earn/redeem/expire
  points integer not null,
  reason text not null,
  booking_id uuid references public.bookings(id),
  staff_id uuid references public.staff(id),
  created_at timestamp with time zone default now()
);
ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branch staff policy loyalty_ledger" ON public.loyalty_ledger
FOR INSERT WITH CHECK (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Branch staff select loyalty_ledger" ON public.loyalty_ledger
FOR SELECT USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved')
);

-- 4. Family Groups
CREATE TABLE public.family_groups (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id),
  name text,
  pool_points boolean default false,
  created_at timestamp with time zone default now()
);
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branch staff policy family_groups" ON public.family_groups
FOR ALL USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved')
);

-- Update customers table foreign key to family_groups
ALTER TABLE public.customers ADD CONSTRAINT fk_family_group FOREIGN KEY (family_group_id) REFERENCES public.family_groups(id) ON DELETE SET NULL;

-- 5. Customer Notes
CREATE TABLE public.customer_notes (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) not null,
  customer_id uuid references public.customers(id) on delete cascade,
  content text not null,
  created_by uuid references public.staff(id),
  created_at timestamp with time zone default now(),
  is_pinned boolean default false
);
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert_any_customer_notes" ON public.customer_notes FOR INSERT USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "select_manager_customer_notes" ON public.customer_notes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND branch_id = customer_notes.branch_id AND role IN ('manager', 'super_admin'))
);

-- 6. Staff Attendance
CREATE TABLE public.staff_attendance (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  staff_id uuid references public.staff(id),
  branch_id uuid references public.branches(id),
  clock_in timestamp with time zone,
  clock_out timestamp with time zone,
  clock_in_lat numeric,
  clock_in_lng numeric,
  date date not null,
  is_valid_location boolean default false
);
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_or_manager_attendance" ON public.staff_attendance USING (
  staff_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND branch_id = staff_attendance.branch_id AND role IN ('manager', 'super_admin'))
);

-- 7. Staff Performance Targets
CREATE TABLE public.staff_performance_targets (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  staff_id uuid references public.staff(id),
  branch_id uuid references public.branches(id),
  month date not null, -- first day of month
  revenue_target numeric(10,2),
  booking_count_target integer,
  created_by uuid references public.staff(id)
);
ALTER TABLE public.staff_performance_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_or_manager_performance" ON public.staff_performance_targets USING (
  staff_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND branch_id = staff_performance_targets.branch_id AND role IN ('manager', 'super_admin'))
);

-- 8. Expenses
CREATE TABLE public.expenses (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id) on delete cascade,
  category text not null, -- rent/salary/utility/repair/washing/misc
  amount numeric(10,2) not null,
  description text,
  receipt_url text,
  staff_id uuid references public.staff(id),
  date date not null default current_date,
  created_at timestamp with time zone default now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branch staff policy expenses" ON public.expenses USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved')
);

-- 9. Cash Reconciliation
CREATE TABLE public.cash_reconciliation (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  branch_id uuid references public.branches(id),
  date date not null,
  expected_amount numeric(10,2),
  actual_amount numeric(10,2),
  difference numeric(10,2),
  notes text,
  approved_by uuid references public.staff(id),
  created_at timestamp with time zone default now()
);
ALTER TABLE public.cash_reconciliation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Manager policy cash_reconciliation" ON public.cash_reconciliation USING (
  EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND branch_id = cash_reconciliation.branch_id AND role IN ('manager', 'super_admin'))
);

-- 10. NPS Responses
CREATE TABLE public.nps_responses (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  booking_id uuid references public.bookings(id),
  customer_id uuid references public.customers(id),
  branch_id uuid references public.branches(id),
  score integer not null, -- 0-10
  collected_by uuid references public.staff(id),
  created_at timestamp with time zone default now()
);
ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branch staff policy nps_responses" ON public.nps_responses FOR SELECT USING (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Branch staff insert nps_responses" ON public.nps_responses FOR INSERT WITH CHECK (
  branch_id IN (SELECT branch_id FROM public.staff WHERE id = auth.uid() AND status = 'approved')
);
