alter table public.staff
  add column if not exists last_active_at timestamptz,
  add column if not exists presence_expires_at timestamptz;

-- Presence is written by the authenticated server endpoint using the service role.
-- Staff managers may edit profiles, but must not be able to forge activity timestamps.
create or replace function private.guard_staff_presence_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and (
    new.last_active_at is distinct from old.last_active_at
    or new.presence_expires_at is distinct from old.presence_expires_at
  ) then
    raise exception 'Staff presence is managed by the server';
  end if;
  return new;
end $$;
revoke all on function private.guard_staff_presence_changes() from public, anon, authenticated;
create trigger guard_staff_presence_changes
before update of last_active_at, presence_expires_at on public.staff
for each row execute function private.guard_staff_presence_changes();
