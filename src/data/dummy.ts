import type {
  Dokumen,
  ItemDokumen,
  Kegiatan,
  NilaiUjian,
  Opd,
  Presensi,
  Pengguna,
  SesiPembinaan,
  StatusDokumen,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Master data                                                         */
/* Semua data di file ini DUMMY. Ganti dengan data asli dari backend. */
/* ------------------------------------------------------------------ */

export const OPD_LIST: Opd[] = [
  { id: "opd-01", nama: "Dinas Pendidikan dan Kebudayaan", singkatan: "Disdikbud" },
  { id: "opd-02", nama: "Dinas Kesehatan", singkatan: "Dinkes" },
  { id: "opd-03", nama: "Dinas Pertanian", singkatan: "Distan" },
  { id: "opd-04", nama: "Dinas Perikanan dan Kelautan", singkatan: "DKP" },
  { id: "opd-05", nama: "Dinas Sosial", singkatan: "Dinsos" },
  { id: "opd-06", nama: "Dinas Pariwisata", singkatan: "Dispar" },
  { id: "opd-07", nama: "Dinas Komunikasi dan Informatika", singkatan: "Diskominfo" },
  { id: "opd-08", nama: "Dinas Kependudukan dan Pencatatan Sipil", singkatan: "Disdukcapil" },
];

// Dokumen yang harus diunggah OPD, berbeda per kegiatan:
// kegiatan 1 = 9 dokumen, kegiatan 2 = 3, kegiatan 3 = 2.
// Item 7–10 masih nama sementara.
export const ITEM_LIST: ItemDokumen[] = [
  { id: "item-01", kegiatanId: "kegiatan-1", nama: "Output per kegiatan" },
  { id: "item-02", kegiatanId: "kegiatan-1", nama: "Monitoring web kelengkapan" },
  { id: "item-04", kegiatanId: "kegiatan-1", nama: "Dokumentasi" },
  { id: "item-05", kegiatanId: "kegiatan-1", nama: "Undangan" },
  { id: "item-06", kegiatanId: "kegiatan-1", nama: "Tabulasi identifikasi kegiatan statistik" },
  { id: "item-07", kegiatanId: "kegiatan-1", nama: "Dokumen – item 7" },
  { id: "item-08", kegiatanId: "kegiatan-1", nama: "Dokumen – item 8" },
  { id: "item-09", kegiatanId: "kegiatan-1", nama: "Dokumen – item 9" },
  { id: "item-10", kegiatanId: "kegiatan-1", nama: "Dokumen – item 10" },
  { id: "item-11", kegiatanId: "kegiatan-2", nama: "Daftar hadir dan sertifikat" },
  { id: "item-12", kegiatanId: "kegiatan-2", nama: "Screenshot hasil MOOC" },
  { id: "item-13", kegiatanId: "kegiatan-2", nama: "Screenshot hasil pretest" },
  { id: "item-14", kegiatanId: "kegiatan-3", nama: "Dokumen statistik sektoral" },
  { id: "item-15", kegiatanId: "kegiatan-3", nama: "Hasil ujian dan pembinaan" },
];

export const KEGIATAN_LIST: Kegiatan[] = [
  {
    id: "kegiatan-1",
    nama: "Kegiatan Statistik Sektoral 1",
    tanggalMulai: "2026-10-01",
    tanggalSelesai: "2026-10-31",
    tenggat: "2026-10-30",
    bobot: 40,
  },
  {
    id: "kegiatan-2",
    nama: "Kegiatan Statistik Sektoral 2",
    tanggalMulai: "2026-11-01",
    tanggalSelesai: "2026-11-30",
    tenggat: "2026-11-30",
    bobot: 30,
  },
  {
    id: "kegiatan-3",
    nama: "Kegiatan Statistik Sektoral 3",
    tanggalMulai: "2026-12-01",
    tanggalSelesai: "2026-12-19",
    tenggat: "2026-12-19",
    bobot: 30,
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

const CATATAN_REVISI = [
  "Berkas tidak terbaca, mohon unggah ulang dengan resolusi lebih jelas.",
  "Dokumen belum ditandatangani, mohon lengkapi.",
  "Format berkas tidak sesuai, gunakan PDF.",
  "Isi dokumen belum lengkap, periksa kembali daftar yang diminta.",
];

const rand = mulberry32(2026);

export const DOKUMEN_LIST: Dokumen[] = OPD_LIST.flatMap((opd, o) =>
  KEGIATAN_LIST.flatMap((kegiatan, k) =>
    ITEM_LIST.filter((i) => i.kegiatanId === kegiatan.id).map<Dokumen>((item) => {
      const peluangTerisi = PROFIL_OPD[o] * FAKTOR_KEGIATAN[k];

      let status: StatusDokumen = "belum";
      if (rand() < peluangTerisi) {
        const s = rand();
        status = s < 0.6 ? "disetujui" : s < 0.85 ? "menunggu" : "revisi";
      }

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
        catatanRevisi:
          status === "revisi" ? CATATAN_REVISI[Math.floor(rand() * CATATAN_REVISI.length)] : null,
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
  {
    id: "sesi-1",
    urutan: 1,
    judul: "Prinsip & Pengertian Satu Data Indonesia",
    tanggal: "2026-10-08",
    batasPengisian: "2026-10-09T17:00",
    akses: "ditutup",
  },
  {
    id: "sesi-2",
    urutan: 2,
    judul: "Penyelenggara SDI Pusat & Daerah",
    tanggal: "2026-10-15",
    batasPengisian: "2026-10-16T17:00",
    akses: "dibuka", // terkunci karena batas waktu sudah lewat
  },
  {
    id: "sesi-3",
    urutan: 3,
    judul: "Tahapan Penyelenggaraan SDI & GSBPM",
    tanggal: "2026-10-27",
    batasPengisian: "2026-10-30T17:00",
    akses: "dibuka",
  },
  {
    id: "sesi-4",
    urutan: 4,
    judul: "Penyusunan Data Prioritas & EPSS",
    tanggal: "2026-11-06",
    batasPengisian: "2026-11-07T17:00",
    akses: "belum_dibuka",
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
];