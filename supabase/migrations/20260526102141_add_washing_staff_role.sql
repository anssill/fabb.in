alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff
  add constraint staff_role_check
  check (role in ('super_admin', 'owner', 'admin', 'manager', 'staff', 'washing_staff'));

update public.staff
set permissions = coalesce(permissions, '{}'::jsonb)
  || jsonb_build_object(
    'manage_dashboard', true,
    'manage_washing', true,
    'log_washing', true,
    'complete_washing', true,
    'manage_notifications', true
  )
where role = 'washing_staff';
