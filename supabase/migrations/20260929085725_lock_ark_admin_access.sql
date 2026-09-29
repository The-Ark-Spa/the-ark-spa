-- The Ark Spa & Salon — lock admin-only database and storage writes
-- Applied to Supabase project nxgbwfxnnfghlyehmlkv as migration 20260929085725.
-- The public website keeps read access to site_content and insert access to appointments.
-- Only the approved Supabase Auth user can administer content, appointments, and storage.

drop policy if exists appointments_admin_all on public.appointments;
create policy appointments_admin_select on public.appointments
  for select to authenticated
  using ((select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid);

create policy appointments_admin_update on public.appointments
  for update to authenticated
  using ((select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid)
  with check ((select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid);

create policy appointments_admin_delete on public.appointments
  for delete to authenticated
  using ((select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid);

drop policy if exists site_content_admin_write on public.site_content;
create policy site_content_admin_insert on public.site_content
  for insert to authenticated
  with check ((select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid);

create policy site_content_admin_update on public.site_content
  for update to authenticated
  using ((select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid)
  with check ((select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid);

create policy site_content_admin_delete on public.site_content
  for delete to authenticated
  using ((select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid);

drop policy if exists ark_storage_auth_delete on storage.objects;
drop policy if exists ark_storage_auth_insert on storage.objects;
drop policy if exists ark_storage_auth_update on storage.objects;

create policy ark_storage_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = any(array['ark-gallery','ark-assets']::text[])
    and (select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid
  );

create policy ark_storage_admin_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = any(array['ark-gallery','ark-assets']::text[])
    and (select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid
  );

create policy ark_storage_admin_update on storage.objects
  for update to authenticated
  using (
    bucket_id = any(array['ark-gallery','ark-assets']::text[])
    and (select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid
  )
  with check (
    bucket_id = any(array['ark-gallery','ark-assets']::text[])
    and (select auth.uid()) = '809dec37-2df0-4ff3-b47a-aeaca12b1c00'::uuid
  );