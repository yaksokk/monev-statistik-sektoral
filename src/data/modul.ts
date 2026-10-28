import type { BabModul, BabSelesai, ModulPembelajaran } from "@/lib/types";

// Dummy: nanti diisi admin lewat halaman khusus dan dibaca dari database.
// Sementara semua bab memakai link folder Drive; ganti manual per bab dengan link file.
const LINK_SEMENTARA =
  "https://drive.google.com/drive/folders/1vMYIiLaKdp15EMe6HEJ6YAXpd-PzGTo0";

export const MODUL_LIST: ModulPembelajaran[] = [
  {
    id: "modul-1",
    urutan: 1,
    judul: "Satu Data Indonesia",
    subjudul: "Pembinaan Statistik Sektoral Seri EPSS (Badan Pusat Statistik)",
  },
];

export const BAB_LIST: BabModul[] = [
  { id: "m1-b1", modulId: "modul-1", urutan: 1, judul: "Pendahuluan", linkMateri: LINK_SEMENTARA },
  { id: "m1-b2", modulId: "modul-1", urutan: 2, judul: "Satu Data Indonesia (SDI)", linkMateri: LINK_SEMENTARA },
  { id: "m1-b3", modulId: "modul-1", urutan: 3, judul: "Penyelenggara Satu Data Indonesia", linkMateri: LINK_SEMENTARA },
  { id: "m1-b4", modulId: "modul-1", urutan: 4, judul: "Penyelenggaraan SDI & GSBPM", linkMateri: LINK_SEMENTARA },
  { id: "m1-b5", modulId: "modul-1", urutan: 5, judul: "Daftar Data & Data Prioritas", linkMateri: LINK_SEMENTARA },
  { id: "m1-b6", modulId: "modul-1", urutan: 6, judul: "Indikator Kematangan EPSS", linkMateri: LINK_SEMENTARA },
];

// Catatan bab yang sudah ditandai selesai oleh OPD (dasar tampilan admin nanti)
export const BAB_SELESAI_LIST: BabSelesai[] = [
  { opdId: "opd-02", babId: "m1-b1", selesaiPada: "2026-10-26T09:15" },
  { opdId: "opd-02", babId: "m1-b2", selesaiPada: "2026-10-26T10:02" },
  { opdId: "opd-03", babId: "m1-b1", selesaiPada: "2026-10-27T08:40" },
];