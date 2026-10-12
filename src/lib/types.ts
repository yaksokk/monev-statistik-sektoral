export type Peran = "admin" | "operator" | "pimpinan";

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

export interface Tahap {
  id: string;
  urutan: 1 | 2 | 3;
  nama: string;
  bobot: number; // persen
}

export interface ItemTahap {
  id: string;
  tahapId: string;
  nama: string;
}

export interface Kegiatan {
  id: string;
  nama: string;
  tanggalMulai: string; // ISO yyyy-mm-dd
  tanggalSelesai: string;
  tenggat: Record<string, string>; // tahapId -> tanggal tenggat
}

export interface Dokumen {
  id: string;
  opdId: string;
  kegiatanId: string;
  tahapId: string;
  itemId: string;
  status: StatusDokumen;
  namaFile: string | null;
  diunggahPada: string | null; // ISO yyyy-mm-dd
  catatanRevisi: string | null;
}

export interface NilaiUjian {
  opdId: string;
  tahapId: string;
  nilai: number | null; // null = belum diinput admin
}
