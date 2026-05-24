alter table public.customers
  add column if not exists alternate_phone text,
  add column if not exists emergency_phone text;

comment on column public.customers.alternate_phone is 'Optional second customer mobile number for booking safety follow-up.';
comment on column public.customers.emergency_phone is 'Optional backup or family mobile number for booking safety follow-up.';

alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff
  add constraint staff_role_check
  check (role in ('super_admin', 'owner', 'admin', 'manager', 'staff'));

drop policy if exists "owner_manage_staff" on public.staff;
create policy "owner_manage_staff" on public.staff
  using (
    business_id in (
      select s.business_id
      from public.get_my_staff_info() as s(business_id, role, status)
      where s.role in ('owner', 'admin', 'manager', 'super_admin')
        and s.status = 'active'
    )
  );

drop policy if exists "owner_manage_branches" on public.branches;
create policy "owner_manage_branches" on public.branches
  using (
    business_id in (
      select s.business_id
      from public.get_my_staff_info() as s(business_id, role, status)
      where s.role in ('owner', 'admin', 'manager', 'super_admin')
        and s.status = 'active'
    )
  )
  with check (
    business_id in (
      select s.business_id
      from public.get_my_staff_info() as s(business_id, role, status)
      where s.role in ('owner', 'admin', 'manager', 'super_admin')
        and s.status = 'active'
    )
  );

drop policy if exists "owner_manager_audit_read" on public.audit_log;
create policy "owner_manager_audit_read" on public.audit_log
  for select
  using (
    business_id in (
      select business_id
      from public.staff
      where id = auth.uid()
        and role in ('owner', 'admin', 'manager')
        and status = 'active'
    )
  );
