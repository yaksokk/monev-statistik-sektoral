import type { AspekMonev } from "@/lib/types";

export const ASPEK_MONEV_LIST: AspekMonev[] = [
  {
    id: "aspek-1",
    nama: "Cakupan pembinaan OPD",
    kondisiAktual:
      "4 dari 30 OPD atau 13,33 % memperoleh pembinaan; dengan pola lama dibutuhkan sekitar 13–14 tahun untuk menjangkau seluruh OPD.",
    kondisiDiharapkan:
      "Minimal 50% OPD memperoleh pembinaan dan penyegaran materi secara berkala sehingga OPD terpetakan.",
    indikator: [
      {
        id: "ind-1",
        teks: "30 OPD terpetakan dan minimal 50% OPD memperoleh pembinaan melalui moda luring dan daring (Jangka Pendek).",
      },
      {
        id: "ind-2",
        teks: "Metadata 2 OPD yang akan dievaluasi tersedia dan terverifikasi (Jangka Menengah).",
      },
    ],
  },
  {
    id: "aspek-2",
    nama: "Jejaring dan tata kelola kolaborasi",
    kondisiAktual:
      "Hubungan BPS–Bappeda–Diskominfo–OPD masih parsial, insidental, dan cenderung transaksional saat terdapat kebutuhan data.",
    kondisiDiharapkan: "Jejaring kelembagaan mempunyai komitmen bersama.",
    indikator: [
      {
        id: "ind-3",
        teks: "1 dokumen komitmen bersama tersedia dan terdokumentasi (Jangka Pendek).",
      },
      {
        id: "ind-4",
        teks: "IPS Kabupaten Minahasa Tenggara mencapai nilai di atas 3,00 dengan predikat minimal Baik (Jangka Panjang).",
      },
    ],
  },
  {
    id: "aspek-3",
    nama: "Kapasitas SDM dan keberlanjutan pengetahuan",
    kondisiAktual:
      "Literasi statistik, pemahaman metadata, standar data, dan manajemen kualitas belum merata; rotasi pegawai menimbulkan talent gap dan kehilangan pengetahuan.",
    kondisiDiharapkan:
      "Setiap OPD memiliki LO/Agen Statistik kompeten dan pengetahuan tersimpan dalam repositori organisasi, bukan hanya pada individu.",
    indikator: [
      {
        id: "ind-5",
        teks: "1 SK Tim LO/Agen Statistik, 1 portal repositori digital, dan keterlibatan lebih dari 1 tim kerja tersedia (Jangka Pendek).",
      },
      {
        id: "ind-6",
        teks: "Hasil post-test meningkat dibandingkan pre-test (Jangka Pendek).",
      },
      {
        id: "ind-7",
        teks: "LO/Agen Statistik mengikuti dan menyelesaikan MOOC dengan bukti sertifikat atau rekam penyelesaian (Jangka Menengah).",
      },
    ],
  },
  {
    id: "aspek-4",
    nama: "Budaya kerja kolaboratif dan digital",
    kondisiAktual:
      "Pola kerja masih silo-centric; pemanfaatan kanal digital dan manajemen pengetahuan belum terintegrasi.",
    kondisiDiharapkan:
      "Budaya kerja adaptif, berbasis bukti, dan kolaboratif dengan dukungan digital.",
    indikator: [
      {
        id: "ind-8",
        teks: "1 dashboard monitoring dan evaluasi serta 1 portal repositori digital tersedia dan digunakan (Jangka Pendek).",
      },
      {
        id: "ind-9",
        teks: "1 dokumen pembinaan tercatat pada SPESIAL dan SIMBATIK serta tindak lanjut monitoring terdokumentasi (Jangka Menengah).",
      },
    ],
  },
];