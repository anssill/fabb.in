-- Qualify the outer storage row: unqualified name binds to staff.name inside subqueries.
drop policy if exists business_images_read on storage.objects;
create policy business_images_read on storage.objects for select to authenticated
using (bucket_id='images' and exists (select 1 from public.staff s where s.id=auth.uid() and s.status in ('active','approved') and s.business_id::text=(storage.foldername(objects.name))[1]));

drop policy if exists business_images_insert on storage.objects;
create policy business_images_insert on storage.objects for insert to authenticated
with check (bucket_id='images' and exists (select 1 from public.staff s where s.id=auth.uid() and s.status in ('active','approved') and s.business_id::text=(storage.foldername(objects.name))[1] and (((storage.foldername(objects.name))[2]='items' and private.has_business_permission(s.business_id,'manage_inventory')) or ((storage.foldername(objects.name))[2]='logos' and private.has_business_permission(s.business_id,'manage_settings')))));

drop policy if exists business_images_delete on storage.objects;
create policy business_images_delete on storage.objects for delete to authenticated
using (bucket_id='images' and exists (select 1 from public.staff s where s.id=auth.uid() and s.status in ('active','approved') and s.business_id::text=(storage.foldername(objects.name))[1] and (((storage.foldername(objects.name))[2]='items' and private.has_business_permission(s.business_id,'manage_inventory')) or ((storage.foldername(objects.name))[2]='logos' and private.has_business_permission(s.business_id,'manage_settings')))));

drop policy if exists customer_documents_read on storage.objects;
create policy customer_documents_read on storage.objects for select to authenticated
using (bucket_id='customer-private' and exists(select 1 from public.staff s where s.id=auth.uid() and s.status in ('active','approved') and s.business_id::text=(storage.foldername(objects.name))[1]));

drop policy if exists customer_documents_insert on storage.objects;
create policy customer_documents_insert on storage.objects for insert to authenticated
with check (bucket_id='customer-private' and (storage.foldername(objects.name))[2]='customers' and exists(select 1 from public.staff s where s.id=auth.uid() and s.status in ('active','approved') and s.business_id::text=(storage.foldername(objects.name))[1] and (private.has_business_permission(s.business_id,'manage_customers') or private.has_business_permission(s.business_id,'manage_bookings'))));

create policy rental_evidence_read on storage.objects for select to authenticated using (bucket_id='rental-evidence' and (storage.foldername(objects.name))[2]='bookings'
 and (storage.foldername(objects.name))[4] in ('pickup','return')
 and exists (select 1 from public.bookings b
 where b.business_id::text=(storage.foldername(objects.name))[1]
 and b.id::text=(storage.foldername(objects.name))[3]
 and private.can_access_branch(b.business_id,b.branch_id)));
create policy rental_evidence_insert on storage.objects for insert to authenticated with check (bucket_id='rental-evidence' and (storage.foldername(objects.name))[2]='bookings'
 and (storage.foldername(objects.name))[4] in ('pickup','return')
 and exists (select 1 from public.bookings b
 where b.business_id::text=(storage.foldername(objects.name))[1]
 and b.id::text=(storage.foldername(objects.name))[3]
 and private.can_access_branch(b.business_id,b.branch_id))
 and exists (select 1 from public.staff s where s.id=auth.uid()
 and s.business_id::text=(storage.foldername(objects.name))[1]
 and private.has_business_permission(s.business_id,'manage_bookings')));
