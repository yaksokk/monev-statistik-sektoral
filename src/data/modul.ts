import type { BabModul, BabSelesai, ModulPembelajaran } from "@/lib/types";

// Dummy: nanti diisi admin lewat halaman khusus dan dibaca dari database.
// Link per bab: ganti "GANTI_ID_..." dengan ID file Drive masing-masing bab.
const driveFile = (id: string) => `https://drive.google.com/file/d/${id}/view`;

export const MODUL_LIST: ModulPembelajaran[] = [
  {
    id: "modul-1",
    urutan: 1,
    judul: "Satu Data Indonesia",
    subjudul: "Pembinaan Statistik Sektoral Seri EPSS (Badan Pusat Statistik)",
  },
];

export const BAB_LIST: BabModul[] = [
  { id: "m1-b1", modulId: "modul-1", urutan: 1, judul: "Overview", linkMateri: driveFile("1bCBAccTHV4RIEGMoPLkqTCPcQBbYPMjx"), pembinaan: 1 },
  { id: "m1-b2", modulId: "modul-1", urutan: 2, judul: "Prinsip Satu Data Indonesia", linkMateri: driveFile("1B0DYhenvUUS7GasRNPYMIImQsBhEnqc0"), pembinaan: 1 },
  { id: "m1-b3", modulId: "modul-1", urutan: 3, judul: "Kualitas Data", linkMateri: driveFile("1QRPw3ElngxyJ-R2F6o4_9Vqb2InJzYU8"), pembinaan: 1 },
  { id: "m1-b4", modulId: "modul-1", urutan: 4, judul: "Proses Bisnis Statistik", linkMateri: driveFile("1dkBl3jwpd8ifVErLmr3hVe7SAv1Mv4kt"), pembinaan: 2 },
  { id: "m1-b5", modulId: "modul-1", urutan: 5, judul: "Kelembagaan", linkMateri: driveFile("1JD7LLlcYJLM24ZvsokJHNEQVQ2fgnw7t"), pembinaan: 2 },
  { id: "m1-b6", modulId: "modul-1", urutan: 6, judul: "Statistik Nasional", linkMateri: driveFile("1mz1UTSRgAvdTU_1LB2TGkD0lWPaaqC60"), pembinaan: 2 },
];

// Catatan bab yang sudah ditandai selesai oleh OPD (dasar tampilan admin nanti)
export const BAB_SELESAI_LIST: BabSelesai[] = [
  { opdId: "opd-02", babId: "m1-b1", selesaiPada: "2026-10-26T09:15" },
  { opdId: "opd-02", babId: "m1-b2", selesaiPada: "2026-10-26T10:02" },
  { opdId: "opd-03", babId: "m1-b1", selesaiPada: "2026-10-27T08:40" },
];