-- Insert default business and branch
insert into public.businesses (id, name, subdomain, plan, status)
values ('00000000-0000-0000-0000-000000000001', 'Echo HQ', 'hq', 'enterprise', 'active');

insert into public.branches (id, business_id, name, address)
values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Main Branch', 'Mumbai, MH');

-- Note: The auth.users insert is omitted because Supabase usually handles auth users creation via API.
-- Once an auth user is created, a trigger should insert them into public.staff.
