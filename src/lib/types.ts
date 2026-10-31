export type Peran = "admin" | "operator";

export type StatusDokumen = "belum" | "disetujui";

export const STATUS_LABEL: Record<StatusDokumen, string> = {
  belum: "Belum",
  disetujui: "Disetujui",
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
  // Saklar quiz per kegiatan. Kosong dianggap aktif; terkunci bila kegiatan diarsipkan
  preTestAktif?: boolean;
  postTestAktif?: boolean;
  evaluasiAktif?: boolean;
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

export type JenisQuiz = "pretest" | "posttest" | "evaluasi";

// Soal pilihan ganda milik satu quiz pada satu kegiatan. kunci = indeks opsi yang benar (mulai dari 0)
export interface SoalQuiz {
  id: string;
  kegiatanId: string;
  quizId: JenisQuiz;
  urutan: number; // urutan tampil di admin; OPD melihat urutan acak
  pertanyaan: string;
  opsi: string[];
  kunci: number;
  pembahasan: string; // kosong = bagian pembahasan tidak tampil
  aktif: boolean; // false = tidak dihitung dalam nilai, tapi tetap tercatat
}

// Diatur admin per kegiatan. Status quiz diturunkan dari dua waktu di bawah
export interface PengaturanQuiz {
  id: JenisQuiz;
  kegiatanId: string;
  judul: string;
  durasiMenit: number;
  waktuBuka: string | null; // yyyy-mm-ddTHH:mm (waktu lokal), null = belum dibuka
  batasAkhir: string | null; // yyyy-mm-ddTHH:mm (waktu lokal), null = tanpa batas; memotong waktu pengerjaan
  hanyaBerizin?: boolean; // true setelah batas akhir pertama lewat: hanya OPD berizin yang boleh mulai
}

// Hasil satu OPD, hanya ada setelah jawaban terkirim. Nilai tidak disimpan, dihitung dari jawaban dan kunci
export interface HasilQuiz {
  opdId: string;
  kegiatanId: string;
  quizId: JenisQuiz;
  urutanSoal: string[]; // id soal sesuai urutan yang dilihat OPD
  jawaban: Record<string, number>; // id soal -> indeks opsi; soal tanpa jawaban tidak ada
  mulai: string; // yyyy-mm-ddTHH:mm
  selesai: string; // yyyy-mm-ddTHH:mm
  otomatis: boolean; // true bila terkirim karena waktu habis
}

// Izin admin agar OPD mengerjakan ulang; hasil lama OPD itu dihapus saat izin diberikan
export interface IzinKerjaUlang {
  kegiatanId: string;
  quizId: JenisQuiz;
  opdId: string;
  diberikanPada: string; // yyyy-mm-ddTHH:mm
  admin: string;
}

export type JenisLogQuiz = "kunci" | "nonaktif" | "aktifkan" | "izin_ulang";

export interface LogPerubahanQuiz {
  id: string;
  kegiatanId: string;
  quizId: JenisQuiz;
  jenis: JenisLogQuiz;
  soalId?: string; // untuk kunci, nonaktif, aktifkan
  kunciLama?: number; // hanya untuk jenis "kunci"
  kunciBaru?: number;
  opdId?: string; // hanya untuk jenis "izin_ulang"
  admin: string;
  waktu: string; // yyyy-mm-ddTHH:mm
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