begin;
alter table public.kegiatan
  drop column judul_undangan,
  drop column tanggal_undangan,
  drop column link_undangan;
commit;