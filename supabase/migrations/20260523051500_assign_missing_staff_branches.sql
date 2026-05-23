with fallback_branches as (
  select distinct on (business_id)
    id,
    business_id
  from public.branches
  where status = 'active'
  order by business_id, is_default desc, created_at asc
)
update public.staff s
set branch_id = fb.id
from fallback_branches fb
where s.business_id = fb.business_id
  and s.branch_id is null;
