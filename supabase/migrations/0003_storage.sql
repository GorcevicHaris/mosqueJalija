-- =====================================================================
-- 0003_storage.sql — bucket "slike" za fotografije (obavještenja, galerija, imami)
--   * javno čitanje preko javnog URL-a (/storage/v1/object/public/slike/...)
--   * upload / izmjena / brisanje samo za urednike
--   * dozvoljeno: JPEG, PNG, WebP, najviše 5 MB (provjerava i sam Storage)
-- Napomena: RLS na storage.objects je u Supabase-u već uključen — ne diramo ga.
-- Namjerno NEMA SELECT politike za anon: javni bucket služi fajlove preko javnog URL-a i bez
-- nje, a bez nje niko anoniman ne može izlistati sve fajlove (Supabase advisor upozorava na to).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('slike', 'slike', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Urednici vide listu fajlova (potrebno i za brisanje/zamjenu fajla).
drop policy if exists "slike_urednik_citanje" on storage.objects;
create policy "slike_urednik_citanje" on storage.objects
  for select to authenticated
  using (bucket_id = 'slike' and (select private.je_urednik()));

drop policy if exists "slike_urednik_unos" on storage.objects;
create policy "slike_urednik_unos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'slike' and (select private.je_urednik()));

drop policy if exists "slike_urednik_izmjena" on storage.objects;
create policy "slike_urednik_izmjena" on storage.objects
  for update to authenticated
  using (bucket_id = 'slike' and (select private.je_urednik()))
  with check (bucket_id = 'slike' and (select private.je_urednik()));

drop policy if exists "slike_urednik_brisanje" on storage.objects;
create policy "slike_urednik_brisanje" on storage.objects
  for delete to authenticated
  using (bucket_id = 'slike' and (select private.je_urednik()));
