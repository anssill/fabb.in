alter table public.staff
  add column if not exists accessible_branch_ids uuid[];

comment on column public.staff.accessible_branch_ids is
  'Branches this staff member can switch to. Null means full branch access for owners/super admins.';

update public.staff
set accessible_branch_ids = case
  when role in ('owner', 'super_admin') then null
  when branch_id is not null then array[branch_id]::uuid[]
  else accessible_branch_ids
end
where accessible_branch_ids is null;

create index if not exists idx_staff_accessible_branch_ids
  on public.staff using gin (accessible_branch_ids);
