-- 00002_inventory_washing.sql
-- Inventory & Washing Queue Tables
-- Author: Agent 3

-- Drop the old simple items table from initial schema
DROP TABLE IF EXISTS public.items CASCADE;

-- 1. Items
create table public.items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete cascade not null,
  name text not null,
  sku text,
  category text not null,
  sub_category text,
  condition_grade text default 'A',
  status text default 'available',
  price numeric(10,2) not null,
  deposit_pct integer default 20,
  storage_rack text,
  storage_shelf text,
  storage_bay text,
  purchase_date date,
  purchase_cost numeric(10,2),
  colour_label text,
  internal_notes text,
  cover_photo_url text,
  completeness_score integer default 0,
  description text,
  created_by uuid references public.staff(id),
  created_at timestamptz default now(),
  last_scanned_at timestamptz,
  last_scanned_by uuid references public.staff(id),
  qr_code text,
  notion_page_id text
);

alter table public.items enable row level security;
create policy "branch_staff_items" on public.items using (
  branch_id in (
    select branch_id from public.staff where id = auth.uid() and status = 'approved'
  )
);

-- 2. Item Variants
create table public.item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items(id) on delete cascade not null,
  size text,
  colour text,
  sku text unique,
  qr_code text,
  barcode text,
  status text default 'available',
  available_count integer default 1,
  reserved_count integer default 0,
  created_at timestamptz default now()
);

alter table public.item_variants enable row level security;
create policy "branch_staff_variants" on public.item_variants using (
  item_id in (
    select id from public.items where branch_id in (
      select branch_id from public.staff where id = auth.uid() and status = 'approved'
    )
  )
);

-- 3. Item Photos
create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items(id) on delete cascade not null,
  url text not null,
  is_cover boolean default false,
  display_order integer default 0,
  uploaded_by uuid references public.staff(id),
  uploaded_at timestamptz default now()
);

alter table public.item_photos enable row level security;
create policy "branch_staff_photos" on public.item_photos using (
  item_id in (
    select id from public.items where branch_id in (
      select branch_id from public.staff where id = auth.uid() and status = 'approved'
    )
  )
);

-- 4. Item Tags
create table public.item_tags (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items(id) on delete cascade not null,
  tag_type text not null,
  tag_value text not null
);

alter table public.item_tags enable row level security;
create policy "branch_staff_tags" on public.item_tags using (
  item_id in (
    select id from public.items where branch_id in (
      select branch_id from public.staff where id = auth.uid() and status = 'approved'
    )
  )
);

-- 5. Item Collections
create table public.item_collections (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) not null,
  name text not null
);

alter table public.item_collections enable row level security;
create policy "branch_staff_collections" on public.item_collections using (
  branch_id in (
    select branch_id from public.staff where id = auth.uid() and status = 'approved'
  )
);

-- 6. Item Collection Memberships
create table public.item_collection_memberships (
  item_id uuid references public.items(id) on delete cascade not null,
  collection_id uuid references public.item_collections(id) on delete cascade not null,
  primary key (item_id, collection_id)
);

alter table public.item_collection_memberships enable row level security;
create policy "branch_staff_memberships" on public.item_collection_memberships using (
  item_id in (
    select id from public.items where branch_id in (
      select branch_id from public.staff where id = auth.uid() and status = 'approved'
    )
  )
);

-- 7. Item Pairings
create table public.item_pairings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) not null,
  primary_item_id uuid references public.items(id) not null,
  paired_item_id uuid references public.items(id) not null,
  created_by uuid references public.staff(id)
);

alter table public.item_pairings enable row level security;
create policy "branch_staff_pairings" on public.item_pairings using (
  branch_id in (
    select branch_id from public.staff where id = auth.uid() and status = 'approved'
  )
);

-- 8. Item Repairs
create table public.item_repairs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items(id) on delete cascade not null,
  vendor_name text,
  cost numeric(10,2),
  status text default 'sent',
  sent_date date,
  expected_return date,
  actual_return date,
  notes text,
  created_by uuid references public.staff(id),
  created_at timestamptz default now()
);

alter table public.item_repairs enable row level security;
create policy "branch_staff_repairs" on public.item_repairs using (
  item_id in (
    select id from public.items where branch_id in (
      select branch_id from public.staff where id = auth.uid() and status = 'approved'
    )
  )
);

-- 9. Wishlist
create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) not null,
  item_id uuid references public.items(id) not null,
  branch_id uuid references public.branches(id) not null,
  notified boolean default false,
  created_at timestamptz default now()
);

alter table public.wishlist enable row level security;
create policy "branch_staff_wishlist" on public.wishlist using (
  branch_id in (
    select branch_id from public.staff where id = auth.uid() and status = 'approved'
  )
);

-- 10. Washing Queue
create table public.washing_queue (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete cascade not null,
  item_id uuid references public.items(id),
  variant_id uuid references public.item_variants(id),
  booking_id uuid references public.bookings(id),
  stage text not null default 'queue',
  priority text not null default 'normal',
  assigned_to uuid references public.staff(id),
  cost numeric(10,2),
  notes text,
  is_external boolean default false,
  external_vendor text,
  vendor_handover_date date,
  vendor_expected_return date,
  entered_at timestamptz default now(),
  ready_at timestamptz,
  sla_deadline timestamptz
);

alter table public.washing_queue enable row level security;
create policy "branch_staff_washing_queue" on public.washing_queue using (
  branch_id in (
    select branch_id from public.staff where id = auth.uid() and status = 'approved'
  )
);
