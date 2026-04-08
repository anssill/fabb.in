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