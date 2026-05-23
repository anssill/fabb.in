-- Keep RLS in sync with the app's staff lifecycle.
-- Staff records use status = 'active'; older policies still checked 'approved'.

drop policy if exists "own_business_read" on public.businesses;
drop policy if exists "staff_read_own_business" on public.businesses;
create policy "staff_read_own_business" on public.businesses
  for select using (
    id in (
      select business_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
    or exists (
      select 1
      from public.staff
      where id = auth.uid() and role = 'super_admin'
    )
  );

drop policy if exists "owner_update_business" on public.businesses;
create policy "owner_update_business" on public.businesses
  for update using (
    id in (
      select business_id
      from public.staff
      where id = auth.uid()
        and role in ('owner', 'super_admin')
        and status = 'active'
    )
  );

drop policy if exists "branch_access_by_business" on public.branches;
drop policy if exists "staff_read_own_branches" on public.branches;
create policy "staff_read_own_branches" on public.branches
  for select using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
    or exists (
      select 1
      from public.staff
      where id = auth.uid() and role = 'super_admin'
    )
  );

drop policy if exists "owner_manager_update_branch" on public.branches;
drop policy if exists "owner_manage_branches" on public.branches;
create policy "owner_manage_branches" on public.branches
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid()
        and role in ('owner', 'manager', 'super_admin')
        and status = 'active'
    )
  );

drop policy if exists "same_business_staff_read" on public.staff;
drop policy if exists "staff_read_peers" on public.staff;
create policy "staff_read_peers" on public.staff
  for select using (
    business_id in (
      select s.business_id
      from public.get_my_staff_info() as s(business_id, role, status)
      where s.status = 'active'
    )
    or exists (
      select 1
      from public.get_my_staff_info() as s(business_id, role, status)
      where s.role = 'super_admin'
    )
  );

drop policy if exists "owner_manager_update_staff" on public.staff;
drop policy if exists "owner_manage_staff" on public.staff;
create policy "owner_manage_staff" on public.staff
  using (
    business_id in (
      select s.business_id
      from public.get_my_staff_info() as s(business_id, role, status)
      where s.role in ('owner', 'manager', 'super_admin')
        and s.status = 'active'
    )
  );

drop policy if exists "business_staff_customers" on public.customers;
create policy "business_staff_customers" on public.customers
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "business_staff_items" on public.items;
create policy "business_staff_items" on public.items
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "staff_update_items" on public.items;
create policy "staff_update_items" on public.items
  for update using (
    branch_id in (
      select branch_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "variants_via_items" on public.item_variants;
create policy "variants_via_items" on public.item_variants
  using (
    item_id in (
      select id
      from public.items
      where business_id in (
        select business_id
        from public.staff
        where id = auth.uid() and status = 'active'
      )
    )
  );

drop policy if exists "item_images_via_items" on public.item_images;
create policy "item_images_via_items" on public.item_images
  using (
    item_id in (
      select id
      from public.items
      where business_id in (
        select business_id
        from public.staff
        where id = auth.uid() and status = 'active'
      )
    )
  );

drop policy if exists "business_staff_bookings" on public.bookings;
create policy "business_staff_bookings" on public.bookings
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "booking_items_via_bookings" on public.booking_items;
create policy "booking_items_via_bookings" on public.booking_items
  using (
    booking_id in (
      select id
      from public.bookings
      where business_id in (
        select business_id
        from public.staff
        where id = auth.uid() and status = 'active'
      )
    )
  );

drop policy if exists "business_staff_payments" on public.booking_payments;
create policy "business_staff_payments" on public.booking_payments
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "business_staff_timeline" on public.booking_timeline;
create policy "business_staff_timeline" on public.booking_timeline
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "business_staff_washing" on public.washing_queue;
create policy "business_staff_washing" on public.washing_queue
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "own_notifications" on public.notifications;
create policy "own_notifications" on public.notifications
  for select using (
    target_staff_id = auth.uid()
    or (
      target_staff_id is null
      and branch_id in (
        select branch_id
        from public.staff
        where id = auth.uid() and status = 'active'
      )
    )
  );

drop policy if exists "owner_manager_audit_read" on public.audit_log;
create policy "owner_manager_audit_read" on public.audit_log
  for select using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid()
        and role in ('owner', 'manager')
        and status = 'active'
    )
  );

drop policy if exists "business_staff_sms_log" on public.sms_log;
create policy "business_staff_sms_log" on public.sms_log
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid() and status = 'active'
    )
  );

drop policy if exists "owner_manager_expenses" on public.expenses;
create policy "owner_manager_expenses" on public.expenses
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid()
        and role in ('owner', 'manager', 'super_admin')
        and status = 'active'
    )
  );

drop policy if exists "manager_owner_attendance" on public.staff_attendance;
create policy "manager_owner_attendance" on public.staff_attendance
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid()
        and role in ('owner', 'manager', 'super_admin')
        and status = 'active'
    )
  );

drop policy if exists "manager_set_targets" on public.staff_performance_targets;
create policy "manager_set_targets" on public.staff_performance_targets
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid()
        and role in ('owner', 'manager', 'super_admin')
        and status = 'active'
    )
  );
