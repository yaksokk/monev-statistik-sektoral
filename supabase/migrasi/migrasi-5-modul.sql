-- Langkah 5: fungsi modul dan bab. Dijalankan di SQL editor, lalu ditempel ke skema.sql.
-- Semua fungsi memakai security invoker: RLS tetap berlaku, jadi hanya admin yang berhasil menulis.
-- Urutan: Pembinaan 1 di depan Pembinaan 2, nomor bab dirapatkan 1..n per modul.

create or replace function public.rapikan_bab(p_modul_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update bab_modul b
     set urutan = t.baru
    from (
      select id, row_number() over (order by pembinaan, urutan, id) as baru
        from bab_modul
       where modul_id = p_modul_id
    ) t
   where b.id = t.id
     and b.urutan is distinct from t.baru;
$$;

create or replace function public.simpan_modul(p_judul text, p_subjudul text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Hanya satu modul untuk saat ini; kunci mencegah dua modul dari klik ganda
  perform pg_advisory_xact_lock(hashtext('simpan_modul'));

  select id into v_id from modul_pembelajaran order by urutan, id limit 1;

  if v_id is null then
    insert into modul_pembelajaran (urutan, judul, subjudul)
    values (1, btrim(p_judul), btrim(coalesce(p_subjudul, '')))
    returning id into v_id;
  else
    update modul_pembelajaran
       set judul = btrim(p_judul), subjudul = btrim(coalesce(p_subjudul, ''))
     where id = v_id;
    if not found then
      raise exception 'Anda tidak berwenang mengubah modul.';
    end if;
  end if;

  return v_id;
end;
$$;

create or replace function public.tambah_bab(p_modul_id uuid, p_judul text, p_link text, p_pembinaan int)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform 1 from modul_pembelajaran where id = p_modul_id for update;
  if not found then
    raise exception 'Modul tidak ditemukan.';
  end if;

  -- 10000 = sementara di urutan terakhir kelompoknya, lalu dirapikan
  insert into bab_modul (modul_id, urutan, judul, link_materi, pembinaan)
  values (p_modul_id, 10000, btrim(p_judul), btrim(coalesce(p_link, '')), p_pembinaan)
  returning id into v_id;

  perform public.rapikan_bab(p_modul_id);
  return v_id;
end;
$$;

create or replace function public.ubah_bab(p_id uuid, p_judul text, p_link text, p_pembinaan int)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_modul uuid;
begin
  select modul_id into v_modul from bab_modul where id = p_id;
  if not found then
    raise exception 'Bab tidak ditemukan.';
  end if;

  perform 1 from modul_pembelajaran where id = v_modul for update;

  -- pindah pembinaan: jatuh di urutan terakhir pembinaan baru
  update bab_modul
     set judul = btrim(p_judul),
         link_materi = btrim(coalesce(p_link, '')),
         pembinaan = p_pembinaan,
         urutan = case when pembinaan = p_pembinaan then urutan else 10000 end
   where id = p_id;
  if not found then
    raise exception 'Bab tidak ditemukan atau Anda tidak berwenang mengubahnya.';
  end if;

  perform public.rapikan_bab(v_modul);
end;
$$;

create or replace function public.hapus_bab(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_modul uuid;
begin
  select modul_id into v_modul from bab_modul where id = p_id;
  if not found then
    raise exception 'Bab tidak ditemukan.';
  end if;

  perform 1 from modul_pembelajaran where id = v_modul for update;

  -- catatan bab_selesai ikut terhapus lewat cascade
  delete from bab_modul where id = p_id;
  if not found then
    raise exception 'Bab tidak ditemukan atau Anda tidak berwenang menghapusnya.';
  end if;

  perform public.rapikan_bab(v_modul);
end;
$$;

create or replace function public.geser_bab(p_id uuid, p_arah int)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_modul uuid;
  v_pemb int;
  v_urut int;
  v_tid uuid;
  v_turut int;
begin
  if p_arah not in (-1, 1) then
    raise exception 'Arah tidak valid.';
  end if;

  select modul_id into v_modul from bab_modul where id = p_id;
  if not found then
    raise exception 'Bab tidak ditemukan.';
  end if;

  perform 1 from modul_pembelajaran where id = v_modul for update;

  -- baca ulang setelah kunci
  select pembinaan, urutan into v_pemb, v_urut from bab_modul where id = p_id;
  if not found then
    raise exception 'Bab tidak ditemukan.';
  end if;

  if p_arah = -1 then
    select id, urutan into v_tid, v_turut
      from bab_modul
     where modul_id = v_modul and pembinaan = v_pemb and urutan < v_urut
     order by urutan desc limit 1;
  else
    select id, urutan into v_tid, v_turut
      from bab_modul
     where modul_id = v_modul and pembinaan = v_pemb and urutan > v_urut
     order by urutan asc limit 1;
  end if;

  if v_tid is null then
    return; -- sudah di ujung kelompoknya
  end if;

  update bab_modul
     set urutan = case when id = p_id then v_turut else v_urut end
   where id in (p_id, v_tid);
end;
$$;

revoke execute on function public.rapikan_bab(uuid) from public, anon, authenticated;
revoke execute on function public.simpan_modul(text, text) from public, anon, authenticated;
revoke execute on function public.tambah_bab(uuid, text, text, int) from public, anon, authenticated;
revoke execute on function public.ubah_bab(uuid, text, text, int) from public, anon, authenticated;
revoke execute on function public.hapus_bab(uuid) from public, anon, authenticated;
revoke execute on function public.geser_bab(uuid, int) from public, anon, authenticated;

-- Dipanggil aplikasi lewat rpc. rapikan_bab dipanggil dari dalam fungsi lain sebagai pengguna yang sama,
-- jadi juga perlu grant; tanpa hak admin (RLS) ia tidak mengubah baris apa pun.
grant execute on function public.rapikan_bab(uuid) to authenticated;
grant execute on function public.simpan_modul(text, text) to authenticated;
grant execute on function public.tambah_bab(uuid, text, text, int) to authenticated;
grant execute on function public.ubah_bab(uuid, text, text, int) to authenticated;
grant execute on function public.hapus_bab(uuid) to authenticated;
grant execute on function public.geser_bab(uuid, int) to authenticated;