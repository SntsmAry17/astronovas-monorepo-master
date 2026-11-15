-- Bucket público para las fotos de los sitios. Convención de ruta: <user_id>/<site_slug>/<archivo>.
-- Cada usuario solo sube, cambia o borra dentro de su carpeta; los revisores pueden borrar cualquiera.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "site_media_objects_read" on storage.objects for select
  using (bucket_id = 'site-media');

create policy "site_media_objects_insert_own_folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "site_media_objects_update_own_folder" on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'site-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "site_media_objects_delete_own_folder" on storage.objects for delete to authenticated
  using (
    bucket_id = 'site-media'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_reviewer())
  );
