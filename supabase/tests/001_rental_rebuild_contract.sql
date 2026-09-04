begin;
create extension if not exists pgtap;
select plan(19);

select has_function('public', 'get_rental_availability', array['uuid','uuid','date','date','uuid','uuid','integer'], 'date availability function exists');
select has_function('public', 'post_booking_payment', array['uuid','text','numeric','text','text','text','text'], 'atomic payment command exists');
select hasnt_table('public', 'washing_queue', 'obsolete processing table is removed');
select hasnt_table('public', 'quality_audits', 'quality audit tables do not exist');
select hasnt_table('public', 'subscriptions', 'subscription enforcement is excluded');
select hasnt_column('public', 'item_variants', 'colour', 'inventory has no colour field');
select hasnt_column('public', 'item_variants', 'available_stock', 'availability is not persisted');
select hasnt_column('public', 'item_variants', 'reserved_stock', 'reservations are not persisted as counters');
select hasnt_column('public', 'booking_items', 'condition_on_return', 'return quality field is removed');
select hasnt_column('public', 'items', 'notion_page_id', 'Notion persistence is removed');
select col_type_is('public', 'bookings', 'status', 'rental_booking_status', 'booking lifecycle uses the rental enum');
select has_table('public', 'inventory_unavailability', 'damage and missing use a dedicated ledger');
select has_table('public', 'inventory_assets', 'premium assets are supported');
select is(
  (select bool_and(relrowsecurity) from pg_class join pg_namespace on pg_namespace.oid = pg_class.relnamespace where nspname = 'public' and relkind in ('r', 'p')),
  true,
  'all public tables enforce row level security'
);

insert into public.businesses (id, name, slug)
values ('10000000-0000-0000-0000-000000000001', 'Availability Test', 'availability-test');
insert into public.branches (id, business_id, name, prefix)
values ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Test Branch', 'TST');
insert into public.items (id, business_id, branch_id, name, category, price, is_active, status)
values ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Test Outfit', 'Suits', 1000, true, 'available');
insert into public.item_variants (id, business_id, branch_id, item_id, size, total_stock, status)
values ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'M', 3, 'available');
insert into public.customers (id, business_id, branch_id, name, phone)
values ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Test Customer', '9999999999');
insert into public.bookings (
  id, business_id, branch_id, customer_id, booking_number, status,
  pickup_date, return_date, subtotal, total_amount
) values (
  '10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005',
  'TST-001', 'confirmed', '2030-10-10', '2030-10-12', 2000, 2000
);
insert into public.booking_items (
  id, business_id, branch_id, booking_id, item_id, item_variant_id,
  item_name, size, price, quantity, rental_days
) values (
  '10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004',
  'Test Outfit', 'M', 1000, 2, 3
);

select is((select peak_booked from public.get_rental_availability('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','2030-10-10','2030-10-12','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004',0)), 2, 'overlapping period reserves quantity');
select is((select available_quantity from public.get_rental_availability('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','2030-10-15','2030-10-15',null,null,0)), 3, 'non-overlapping date remains fully available');

insert into public.inventory_unavailability (business_id, branch_id, item_id, item_variant_id, reason, quantity)
values ('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004','damaged',1);
select is((select available_quantity from public.get_rental_availability('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','2030-10-15','2030-10-15',null,null,0)), 2, 'open damage reduces availability');

insert into public.booking_item_fulfilments (business_id, branch_id, booking_id, booking_item_id, event_type, quantity, occurred_at)
values ('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000007','return',1,'2030-10-11 10:00:00+00');
select is((select peak_booked from public.get_rental_availability('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','2030-10-11','2030-10-12',null,null,0)), 1, 'early return releases the returned quantity on the return day');
select is((select shortage_quantity from public.get_rental_availability('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','2030-10-10','2030-10-10',null,null,3)), 3, 'shortage reports requested quantity beyond availability');

select * from finish();
rollback;
