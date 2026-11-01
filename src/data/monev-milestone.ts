import type { Milestone } from "@/lib/types";

export const MILESTONE_LIST: Milestone[] = [
  {
    id: "milestone-1",
    tujuan: "Jangka Pendek",
    jadwal: "November 2026 – Minggu I Januari 2027",
    output: [
      { id: "out-1", teks: "Kesepakatan Bersama" },
      { id: "out-2", teks: "SK Tim LO/Agen Statistik" },
      { id: "out-3", teks: "30 OPD terpetakan" },
      { id: "out-4", teks: "Minimal 50% OPD mengikuti pembinaan" },
      { id: "out-5", teks: "Kelengkapan bukti pembinaan termonitor" },
      { id: "out-6", teks: "Materi dan bukti dukung tersedia" },
      { id: "out-7", teks: "Pemanfaatan Teknologi Informasi" },
    ],
  },
  {
    id: "milestone-2",
    tujuan: "Jangka Menengah",
    jadwal: "Minggu I Januari – Minggu IV April 2027",
    output: [
      {
        id: "out-8",
        teks: "Hasil Implementasi Metadata dan Romantik 2 OPD yang akan dievaluasi tersedia",
      },
      { id: "out-9", teks: "MOOC untuk Keberlanjutan pembelajaran mandiri" },
      { id: "out-10", teks: "Keterlibatan pimpinan daerah pada e-learning Pusdiklat" },
    ],
  },
  {
    id: "milestone-3",
    tujuan: "Jangka Panjang",
    jadwal: "Mei – Desember 2027",
    output: [
      {
        id: "out-11",
        teks: "Terwujudnya penyelenggaraan Sistem Statistik Nasional (SSN) yang terpadu di Kabupaten Minahasa Tenggara dan tercapainya Nilai Indeks Pembangunan Statistik",
      },
    ],
  },
];