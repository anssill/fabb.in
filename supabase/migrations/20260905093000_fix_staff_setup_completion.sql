-- Repair the staff privilege guard after custom_permissions was removed from
-- the zero-state schema. The stale column reference prevented every staff
-- update, including the owner's setup_completed transition.
create or replace function private.guard_staff_privilege_changes()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if old.id = (select auth.uid())
    and not private.has_business_permission(old.business_id, 'manage_staff')
    and (
      new.business_id is distinct from old.business_id
      or new.branch_id is distinct from old.branch_id
      or new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.permissions is distinct from old.permissions
    )
  then
    raise exception 'Staff permission required to change role, branch, status or permissions';
  end if;
  return new;
end
$$;


