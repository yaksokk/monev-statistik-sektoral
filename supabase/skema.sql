-- Skema database web monev Statistik Sektoral (Supabase / PostgreSQL).
-- Untuk database KOSONG (semua tabel dan fungsi lama sudah dihapus).
-- Urutan: skema.sql -> buat akun admin pertama (lihat bagian paling bawah) -> data-awal.sql.
-- Seluruh skrip berjalan dalam satu transaksi: bila ada error, tidak ada yang tersimpan.
-- Sudah memuat semua migrasi: 2b (kegiatan dan item), 3 (path dokumen, batas 2 MB), 4 (jaga hapus sesi),
-- 5 (fungsi modul dan bab), 6 (quiz dengan sesi pengerjaan). Database yang sudah berjalan cukup
-- menjalankan file migrasinya, bukan skema ini.
-- Data awal 8 soal dari migrasi 6 TIDAK ada di sini: letakkan di data-awal.sql.

begin;

-- =====================================================================
-- 1. TIPE
-- =====================================================================

create type peran as enum ('admin', 'operator');
create type status_dokumen as enum ('belum', 'disetujui');
create type status_kehadiran as enum ('tepat_waktu', 'terlambat', 'izin');
create type jenis_quiz as enum ('pretest', 'posttest');
create type jenis_log_quiz as enum ('kunci', 'nonaktif', 'aktifkan', 'izin_ulang', 'edit');
-- draf = belum/tidak aktif, aktif = kegiatan berjalan (paling banyak satu), arsip = diarsipkan admin
create type status_kegiatan as enum ('draf', 'aktif', 'arsip');

-- =====================================================================
-- 2. TABEL
-- =====================================================================

-- ---------- OPD dan pengguna ----------

create table opd (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  singkatan text not null,
  dibuat_pada timestamptz not null default now(),
  constraint opd_nama_unik unique (nama),
  constraint opd_teks_terisi check (length(btrim(nama)) > 0 and length(btrim(singkatan)) > 0)
);

-- Satu baris per akun login (auth.users). Admin: opd_id kosong. Operator: opd_id wajib.
create table profil (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  email text not null,
  peran peran not null,
  opd_id uuid references opd (id) on delete restrict,
  link_sertifikat text,
  wajib_ganti_sandi boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  constraint profil_nama_terisi check (length(btrim(nama)) > 0),
  constraint profil_peran_opd check ((peran = 'operator') = (opd_id is not null)),
  constraint profil_link_sertifikat check (link_sertifikat is null or link_sertifikat ~* '^https://')
);
create unique index profil_email_unik on profil (lower(email));
create index profil_opd_id_idx on profil (opd_id);

-- ---------- Kegiatan dan dokumen ----------

create table kegiatan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  tenggat date not null,
  status status_kegiatan not null default 'draf',
  bobot smallint not null default 0,
  ambang_kehadiran smallint not null default 75,
  pretest_aktif boolean not null default true,
  posttest_aktif boolean not null default true,
  judul_undangan text,
  tanggal_undangan date,
  link_undangan text,
  dibuat_pada timestamptz not null default now(),
  constraint kegiatan_nama_terisi check (length(btrim(nama)) > 0),
  constraint kegiatan_tanggal check (tanggal_selesai >= tanggal_mulai),
  constraint kegiatan_bobot check (bobot between 0 and 100),
  constraint kegiatan_ambang check (ambang_kehadiran between 0 and 100),
  constraint kegiatan_link_undangan check (link_undangan is null or link_undangan ~* '^https://')
);
-- Paling banyak satu kegiatan berstatus aktif
create unique index kegiatan_satu_aktif on kegiatan (status) where status = 'aktif';

create table item_dokumen (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null references kegiatan (id) on delete cascade,
  urutan smallint not null,
  nama text not null,
  constraint item_dokumen_nama_terisi check (length(btrim(nama)) > 0),
  constraint item_dokumen_kegiatan_urutan_unik unique (kegiatan_id, urutan),
  constraint item_dokumen_id_kegiatan_unik unique (id, kegiatan_id)
);

-- Satu baris per pegawai per item. Dibuat otomatis oleh trigger (lihat bagian 4).
create table dokumen (
  id uuid primary key default gen_random_uuid(),
  pengguna_id uuid not null references profil (id) on delete cascade,
  kegiatan_id uuid not null,
  item_id uuid not null,
  status status_dokumen not null default 'belum',
  nama_file text,
  path_file text, -- lokasi di bucket dokumen-opd: <pengguna_id>/<item_id>/...
  diunggah_pada timestamptz,
  constraint dokumen_pengguna_item_unik unique (pengguna_id, item_id),
  constraint dokumen_item_kegiatan_fkey foreign key (item_id, kegiatan_id)
    references item_dokumen (id, kegiatan_id) on delete cascade,
  constraint dokumen_kondisi check (
    (status = 'belum' and nama_file is null and path_file is null and diunggah_pada is null)
    or (status = 'disetujui' and nama_file is not null and path_file is not null and diunggah_pada is not null)
  ),
  constraint dokumen_path check (
    path_file is null
    or path_file like pengguna_id::text || '/' || item_id::text || '/%'
  )
);
create index dokumen_kegiatan_idx on dokumen (kegiatan_id);

-- ---------- Sesi pembinaan dan presensi ----------

create table sesi_pembinaan (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null references kegiatan (id) on delete cascade,
  urutan smallint not null default 0, -- 0 = diisi otomatis; rapi kembali bila ada sesi dihapus
  judul text not null,
  waktu_buka timestamptz, -- null = langsung terbuka
  batas_pengisian timestamptz, -- null = terbuka sampai batas diisi
  dibuat_pada timestamptz not null default now(),
  constraint sesi_judul_terisi check (length(btrim(judul)) > 0),
  constraint sesi_batas check (waktu_buka is null or batas_pengisian is null or batas_pengisian > waktu_buka)
);
create index sesi_kegiatan_idx on sesi_pembinaan (kegiatan_id);

create table presensi (
  id uuid primary key default gen_random_uuid(),
  pengguna_id uuid not null references profil (id) on delete cascade,
  sesi_id uuid not null references sesi_pembinaan (id) on delete cascade,
  status status_kehadiran not null,
  waktu_isi timestamptz not null default now(), -- selalu diisi server
  catatan text,
  constraint presensi_unik unique (pengguna_id, sesi_id),
  constraint presensi_catatan check (status = 'tepat_waktu' or length(btrim(coalesce(catatan, ''))) > 0)
);
create index presensi_sesi_idx on presensi (sesi_id);

-- ---------- Quiz (Pre-Test dan Post-Test) ----------

-- Dua baris per kegiatan (pretest, posttest), dibuat otomatis saat kegiatan dibuat
create table pengaturan_quiz (
  kegiatan_id uuid not null references kegiatan (id) on delete cascade,
  quiz jenis_quiz not null,
  judul text not null,
  durasi_menit smallint not null default 15,
  waktu_buka timestamptz, -- null = belum dibuka
  batas_akhir timestamptz, -- null = tanpa batas
  hanya_berizin boolean not null default false,
  acak_soal boolean not null default true, -- true = urutan soal diacak per pegawai saat mulai
  primary key (kegiatan_id, quiz),
  constraint pengaturan_durasi check (durasi_menit > 0),
  constraint pengaturan_batas check (waktu_buka is null or batas_akhir is null or batas_akhir > waktu_buka)
);

create table soal_quiz (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null,
  quiz jenis_quiz not null,
  urutan smallint not null,
  pertanyaan text not null,
  opsi text[] not null,
  aktif boolean not null default true, -- false = tidak dihitung dalam nilai, tetap tercatat
  dibuat_pada timestamptz not null default now(),
  constraint soal_pengaturan_fkey foreign key (kegiatan_id, quiz)
    references pengaturan_quiz (kegiatan_id, quiz) on delete cascade,
  constraint soal_pertanyaan_terisi check (length(btrim(pertanyaan)) > 0),
  constraint soal_jumlah_opsi check (array_length(opsi, 1) between 2 and 6)
);
create index soal_kegiatan_quiz_idx on soal_quiz (kegiatan_id, quiz);

-- Kunci dan pembahasan dipisah dari soal agar pegawai tidak bisa membaca kunci sebelum selesai mengerjakan
create table kunci_soal (
  soal_id uuid primary key references soal_quiz (id) on delete cascade,
  kunci smallint not null, -- indeks opsi yang benar, mulai dari 0
  pembahasan text not null default '',
  constraint kunci_tidak_negatif check (kunci >= 0)
);

-- Ada hanya setelah jawaban terkirim. Nilai tidak disimpan: lihat view v_nilai_quiz
create table hasil_quiz (
  id uuid primary key default gen_random_uuid(),
  pengguna_id uuid not null references profil (id) on delete cascade,
  kegiatan_id uuid not null,
  quiz jenis_quiz not null,
  urutan_soal uuid[] not null, -- id soal sesuai urutan yang dilihat pegawai
  mulai timestamptz not null,
  selesai timestamptz not null,
  otomatis boolean not null default false, -- true bila terkirim karena waktu habis
  constraint hasil_pengaturan_fkey foreign key (kegiatan_id, quiz)
    references pengaturan_quiz (kegiatan_id, quiz) on delete cascade,
  constraint hasil_unik unique (pengguna_id, kegiatan_id, quiz),
  constraint hasil_waktu check (selesai >= mulai)
);
create index hasil_kegiatan_quiz_idx on hasil_quiz (kegiatan_id, quiz);

create table jawaban_quiz (
  hasil_id uuid not null references hasil_quiz (id) on delete cascade,
  soal_id uuid not null references soal_quiz (id) on delete cascade,
  pilihan smallint not null, -- indeks opsi; soal tanpa jawaban tidak punya baris
  primary key (hasil_id, soal_id),
  constraint jawaban_pilihan check (pilihan >= 0)
);
create index jawaban_soal_idx on jawaban_quiz (soal_id);

-- Satu baris selama pegawai mengerjakan. Dihapus saat jawaban dikirim (jadi hasil_quiz).
-- Waktu mulai dan batas selesai ditentukan server, jawaban disimpan per pilihan (autosave).
create table sesi_kerja_quiz (
  pengguna_id uuid not null references profil (id) on delete cascade,
  kegiatan_id uuid not null,
  quiz jenis_quiz not null,
  urutan_soal uuid[] not null, -- id soal aktif sesuai urutan yang dilihat pegawai
  jawaban jsonb not null default '{}'::jsonb, -- {"<id soal>": <indeks opsi>}
  mulai timestamptz not null default now(),
  berakhir_pada timestamptz not null,
  primary key (pengguna_id, kegiatan_id, quiz),
  constraint sesi_kerja_pengaturan_fkey foreign key (kegiatan_id, quiz)
    references pengaturan_quiz (kegiatan_id, quiz) on delete cascade,
  constraint sesi_kerja_waktu check (berakhir_pada > mulai)
);

-- Izin admin agar pegawai mengerjakan ulang. Dihapus otomatis setelah jawaban baru terkirim
create table izin_kerja_ulang (
  kegiatan_id uuid not null,
  quiz jenis_quiz not null,
  pengguna_id uuid not null references profil (id) on delete cascade,
  diberikan_pada timestamptz not null default now(),
  admin_id uuid references profil (id) on delete set null,
  admin_nama text not null,
  primary key (kegiatan_id, quiz, pengguna_id),
  constraint izin_pengaturan_fkey foreign key (kegiatan_id, quiz)
    references pengaturan_quiz (kegiatan_id, quiz) on delete cascade
);

create table log_perubahan_quiz (
  id uuid primary key default gen_random_uuid(),
  kegiatan_id uuid not null,
  quiz jenis_quiz not null,
  jenis jenis_log_quiz not null,
  soal_id uuid references soal_quiz (id) on delete set null,
  kunci_lama smallint,
  kunci_baru smallint,
  pengguna_id uuid references profil (id) on delete set null, -- untuk jenis izin_ulang
  admin_nama text not null,
  waktu timestamptz not null default now(),
  constraint log_pengaturan_fkey foreign key (kegiatan_id, quiz)
    references pengaturan_quiz (kegiatan_id, quiz) on delete cascade
);
create index log_kegiatan_quiz_idx on log_perubahan_quiz (kegiatan_id, quiz, waktu desc);

-- ---------- Modul pembelajaran (materi lewat link Google Drive) ----------

create table modul_pembelajaran (
  id uuid primary key default gen_random_uuid(),
  urutan smallint not null,
  judul text not null,
  subjudul text not null default '',
  constraint modul_judul_terisi check (length(btrim(judul)) > 0)
);

create table bab_modul (
  id uuid primary key default gen_random_uuid(),
  modul_id uuid not null references modul_pembelajaran (id) on delete cascade,
  urutan smallint not null,
  judul text not null,
  link_materi text not null default '',
  pembinaan smallint not null,
  constraint bab_judul_terisi check (length(btrim(judul)) > 0),
  constraint bab_pembinaan check (pembinaan in (1, 2)),
  constraint bab_link check (link_materi = '' or link_materi ~* '^https://')
);
create index bab_modul_idx on bab_modul (modul_id);

create table bab_selesai (
  pengguna_id uuid not null references profil (id) on delete cascade,
  bab_id uuid not null references bab_modul (id) on delete cascade,
  selesai_pada timestamptz not null default now(),
  primary key (pengguna_id, bab_id)
);

-- ---------- Undangan yang dikirim ke OPD terpilih ----------

create table undangan (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  link text not null,
  dikirim_pada timestamptz not null default now(),
  constraint undangan_judul_terisi check (length(btrim(judul)) > 0),
  constraint undangan_link check (link ~* '^https://')
);

create table undangan_opd (
  undangan_id uuid not null references undangan (id) on delete cascade,
  opd_id uuid not null references opd (id) on delete cascade,
  primary key (undangan_id, opd_id)
);
create index undangan_opd_opd_idx on undangan_opd (opd_id);

-- ---------- Monev ----------

create table aspek_monev (
  id uuid primary key default gen_random_uuid(),
  urutan smallint not null,
  nama text not null,
  kondisi_aktual text not null default '',
  kondisi_diharapkan text not null default ''
);

create table indikator_keberhasilan (
  id uuid primary key default gen_random_uuid(),
  aspek_id uuid not null references aspek_monev (id) on delete cascade,
  urutan smallint not null,
  teks text not null,
  link_dokumen text,
  constraint indikator_link check (link_dokumen is null or link_dokumen ~* '^https://')
);
create index indikator_aspek_idx on indikator_keberhasilan (aspek_id);

create table milestone (
  id uuid primary key default gen_random_uuid(),
  urutan smallint not null,
  tujuan text not null,
  jadwal text not null default ''
);

create table output_milestone (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references milestone (id) on delete cascade,
  urutan smallint not null,
  teks text not null,
  link_dokumen text,
  constraint output_link check (link_dokumen is null or link_dokumen ~* '^https://')
);
create index output_milestone_idx on output_milestone (milestone_id);

-- =====================================================================
-- 3. FUNGSI PEMBANTU (dipakai kebijakan RLS dan fungsi lain)
-- =====================================================================

create function public.peran_saya()
returns public.peran
language sql stable security definer set search_path = ''
as $$
  select p.peran from public.profil p where p.id = (select auth.uid())
$$;

create function public.adalah_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.peran = 'admin' from public.profil p where p.id = (select auth.uid())), false)
$$;

create function public.opd_saya()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.opd_id from public.profil p where p.id = (select auth.uid())
$$;

create function public.nama_saya()
returns text
language sql stable security definer set search_path = ''
as $$
  select p.nama from public.profil p where p.id = (select auth.uid())
$$;

-- Quiz dianggap sudah dibuka bila waktu bukanya sudah lewat; perubahan setelah itu dicatat di log
create function public.quiz_sudah_dibuka(p_kegiatan_id uuid, p_quiz public.jenis_quiz)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.pengaturan_quiz q
    where q.kegiatan_id = p_kegiatan_id and q.quiz = p_quiz
      and q.waktu_buka is not null and q.waktu_buka <= now()
  )
$$;

-- Soal bisa diubah, dihapus, atau digeser hanya bila quiz belum dibuka dan belum ada yang mengerjakan
create function public.soal_bisa_diubah(p_kegiatan_id uuid, p_quiz public.jenis_quiz)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select not public.quiz_sudah_dibuka(p_kegiatan_id, p_quiz)
     and not exists (select 1 from public.hasil_quiz h
                     where h.kegiatan_id = p_kegiatan_id and h.quiz = p_quiz)
     and not exists (select 1 from public.sesi_kerja_quiz s
                     where s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz)
$$;

-- Pembantu internal (tanpa grant ke aplikasi)
create function public.pastikan_kegiatan_terbuka(p_kegiatan_id uuid)
returns void
language plpgsql stable security definer set search_path = ''
as $$
declare v_status public.status_kegiatan;
begin
  select k.status into v_status from public.kegiatan k where k.id = p_kegiatan_id;
  if not found then
    raise exception 'Kegiatan tidak ditemukan.';
  end if;
  if v_status = 'arsip' then
    raise exception 'Kegiatan diarsipkan, tidak bisa diubah.';
  end if;
end $$;

create function public.rapikan_urutan_soal(p_kegiatan_id uuid, p_quiz public.jenis_quiz)
returns void
language sql security definer set search_path = ''
as $$
  update public.soal_quiz s
     set urutan = t.rn
    from (
      select x.id, (row_number() over (order by x.urutan, x.dibuat_pada, x.id))::smallint as rn
        from public.soal_quiz x
       where x.kegiatan_id = p_kegiatan_id and x.quiz = p_quiz
    ) t
   where s.id = t.id and s.urutan <> t.rn
$$;

-- Mengubah sesi menjadi hasil_quiz + jawaban_quiz, lalu menghapus sesi dan izin yang terpakai.
-- p_jawaban kosong = pakai jawaban autosave di sesi. Jawaban yang tidak valid dibuang.
create function public.finalkan_sesi_internal(
  p_pengguna_id uuid,
  p_kegiatan_id uuid,
  p_quiz public.jenis_quiz,
  p_jawaban jsonb,
  p_otomatis boolean,
  p_selesai timestamptz
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_sesi public.sesi_kerja_quiz;
  v_hasil uuid;
begin
  select * into v_sesi from public.sesi_kerja_quiz s
  where s.pengguna_id = p_pengguna_id and s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz
  for update;
  if not found then
    return null;
  end if;

  insert into public.hasil_quiz (pengguna_id, kegiatan_id, quiz, urutan_soal, mulai, selesai, otomatis)
  values (p_pengguna_id, p_kegiatan_id, p_quiz, v_sesi.urutan_soal, v_sesi.mulai,
          greatest(p_selesai, v_sesi.mulai), p_otomatis)
  returning id into v_hasil;

  insert into public.jawaban_quiz (hasil_id, soal_id, pilihan)
  select v_hasil, j.soal_id, j.pilihan
  from (
    select e.key::uuid as soal_id, e.value::int as pilihan
    from jsonb_each_text(coalesce(p_jawaban, v_sesi.jawaban)) as e
  ) j
  join public.soal_quiz s on s.id = j.soal_id
  where j.soal_id = any (v_sesi.urutan_soal)
    and j.pilihan >= 0
    and j.pilihan < array_length(s.opsi, 1);

  delete from public.sesi_kerja_quiz s
  where s.pengguna_id = p_pengguna_id and s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz;

  delete from public.izin_kerja_ulang i
  where i.pengguna_id = p_pengguna_id and i.kegiatan_id = p_kegiatan_id and i.quiz = p_quiz;

  return v_hasil;
end $$;

-- =====================================================================
-- 4. TRIGGER
-- =====================================================================

-- ---------- profil ----------

create function public.tg_profil_jaga()
returns trigger
language plpgsql
as $$
begin
  if new.id <> old.id or new.peran <> old.peran then
    raise exception 'ID dan peran akun tidak bisa diubah.';
  end if;
  return new;
end $$;

create trigger profil_jaga before update on profil
for each row execute function public.tg_profil_jaga();

-- Pegawai baru otomatis mendapat baris dokumen untuk semua item kegiatan yang tidak diarsipkan
create function public.tg_profil_buat_dokumen()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.peran = 'operator' then
    insert into public.dokumen (pengguna_id, kegiatan_id, item_id)
    select new.id, i.kegiatan_id, i.id
    from public.item_dokumen i
    join public.kegiatan k on k.id = i.kegiatan_id
    where k.status <> 'arsip'
    on conflict (pengguna_id, item_id) do nothing;
  end if;
  return new;
end $$;

create trigger profil_buat_dokumen after insert on profil
for each row execute function public.tg_profil_buat_dokumen();

-- ---------- item_dokumen dan dokumen ----------

-- Item baru otomatis dibuatkan baris dokumen untuk semua pegawai
create function public.tg_item_buat_dokumen()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.dokumen (pengguna_id, kegiatan_id, item_id)
  select p.id, new.kegiatan_id, new.id
  from public.profil p
  where p.peran = 'operator'
  on conflict (pengguna_id, item_id) do nothing;
  return new;
end $$;

create trigger item_buat_dokumen after insert on item_dokumen
for each row execute function public.tg_item_buat_dokumen();

-- Pegawai tidak boleh memindahkan baris dokumen; waktu unggah selalu dari server
create function public.tg_dokumen_jaga()
returns trigger
language plpgsql
as $$
begin
  if new.id <> old.id or new.pengguna_id <> old.pengguna_id
     or new.kegiatan_id <> old.kegiatan_id or new.item_id <> old.item_id then
    raise exception 'Kolom identitas dokumen tidak bisa diubah.';
  end if;

  if new.status = 'disetujui' then
    if old.status = 'belum'
       or new.path_file is distinct from old.path_file
       or new.nama_file is distinct from old.nama_file then
      new.diunggah_pada := now();
    else
      new.diunggah_pada := old.diunggah_pada;
    end if;
  else
    new.diunggah_pada := null;
  end if;
  return new;
end $$;

create trigger dokumen_jaga before update on dokumen
for each row execute function public.tg_dokumen_jaga();

-- ---------- kegiatan ----------

-- Setiap kegiatan baru otomatis punya pengaturan Pre-Test dan Post-Test
create function public.tg_kegiatan_buat_pengaturan()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.pengaturan_quiz (kegiatan_id, quiz, judul)
  values (new.id, 'pretest', 'Pre-Test'), (new.id, 'posttest', 'Post-Test');
  return new;
end $$;

create trigger kegiatan_buat_pengaturan after insert on kegiatan
for each row execute function public.tg_kegiatan_buat_pengaturan();

-- Kegiatan yang keluar dari arsip: lengkapi baris dokumen pegawai yang masuk selama diarsipkan
create function public.tg_kegiatan_lengkapi_dokumen()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.dokumen (pengguna_id, kegiatan_id, item_id)
  select p.id, i.kegiatan_id, i.id
  from public.item_dokumen i
  cross join public.profil p
  where i.kegiatan_id = new.id and p.peran = 'operator'
  on conflict (pengguna_id, item_id) do nothing;
  return new;
end $$;

create trigger kegiatan_lengkapi_dokumen after update of status on kegiatan
for each row when (old.status = 'arsip' and new.status <> 'arsip')
execute function public.tg_kegiatan_lengkapi_dokumen();

-- ---------- sesi_pembinaan ----------

create function public.tg_sesi_urutan_awal()
returns trigger
language plpgsql
as $$
declare v_urutan smallint;
begin
  if new.urutan is null or new.urutan = 0 then
    select coalesce(max(s.urutan), 0) + 1 into v_urutan
    from public.sesi_pembinaan s where s.kegiatan_id = new.kegiatan_id;
    new.urutan := v_urutan;
  end if;
  return new;
end $$;

create trigger sesi_urutan_awal before insert on sesi_pembinaan
for each row execute function public.tg_sesi_urutan_awal();

create function public.tg_sesi_rapikan()
returns trigger
language plpgsql
as $$
begin
  update public.sesi_pembinaan s
  set urutan = t.rn
  from (
    select x.id, (row_number() over (order by x.urutan, x.dibuat_pada, x.id))::smallint as rn
    from public.sesi_pembinaan x
    where x.kegiatan_id = old.kegiatan_id
  ) t
  where s.id = t.id and s.urutan <> t.rn;
  return null;
end $$;

create trigger sesi_rapikan after delete on sesi_pembinaan
for each row execute function public.tg_sesi_rapikan();

-- Sesi yang sudah ada kehadiran tidak boleh dihapus (pengaman kedua selain server action)
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

-- ---------- presensi ----------

create function public.tg_presensi_jaga()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v record;
begin
  new.waktu_isi := now();

  if public.peran_saya() = 'operator' then
    if new.pengguna_id <> (select auth.uid()) then
      raise exception 'Presensi hanya bisa diisi atas nama sendiri.';
    end if;

    select s.waktu_buka, s.batas_pengisian, k.status
      into v
    from public.sesi_pembinaan s
    join public.kegiatan k on k.id = s.kegiatan_id
    where s.id = new.sesi_id;

    if not found or v.status <> 'aktif' then
      raise exception 'Sesi tidak tersedia.';
    end if;
    if v.waktu_buka is not null and now() < v.waktu_buka then
      raise exception 'Sesi belum dibuka.';
    end if;
    if v.batas_pengisian is not null and now() > v.batas_pengisian then
      raise exception 'Batas pengisian daftar hadir sudah lewat.';
    end if;
  end if;
  return new;
end $$;

create trigger presensi_jaga before insert on presensi
for each row execute function public.tg_presensi_jaga();

-- ---------- kunci_soal ----------

create function public.tg_kunci_valid()
returns trigger
language plpgsql
as $$
declare v_jumlah int;
begin
  select array_length(s.opsi, 1) into v_jumlah from public.soal_quiz s where s.id = new.soal_id;
  if v_jumlah is null or new.kunci >= v_jumlah then
    raise exception 'Kunci jawaban di luar daftar opsi.';
  end if;
  return new;
end $$;

create trigger kunci_valid before insert or update on kunci_soal
for each row execute function public.tg_kunci_valid();

-- =====================================================================
-- 5. FUNGSI YANG DIPANGGIL APLIKASI (rpc)
-- =====================================================================

-- ---------- akun ----------

-- Dipanggil pegawai setelah berhasil mengganti kata sandi awal
create function public.tandai_sandi_diganti()
returns void
language sql security definer set search_path = ''
as $$
  update public.profil set wajib_ganti_sandi = false where id = (select auth.uid())
$$;

-- ---------- kegiatan ----------

-- Memindahkan kegiatan aktif; kegiatan aktif sebelumnya kembali ke draf
create function public.aktifkan_kegiatan(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_status public.status_kegiatan;
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;

  select k.status into v_status from public.kegiatan k where k.id = p_id;
  if not found then
    raise exception 'Kegiatan tidak ditemukan.';
  end if;
  if v_status = 'arsip' then
    raise exception 'Kegiatan yang diarsipkan tidak bisa diaktifkan. Keluarkan dari arsip dulu.';
  end if;

  update public.kegiatan set status = 'draf' where status = 'aktif' and id <> p_id;
  update public.kegiatan set status = 'aktif' where id = p_id;
end $$;

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

-- ---------- modul dan bab (security invoker: RLS tetap berlaku, hanya admin yang berhasil menulis) ----------
-- Urutan: Pembinaan 1 di depan Pembinaan 2, nomor bab dirapatkan 1..n per modul.

create function public.rapikan_bab(p_modul_id uuid)
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

create function public.simpan_modul(p_judul text, p_subjudul text)
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

create function public.tambah_bab(p_modul_id uuid, p_judul text, p_link text, p_pembinaan int)
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

create function public.ubah_bab(p_id uuid, p_judul text, p_link text, p_pembinaan int)
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

create function public.hapus_bab(p_id uuid)
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

create function public.geser_bab(p_id uuid, p_arah int)
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

-- ---------- quiz: sisi admin ----------

-- Membuat soal (p_id kosong) atau mengubah soal. Setelah quiz dibuka atau ada yang mengerjakan:
-- hanya teks soal, kunci, dan pembahasan yang boleh berubah (opsi harus sama persis), dan dicatat di log.
create function public.simpan_soal(
  p_id uuid,
  p_kegiatan_id uuid,
  p_quiz public.jenis_quiz,
  p_pertanyaan text,
  p_opsi text[],
  p_kunci smallint,
  p_pembahasan text default ''
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_urutan smallint;
  v_lama record;
  v_pertanyaan text := btrim(coalesce(p_pertanyaan, ''));
  v_pembahasan text := btrim(coalesce(p_pembahasan, ''));
  v_opsi text[];
  v_bisa_ubah boolean;
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;
  perform public.pastikan_kegiatan_terbuka(p_kegiatan_id);

  perform 1 from public.pengaturan_quiz q
  where q.kegiatan_id = p_kegiatan_id and q.quiz = p_quiz for update;
  if not found then
    raise exception 'Quiz tidak ditemukan.';
  end if;

  if v_pertanyaan = '' then
    raise exception 'Teks soal wajib diisi.';
  end if;
  v_opsi := array(
    select btrim(u.o) from unnest(coalesce(p_opsi, '{}'::text[])) with ordinality as u(o, n) order by u.n
  );
  if coalesce(array_length(v_opsi, 1), 0) not between 2 and 6 then
    raise exception 'Jumlah opsi harus 2 sampai 6.';
  end if;
  if exists (select 1 from unnest(v_opsi) as u(o) where u.o = '') then
    raise exception 'Semua opsi wajib diisi.';
  end if;
  if p_kunci is null or p_kunci < 0 or p_kunci >= array_length(v_opsi, 1) then
    raise exception 'Kunci jawaban di luar daftar opsi.';
  end if;

  if p_id is null then
    select coalesce(max(s.urutan), 0) + 1 into v_urutan
    from public.soal_quiz s where s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz;

    insert into public.soal_quiz (kegiatan_id, quiz, urutan, pertanyaan, opsi)
    values (p_kegiatan_id, p_quiz, v_urutan, v_pertanyaan, v_opsi)
    returning id into v_id;

    insert into public.kunci_soal (soal_id, kunci, pembahasan) values (v_id, p_kunci, v_pembahasan);
  else
    select s.pertanyaan, s.opsi, k.kunci, k.pembahasan into v_lama
    from public.soal_quiz s
    join public.kunci_soal k on k.soal_id = s.id
    where s.id = p_id and s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz;
    if not found then
      raise exception 'Soal tidak ditemukan.';
    end if;
    v_id := p_id;

    v_bisa_ubah := public.soal_bisa_diubah(p_kegiatan_id, p_quiz);
    if not v_bisa_ubah and v_lama.opsi is distinct from v_opsi then
      raise exception 'Teks, jumlah, dan urutan opsi tidak bisa diubah setelah quiz dibuka.';
    end if;

    update public.soal_quiz set pertanyaan = v_pertanyaan, opsi = v_opsi where id = p_id;
    update public.kunci_soal set kunci = p_kunci, pembahasan = v_pembahasan where soal_id = p_id;

    if not v_bisa_ubah then
      if v_lama.kunci <> p_kunci then
        insert into public.log_perubahan_quiz (kegiatan_id, quiz, jenis, soal_id, kunci_lama, kunci_baru, admin_nama)
        values (p_kegiatan_id, p_quiz, 'kunci', p_id, v_lama.kunci, p_kunci, public.nama_saya());
      end if;
      if v_lama.pertanyaan is distinct from v_pertanyaan or v_lama.pembahasan is distinct from v_pembahasan then
        insert into public.log_perubahan_quiz (kegiatan_id, quiz, jenis, soal_id, admin_nama)
        values (p_kegiatan_id, p_quiz, 'edit', p_id, public.nama_saya());
      end if;
    end if;
  end if;

  return v_id;
end $$;

create function public.ubah_aktif_soal(p_soal_id uuid, p_aktif boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v record;
  v_aktif boolean;
  v_terkunci boolean;
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;

  select s.kegiatan_id, s.quiz into v from public.soal_quiz s where s.id = p_soal_id;
  if not found then
    raise exception 'Soal tidak ditemukan.';
  end if;
  perform public.pastikan_kegiatan_terbuka(v.kegiatan_id);

  perform 1 from public.pengaturan_quiz q
  where q.kegiatan_id = v.kegiatan_id and q.quiz = v.quiz for update;

  select s.aktif into v_aktif from public.soal_quiz s where s.id = p_soal_id;
  if v_aktif is null then
    raise exception 'Soal tidak ditemukan.';
  end if;
  if v_aktif = p_aktif then
    return;
  end if;

  v_terkunci := not public.soal_bisa_diubah(v.kegiatan_id, v.quiz);
  update public.soal_quiz set aktif = p_aktif where id = p_soal_id;

  if v_terkunci then
    insert into public.log_perubahan_quiz (kegiatan_id, quiz, jenis, soal_id, admin_nama)
    values (v.kegiatan_id, v.quiz,
            case when p_aktif then 'aktifkan' else 'nonaktif' end::public.jenis_log_quiz,
            p_soal_id, public.nama_saya());
  end if;
end $$;

-- Hanya sebelum quiz dibuka dan belum ada yang mengerjakan. Mengembalikan true bila waktu buka
-- ikut dikosongkan karena tidak ada soal aktif tersisa.
create function public.hapus_soal(p_soal_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v record;
  v_sisa int;
  v_kosongkan boolean := false;
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;

  select s.kegiatan_id, s.quiz into v from public.soal_quiz s where s.id = p_soal_id;
  if not found then
    raise exception 'Soal tidak ditemukan.';
  end if;
  perform public.pastikan_kegiatan_terbuka(v.kegiatan_id);

  perform 1 from public.pengaturan_quiz q
  where q.kegiatan_id = v.kegiatan_id and q.quiz = v.quiz for update;

  if not public.soal_bisa_diubah(v.kegiatan_id, v.quiz) then
    raise exception 'Soal tidak bisa dihapus karena quiz sudah dibuka atau sudah ada yang mengerjakan. Nonaktifkan saja.';
  end if;

  delete from public.soal_quiz where id = p_soal_id;
  perform public.rapikan_urutan_soal(v.kegiatan_id, v.quiz);

  select count(*) into v_sisa from public.soal_quiz s
  where s.kegiatan_id = v.kegiatan_id and s.quiz = v.quiz and s.aktif;
  if v_sisa = 0 then
    update public.pengaturan_quiz q set waktu_buka = null
    where q.kegiatan_id = v.kegiatan_id and q.quiz = v.quiz and q.waktu_buka is not null;
    v_kosongkan := found;
  end if;

  return v_kosongkan;
end $$;

create function public.geser_soal(p_soal_id uuid, p_arah int)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v record;
  v_urut smallint;
  v_tid uuid;
  v_turut smallint;
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;
  if p_arah not in (-1, 1) then
    raise exception 'Arah tidak valid.';
  end if;

  select s.kegiatan_id, s.quiz into v from public.soal_quiz s where s.id = p_soal_id;
  if not found then
    raise exception 'Soal tidak ditemukan.';
  end if;
  perform public.pastikan_kegiatan_terbuka(v.kegiatan_id);

  perform 1 from public.pengaturan_quiz q
  where q.kegiatan_id = v.kegiatan_id and q.quiz = v.quiz for update;

  if not public.soal_bisa_diubah(v.kegiatan_id, v.quiz) then
    raise exception 'Urutan soal terkunci karena quiz sudah dibuka atau sudah ada yang mengerjakan.';
  end if;

  select s.urutan into v_urut from public.soal_quiz s where s.id = p_soal_id;
  if v_urut is null then
    raise exception 'Soal tidak ditemukan.';
  end if;

  if p_arah = -1 then
    select s.id, s.urutan into v_tid, v_turut from public.soal_quiz s
    where s.kegiatan_id = v.kegiatan_id and s.quiz = v.quiz and s.urutan < v_urut
    order by s.urutan desc limit 1;
  else
    select s.id, s.urutan into v_tid, v_turut from public.soal_quiz s
    where s.kegiatan_id = v.kegiatan_id and s.quiz = v.quiz and s.urutan > v_urut
    order by s.urutan asc limit 1;
  end if;

  if v_tid is null then
    return; -- sudah di ujung
  end if;

  update public.soal_quiz
     set urutan = case when id = p_soal_id then v_turut else v_urut end
   where id in (p_soal_id, v_tid);
end $$;

-- Pengaturan waktu, durasi, dan acak soal. hanya_berizin menyala otomatis bila batas akhir
-- pertama sudah lewat (sesuai aturan di layar admin).
create function public.simpan_pengaturan_quiz(
  p_kegiatan_id uuid,
  p_quiz public.jenis_quiz,
  p_waktu_buka timestamptz,
  p_batas_akhir timestamptz,
  p_durasi_menit int,
  p_acak_soal boolean
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_lama public.pengaturan_quiz;
  v_soal_aktif int;
  v_acak boolean;
  v_tutup boolean;
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;
  perform public.pastikan_kegiatan_terbuka(p_kegiatan_id);

  select * into v_lama from public.pengaturan_quiz q
  where q.kegiatan_id = p_kegiatan_id and q.quiz = p_quiz for update;
  if not found then
    raise exception 'Quiz tidak ditemukan.';
  end if;

  if p_durasi_menit is null or p_durasi_menit < 1 or p_durasi_menit > 32767 then
    raise exception 'Durasi minimal 1 menit.';
  end if;

  select count(*) into v_soal_aktif from public.soal_quiz s
  where s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz and s.aktif;
  if p_waktu_buka is not null and v_soal_aktif = 0 then
    raise exception 'Tambahkan minimal satu soal aktif dulu.';
  end if;
  if p_waktu_buka is not null and p_batas_akhir is not null and p_batas_akhir <= p_waktu_buka then
    raise exception 'Batas akhir harus setelah waktu buka.';
  end if;

  v_acak := coalesce(p_acak_soal, v_lama.acak_soal);
  if v_acak <> v_lama.acak_soal and not public.soal_bisa_diubah(p_kegiatan_id, p_quiz) then
    raise exception 'Pilihan acak soal terkunci setelah quiz dibuka atau sudah ada yang mengerjakan.';
  end if;

  -- batas akhir lama sudah lewat (sampai akhir menitnya): sejak itu hanya pegawai berizin
  v_tutup := v_lama.waktu_buka is not null and v_lama.waktu_buka <= now()
         and v_lama.batas_akhir is not null and now() >= v_lama.batas_akhir + interval '1 minute';

  update public.pengaturan_quiz
     set waktu_buka = p_waktu_buka,
         batas_akhir = p_batas_akhir,
         durasi_menit = p_durasi_menit::smallint,
         acak_soal = v_acak,
         hanya_berizin = v_lama.hanya_berizin or v_tutup
   where kegiatan_id = p_kegiatan_id and quiz = p_quiz;
end $$;

-- Izin kerja ulang untuk banyak pegawai sekaligus, satu transaksi.
-- p_target: [{"pengguna_id": "<uuid>", "quiz": "pretest"}, ...]
-- Hasil dan sesi lama dihapus, izin dan log dicatat, hanya_berizin dinyalakan bila batas akhir sudah lewat.
create function public.beri_izin_kerja_ulang_banyak(p_kegiatan_id uuid, p_target jsonb)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  v_n int := 0;
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;
  perform public.pastikan_kegiatan_terbuka(p_kegiatan_id);

  if p_target is null or jsonb_typeof(p_target) <> 'array' or jsonb_array_length(p_target) = 0 then
    raise exception 'Pilih minimal satu pegawai.';
  end if;

  perform 1 from public.pengaturan_quiz q
  where q.kegiatan_id = p_kegiatan_id
    and q.quiz in (
      select t.quiz from jsonb_to_recordset(p_target) as t(pengguna_id uuid, quiz public.jenis_quiz)
    )
  order by q.quiz
  for update;

  for r in
    select distinct t.pengguna_id, t.quiz
    from jsonb_to_recordset(p_target) as t(pengguna_id uuid, quiz public.jenis_quiz)
    order by t.quiz, t.pengguna_id
  loop
    if not exists (select 1 from public.profil p where p.id = r.pengguna_id and p.peran = 'operator') then
      raise exception 'Pegawai tidak ditemukan.';
    end if;

    delete from public.hasil_quiz h
    where h.pengguna_id = r.pengguna_id and h.kegiatan_id = p_kegiatan_id and h.quiz = r.quiz;
    delete from public.sesi_kerja_quiz s
    where s.pengguna_id = r.pengguna_id and s.kegiatan_id = p_kegiatan_id and s.quiz = r.quiz;

    insert into public.izin_kerja_ulang (kegiatan_id, quiz, pengguna_id, admin_id, admin_nama)
    values (p_kegiatan_id, r.quiz, r.pengguna_id, (select auth.uid()), public.nama_saya())
    on conflict (kegiatan_id, quiz, pengguna_id)
    do update set diberikan_pada = now(), admin_id = excluded.admin_id, admin_nama = excluded.admin_nama;

    insert into public.log_perubahan_quiz (kegiatan_id, quiz, jenis, pengguna_id, admin_nama)
    values (p_kegiatan_id, r.quiz, 'izin_ulang', r.pengguna_id, public.nama_saya());

    v_n := v_n + 1;
  end loop;

  update public.pengaturan_quiz q set hanya_berizin = true
  where q.kegiatan_id = p_kegiatan_id
    and not q.hanya_berizin
    and q.quiz in (
      select t.quiz from jsonb_to_recordset(p_target) as t(pengguna_id uuid, quiz public.jenis_quiz)
    )
    and q.waktu_buka is not null and q.waktu_buka <= now()
    and q.batas_akhir is not null and now() >= q.batas_akhir + interval '1 minute';

  return v_n;
end $$;

-- Hasil semua pegawai pada satu kegiatan, jawaban digabung jadi satu jsonb per hasil
-- (menghindari batas 1000 baris bila jawaban_quiz dibaca langsung)
create function public.hasil_quiz_admin(p_kegiatan_id uuid)
returns table (
  pengguna_id uuid,
  quiz public.jenis_quiz,
  urutan_soal uuid[],
  jawaban jsonb,
  mulai timestamptz,
  selesai timestamptz,
  otomatis boolean
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.adalah_admin() then
    raise exception 'Hanya admin yang boleh melakukan ini.';
  end if;

  return query
  select h.pengguna_id, h.quiz, h.urutan_soal,
         coalesce((select jsonb_object_agg(j.soal_id::text, j.pilihan)
                     from public.jawaban_quiz j where j.hasil_id = h.id), '{}'::jsonb),
         h.mulai, h.selesai, h.otomatis
  from public.hasil_quiz h
  where h.kegiatan_id = p_kegiatan_id
  order by h.selesai;
end $$;

-- ---------- quiz: sisi pegawai ----------

-- Jumlah soal aktif untuk kartu quiz (soal sendiri belum terbaca sebelum Mulai)
create function public.jumlah_soal_aktif(p_kegiatan_id uuid, p_quiz public.jenis_quiz)
returns int
language sql stable security definer set search_path = ''
as $$
  select case
    when public.adalah_admin()
      or exists (select 1 from public.kegiatan k where k.id = p_kegiatan_id and k.status = 'aktif')
    then (select count(*)::int from public.soal_quiz s
          where s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz and s.aktif)
    else 0
  end
$$;

-- Memulai (atau melanjutkan) pengerjaan. Mengembalikan data sesi; soal dibaca lewat RLS setelah ini.
-- Menutup browser tidak memberi kesempatan kedua: sesi yang sama dilanjutkan, waktu tetap berjalan.
create function public.mulai_quiz(p_kegiatan_id uuid, p_quiz public.jenis_quiz)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_kegiatan record;
  v_p public.pengaturan_quiz;
  v_sesi public.sesi_kerja_quiz;
  v_urutan uuid[];
  v_berakhir timestamptz;
begin
  if public.peran_saya() is distinct from 'operator' then
    raise exception 'Hanya pegawai OPD yang bisa mengerjakan quiz.';
  end if;

  select k.status, k.pretest_aktif, k.posttest_aktif into v_kegiatan
  from public.kegiatan k where k.id = p_kegiatan_id;
  if not found or v_kegiatan.status <> 'aktif' then
    raise exception 'Kegiatan tidak aktif.';
  end if;
  if (p_quiz = 'pretest' and not v_kegiatan.pretest_aktif)
     or (p_quiz = 'posttest' and not v_kegiatan.posttest_aktif) then
    raise exception 'Quiz ini sedang dinonaktifkan.';
  end if;

  select * into v_p from public.pengaturan_quiz q
  where q.kegiatan_id = p_kegiatan_id and q.quiz = p_quiz for share;
  if not found or v_p.waktu_buka is null or now() < v_p.waktu_buka then
    raise exception 'Quiz belum dibuka.';
  end if;

  if exists (select 1 from public.hasil_quiz h
             where h.pengguna_id = v_uid and h.kegiatan_id = p_kegiatan_id and h.quiz = p_quiz) then
    raise exception 'Kamu sudah mengerjakan quiz ini.';
  end if;

  select * into v_sesi from public.sesi_kerja_quiz s
  where s.pengguna_id = v_uid and s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz;

  if not found then
    -- aturan untuk memulai yang baru. Batas akhir berlaku untuk semua, termasuk pemegang izin
    if v_p.batas_akhir is not null and now() >= v_p.batas_akhir + interval '1 minute' then
      raise exception 'Batas akhir quiz sudah lewat.';
    end if;
    if v_p.hanya_berizin and not exists (
      select 1 from public.izin_kerja_ulang i
      where i.pengguna_id = v_uid and i.kegiatan_id = p_kegiatan_id and i.quiz = p_quiz
    ) then
      raise exception 'Quiz sudah ditutup. Hanya pegawai yang diberi izin yang boleh mengerjakan.';
    end if;
    if p_quiz = 'posttest' and v_kegiatan.pretest_aktif and not exists (
      select 1 from public.hasil_quiz h
      where h.pengguna_id = v_uid and h.kegiatan_id = p_kegiatan_id and h.quiz = 'pretest'
    ) then
      raise exception 'Post-Test baru terbuka setelah Pre-Test selesai dikerjakan.';
    end if;

    select coalesce(array_agg(x.id order by x.ord), '{}'::uuid[]) into v_urutan
    from (
      select s.id,
             case when v_p.acak_soal then random() else s.urutan end as ord
      from public.soal_quiz s
      where s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz and s.aktif
    ) x;
    if array_length(v_urutan, 1) is null then
      raise exception 'Quiz belum punya soal.';
    end if;

    -- durasi penuh, dipotong batas akhir (sampai akhir menit batas akhir)
    v_berakhir := least(
      now() + make_interval(mins => v_p.durasi_menit),
      coalesce(v_p.batas_akhir + interval '1 minute', 'infinity'::timestamptz)
    );

    insert into public.sesi_kerja_quiz (pengguna_id, kegiatan_id, quiz, urutan_soal, mulai, berakhir_pada)
    values (v_uid, p_kegiatan_id, p_quiz, v_urutan, now(), v_berakhir)
    on conflict (pengguna_id, kegiatan_id, quiz) do nothing;

    select * into v_sesi from public.sesi_kerja_quiz s
    where s.pengguna_id = v_uid and s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz;
  end if;

  return jsonb_build_object(
    'mulai', v_sesi.mulai,
    'berakhir_pada', v_sesi.berakhir_pada,
    'sisa_detik', greatest(0, ceil(extract(epoch from (v_sesi.berakhir_pada - now()))))::int,
    'urutan_soal', to_jsonb(v_sesi.urutan_soal),
    'jawaban', v_sesi.jawaban
  );
end $$;

-- Autosave satu pilihan jawaban
create function public.simpan_jawaban_quiz(
  p_kegiatan_id uuid,
  p_quiz public.jenis_quiz,
  p_soal_id uuid,
  p_pilihan int
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_sesi public.sesi_kerja_quiz;
  v_jumlah int;
begin
  if public.peran_saya() is distinct from 'operator' then
    raise exception 'Hanya pegawai OPD yang bisa mengerjakan quiz.';
  end if;

  select * into v_sesi from public.sesi_kerja_quiz s
  where s.pengguna_id = v_uid and s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz
  for update;
  if not found then
    raise exception 'Sesi pengerjaan tidak ditemukan.';
  end if;
  if now() > v_sesi.berakhir_pada + interval '15 seconds' then
    raise exception 'Waktu pengerjaan sudah habis.';
  end if;
  if not (p_soal_id = any (v_sesi.urutan_soal)) then
    raise exception 'Soal tidak termasuk dalam pengerjaan ini.';
  end if;

  select array_length(s.opsi, 1) into v_jumlah from public.soal_quiz s where s.id = p_soal_id;
  if p_pilihan is null or p_pilihan < 0 or p_pilihan >= coalesce(v_jumlah, 0) then
    raise exception 'Pilihan jawaban di luar daftar opsi.';
  end if;

  update public.sesi_kerja_quiz s
     set jawaban = jsonb_set(s.jawaban, array[p_soal_id::text], to_jsonb(p_pilihan), true)
   where s.pengguna_id = v_uid and s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz;
end $$;

-- Mengirim jawaban. Waktu selesai dari server. p_jawaban melengkapi jawaban autosave.
-- Bila kiriman datang lebih dari 15 detik setelah batas waktu, hasil dibuat dari autosave saja
-- dan ditandai otomatis. p_otomatis hanya label untuk kiriman dari timer di browser.
create function public.kirim_quiz(
  p_kegiatan_id uuid,
  p_quiz public.jenis_quiz,
  p_jawaban jsonb,
  p_otomatis boolean default false
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_sesi public.sesi_kerja_quiz;
begin
  if public.peran_saya() is distinct from 'operator' then
    raise exception 'Hanya pegawai OPD yang bisa mengirim jawaban.';
  end if;
  if p_jawaban is not null and jsonb_typeof(p_jawaban) <> 'object' then
    raise exception 'Format jawaban tidak valid.';
  end if;

  select * into v_sesi from public.sesi_kerja_quiz s
  where s.pengguna_id = v_uid and s.kegiatan_id = p_kegiatan_id and s.quiz = p_quiz
  for update;
  if not found then
    if exists (select 1 from public.hasil_quiz h
               where h.pengguna_id = v_uid and h.kegiatan_id = p_kegiatan_id and h.quiz = p_quiz) then
      raise exception 'Kamu sudah mengerjakan quiz ini.';
    end if;
    raise exception 'Sesi pengerjaan tidak ditemukan. Mulai quiz dulu.';
  end if;

  if now() > v_sesi.berakhir_pada + interval '15 seconds' then
    return public.finalkan_sesi_internal(v_uid, p_kegiatan_id, p_quiz, null, true, v_sesi.berakhir_pada);
  end if;

  return public.finalkan_sesi_internal(
    v_uid, p_kegiatan_id, p_quiz,
    v_sesi.jawaban || coalesce(p_jawaban, '{}'::jsonb),
    coalesce(p_otomatis, false),
    now()
  );
end $$;

-- Sesi yang waktunya sudah lewat (browser ditutup) dijadikan hasil dari jawaban autosave.
-- Pegawai: hanya sesinya sendiri. Admin: semua (dipanggil saat halaman Kelola Quiz dibuka).
create function public.finalkan_sesi_kedaluwarsa(p_kegiatan_id uuid default null)
returns int
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_admin boolean := public.adalah_admin();
  r record;
  v_n int := 0;
begin
  if v_uid is null then
    raise exception 'Belum masuk.';
  end if;

  for r in
    select s.pengguna_id, s.kegiatan_id, s.quiz, s.berakhir_pada
    from public.sesi_kerja_quiz s
    where now() > s.berakhir_pada + interval '15 seconds'
      and (v_admin or s.pengguna_id = v_uid)
      and (p_kegiatan_id is null or s.kegiatan_id = p_kegiatan_id)
    for update skip locked
  loop
    perform public.finalkan_sesi_internal(r.pengguna_id, r.kegiatan_id, r.quiz, null, true, r.berakhir_pada);
    v_n := v_n + 1;
  end loop;

  return v_n;
end $$;

-- =====================================================================
-- 6. VIEW NILAI QUIZ (nilai dihitung dari jawaban dan kunci, tidak disimpan)
-- =====================================================================

create view v_nilai_quiz with (security_invoker = true) as
select t.*,
       case when t.jumlah_soal > 0
            then round(t.jumlah_benar * 100.0 / t.jumlah_soal, 2)
       end as nilai
from (
  select h.id as hasil_id,
         h.pengguna_id,
         h.kegiatan_id,
         h.quiz,
         (select count(*) from public.soal_quiz s
           where s.kegiatan_id = h.kegiatan_id and s.quiz = h.quiz and s.aktif)::int as jumlah_soal,
         (select count(*) from public.jawaban_quiz j
            join public.soal_quiz s on s.id = j.soal_id and s.aktif
            join public.kunci_soal k on k.soal_id = s.id and k.kunci = j.pilihan
           where j.hasil_id = h.id)::int as jumlah_benar
  from public.hasil_quiz h
) t;

-- =====================================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================================
-- Admin: akses penuh (kecuali yang sengaja lewat fungsi di bagian 5).
-- Operator: hanya data milik sendiri dan kegiatan yang sedang aktif.

alter table opd enable row level security;
alter table profil enable row level security;
alter table kegiatan enable row level security;
alter table item_dokumen enable row level security;
alter table dokumen enable row level security;
alter table sesi_pembinaan enable row level security;
alter table presensi enable row level security;
alter table pengaturan_quiz enable row level security;
alter table soal_quiz enable row level security;
alter table kunci_soal enable row level security;
alter table hasil_quiz enable row level security;
alter table jawaban_quiz enable row level security;
alter table sesi_kerja_quiz enable row level security;
alter table izin_kerja_ulang enable row level security;
alter table log_perubahan_quiz enable row level security;
alter table modul_pembelajaran enable row level security;
alter table bab_modul enable row level security;
alter table bab_selesai enable row level security;
alter table undangan enable row level security;
alter table undangan_opd enable row level security;
alter table aspek_monev enable row level security;
alter table indikator_keberhasilan enable row level security;
alter table milestone enable row level security;
alter table output_milestone enable row level security;

-- ---------- opd ----------
create policy opd_baca on opd for select to authenticated using (true);
create policy opd_admin on opd for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));

-- ---------- profil ----------
create policy profil_baca on profil for select to authenticated
  using (id = (select auth.uid()) or (select public.adalah_admin()));
create policy profil_admin on profil for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));

-- ---------- kegiatan dan item ----------
create policy kegiatan_admin on kegiatan for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy kegiatan_baca_operator on kegiatan for select to authenticated
  using (status = 'aktif');

create policy item_admin on item_dokumen for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy item_baca_operator on item_dokumen for select to authenticated
  using (kegiatan_id in (select k.id from public.kegiatan k where k.status = 'aktif'));

-- ---------- dokumen ----------
-- Baris dibuat dan dihapus oleh trigger/cascade; pegawai hanya membaca dan memperbarui baris sendiri
create policy dokumen_admin on dokumen for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy dokumen_baca_sendiri on dokumen for select to authenticated
  using (pengguna_id = (select auth.uid()));
create policy dokumen_ubah_sendiri on dokumen for update to authenticated
  using (pengguna_id = (select auth.uid())
         and kegiatan_id in (select k.id from public.kegiatan k where k.status = 'aktif'))
  with check (pengguna_id = (select auth.uid())
              and kegiatan_id in (select k.id from public.kegiatan k where k.status = 'aktif'));

-- ---------- sesi dan presensi ----------
create policy sesi_admin on sesi_pembinaan for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy sesi_baca_operator on sesi_pembinaan for select to authenticated
  using (kegiatan_id in (select k.id from public.kegiatan k where k.status = 'aktif'));

create policy presensi_admin on presensi for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy presensi_baca_sendiri on presensi for select to authenticated
  using (pengguna_id = (select auth.uid()));
create policy presensi_isi_sendiri on presensi for insert to authenticated
  with check (pengguna_id = (select auth.uid()));

-- ---------- quiz ----------
-- pengaturan_quiz: baris dibuat trigger dan dihapus cascade, admin hanya membaca dan mengubah
create policy pengaturan_baca_admin on pengaturan_quiz for select to authenticated
  using ((select public.adalah_admin()));
create policy pengaturan_ubah_admin on pengaturan_quiz for update to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy pengaturan_baca_operator on pengaturan_quiz for select to authenticated
  using (kegiatan_id in (select k.id from public.kegiatan k where k.status = 'aktif'));

-- soal_quiz: tambah/ubah/hapus soal lewat fungsi simpan_soal, ubah_aktif_soal, hapus_soal, geser_soal
create policy soal_baca_admin on soal_quiz for select to authenticated
  using ((select public.adalah_admin()));
-- Pegawai baru bisa membaca soal setelah menekan Mulai (punya sesi) atau sudah punya hasil (review)
create policy soal_baca_operator on soal_quiz for select to authenticated
  using (
    kegiatan_id in (select k.id from public.kegiatan k where k.status = 'aktif')
    and (
      exists (
        select 1 from public.sesi_kerja_quiz s
        where s.pengguna_id = (select auth.uid())
          and s.kegiatan_id = soal_quiz.kegiatan_id and s.quiz = soal_quiz.quiz
      )
      or exists (
        select 1 from public.hasil_quiz h
        where h.pengguna_id = (select auth.uid())
          and h.kegiatan_id = soal_quiz.kegiatan_id and h.quiz = soal_quiz.quiz
      )
    )
  );

-- kunci_soal: pegawai baru bisa membaca setelah hasilnya sendiri tersimpan
create policy kunci_baca_admin on kunci_soal for select to authenticated
  using ((select public.adalah_admin()));
create policy kunci_baca_operator on kunci_soal for select to authenticated
  using (exists (
    select 1
    from public.soal_quiz s
    join public.hasil_quiz h on h.kegiatan_id = s.kegiatan_id and h.quiz = s.quiz
    where s.id = kunci_soal.soal_id and h.pengguna_id = (select auth.uid())
  ));

-- hasil dan jawaban: ditulis hanya oleh finalkan_sesi_internal (lewat kirim_quiz dan
-- finalkan_sesi_kedaluwarsa), dihapus oleh beri_izin_kerja_ulang_banyak
create policy hasil_baca_admin on hasil_quiz for select to authenticated
  using ((select public.adalah_admin()));
create policy hasil_baca_sendiri on hasil_quiz for select to authenticated
  using (pengguna_id = (select auth.uid()));

create policy jawaban_baca_admin on jawaban_quiz for select to authenticated
  using ((select public.adalah_admin()));
create policy jawaban_baca_sendiri on jawaban_quiz for select to authenticated
  using (hasil_id in (select h.id from public.hasil_quiz h where h.pengguna_id = (select auth.uid())));

-- sesi_kerja_quiz: ditulis hanya oleh fungsi mulai_quiz, simpan_jawaban_quiz, kirim_quiz
create policy sesi_kerja_baca_sendiri on sesi_kerja_quiz for select to authenticated
  using (pengguna_id = (select auth.uid()));
create policy sesi_kerja_baca_admin on sesi_kerja_quiz for select to authenticated
  using ((select public.adalah_admin()));

create policy izin_baca_admin on izin_kerja_ulang for select to authenticated
  using ((select public.adalah_admin()));
create policy izin_baca_sendiri on izin_kerja_ulang for select to authenticated
  using (pengguna_id = (select auth.uid()));

create policy log_admin on log_perubahan_quiz for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));

-- ---------- modul ----------
create policy modul_admin on modul_pembelajaran for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy modul_baca on modul_pembelajaran for select to authenticated using (true);

create policy bab_admin on bab_modul for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy bab_baca on bab_modul for select to authenticated using (true);

create policy bab_selesai_admin on bab_selesai for select to authenticated
  using ((select public.adalah_admin()));
create policy bab_selesai_baca_sendiri on bab_selesai for select to authenticated
  using (pengguna_id = (select auth.uid()));
create policy bab_selesai_isi_sendiri on bab_selesai for insert to authenticated
  with check (pengguna_id = (select auth.uid()));
create policy bab_selesai_batal_sendiri on bab_selesai for delete to authenticated
  using (pengguna_id = (select auth.uid()));

-- ---------- undangan ----------
create policy undangan_admin on undangan for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy undangan_baca_operator on undangan for select to authenticated
  using (exists (
    select 1 from public.undangan_opd uo
    where uo.undangan_id = undangan.id and uo.opd_id = (select public.opd_saya())
  ));

create policy undangan_opd_admin on undangan_opd for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy undangan_opd_baca_operator on undangan_opd for select to authenticated
  using (opd_id = (select public.opd_saya()));

-- ---------- monev (khusus admin untuk saat ini) ----------
create policy aspek_admin on aspek_monev for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy indikator_admin on indikator_keberhasilan for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy milestone_admin on milestone for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));
create policy output_milestone_admin on output_milestone for all to authenticated
  using ((select public.adalah_admin())) with check ((select public.adalah_admin()));

-- =====================================================================
-- 8. HAK AKSES FUNGSI DAN TABEL
-- =====================================================================

revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon, authenticated;

-- sesi_kerja_quiz: pegawai hanya membaca (lewat RLS); semua penulisan lewat fungsi
revoke all on public.sesi_kerja_quiz from authenticated;
grant select on public.sesi_kerja_quiz to authenticated;

-- Dipakai kebijakan RLS
grant execute on function public.peran_saya() to authenticated;
grant execute on function public.adalah_admin() to authenticated;
grant execute on function public.opd_saya() to authenticated;
grant execute on function public.nama_saya() to authenticated;
grant execute on function public.quiz_sudah_dibuka(uuid, public.jenis_quiz) to authenticated;

-- Dipanggil aplikasi lewat supabase.rpc(...)
grant execute on function public.tandai_sandi_diganti() to authenticated;
grant execute on function public.aktifkan_kegiatan(uuid) to authenticated;
grant execute on function public.ringkasan_kegiatan() to authenticated;
grant execute on function public.daftar_item_berdata() to authenticated;
grant execute on function public.hapus_kegiatan(uuid) to authenticated;
grant execute on function public.tambah_item_dokumen(uuid, text) to authenticated;
grant execute on function public.hapus_item_dokumen(uuid) to authenticated;

-- modul dan bab (rapikan_bab dipanggil dari fungsi lain sebagai pengguna yang sama, jadi perlu grant;
-- tanpa hak admin (RLS) ia tidak mengubah baris apa pun)
grant execute on function public.rapikan_bab(uuid) to authenticated;
grant execute on function public.simpan_modul(text, text) to authenticated;
grant execute on function public.tambah_bab(uuid, text, text, int) to authenticated;
grant execute on function public.ubah_bab(uuid, text, text, int) to authenticated;
grant execute on function public.hapus_bab(uuid) to authenticated;
grant execute on function public.geser_bab(uuid, int) to authenticated;

-- quiz
grant execute on function public.simpan_soal(uuid, uuid, public.jenis_quiz, text, text[], smallint, text) to authenticated;
grant execute on function public.ubah_aktif_soal(uuid, boolean) to authenticated;
grant execute on function public.hapus_soal(uuid) to authenticated;
grant execute on function public.geser_soal(uuid, int) to authenticated;
grant execute on function public.simpan_pengaturan_quiz(uuid, public.jenis_quiz, timestamptz, timestamptz, int, boolean) to authenticated;
grant execute on function public.beri_izin_kerja_ulang_banyak(uuid, jsonb) to authenticated;
grant execute on function public.hasil_quiz_admin(uuid) to authenticated;
grant execute on function public.jumlah_soal_aktif(uuid, public.jenis_quiz) to authenticated;
grant execute on function public.mulai_quiz(uuid, public.jenis_quiz) to authenticated;
grant execute on function public.simpan_jawaban_quiz(uuid, public.jenis_quiz, uuid, int) to authenticated;
grant execute on function public.kirim_quiz(uuid, public.jenis_quiz, jsonb, boolean) to authenticated;
grant execute on function public.finalkan_sesi_kedaluwarsa(uuid) to authenticated;

-- Sengaja tanpa grant (hanya dipanggil dari dalam fungsi lain atau trigger):
-- kegiatan_berdata, soal_bisa_diubah, pastikan_kegiatan_terbuka, rapikan_urutan_soal,
-- finalkan_sesi_internal, tg_sesi_jaga_hapus

-- =====================================================================
-- 9. STORAGE: bucket dokumen-opd (privat, maksimal 2 MB per file)
-- =====================================================================
-- Path file: <id pegawai>/<id item>/<nama file>. Pegawai hanya mengakses folder sendiri,
-- admin membaca dan menghapus semua.

insert into storage.buckets (id, name, public, file_size_limit)
values ('dokumen-opd', 'dokumen-opd', false, 2097152)
on conflict (id) do update set public = false, file_size_limit = 2097152;

drop policy if exists dokumen_opd_baca on storage.objects;
drop policy if exists dokumen_opd_unggah on storage.objects;
drop policy if exists dokumen_opd_ganti on storage.objects;
drop policy if exists dokumen_opd_hapus on storage.objects;

create policy dokumen_opd_baca on storage.objects for select to authenticated
  using (bucket_id = 'dokumen-opd'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.adalah_admin())));

create policy dokumen_opd_unggah on storage.objects for insert to authenticated
  with check (bucket_id = 'dokumen-opd'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy dokumen_opd_ganti on storage.objects for update to authenticated
  using (bucket_id = 'dokumen-opd' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'dokumen-opd' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy dokumen_opd_hapus on storage.objects for delete to authenticated
  using (bucket_id = 'dokumen-opd'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.adalah_admin())));

-- =====================================================================
-- 10. PEMERIKSAAN AKHIR
-- =====================================================================

-- Harus 0 baris: tidak boleh ada tabel public tanpa RLS
select tablename as tabel_tanpa_rls from pg_tables where schemaname = 'public' and not rowsecurity;

commit;

-- =====================================================================
-- AKUN ADMIN PERTAMA (jalankan SETELAH skema di atas berhasil)
-- =====================================================================
-- 1. Supabase Dashboard > Authentication > Users > Add user: isi email dan kata sandi, centang Auto Confirm User.
-- 2. Jalankan di SQL Editor, ganti email dan nama:
--
--   insert into public.profil (id, nama, email, peran, wajib_ganti_sandi)
--   select id, 'Admin BPS', email, 'admin', false
--   from auth.users where email = 'admin@contoh.go.id';
--
-- Akun pegawai OPD dibuat dari aplikasi (route handler server memakai service role key):
-- auth.admin.createUser(...) lalu insert ke profil. Trigger langsung membuatkan baris dokumennya.