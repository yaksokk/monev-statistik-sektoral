-- Migrasi 2b: fungsi untuk halaman admin Kegiatan dan item dokumen.
-- Jalankan sekali di SQL Editor. Setelah itu tempel isinya ke skema.sql
-- (fungsi di akhir bagian 5, grant di bagian 8).

begin;

-- Pembantu internal: kegiatan dianggap berdata bila ada salah satu dari lima hal ini.
-- Tidak diberi hak execute ke aplikasi; hanya dipanggil fungsi lain.
create function public.kegiatan_berdata(p_kegiatan_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.dokumen d
                 where d.kegiatan_id = p_kegiatan_id and d.status = 'disetujui')
      or exists (select 1 from public.presensi p
                 join public.sesi_pembinaan s on s.id = p.sesi_id
                 where s.kegiatan_id = p_kegiatan_id)
      or exists (select 1 from public.hasil_quiz h where h.kegiatan_id = p_kegiatan_id)
      or exists (select 1 from public.izin_kerja_ulang i where i.kegiatan_id = p_kegiatan_id)
      or exists (select 1 from public.log_perubahan_quiz l where l.kegiatan_id = p_kegiatan_id)
$$;

-- Ringkasan per kegiatan untuk halaman admin
create function public.ringkasan_kegiatan()
returns table (
  kegiatan_id uuid,
  jumlah_item int,
  jumlah_sesi int,
  jumlah_soal int,
  hasil_pretest int,
  hasil_posttest int,
  berdata boolean
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;

  return query
  select k.id,
         (select count(*) from public.item_dokumen i where i.kegiatan_id = k.id)::int,
         (select count(*) from public.sesi_pembinaan s where s.kegiatan_id = k.id)::int,
         (select count(*) from public.soal_quiz q where q.kegiatan_id = k.id)::int,
         (select count(distinct p.opd_id) from public.hasil_quiz h
            join public.profil p on p.id = h.pengguna_id
           where h.kegiatan_id = k.id and h.quiz = 'pretest')::int,
         (select count(distinct p.opd_id) from public.hasil_quiz h
            join public.profil p on p.id = h.pengguna_id
           where h.kegiatan_id = k.id and h.quiz = 'posttest')::int,
         public.kegiatan_berdata(k.id)
  from public.kegiatan k;
end $$;

-- Item yang sudah punya dokumen disetujui (tidak bisa dihapus)
create function public.daftar_item_berdata()
returns table (item_id uuid)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;

  return query
  select distinct d.item_id from public.dokumen d where d.status = 'disetujui';
end $$;

-- Hapus kegiatan: cek dan hapus dalam satu transaksi
create function public.hapus_kegiatan(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_status public.status_kegiatan;
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;

  select k.status into v_status from public.kegiatan k where k.id = p_id for update;
  if not found then
    raise exception 'Kegiatan tidak ditemukan.';
  end if;
  if v_status = 'aktif' then
    raise exception 'Kegiatan aktif tidak bisa dihapus. Nonaktifkan dulu.';
  end if;
  if public.kegiatan_berdata(p_id) then
    raise exception 'Kegiatan sudah punya data, tidak bisa dihapus. Arsipkan saja.';
  end if;

  delete from public.kegiatan where id = p_id;
end $$;

-- Tambah item di urutan paling akhir; baris kegiatan dikunci agar urutan tidak bentrok
create function public.tambah_item_dokumen(p_kegiatan_id uuid, p_nama text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_urutan smallint;
  v_id uuid;
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;
  if length(btrim(coalesce(p_nama, ''))) = 0 then
    raise exception 'Nama item wajib diisi.';
  end if;

  perform 1 from public.kegiatan k where k.id = p_kegiatan_id for update;
  if not found then
    raise exception 'Kegiatan tidak ditemukan.';
  end if;

  select coalesce(max(i.urutan), 0) + 1 into v_urutan
  from public.item_dokumen i where i.kegiatan_id = p_kegiatan_id;

  insert into public.item_dokumen (kegiatan_id, urutan, nama)
  values (p_kegiatan_id, v_urutan, btrim(p_nama))
  returning id into v_id;

  return v_id;
end $$;

-- Hapus item: baris dokumennya dikunci dulu supaya unggahan bersamaan tidak lolos
create function public.hapus_item_dokumen(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;

  perform 1 from public.item_dokumen i where i.id = p_id for update;
  if not found then
    raise exception 'Item tidak ditemukan.';
  end if;

  perform 1 from public.dokumen d where d.item_id = p_id for update;
  if exists (select 1 from public.dokumen d where d.item_id = p_id and d.status = 'disetujui') then
    raise exception 'Item sudah punya dokumen disetujui, tidak bisa dihapus.';
  end if;

  delete from public.item_dokumen where id = p_id;
end $$;

-- Hak akses
revoke execute on function public.kegiatan_berdata(uuid) from public, anon, authenticated;
revoke execute on function public.ringkasan_kegiatan() from public, anon, authenticated;
revoke execute on function public.daftar_item_berdata() from public, anon, authenticated;
revoke execute on function public.hapus_kegiatan(uuid) from public, anon, authenticated;
revoke execute on function public.tambah_item_dokumen(uuid, text) from public, anon, authenticated;
revoke execute on function public.hapus_item_dokumen(uuid) from public, anon, authenticated;

grant execute on function public.ringkasan_kegiatan() to authenticated;
grant execute on function public.daftar_item_berdata() to authenticated;
grant execute on function public.hapus_kegiatan(uuid) to authenticated;
grant execute on function public.tambah_item_dokumen(uuid, text) to authenticated;
grant execute on function public.hapus_item_dokumen(uuid) to authenticated;

commit;