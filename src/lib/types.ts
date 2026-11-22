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
}

export interface Pengguna {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
  opdId?: string; // hanya untuk peran "operator"
  linkSertifikat?: string;
  wajibGantiSandi?: boolean; // true = sandi awal dari admin belum diganti
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
  // Surat undangan, diisi admin, sama untuk semua OPD
  judulUndangan?: string;
  tanggalUndangan?: string; // ISO yyyy-mm-dd, tanggal surat
  linkUndangan?: string; // link Google Drive
  
}

export interface Dokumen {
  id: string;
  penggunaId?: string;
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
  penggunaId?: string;
  opdId: string;
  sesiId: string;
  status: StatusKehadiran;
  waktuIsi: string; // yyyy-mm-ddTHH:mm (waktu lokal), terisi otomatis saat dikirim
  catatan: string | null; // wajib bila terlambat atau izin
}

export type JenisQuiz = "pretest" | "posttest";

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
  acakSoal?: boolean; // urutan soal diacak per pegawai; kosong dianggap true
}

// Hasil satu OPD, hanya ada setelah jawaban terkirim. Nilai tidak disimpan, dihitung dari jawaban dan kunci
export interface HasilQuiz {
  penggunaId?: string;
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
  penggunaId: string;
  diberikanPada: string; // yyyy-mm-ddTHH:mm
  admin: string;
}

// ---- Sisi pegawai: soal tanpa kunci. Kunci dan pembahasan baru terbaca setelah jawaban terkirim ----

export interface SoalPegawai {
  id: string;
  pertanyaan: string;
  opsi: string[];
}

// Pengerjaan yang sedang berjalan. Waktu mulai dan batas selesai ditentukan server
export interface SesiPegawai {
  mulai: string; // yyyy-mm-ddTHH:mm
  sisaDetik: number; // sisa waktu saat halaman dibuat server
  jawaban: Record<string, number>; // jawaban yang sudah tersimpan (autosave)
  soal: SoalPegawai[]; // sudah dalam urutan yang dilihat pegawai
}

// Nilai tidak disimpan di database, dihitung dari jawaban dan kunci
export interface RingkasanHasil {
  nilai: number;
  benar: number;
  salah: number;
  total: number;
  selesai: string; // yyyy-mm-ddTHH:mm
  otomatis: boolean;
}

export interface ReviewSoal {
  id: string;
  pertanyaan: string;
  opsi: string[];
  kunci: number;
  pembahasan: string;
  pilihan: number | null; // null = tidak dijawab
}

export interface DataQuizPegawai {
  aktif: boolean;
  pengaturan: PengaturanQuiz | undefined;
  jumlahSoal: number; // soal aktif
  diizinkan: boolean; // punya izin kerja ulang dari admin
  hasil: RingkasanHasil | null;
  review: ReviewSoal[] | null; // hanya bila diminta dan hasil sudah ada
  sesi: SesiPegawai | null; // hanya bila diminta dan pegawai sedang mengerjakan
}

export type JenisLogQuiz = "kunci" | "nonaktif" | "aktifkan" | "izin_ulang" | "edit";

export interface LogPerubahanQuiz {
  id: string;
  kegiatanId: string;
  quizId: JenisQuiz;
  jenis: JenisLogQuiz;
  soalId?: string; // untuk kunci, nonaktif, aktifkan
  kunciLama?: number; // hanya untuk jenis "kunci"
  kunciBaru?: number;
  opdId?: string; // lama, tidak dipakai lagi
  penggunaId?: string; // hanya untuk jenis "izin_ulang"
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
 
// Catatan pegawai menandai bab selesai; dipakai admin nanti untuk melihat siapa yang sudah belajar
export interface BabSelesai {
  penggunaId: string;
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

// Satu butir indikator keberhasilan; link dokumennya diisi admin
export interface IndikatorKeberhasilan {
  id: string;
  teks: string;
  linkDokumen: string | null; // link dokumen dari admin, null = belum diisi
}

// Satu baris tabel Monev Indikator Keberhasilan
export interface AspekMonev {
  id: string;
  nama: string;
  kondisiAktual: string;
  kondisiDiharapkan: string;
  indikator: IndikatorKeberhasilan[];
}

// Satu butir output milestone; link dokumennya diisi admin
export interface OutputMilestone {
  id: string;
  teks: string;
  linkDokumen: string | null;
}

// Satu baris tabel Monev Milestone
export interface Milestone {
  id: string;
  tujuan: string;
  jadwal: string;
  output: OutputMilestone[];
}