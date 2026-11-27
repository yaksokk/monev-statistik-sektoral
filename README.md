# Monev Statistik Sektoral

Aplikasi web monitoring dan evaluasi (monev) Statistik Sektoral untuk BPS Kabupaten Minahasa Tenggara. Dipakai memantau kelengkapan dokumen, kehadiran, modul pembelajaran, dan hasil Pre-Test/Post-Test OPD peserta pembinaan.

## Fitur

### Admin (BPS)
- Dashboard ringkasan dan rekap per OPD
- Kelola OPD dan akun pegawai (buat akun, reset kata sandi, hapus)
- Kelola kegiatan dan item dokumen
- Kelola Daftar Hadir (sesi, batas waktu, rekap kehadiran)
- Kelola Modul dan bab (materi lewat link Google Drive) beserta pantauan penyelesaian
- Kelola Quiz (soal, kunci jawaban, waktu, izin kerja ulang)
- Undangan ke OPD terpilih atau semua OPD
- Monev Indikator Keberhasilan dan Monev Milestone

### Operator OPD
- Dashboard: status kelulusan, undangan, tombol sertifikat
- Daftar Dokumen: lihat status dan unggah dokumen (PDF/JPG/PNG, maks. 2 MB)
- Daftar Hadir per sesi
- Pembinaan 1 dan Pembinaan 2: modul pembelajaran, Pre-Test, Post-Test
- Wajib ganti kata sandi pada login pertama

## Teknologi

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- React
- Tailwind CSS v4
- [Supabase](https://supabase.com/) (Auth, Postgres dengan RLS, Storage)
- lucide-react

## Peran

| Peran | Keterangan |
| --- | --- |
| Admin | Mengelola seluruh data dan akun. Pimpinan memakai akun admin. |
| Operator OPD | Hanya mengakses data miliknya sendiri. |

Akun operator dibuat oleh admin; kata sandi awal diketik admin dan wajib diganti saat login pertama.

## Menjalankan di Lokal

Prasyarat: Node.js dan proyek Supabase yang sudah berisi skema.

```bash
git clone <url-repository>
cd monev-statistik-sektoral
npm install
```

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Catatan:
- `NEXT_PUBLIC_SUPABASE_URL` diisi tanpa `/rest/v1/`.
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server. Jangan dimasukkan ke kode klien atau repository.
- Pastikan `.env*` ada di `.gitignore`.

Jalankan:

```bash
npm run dev
```

Buka http://localhost:3000.

## Database

Skema dan migrasi ada di folder `supabase/`. Jalankan di SQL Editor Supabase sesuai urutan:

1. `skema.sql`
2. Data awal
3. File migrasi bernomor (`migrasi-*.sql`) secara berurutan

Semua tabel memakai Row Level Security. Dokumen disimpan di bucket privat `dokumen-opd` dan dibuka lewat signed URL.

Profil admin pertama dibuat manual di Supabase (Auth, lalu baris di tabel `profil`).

## Struktur Folder (ringkas)

```
src/
  app/
    admin/        halaman admin
    opd/          halaman operator OPD
    api/admin/    route handler akun pegawai (service role)
  components/     layout dan komponen UI
  lib/            akses data, helper, dan fungsi bersama
supabase/         skema dan migrasi SQL
```

## Keamanan

- Repository ini publik: jangan commit kunci atau data sensitif.
- Pembuatan akun, reset kata sandi, dan hapus akun lewat route handler server dengan service role; setiap handler memeriksa bahwa pemanggil adalah admin.
- Operator hanya dapat membaca dan mengubah data miliknya lewat RLS.

## Lisensi

Dikembangkan sebagai bagian dari kegiatan magang di BPS Kabupaten Minahasa Tenggara.