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
  StatusKehadiran,
} from "@/lib/types";


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
]

// Dokumen yang harus diunggah OPD pada kegiatan aktif.
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
];

const PENGGUNA_DASAR: Pengguna[] = [
  { id: "usr-admin", nama: "Admin BPS", email: "admin@example.com", peran: "admin" },
  { id: "usr-op-01", nama: "Kezia Siwi", email: "operator@monev.test", peran: "operator", opdId: "opd-01" },
  { id: "usr-op-02", nama: "Monita Purba", email: "monita.disdikbud@monev.test", peran: "operator", opdId: "opd-01" },
  { id: "usr-op-03", nama: "Keisya Akay", email: "keisya.dinkes@monev.test", peran: "operator", opdId: "opd-02" },
  { id: "usr-op-04", nama: "Arya Mandy", email: "arya.dinkes@monev.test", peran: "operator", opdId: "opd-02" },
  { id: "usr-op-05", nama: "Silvana Arikalang", email: "silvana.dinsos@monev.test", peran: "operator", opdId: "opd-05" },
  { id: "usr-op-06", nama: "La Ode", email: "laode.dinsos@monev.test", peran: "operator", opdId: "opd-05" },
  { id: "usr-op-07", nama: "Arturito Rawung", email: "arturito.dkp@monev.test", peran: "operator", opdId: "opd-04" },
  { id: "usr-op-08", nama: "Marya Zahra", email: "marya.dkp@monev.test", peran: "operator", opdId: "opd-04" },
  { id: "usr-op-09", nama: "Samuel Untu", email: "samuel.diskominfo@monev.test", peran: "operator", opdId: "opd-07" },
  { id: "usr-op-10", nama: "Dina Yanti Nainggolan", email: "dina.diskominfo@monev.test", peran: "operator", opdId: "opd-07" },
];

export const PENGGUNA_LIST: Pengguna[] = PENGGUNA_DASAR.map((p) =>
  p.peran === "operator" ? { ...p, linkSertifikat: LINK_SERTIFIKAT_CONTOH } : p,
);
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

// Dipakai NILAI_UJIAN_LIST di bawah
const PROFIL_OPD = [0.95, 0.85, 0.75, 0.65, 0.55, 0.4, 0.25, 0.1];

// Seberapa rajin tiap pegawai mengunggah dokumen (1 = semua disetujui). Samuel dan Dina terbaik
const PELUANG_DOKUMEN: Record<string, number> = {
  "usr-op-01": 0.8,
  "usr-op-02": 0.3,
  "usr-op-03": 0.6,
  "usr-op-04": 0.75,
  "usr-op-05": 0.4,
  "usr-op-06": 0.55,
  "usr-op-07": 0.35,
  "usr-op-08": 0.7,
  "usr-op-09": 1,
  "usr-op-10": 1,
};

const rand = mulberry32(2026);

export const DOKUMEN_LIST: Dokumen[] = PENGGUNA_LIST.filter(
  (p) => p.peran === "operator" && p.opdId,
).flatMap((pegawai) =>
  KEGIATAN_LIST.flatMap((kegiatan) =>
    ITEM_LIST.filter((i) => i.kegiatanId === kegiatan.id).map<Dokumen>((item) => {
      const peluang = PELUANG_DOKUMEN[pegawai.id] ?? 0.5;

      let status: StatusDokumen = "belum";
      if (rand() < peluang) status = "disetujui";

      const sudahUnggah = status !== "belum";
      const hari = String(1 + Math.floor(rand() * 10)).padStart(2, "0");
      const opd = OPD_LIST.find((o) => o.id === pegawai.opdId)!;

      return {
        id: `dok-${pegawai.id}-${kegiatan.id}-${item.id}`,
        penggunaId: pegawai.id,
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
const AMBANG_NILAI = [0.25];

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
  // kegiatan-1: dua ditutup, satu terbuka, satu belum dibuka
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
];

function hadir(
  penggunaId: string,
  opdId: string,
  sesiId: string,
  status: StatusKehadiran,
  waktuIsi: string,
  catatan: string | null = null,
): Presensi {
  return { id: `hadir-${penggunaId}-${sesiId}`, penggunaId, opdId, sesiId, status, waktuIsi, catatan };
}

export const PRESENSI_LIST: Presensi[] = [
  hadir("usr-op-01", "opd-01", "sesi-1", "tepat_waktu", "2026-10-08T08:30", "Mengikuti via Zoom"),
  hadir("usr-op-01", "opd-01", "sesi-1", "tepat_waktu", "2026-10-08T08:30", "Mengikuti via Zoom"),
  hadir("usr-op-01", "opd-01", "sesi-2", "tepat_waktu", "2026-10-15T08:20"),
  hadir("usr-op-02", "opd-01", "sesi-1", "terlambat", "2026-10-08T09:15", "Bergabung terlambat karena rapat internal"),
  hadir("usr-op-02", "opd-01", "sesi-2", "terlambat", "2026-10-15T09:15", "Bergabung terlambat karena rapat internal"),
  hadir("usr-op-03", "opd-02", "sesi-1", "terlambat", "2026-10-08T09:05", "Kendala jaringan"),
  hadir("usr-op-03", "opd-02", "sesi-2", "izin", "2026-10-15T07:50", "Tugas dinas ke luar kota"),
  hadir("usr-op-04", "opd-02", "sesi-1", "tepat_waktu", "2026-10-08T08:41"),
  hadir("usr-op-04", "opd-02", "sesi-2", "tepat_waktu", "2026-10-15T08:35"),
  hadir("usr-op-04", "opd-02", "sesi-3", "terlambat", "2026-10-27T09:30", "Jaringan tidak stabil"),
  hadir("usr-op-05", "opd-05", "sesi-1", "terlambat", "2026-10-08T09:40", "Kendala jaringan"),
  hadir("usr-op-05", "opd-05", "sesi-2", "terlambat", "2026-10-15T09:40", "Kendala jaringan"),
  hadir("usr-op-05", "opd-05", "sesi-3", "terlambat", "2026-10-27T09:40", "Kendala jaringan"),
  hadir("usr-op-06", "opd-05", "sesi-1", "tepat_waktu", "2026-10-08T08:28"),
  hadir("usr-op-06", "opd-05", "sesi-2", "tepat_waktu", "2026-10-15T08:33"),
  hadir("usr-op-06", "opd-05", "sesi-3", "tepat_waktu", "2026-10-15T08:33"),
  hadir("usr-op-07", "opd-04", "sesi-1", "tepat_waktu", "2026-10-08T08:28"),
  hadir("usr-op-07", "opd-04", "sesi-2", "tepat_waktu", "2026-10-15T08:28"),
  hadir("usr-op-07", "opd-04", "sesi-3", "tepat_waktu", "2026-10-15T08:28"),
  hadir("usr-op-08", "opd-04", "sesi-1", "tepat_waktu", "2026-10-08T08:30"),
  hadir("usr-op-08", "opd-04", "sesi-2", "tepat_waktu", "2026-10-15T08:36"),
  hadir("usr-op-08", "opd-04", "sesi-3", "tepat_waktu", "2026-10-15T08:36"),
  hadir("usr-op-08", "opd-04", "sesi-4", "tepat_waktu", "2026-10-15T08:36"),
  hadir("usr-op-09", "opd-07", "sesi-1", "tepat_waktu", "2026-10-08T08:20"),
  hadir("usr-op-09", "opd-07", "sesi-2", "tepat_waktu", "2026-10-15T08:18"),
  hadir("usr-op-09", "opd-07", "sesi-3", "tepat_waktu", "2026-10-27T08:15"),
  hadir("usr-op-10", "opd-07", "sesi-1", "tepat_waktu", "2026-10-08T08:25"),
  hadir("usr-op-10", "opd-07", "sesi-2", "tepat_waktu", "2026-10-15T08:22"),
  hadir("usr-op-10", "opd-07", "sesi-3", "tepat_waktu", "2026-10-27T08:40"),
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
];

// Jawaban dummy: `benar` soal pertama dijawab benar, sisanya salah
function buatJawaban(quizId: JenisQuiz, benar: number): Record<string, number> {
  return Object.fromEntries(
    SOAL_DASAR.map((s, i) => [
      s.id.replace("pt-", AWALAN_SOAL[quizId]),
      i < benar ? s.kunci : (s.kunci + 1) % s.opsi.length,
    ]),
  );
}

function buatHasil(
  penggunaId: string,
  opdId: string,
  quizId: JenisQuiz,
  benar: number,
  tanggal: string,
  jam: string,
): HasilQuiz {
  const jawaban = buatJawaban(quizId, benar);
  return {
    penggunaId,
    opdId,
    kegiatanId: "kegiatan-1",
    quizId,
    urutanSoal: Object.keys(jawaban),
    jawaban,
    mulai: `${tanggal}T${jam}:00`,
    selesai: `${tanggal}T${jam}:10`,
    otomatis: false,
  };
}

// [pegawai, jumlah benar Pre-Test, jumlah benar Post-Test dari 8 soal]; null = belum mengerjakan
const SKOR_DUMMY: [string, number | null, number | null][] = [
  ["usr-op-01", 3, null],
  ["usr-op-02", null, null],
  ["usr-op-03", 4, 5],
  ["usr-op-04", 5, 6],
  ["usr-op-05", 3, 4],
  ["usr-op-06", 4, 5],
  ["usr-op-07", 4, 6],
  ["usr-op-08", 5, 6],
  ["usr-op-09", 6, 8],
  ["usr-op-10", 5, 8],
];

export const HASIL_QUIZ_LIST: HasilQuiz[] = SKOR_DUMMY.flatMap(([penggunaId, pre, post], i) => {
  const opdId = PENGGUNA_LIST.find((p) => p.id === penggunaId)!.opdId!;
  const jam = String(8 + i).padStart(2, "0");
  const hasil: HasilQuiz[] = [];
  if (pre !== null) hasil.push(buatHasil(penggunaId, opdId, "pretest", pre, "2026-10-26", jam));
  if (post !== null) hasil.push(buatHasil(penggunaId, opdId, "posttest", post, "2026-10-27", jam));
  return hasil;
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