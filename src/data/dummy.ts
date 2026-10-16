import type {
  Dokumen,
  ItemTahap,
  Kegiatan,
  NilaiUjian,
  Opd,
  Pengguna,
  StatusDokumen,
  Tahap,
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

export const TAHAP_LIST: Tahap[] = [
  { id: "tahap-1", urutan: 1, nama: "Tahap 1", bobot: 40 },
  { id: "tahap-2", urutan: 2, nama: "Tahap 2", bobot: 30 },
  { id: "tahap-3", urutan: 3, nama: "Tahap 3", bobot: 30 },
];

export const ITEM_LIST: ItemTahap[] = [
  // Tahap 1 (10 item). Item 7–10 masih nama sementara.
  { id: "t1-01", tahapId: "tahap-1", nama: "Output per kegiatan" },
  { id: "t1-02", tahapId: "tahap-1", nama: "Monitoring web kelengkapan" },
  { id: "t1-03", tahapId: "tahap-1", nama: "Daftar hadir" },
  { id: "t1-04", tahapId: "tahap-1", nama: "Dokumentasi" },
  { id: "t1-05", tahapId: "tahap-1", nama: "Undangan" },
  { id: "t1-06", tahapId: "tahap-1", nama: "Tabulasi identifikasi kegiatan statistik" },
  { id: "t1-07", tahapId: "tahap-1", nama: "Dokumen tahap 1 – item 7" },
  { id: "t1-08", tahapId: "tahap-1", nama: "Dokumen tahap 1 – item 8" },
  { id: "t1-09", tahapId: "tahap-1", nama: "Dokumen tahap 1 – item 9" },
  { id: "t1-10", tahapId: "tahap-1", nama: "Dokumen tahap 1 – item 10" },
  // Tahap 2 – MOOC (3 item)
  { id: "t2-01", tahapId: "tahap-2", nama: "Daftar hadir dan sertifikat" },
  { id: "t2-02", tahapId: "tahap-2", nama: "Screenshot hasil MOOC" },
  { id: "t2-03", tahapId: "tahap-2", nama: "Screenshot hasil pretest" },
  // Tahap 3 (2 item)
  { id: "t3-01", tahapId: "tahap-3", nama: "Dokumen statistik sektoral" },
  { id: "t3-02", tahapId: "tahap-3", nama: "Hasil ujian dan pembinaan" },
];

export const KEGIATAN_LIST: Kegiatan[] = [
  {
    id: "kegiatan-1",
    nama: "Kegiatan Statistik Sektoral 1",
    tanggalMulai: "2026-10-01",
    tanggalSelesai: "2026-10-31",
    tenggat: { "tahap-1": "2026-10-15", "tahap-2": "2026-10-22", "tahap-3": "2026-10-30" },
  },
  {
    id: "kegiatan-2",
    nama: "Kegiatan Statistik Sektoral 2",
    tanggalMulai: "2026-11-01",
    tanggalSelesai: "2026-11-30",
    tenggat: { "tahap-1": "2026-11-15", "tahap-2": "2026-11-22", "tahap-3": "2026-11-30" },
  },
  {
    id: "kegiatan-3",
    nama: "Kegiatan Statistik Sektoral 3",
    tanggalMulai: "2026-12-01",
    tanggalSelesai: "2026-12-19",
    tenggat: { "tahap-1": "2026-12-08", "tahap-2": "2026-12-14", "tahap-3": "2026-12-19" },
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
// Tahap yang lebih akhir = lebih sedikit yang sudah terisi
const FAKTOR_TAHAP = [1, 0.8, 0.6];

const CATATAN_REVISI = [
  "Berkas tidak terbaca, mohon unggah ulang dengan resolusi lebih jelas.",
  "Dokumen belum ditandatangani, mohon lengkapi.",
  "Format berkas tidak sesuai, gunakan PDF.",
  "Isi dokumen belum lengkap, periksa kembali daftar yang diminta.",
];

const rand = mulberry32(2026);

export const DOKUMEN_LIST: Dokumen[] = OPD_LIST.flatMap((opd, o) =>
  KEGIATAN_LIST.flatMap((kegiatan, k) =>
    ITEM_LIST.map<Dokumen>((item) => {
      const tahap = TAHAP_LIST.find((t) => t.id === item.tahapId)!;
      const peluangTerisi = PROFIL_OPD[o] * FAKTOR_KEGIATAN[k] * FAKTOR_TAHAP[tahap.urutan - 1];

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
        tahapId: item.tahapId,
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
/* Nilai ujian dummy (diinput admin, per OPD per tahap)                */
/* ------------------------------------------------------------------ */

// OPD yang cukup rajin sudah punya nilai ujian; sisanya null (belum diinput)
const AMBANG_NILAI = [0.25, 0.55, 0.75];

export const NILAI_UJIAN_LIST: NilaiUjian[] = OPD_LIST.flatMap((opd, o) =>
  TAHAP_LIST.map<NilaiUjian>((tahap) => ({
    opdId: opd.id,
    tahapId: tahap.id,
    nilai:
      PROFIL_OPD[o] >= AMBANG_NILAI[tahap.urutan - 1] ? Math.round(65 + rand() * 33) : null,
  })),
);
