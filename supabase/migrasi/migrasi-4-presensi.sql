-- Langkah 4: sesi yang sudah ada kehadiran tidak boleh dihapus (pengaman kedua selain server action).
-- Jalankan di SQL Editor, lalu tempel ke skema.sql (bagian 4, trigger sesi_pembinaan).
begin;

create function public.tg_sesi_jaga_hapus()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.presensi p where p.sesi_id = old.id) then
    raise exception 'Sesi sudah ada kehadiran terisi, tidak bisa dihapus.';
  end if;
  return old;
end $$;

create trigger sesi_jaga_hapus before delete on sesi_pembinaan
for each row execute function public.tg_sesi_jaga_hapus();

revoke execute on function public.tg_sesi_jaga_hapus() from public, anon, authenticated;

commit;