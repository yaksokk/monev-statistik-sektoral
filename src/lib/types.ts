export type Peran = "admin" | "operator";

export type StatusDokumen = "belum" | "menunggu" | "disetujui" | "revisi";

export const STATUS_LABEL: Record<StatusDokumen, string> = {
  belum: "Belum diunggah",
  menunggu: "Menunggu pemeriksaan",
  disetujui: "Disetujui",
  revisi: "Perlu revisi",
};

export interface Opd {
  id: string;
  nama: string;
  singkatan: string;
}

export interface Pengguna {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
  opdId?: string; // hanya untuk peran "operator"
}

// Dokumen yang harus diunggah OPD pada setiap kegiatan
export interface ItemDokumen {
  id: string;
  nama: string;
}

export interface Kegiatan {
  id: string;
  nama: string;
  tanggalMulai: string; // ISO yyyy-mm-dd
  tanggalSelesai: string;
  tenggat: string; // ISO yyyy-mm-dd, batas akhir unggah dokumen
  bobot: number; // persen, bobot kegiatan terhadap nilai keseluruhan
}

export interface Dokumen {
  id: string;
  opdId: string;
  kegiatanId: string;
  itemId: string;
  status: StatusDokumen;
  namaFile: string | null;
  diunggahPada: string | null; // ISO yyyy-mm-dd
  catatanRevisi: string | null;
}

export interface NilaiUjian {
  opdId: string;
  kegiatanId: string;
  nilai: number | null; // null = belum diinput admin
}