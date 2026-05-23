alter table public.staff drop constraint if exists staff_status_check;

update public.staff
set status = case
  when status in ('approved', 'pending') then 'active'
  when status in ('rejected', 'inactive', 'disabled') then 'suspended'
  else status
end
where status in ('approved', 'pending', 'rejected', 'inactive', 'disabled');

alter table public.staff alter column status set default 'active';

alter table public.staff
  add constraint staff_status_check
  check (status in ('active', 'suspended', 'invited'));
