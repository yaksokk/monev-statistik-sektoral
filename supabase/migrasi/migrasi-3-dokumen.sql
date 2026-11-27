-- Langkah 3: path file dokumen per item, batas bucket 2 MB.
-- Jalankan di SQL Editor, lalu tempel perubahan yang sama ke skema.sql
-- (constraint dokumen_path di bagian 2 dan file_size_limit di bagian 9).
begin;

alter table public.dokumen drop constraint dokumen_path;
alter table public.dokumen add constraint dokumen_path check (
  path_file is null
  or path_file like pengguna_id::text || '/' || item_id::text || '/%'
);

update storage.buckets set file_size_limit = 2097152 where id = 'dokumen-opd';

commit;