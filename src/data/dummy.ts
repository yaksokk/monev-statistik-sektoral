import type {
  Dokumen,
  HasilQuiz,
  IzinKerjaUlang,
  ItemDokumen,
  JenisQuiz,
  Kegiatan,
  LogPerubahanQuiz,
  NilaiUjian,
  Opd,
  PengaturanQuiz,
  Presensi,
  Pengguna,
  SesiPembinaan,
  SoalQuiz,
  StatusDokumen,
  Undangan,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Master data                                                         */
/* Semua data di file ini DUMMY. Ganti dengan data asli dari backend. */
/* ------------------------------------------------------------------ */
// Dummy: satu link contoh untuk semua OPD. Nanti admin mengisi link per OPD
const LINK_SERTIFIKAT_CONTOH =
  "https://drive.google.com/drive/folders/1vMYIiLaKdp15EMe6HEJ6YAXpd-PzGTo0";
  
export const OPD_LIST: Opd[] = [
  { id: "opd-01", nama: "Dinas Pendidikan dan Kebudayaan", singkatan: "Disdikbud" },
  { id: "opd-02", nama: "Dinas Kesehatan", singkatan: "Dinkes" },
  { id: "opd-03", nama: "Dinas Pertanian", singkatan: "Distan" },
  { id: "opd-04", nama: "Dinas Perikanan dan Kelautan", singkatan: "DKP" },
  { id: "opd-05", nama: "Dinas Sosial", singkatan: "Dinsos" },
  { id: "opd-06", nama: "Dinas Pariwisata", singkatan: "Dispar" },
  { id: "opd-07", nama: "Dinas Komunikasi dan Informatika", singkatan: "Diskominfo" },
  { id: "opd-08", nama: "Dinas Kependudukan dan Pencatatan Sipil", singkatan: "Disdukcapil" },
].map((opd) => ({ ...opd, linkSertifikat: LINK_SERTIFIKAT_CONTOH }));

// Dokumen yang harus diunggah OPD, berbeda per kegiatan:
// kegiatan 1 = 9 dokumen, kegiatan 2 = 3, kegiatan 3 = 2.
// Item 7–10 masih nama sementara.
export const ITEM_LIST: ItemDokumen[] = [
  { id: "item-01", kegiatanId: "kegiatan-1", nama: "Metadata" },
  { id: "item-02", kegiatanId: "kegiatan-1", nama: "Romantik" },
  { id: "item-03", kegiatanId: "kegiatan-1", nama: "Dokumentasi" },

];

export const KEGIATAN_LIST: Kegiatan[] = [
  {
    aktif: true,
    id: "kegiatan-1",
    nama: "Kegiatan Statistik Sektoral 1",
    tanggalMulai: "2026-10-01",
    tanggalSelesai: "2026-10-31",
    tenggat: "2026-10-30",
    bobot: 40,
    ambangKehadiran: 75,
    judulUndangan: "Undangan Pembinaan Statistik Sektoral",
    tanggalUndangan: "2026-10-01",
    linkUndangan: LINK_SERTIFIKAT_CONTOH, // hanya data dummy
  },
  {
    id: "kegiatan-2",
    nama: "Kegiatan Statistik Sektoral 2",
    tanggalMulai: "2026-11-01",
    tanggalSelesai: "2026-11-30",
    tenggat: "2026-11-30",
    bobot: 30,
    ambangKehadiran: 70,
  },
  {
    id: "kegiatan-3",
    nama: "Kegiatan Statistik Sektoral 3",
    tanggalMulai: "2026-12-01",
    tanggalSelesai: "2026-12-19",
    tenggat: "2026-12-19",
    bobot: 30,
    ambangKehadiran: 75,
    arsip: true,
  },
];

export const PENGGUNA_LIST: Pengguna[] = [
  { id: "usr-admin", nama: "Admin BPS", email: "admin@example.com", peran: "admin" },
  ...OPD_LIST.map<Pengguna>((opd, i) => ({
    id: `usr-op-${String(i + 1).padStart(2, "0")}`,
    nama: `Operator ${opd.singkatan}`,
    email: `operator.${opd.singkatan.toLowerCase()}@example.com`,
    peran: "operator",
    opdId: opd.id,
  })),
];

/* ------------------------------------------------------------------ */
/* Dokumen dummy (dibangkitkan deterministik, aman untuk SSR/hydration) */
/* ------------------------------------------------------------------ */

// Pseudo-random dengan seed tetap, supaya hasil sama di server dan client.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seberapa rajin tiap OPD (urut sesuai OPD_LIST) -> variasi tampilan
const PROFIL_OPD = [0.95, 0.85, 0.75, 0.65, 0.55, 0.4, 0.25, 0.1];
// Kegiatan yang lebih jauh = lebih sedikit yang sudah terisi
const FAKTOR_KEGIATAN = [1, 0.6, 0.25];

const rand = mulberry32(2026);

export const DOKUMEN_LIST: Dokumen[] = OPD_LIST.flatMap((opd, o) =>
  KEGIATAN_LIST.flatMap((kegiatan, k) =>
    ITEM_LIST.filter((i) => i.kegiatanId === kegiatan.id).map<Dokumen>((item) => {
      const peluangTerisi = PROFIL_OPD[o] * FAKTOR_KEGIATAN[k];

      let status: StatusDokumen = "belum";
      if (rand() < peluangTerisi) status = "disetujui";

      const sudahUnggah = status !== "belum";
      const hari = String(1 + Math.floor(rand() * 10)).padStart(2, "0");

      return {
        id: `dok-${opd.id}-${kegiatan.id}-${item.id}`,
        opdId: opd.id,
        kegiatanId: kegiatan.id,
        itemId: item.id,
        status,
        namaFile: sudahUnggah ? `${opd.singkatan.toLowerCase()}-${item.id}.pdf` : null,
        diunggahPada: sudahUnggah ? `${kegiatan.tanggalMulai.slice(0, 8)}${hari}` : null,
      };
    }),
  ),
);

/* ------------------------------------------------------------------ */
/* Nilai ujian dummy (diinput admin, per OPD per kegiatan)             */
/* ------------------------------------------------------------------ */

// OPD yang cukup rajin sudah punya nilai ujian; sisanya null (belum diinput)
const AMBANG_NILAI = [0.25, 0.55, 0.75];

export const NILAI_UJIAN_LIST: NilaiUjian[] = OPD_LIST.flatMap((opd, o) =>
  KEGIATAN_LIST.map<NilaiUjian>((kegiatan, k) => ({
    opdId: opd.id,
    kegiatanId: kegiatan.id,
    nilai: PROFIL_OPD[o] >= AMBANG_NILAI[k] ? Math.round(65 + rand() * 33) : null,
  })),
);

/* ------------------------------------------------------------------ */
/* Sesi pembinaan dan presensi dummy                                   */
/* ------------------------------------------------------------------ */

export const SESI_LIST: SesiPembinaan[] = [
  // kegiatan-1 (aktif): dua ditutup, satu terbuka, satu belum dibuka
  {
    id: "sesi-1",
    kegiatanId: "kegiatan-1",
    urutan: 1,
    judul: "Prinsip & Pengertian Satu Data Indonesia",
    waktuBuka: "2026-10-08T08:00",
    batasPengisian: "2026-10-09T17:00",
  },
  {
    id: "sesi-2",
    kegiatanId: "kegiatan-1",
    urutan: 2,
    judul: "Penyelenggara SDI Pusat & Daerah",
    waktuBuka: "2026-10-15T08:00",
    batasPengisian: "2026-10-16T17:00",
  },
  {
    id: "sesi-3",
    kegiatanId: "kegiatan-1",
    urutan: 3,
    judul: "Tahapan Penyelenggaraan SDI & GSBPM",
    waktuBuka: "2026-10-27T08:00",
    batasPengisian: "2026-11-04T17:00",
  },
  {
    id: "sesi-4",
    kegiatanId: "kegiatan-1",
    urutan: 4,
    judul: "Penyusunan Data Prioritas & EPSS",
    waktuBuka: "2026-11-06T08:00",
    batasPengisian: "2026-11-07T17:00",
  },
  // kegiatan-2: sesi-5 tanpa waktu sama sekali (langsung terbuka, tanpa batas)
  {
    id: "sesi-5",
    kegiatanId: "kegiatan-2",
    urutan: 1,
    judul: "Pengantar Metadata Statistik Sektoral",
    waktuBuka: null,
    batasPengisian: null,
  },
  {
    id: "sesi-6",
    kegiatanId: "kegiatan-2",
    urutan: 2,
    judul: "Penyusunan Metadata",
    waktuBuka: "2026-11-10T08:00",
    batasPengisian: "2026-11-11T17:00",
  },
  // kegiatan-3 (arsip)
  {
    id: "sesi-7",
    kegiatanId: "kegiatan-3",
    urutan: 1,
    judul: "Evaluasi Data Sektoral",
    waktuBuka: "2026-12-03T08:00",
    batasPengisian: "2026-12-04T17:00",
  },
  {
    id: "sesi-8",
    kegiatanId: "kegiatan-3",
    urutan: 2,
    judul: "Penyajian dan Diseminasi Data",
    waktuBuka: "2026-12-10T08:00",
    batasPengisian: "2026-12-11T17:00",
  },
];

export const PRESENSI_LIST: Presensi[] = [
  { id: "hadir-opd-01-sesi-1", opdId: "opd-01", sesiId: "sesi-1", status: "tepat_waktu", waktuIsi: "2026-10-08T08:30", catatan: "Mengikuti via Zoom" },
  { id: "hadir-opd-02-sesi-1", opdId: "opd-02", sesiId: "sesi-1", status: "terlambat", waktuIsi: "2026-10-08T09:15", catatan: "Bergabung terlambat karena rapat internal" },
  { id: "hadir-opd-02-sesi-2", opdId: "opd-02", sesiId: "sesi-2", status: "izin", waktuIsi: "2026-10-15T07:50", catatan: "Tugas dinas ke luar kota" },
  { id: "hadir-opd-03-sesi-1", opdId: "opd-03", sesiId: "sesi-1", status: "tepat_waktu", waktuIsi: "2026-10-08T08:41", catatan: null },
  { id: "hadir-opd-03-sesi-2", opdId: "opd-03", sesiId: "sesi-2", status: "tepat_waktu", waktuIsi: "2026-10-15T08:35", catatan: "Diskusi forum" },
  { id: "hadir-opd-04-sesi-1", opdId: "opd-04", sesiId: "sesi-1", status: "tepat_waktu", waktuIsi: "2026-10-08T08:28", catatan: null },
  { id: "hadir-opd-05-sesi-1", opdId: "opd-05", sesiId: "sesi-1", status: "terlambat", waktuIsi: "2026-10-08T09:40", catatan: "Kendala jaringan" },
  { id: "hadir-opd-06-sesi-3", opdId: "opd-06", sesiId: "sesi-3", status: "tepat_waktu", waktuIsi: "2026-10-27T08:45", catatan: null },
  // kegiatan-2
  { id: "hadir-opd-01-sesi-5", opdId: "opd-01", sesiId: "sesi-5", status: "tepat_waktu", waktuIsi: "2026-11-02T08:20", catatan: null },
  // kegiatan-3 (arsip)
  { id: "hadir-opd-01-sesi-7", opdId: "opd-01", sesiId: "sesi-7", status: "tepat_waktu", waktuIsi: "2026-12-03T08:25", catatan: null },
  { id: "hadir-opd-02-sesi-7", opdId: "opd-02", sesiId: "sesi-7", status: "izin", waktuIsi: "2026-12-03T07:55", catatan: "Tugas dinas" },
  { id: "hadir-opd-01-sesi-8", opdId: "opd-01", sesiId: "sesi-8", status: "terlambat", waktuIsi: "2026-12-10T09:30", catatan: "Kendala jaringan" },
];


/* ------------------------------------------------------------------ */
/* Pre-Test dummy                                                      */
/* ------------------------------------------------------------------ */

// Soal dasar yang dipakai ketiga quiz kegiatan-1 (dummy); id diberi awalan per quiz di bawah
const SOAL_DASAR: Pick<SoalQuiz, "id" | "pertanyaan" | "opsi" | "kunci" | "pembahasan">[] = [
  {
    id: "pt-01",
    pertanyaan:
      "Sesuai Perpres No. 39 Tahun 2019, jenis data yang dicakup di dalam Satu Data Indonesia (SDI) meliputi berikut, KECUALI...",
    opsi: [
      "Data Statistik & Data Geospasial",
      "Data Keuangan Negara Tingkat Pusat",
      "Data Transaksi Rahasia Perbankan Swasta",
      "Data lain untuk perencanaan pembangunan",
    ],
    kunci: 2,
    pembahasan:
      "SDI mencakup data yang diselenggarakan instansi pusat dan daerah, yaitu data statistik, data geospasial, dan data lain untuk perencanaan pembangunan. Data transaksi rahasia perbankan swasta berada di luar cakupan itu.",
  },
  {
    id: "pt-02",
    pertanyaan: "Empat prinsip utama pelaksanaan Kebijakan Satu Data Indonesia adalah...",
    opsi: [
      "Standar Data, Metadata, Interoperabilitas Data, Kode Referensi/Data Induk",
      "Transparansi, Akuntabilitas, Kecepatan, Kerahasiaan",
      "Pengumpulan, Pemeriksaan, Pengolahan, Diseminasi",
      "Validitas, Reliabilitas, Akurasi, Kemutakhiran",
    ],
    kunci: 0,
    pembahasan:
      "Prinsip SDI adalah standar data, metadata, interoperabilitas data, serta kode referensi dan data induk. Opsi lain adalah kumpulan istilah umum yang bukan prinsip SDI.",
  },
  {
    id: "pt-03",
    pertanyaan:
      "Lembaga/Instansi yang bertindak sebagai Pembina Data Statistik Tingkat Pusat dalam SDI adalah...",
    opsi: [
      "Kementerian Komunikasi dan Informatika",
      "Badan Informasi Geospasial (BIG)",
      "Badan Pusat Statistik (BPS)",
      "Kementerian PPN / Bappenas",
    ],
    kunci: 2,
    pembahasan:
      "BPS adalah Pembina Data Statistik tingkat pusat, sedangkan BIG adalah Pembina Data Geospasial.",
  },
  {
    id: "pt-04",
    pertanyaan:
      "Unit kerja pada instansi pemerintah yang bertugas mengumpulkan, memeriksa kesesuaian data, mengelola, dan menyebarluaskan data dari Produsen Data disebut...",
    opsi: ["Dewan Pengarah", "Walidata", "Pembina Data", "Sekretariat SDI"],
    kunci: 1,
    pembahasan:
      "Walidata adalah unit kerja yang mengumpulkan, memeriksa, mengelola, dan menyebarluaskan data yang disampaikan Produsen Data. Pembina Data bertugas membina dan menetapkan standar, bukan mengelola data dari produsen.",
  },
  {
    id: "pt-05",
    pertanyaan: "Manakah urutan tahapan Penyelenggaraan Satu Data Indonesia yang tepat?",
    opsi: [
      "Pengumpulan Data -> Perencanaan Data -> Pemeriksaan Data -> Penyebarluasan Data",
      "Perencanaan Data -> Pengumpulan Data -> Pemeriksaan Data -> Penyebarluasan Data",
      "Pemeriksaan Data -> Perencanaan Data -> Pengumpulan Data -> Penyebarluasan Data",
      "Perencanaan Data -> Pemeriksaan Data -> Pengumpulan Data -> Penyebarluasan Data",
    ],
    kunci: 1,
    pembahasan:
      "Urutannya perencanaan, pengumpulan, pemeriksaan, lalu penyebarluasan data. Data harus direncanakan dan dikumpulkan dulu sebelum bisa diperiksa dan disebarluaskan.",
  },
  {
    id: "pt-06",
    pertanyaan:
      "Kerangka kerja internasional yang digunakan BPS untuk memetakan tahapan bisnis kegiatan statistik dengan SDI adalah...",
    opsi: [
      "SDMX (Statistical Data and Metadata Exchange)",
      "GSBPM (Generic Statistical Business Process Model)",
      "TOGAF (The Open Group Architecture Framework)",
      "DAMA-DMBOK",
    ],
    kunci: 1,
    pembahasan:
      "GSBPM memetakan tahapan proses bisnis kegiatan statistik, dari kebutuhan data sampai evaluasi. SDMX adalah standar pertukaran data dan metadata, bukan model proses bisnis.",
  },
  {
    id: "pt-07",
    pertanyaan:
      "Menteri yang berwenang menetapkan Daftar Data Prioritas tingkat pusat melalui Keputusan Menteri adalah...",
    opsi: [
      "Menteri Dalam Negeri",
      "Menteri PPN / Kepala Bappenas",
      "Menteri Komunikasi dan Informatika",
      "Kepala BPS",
    ],
    kunci: 1,
    pembahasan:
      "Daftar Data Prioritas tingkat pusat ditetapkan oleh Menteri yang membidangi perencanaan pembangunan nasional, yaitu Menteri PPN/Kepala Bappenas.",
  },
  {
    id: "pt-08",
    pertanyaan:
      "Kemampuan data untuk dibagipakaikan antar sistem elektronik yang saling berinteraksi secara konsisten disebut...",
    opsi: [
      "Standardisasi Data",
      "Interoperabilitas Data",
      "Metadata Statistik",
      "Bridging Wilkerstat",
    ],
    kunci: 1,
    pembahasan:
      "Interoperabilitas data adalah kemampuan data dibagipakaikan antar sistem elektronik yang saling berinteraksi.",
  },
];

const AWALAN_SOAL: Record<JenisQuiz, string> = {
  pretest: "pt-",
  posttest: "po-",
  evaluasi: "ev-",
};

function buatSoal(quizId: JenisQuiz): SoalQuiz[] {
  return SOAL_DASAR.map((s, i) => ({
    ...s,
    id: s.id.replace("pt-", AWALAN_SOAL[quizId]),
    kegiatanId: "kegiatan-1",
    quizId,
    urutan: i + 1,
    aktif: true,
  }));
}

export const SOAL_QUIZ_LIST: SoalQuiz[] = [
  ...buatSoal("pretest"),
  ...buatSoal("posttest"),
  ...buatSoal("evaluasi"),
];

export const PENGATURAN_QUIZ_LIST: PengaturanQuiz[] = [
  {
    id: "pretest",
    kegiatanId: "kegiatan-1",
    judul: "Pre-Test Pembinaan Satu Data Indonesia",
    durasiMenit: 15,
    waktuBuka: "2026-10-26T08:00",
    batasAkhir: "2026-10-31T17:00",
  },
  {
    id: "posttest",
    kegiatanId: "kegiatan-1",
    judul: "Post-Test Pembinaan Satu Data Indonesia",
    durasiMenit: 15,
    waktuBuka: "2026-10-27T08:00",
    batasAkhir: "2026-11-07T17:00",
  },
  {
    id: "evaluasi",
    kegiatanId: "kegiatan-1",
    judul: "Evaluasi Pendalaman Pembinaan Satu Data Indonesia",
    durasiMenit: 15,
    waktuBuka: "2026-10-27T08:00",
    batasAkhir: "2026-11-14T17:00",
  },
];

// Hasil contoh Pre-Test: Dinkes selesai tepat waktu, Distan terkirim otomatis dengan jawaban belum lengkap
const HASIL_DASAR: Omit<HasilQuiz, "kegiatanId">[] = [
  {
    opdId: "opd-02",
    quizId: "pretest",
    urutanSoal: ["pt-05", "pt-02", "pt-08", "pt-01", "pt-07", "pt-03", "pt-06", "pt-04"],
    jawaban: { "pt-01": 1, "pt-02": 0, "pt-03": 2, "pt-04": 1, "pt-05": 1, "pt-06": 0, "pt-07": 1, "pt-08": 1 },
    mulai: "2026-10-26T09:00",
    selesai: "2026-10-26T09:11",
    otomatis: false,
  },
  {
    opdId: "opd-03",
    quizId: "pretest",
    urutanSoal: ["pt-02", "pt-01", "pt-04", "pt-03", "pt-05", "pt-06", "pt-07", "pt-08"],
    jawaban: { "pt-01": 2, "pt-02": 0, "pt-03": 0, "pt-04": 1, "pt-05": 1 },
    mulai: "2026-10-26T13:00",
    selesai: "2026-10-26T13:15",
    otomatis: true,
  },
  // Hasil contoh Post-Test: hanya Dinkes yang sudah selesai
  {
    opdId: "opd-02",
    quizId: "posttest",
    urutanSoal: ["pt-04", "pt-07", "pt-01", "pt-06", "pt-03", "pt-08", "pt-02", "pt-05"],
    jawaban: { "pt-01": 2, "pt-02": 0, "pt-03": 2, "pt-04": 1, "pt-05": 1, "pt-06": 1, "pt-07": 0, "pt-08": 1 },
    mulai: "2026-10-27T10:00",
    selesai: "2026-10-27T10:09",
    otomatis: false,
  },
  // DKP dan Dinsos sudah menyelesaikan Pre-Test dan Post-Test, Evaluasi Pendalaman bisa dicoba
  {
    opdId: "opd-04",
    quizId: "pretest",
    urutanSoal: ["pt-01", "pt-02", "pt-03", "pt-04", "pt-05", "pt-06", "pt-07", "pt-08"],
    jawaban: { "pt-01": 0, "pt-02": 0, "pt-03": 2, "pt-04": 1, "pt-05": 1, "pt-06": 1, "pt-07": 1, "pt-08": 1 },
    mulai: "2026-10-26T14:00",
    selesai: "2026-10-26T14:12",
    otomatis: false,
  },
  {
    opdId: "opd-04",
    quizId: "posttest",
    urutanSoal: ["pt-01", "pt-02", "pt-03", "pt-04", "pt-05", "pt-06", "pt-07", "pt-08"],
    jawaban: { "pt-01": 2, "pt-02": 0, "pt-03": 2, "pt-04": 1, "pt-05": 1, "pt-06": 1, "pt-07": 1, "pt-08": 1 },
    mulai: "2026-10-27T11:00",
    selesai: "2026-10-27T11:10",
    otomatis: false,
  },
  {
    opdId: "opd-05",
    quizId: "pretest",
    urutanSoal: ["pt-01", "pt-02", "pt-03", "pt-04", "pt-05", "pt-06", "pt-07", "pt-08"],
    jawaban: { "pt-01": 2, "pt-02": 1, "pt-03": 2, "pt-04": 0, "pt-05": 1, "pt-06": 0, "pt-07": 1, "pt-08": 1 },
    mulai: "2026-10-26T15:00",
    selesai: "2026-10-26T15:13",
    otomatis: false,
  },
  {
    opdId: "opd-05",
    quizId: "posttest",
    urutanSoal: ["pt-01", "pt-02", "pt-03", "pt-04", "pt-05", "pt-06", "pt-07", "pt-08"],
    jawaban: { "pt-01": 2, "pt-02": 0, "pt-03": 2, "pt-04": 1, "pt-05": 1, "pt-06": 0, "pt-07": 0, "pt-08": 1 },
    mulai: "2026-10-27T12:00",
    selesai: "2026-10-27T12:11",
    otomatis: false,
  },
  // Hasil contoh Evaluasi Pendalaman: hanya Dinkes yang sudah selesai (DKP dan Dinsos belum)
  {
    opdId: "opd-02",
    quizId: "evaluasi",
    urutanSoal: ["pt-08", "pt-03", "pt-06", "pt-01", "pt-05", "pt-02", "pt-07", "pt-04"],
    jawaban: { "pt-01": 2, "pt-02": 0, "pt-03": 2, "pt-04": 1, "pt-05": 0, "pt-06": 0, "pt-07": 1, "pt-08": 1 },
    mulai: "2026-10-27T11:00",
    selesai: "2026-10-27T11:08",
    otomatis: false,
  },
];

// Id soal di hasil dasar memakai awalan pt-; disesuaikan ke awalan quiz masing-masing
export const HASIL_QUIZ_LIST: HasilQuiz[] = HASIL_DASAR.map((h) => {
  const ganti = (id: string) => id.replace("pt-", AWALAN_SOAL[h.quizId]);
  return {
    ...h,
    kegiatanId: "kegiatan-1",
    urutanSoal: h.urutanSoal.map(ganti),
    jawaban: Object.fromEntries(Object.entries(h.jawaban).map(([id, v]) => [ganti(id), v])),
  };
});

export const IZIN_KERJA_ULANG_LIST: IzinKerjaUlang[] = [];

export const LOG_PERUBAHAN_QUIZ_LIST: LogPerubahanQuiz[] = [];

export const UNDANGAN_LIST: Undangan[] = [
  {
    id: "undangan-1",
    judul: "Undangan Pembinaan Statistik Sektoral",
    link: "https://drive.google.com/file/d/contoh-1/view",
    dikirimPada: "2026-10-12T09:00",
    opdIds: OPD_LIST.map((o) => o.id),
  },
  {
    id: "undangan-2",
    judul: "Undangan Rapat Koordinasi Operator",
    link: "https://drive.google.com/file/d/contoh-2/view",
    dikirimPada: "2026-10-20T13:30",
    opdIds: OPD_LIST.slice(0, 3).map((o) => o.id),
  },
];