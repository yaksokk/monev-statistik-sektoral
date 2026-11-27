# Arsip migrasi

Semua perubahan di sini sudah termasuk di `../skema.sql`.
Database baru cukup memakai `skema.sql`, bukan file di folder ini.
File di sini hanya untuk database lama yang sudah berjalan.

Urutan penerapan (nomor kecil lebih dulu):
1. migrasi-item-per-kegiatan.sql (hanya jika item_dokumen belum punya kegiatan_id)
2. migrasi-2b-kegiatan.sql
3. migrasi-3-dokumen.sql
4. migrasi-4-presensi.sql
5. migrasi-5-modul.sql
6. migrasi-7-fungsi-undangan.sql
7. migrasi-8-hapus-undangan-lama.sql

Migrasi 1 dan 6 tidak diarsipkan di sini (migrasi 6 memuat data dan akun, migrasi 1 tidak
tersimpan). Strukturnya ada di skema.sql.