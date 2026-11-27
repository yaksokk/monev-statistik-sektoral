-- Migrasi 7: fungsi simpan_undangan (security invoker, RLS tetap berlaku).
-- Jalankan sekali di SQL Editor. Sudah termasuk di skema.sql (bagian 5 dan 8).
-- Hak execute untuk authenticated ada di skema.sql bagian 8; database yang sudah berjalan sudah memilikinya.

begin;

create or replace function public.simpan_undangan(p_id uuid, p_judul text, p_link text, p_opd_ids uuid[])
... (isi persis sama dengan di atas, dari `returns uuid` sampai `$function$;`)

commit;