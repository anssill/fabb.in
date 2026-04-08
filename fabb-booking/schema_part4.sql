create policy "superadmin_items" on items
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_items" on items
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

create policy "staff_update_items" on items
  for update using (
    branch_id in (select branch_id from staff where id = auth.uid() and status = 'active')
  );

alter table item_variants enable row level security;

create policy "variants_via_items" on item_variants
  using (item_id in (
    select id from items where business_id in (
      select business_id from staff where id = auth.uid() and status = 'active'
    )
  ));

alter table item_images enable row level security;

create policy "item_images_via_items" on item_images
  using (item_id in (
    select id from items where business_id in (
      select business_id from staff where id = auth.uid() and status = 'active'
    )
  ));

alter table bookings enable row level security;

create policy "superadmin_bookings" on bookings
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_bookings" on bookings
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table booking_items enable row level security;

create policy "booking_items_via_bookings" on booking_items
  using (booking_id in (
    select id from bookings where business_id in (
      select business_id from staff where id = auth.uid() and status = 'active'
    )
  ));

alter table booking_payments enable row level security;

create policy "superadmin_payments" on booking_payments
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_payments" on booking_payments
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table booking_drafts enable row level security;

create policy "own_drafts" on booking_drafts
  using (staff_id = auth.uid());

alter table booking_timeline enable row level security;

create policy "business_staff_timeline" on booking_timeline
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table washing_queue enable row level security;

create policy "superadmin_washing" on washing_queue
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "business_staff_washing" on washing_queue
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table notifications enable row level security;

create policy "own_notifications" on notifications
  for select using (
    target_staff_id = auth.uid()
    or (
      target_staff_id is null
      and branch_id in (select branch_id from staff where id = auth.uid() and status = 'active')
    )
  );

create policy "insert_notifications" on notifications
  for insert with check (true);

create policy "update_own_notifications" on notifications
  for update using (target_staff_id = auth.uid());

alter table audit_log enable row level security;

create policy "superadmin_audit_log" on audit_log
  using (exists (select 1 from staff where id = auth.uid() and role = 'super_admin'));

create policy "owner_manager_audit_read" on audit_log
  for select using (
    business_id in (
      select business_id from staff where id = auth.uid()
      and role in ('owner', 'manager') and status = 'active'
    )
  );

create policy "insert_audit_log" on audit_log
  for insert with check (true);

alter table sms_log enable row level security;

create policy "business_staff_sms_log" on sms_log
  using (business_id in (
    select business_id from staff where id = auth.uid() and status = 'active'
  ));

alter table expenses enable row level security;

create policy "owner_manager_expenses" on expenses
  using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));

alter table staff_attendance enable row level security;

create policy "own_attendance" on staff_attendance
  for select using (staff_id = auth.uid());

create policy "manager_owner_attendance" on staff_attendance
  using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));

alter table staff_performance_targets enable row level security;

create policy "own_targets" on staff_performance_targets
  for select using (staff_id = auth.uid());

create policy "manager_set_targets" on staff_performance_targets
  using (business_id in (
    select business_id from staff where id = auth.uid()
    and role in ('owner', 'manager', 'super_admin') and status = 'active'
  ));