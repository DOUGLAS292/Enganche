-- Bucket de Supabase Storage para fotos de perfil. Público para lectura
-- (las fotos de perfil no son información sensible, se ven en toda la
-- app), con límite de tamaño y tipos de archivo permitidos. La subida
-- siempre pasa por nuestra propia ruta /api/perfil/foto (que valida la
-- sesión con el mismo JWT que el resto de la app) usando la llave anon
-- pública — por eso la política de inserción es abierta para el rol
-- "anon": quien decide QUIÉN puede subir y A QUÉ usuario se le actualiza
-- la foto es nuestro backend, no Supabase Storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "avatares_insert_anon" on storage.objects
  for insert to anon
  with check (bucket_id = 'avatares');
