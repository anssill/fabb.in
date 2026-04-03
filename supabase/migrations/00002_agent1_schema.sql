-- 00002_agent1_schema.sql
-- Agent 1 Updates: Auth, Dashboard, Settings, etc.

-- 1. Updates to existing tables
-- Businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
-- Keep owner_id as auth.users reference to avoid circular dependencies during creation

-- Branches
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS opening_hours jsonb;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS settings jsonb default '{}'::jsonb;
ALTER TABLE public.branches RENAME COLUMN contact_phone TO contact;

-- Staff
ALTER TABLE public.staff RENAME COLUMN full_name TO name;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS custom_permissions jsonb default '{}'::jsonb;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS google_id text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS last_login timestamptz;

ALTER TABLE public.staff ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE public.staff ALTER COLUMN branch_id DROP NOT NULL;

-- Set dummy emails for existing staff if any to allow NOT NULL
UPDATE public.staff SET email = id::text || '@placeholder.com' WHERE email IS NULL;
ALTER TABLE public.staff ALTER COLUMN email SET NOT NULL;

-- Convert enum to text for role and status to avoid migration issues with enums
ALTER TABLE public.staff ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE public.staff ALTER COLUMN status TYPE text USING status::text;

-- Update defaults
ALTER TABLE public.staff ALTER COLUMN role SET DEFAULT 'floor_staff';
ALTER TABLE public.staff ALTER COLUMN status SET DEFAULT 'pending';

-- Drop the old enums now that they are text
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS staff_status;


-- 2. New Tables

-- Login Requests
create table public.login_requests (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid references public.staff(id) on delete cascade,
  status text default 'pending', -- pending/approved/rejected
  requested_at timestamptz default now(),
  reviewed_by uuid references public.staff(id),
  reviewed_at timestamptz,
  rejection_reason text
);

-- Notifications
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  target_staff_id uuid references public.staff(id) on delete cascade, -- null = all staff in branch
  type text not null, -- overdue/approval_pending/low_stock/washing_urgent/blacklist_attempt/announcement
  title text not null,
  body text,
  action_url text,
  action_type text, -- approve/reject/view
  action_data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Audit Log
create table public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  staff_id uuid references public.staff(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  timestamp timestamptz default now()
);

-- Opening Checklists
create table public.opening_checklists (
  id uuid primary key default uuid_generate_v4(),
  branch_id uuid references public.branches(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  date date not null,
  completed_at timestamptz,
  items jsonb -- [{ label: "Count cash", done: true }, ...]
);


-- 3. Row Level Security Policies

-- Enable RLS
alter table public.login_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.opening_checklists enable row level security;

-- Businesses Policies
drop policy if exists "Enable read access for all users" on public.businesses; -- Just in case
create policy "super_admin_all_businesses" on public.businesses using (
  exists (select 1 from public.staff where id = auth.uid() and role = 'super_admin')
);
create policy "own_business" on public.businesses using (
  id in (select business_id from public.staff where id = auth.uid())
);

-- Branches Policies
drop policy if exists "Enable read access for all users" on public.branches;
create policy "staff_own_branch" on public.branches using (
  business_id in (select business_id from public.staff where id = auth.uid() and status = 'approved')
);

-- Staff Policies
drop policy if exists "Staff can view their own profile" on public.staff;
create policy "own_row" on public.staff using (id = auth.uid());
create policy "manager_branch" on public.staff using (
  branch_id in (
    select branch_id from public.staff where id = auth.uid() and role in ('manager', 'super_admin') and status = 'approved'
  )
);
create policy "super_admin_all_staff" on public.staff using (
  exists (select 1 from public.staff where id = auth.uid() and role = 'super_admin')
);

-- Notifications
create policy "own_notifications" on public.notifications using (
  target_staff_id = auth.uid() or (
    target_staff_id is null and branch_id in (
      select branch_id from public.staff where id = auth.uid() and status = 'approved'
    )
  )
);

-- Audit Log
create policy "super_admin_only_audit_log" on public.audit_log using (
  exists (select 1 from public.staff where id = auth.uid() and role = 'super_admin')
);

-- Opening Checklists
create policy "view_branch_checklists" on public.opening_checklists using (
  branch_id in (
    select branch_id from public.staff where id = auth.uid() and status = 'approved'
  )
);
create policy "create_checklists" on public.opening_checklists for insert with check (
  staff_id = auth.uid() and branch_id in (
    select branch_id from public.staff where id = auth.uid() and status = 'approved'
  )
);
