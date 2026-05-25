-- Store operations workspace: checklists, tasks, alterations, delivery, signatures, accessories, and vendors.

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check
  check (status in (
    'draft', 'pending', 'booked', 'fitting_pending', 'alteration_pending',
    'ready_for_pickup', 'out', 'out_for_delivery', 'delivered', 'return_due',
    'overdue', 'returned', 'in_washing', 'closed', 'cancelled'
  ));

alter table public.bookings
  add column if not exists operation_status text not null default 'booking_desk',
  add column if not exists fitting_at timestamptz,
  add column if not exists fitting_status text not null default 'not_required',
  add column if not exists handoff_notes text,
  add column if not exists internal_notes text,
  add column if not exists delivery_mode text not null default 'store_pickup',
  add column if not exists delivery_status text not null default 'not_required',
  add column if not exists delivery_fee numeric(12, 2) not null default 0,
  add column if not exists ready_for_pickup_at timestamptz;

alter table public.bookings drop constraint if exists bookings_fitting_status_check;
alter table public.bookings
  add constraint bookings_fitting_status_check
  check (fitting_status in ('not_required', 'scheduled', 'pending', 'completed', 'alteration_required'));

alter table public.bookings drop constraint if exists bookings_delivery_mode_check;
alter table public.bookings
  add constraint bookings_delivery_mode_check
  check (delivery_mode in ('store_pickup', 'store_delivery', 'courier', 'staff_delivery'));

alter table public.bookings drop constraint if exists bookings_delivery_status_check;
alter table public.bookings
  add constraint bookings_delivery_status_check
  check (delivery_status in ('not_required', 'pending', 'out_for_delivery', 'delivered', 'failed_delivery'));

alter table public.booking_items
  add column if not exists prep_status text not null default 'pending',
  add column if not exists scan_status text not null default 'not_scanned',
  add column if not exists alteration_status text not null default 'not_required',
  add column if not exists accessory_notes text,
  add column if not exists bag_hanger_code text,
  add column if not exists condition_before_pickup text,
  add column if not exists pickup_scanned_at timestamptz;

alter table public.booking_items drop constraint if exists booking_items_prep_status_check;
alter table public.booking_items
  add constraint booking_items_prep_status_check
  check (prep_status in ('pending', 'picked', 'packed', 'checked', 'blocked'));

alter table public.booking_items drop constraint if exists booking_items_scan_status_check;
alter table public.booking_items
  add constraint booking_items_scan_status_check
  check (scan_status in ('not_scanned', 'scanned', 'mismatch'));

alter table public.booking_items drop constraint if exists booking_items_alteration_status_check;
alter table public.booking_items
  add constraint booking_items_alteration_status_check
  check (alteration_status in ('not_required', 'pending', 'sent_to_tailor', 'completed', 'checked'));

alter table public.washing_queue
  add column if not exists vendor_id uuid,
  add column if not exists washing_started_at timestamptz,
  add column if not exists drying_started_at timestamptz,
  add column if not exists ironing_started_at timestamptz,
  add column if not exists fitting_started_at timestamptz,
  add column if not exists washing_cost numeric(12, 2) not null default 0,
  add column if not exists damage_found boolean not null default false,
  add column if not exists damage_notes text;

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  vendor_type text not null default 'tailor',
  phone text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendors drop constraint if exists vendors_vendor_type_check;
alter table public.vendors
  add constraint vendors_vendor_type_check
  check (vendor_type in ('tailor', 'laundry', 'delivery', 'courier', 'other'));

alter table public.washing_queue drop constraint if exists washing_queue_vendor_id_fkey;
alter table public.washing_queue
  add constraint washing_queue_vendor_id_fkey
  foreign key (vendor_id) references public.vendors(id) on delete set null;

create table if not exists public.booking_checklist_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  section text not null,
  item_key text not null,
  label text not null,
  is_required boolean not null default false,
  is_blocking boolean not null default false,
  is_completed boolean not null default false,
  completed_by uuid references public.staff(id) on delete set null,
  completed_at timestamptz,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, item_key)
);

create table if not exists public.booking_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete cascade,
  task_type text not null,
  title text not null,
  description text,
  assigned_to uuid references public.staff(id) on delete set null,
  status text not null default 'pending',
  priority text not null default 'normal',
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_tasks drop constraint if exists booking_tasks_status_check;
alter table public.booking_tasks
  add constraint booking_tasks_status_check
  check (status in ('pending', 'doing', 'done', 'blocked'));

alter table public.booking_tasks drop constraint if exists booking_tasks_priority_check;
alter table public.booking_tasks
  add constraint booking_tasks_priority_check
  check (priority in ('urgent', 'normal', 'low'));

create table if not exists public.booking_signatures (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  signature_type text not null,
  signer_name text,
  signature_data text,
  agreement_text text,
  captured_by uuid references public.staff(id) on delete set null,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.booking_signatures drop constraint if exists booking_signatures_type_check;
alter table public.booking_signatures
  add constraint booking_signatures_type_check
  check (signature_type in ('pickup', 'return', 'rental_agreement', 'delivery'));

create table if not exists public.booking_alterations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  booking_item_id uuid references public.booking_items(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  length_note text,
  waist_note text,
  sleeve_note text,
  shoulder_note text,
  blouse_note text,
  custom_notes text,
  status text not null default 'pending',
  before_photo_urls jsonb not null default '[]'::jsonb,
  after_photo_urls jsonb not null default '[]'::jsonb,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.staff(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_alterations drop constraint if exists booking_alterations_status_check;
alter table public.booking_alterations
  add constraint booking_alterations_status_check
  check (status in ('pending', 'sent_to_tailor', 'completed', 'checked'));

create table if not exists public.booking_delivery (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  mode text not null default 'store_pickup',
  status text not null default 'pending',
  address text,
  contact_person text,
  contact_phone text,
  delivery_fee numeric(12, 2) not null default 0,
  assigned_staff_id uuid references public.staff(id) on delete set null,
  notes text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id)
);

alter table public.booking_delivery drop constraint if exists booking_delivery_mode_check;
alter table public.booking_delivery
  add constraint booking_delivery_mode_check
  check (mode in ('store_pickup', 'store_delivery', 'courier', 'staff_delivery'));

alter table public.booking_delivery drop constraint if exists booking_delivery_status_check;
alter table public.booking_delivery
  add constraint booking_delivery_status_check
  check (status in ('pending', 'out_for_delivery', 'delivered', 'failed_delivery'));

create table if not exists public.booking_accessories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  booking_item_id uuid references public.booking_items(id) on delete cascade,
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.booking_accessories drop constraint if exists booking_accessories_status_check;
alter table public.booking_accessories
  add constraint booking_accessories_status_check
  check (status in ('pending', 'packed', 'returned', 'missing', 'damaged'));

create index if not exists idx_booking_checklist_booking_id on public.booking_checklist_items(booking_id);
create index if not exists idx_booking_tasks_branch_status on public.booking_tasks(branch_id, status);
create index if not exists idx_booking_tasks_booking_id on public.booking_tasks(booking_id);
create index if not exists idx_booking_signatures_booking_id on public.booking_signatures(booking_id);
create index if not exists idx_booking_alterations_booking_id on public.booking_alterations(booking_id);
create index if not exists idx_booking_delivery_booking_id on public.booking_delivery(booking_id);
create index if not exists idx_booking_accessories_booking_id on public.booking_accessories(booking_id);
create index if not exists idx_vendors_business_type on public.vendors(business_id, vendor_type);

alter table public.vendors enable row level security;
alter table public.booking_checklist_items enable row level security;
alter table public.booking_tasks enable row level security;
alter table public.booking_signatures enable row level security;
alter table public.booking_alterations enable row level security;
alter table public.booking_delivery enable row level security;
alter table public.booking_accessories enable row level security;

drop policy if exists "business_staff_vendors" on public.vendors;
create policy "business_staff_vendors" on public.vendors
  using (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'))
  with check (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'));

drop policy if exists "business_staff_booking_checklist" on public.booking_checklist_items;
create policy "business_staff_booking_checklist" on public.booking_checklist_items
  using (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'))
  with check (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'));

drop policy if exists "business_staff_booking_tasks" on public.booking_tasks;
create policy "business_staff_booking_tasks" on public.booking_tasks
  using (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'))
  with check (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'));

drop policy if exists "business_staff_booking_signatures" on public.booking_signatures;
create policy "business_staff_booking_signatures" on public.booking_signatures
  using (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'))
  with check (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'));

drop policy if exists "business_staff_booking_alterations" on public.booking_alterations;
create policy "business_staff_booking_alterations" on public.booking_alterations
  using (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'))
  with check (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'));

drop policy if exists "business_staff_booking_delivery" on public.booking_delivery;
create policy "business_staff_booking_delivery" on public.booking_delivery
  using (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'))
  with check (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'));

drop policy if exists "business_staff_booking_accessories" on public.booking_accessories;
create policy "business_staff_booking_accessories" on public.booking_accessories
  using (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'))
  with check (business_id in (select business_id from public.staff where id = auth.uid() and status = 'active'));

grant select, insert, update, delete on public.vendors to authenticated;
grant select, insert, update, delete on public.booking_checklist_items to authenticated;
grant select, insert, update, delete on public.booking_tasks to authenticated;
grant select, insert, update, delete on public.booking_signatures to authenticated;
grant select, insert, update, delete on public.booking_alterations to authenticated;
grant select, insert, update, delete on public.booking_delivery to authenticated;
grant select, insert, update, delete on public.booking_accessories to authenticated;

notify pgrst, 'reload schema';
