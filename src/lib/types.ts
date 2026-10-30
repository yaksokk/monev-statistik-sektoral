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
  linkSertifikat?: string; // diisi admin, satu link per OPD
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
  kegiatanId: string;
  nama: string;
}

export interface Kegiatan {
  id: string;
  nama: string;
  tanggalMulai: string; // ISO yyyy-mm-dd
  tanggalSelesai: string;
  tenggat: string; // ISO yyyy-mm-dd, batas akhir unggah dokumen
  aktif?: boolean;
  arsip?: boolean; // diarsipkan admin, tidak bisa aktif bersamaan
  bobot: number; // persen, bobot kegiatan terhadap nilai keseluruhan
  ambangKehadiran: number; 
  // Surat undangan, diisi admin, sama untuk semua OPD
  judulUndangan?: string;
  tanggalUndangan?: string; // ISO yyyy-mm-dd, tanggal surat
  linkUndangan?: string; // link Google Drive
  
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

export type StatusKehadiran = "tepat_waktu" | "terlambat" | "izin";

export const STATUS_KEHADIRAN_LABEL: Record<StatusKehadiran, string> = {
  tepat_waktu: "Hadir (Tepat Waktu)",
  terlambat: "Hadir (Terlambat)",
  izin: "Izin Tugas Dinas",
};


export interface SesiPembinaan {
  id: string;
  kegiatanId: string;
  urutan: number; // label urutan pembuatan, bergeser bila ada sesi dihapus
  judul: string;
  waktuBuka: string | null; // yyyy-mm-ddTHH:mm (waktu lokal), null = langsung terbuka
  batasPengisian: string | null; // yyyy-mm-ddTHH:mm (waktu lokal), null = terbuka sampai batas diisi
}

export interface Presensi {
  id: string;
  opdId: string;
  sesiId: string;
  status: StatusKehadiran;
  waktuIsi: string; // yyyy-mm-ddTHH:mm (waktu lokal), terisi otomatis saat dikirim
  catatan: string | null; // wajib bila terlambat atau izin
}

export type AksesQuiz = "belum_dibuka" | "dibuka" | "ditutup";

// Soal pilihan ganda. kunci = indeks opsi yang benar (mulai dari 0)
export interface SoalQuiz {
  id: string;
  pertanyaan: string;
  opsi: string[];
  kunci: number;
  pembahasan: string;
}

// Diatur admin. Durasi dihitung sejak OPD menekan Mulai
export interface PengaturanQuiz {
  id: string;
  judul: string;
  durasiMenit: number;
  batasAkhir: string; // yyyy-mm-ddTHH:mm (waktu lokal), setelah ini tidak bisa dimulai
  akses: AksesQuiz;
}

// Hasil satu OPD, hanya ada setelah jawaban terkirim
export interface HasilQuiz {
  opdId: string;
  quizId: string;
  urutanSoal: string[]; // id soal sesuai urutan yang dilihat OPD
  jawaban: Record<string, number>; // id soal -> indeks opsi; soal tanpa jawaban tidak ada
  mulai: string; // yyyy-mm-ddTHH:mm
  selesai: string; // yyyy-mm-ddTHH:mm
  otomatis: boolean; // true bila terkirim karena waktu habis
}


export interface ModulPembelajaran {
  id: string;
  urutan: number;
  judul: string;
  subjudul: string;
}
 
// Satu bab = satu link materi di Google Drive
export interface BabModul {
  id: string;
  modulId: string;
  urutan: number;
  judul: string;
  linkMateri: string;
  pembinaan: 1 | 2; // bab ini masuk Pembinaan 1 atau 2
}
 
// Catatan OPD menandai bab selesai; dipakai admin nanti untuk melihat siapa yang sudah belajar
export interface BabSelesai {
  opdId: string;
  babId: string;
  selesaiPada: string; // yyyy-mm-ddTHH:mm
}

// Surat undangan, dibuat admin dan dikirim ke OPD terpilih
export interface Undangan {
  id: string;
  judul: string;
  link: string; 
  dikirimPada: string; // yyyy-mm-ddTHH:mm (waktu lokal), terisi otomatis saat dikirim
  opdIds: string[]; // OPD penerima; kosong = belum ada penerima
}