import { DOKUMEN_LIST, ITEM_LIST, KEGIATAN_LIST, OPD_LIST, PENGGUNA_LIST } from "@/data/dummy";
import { hitungHasil } from "@/lib/quiz";
import { ambilQuizOpd } from "@/lib/quiz-opd";
import type { JenisQuiz, Pengguna, StatusDokumen } from "@/lib/types";

const bulatkan1 = (n: number) => Math.round(n * 10) / 10;

/** Porsi nilai akhir (jumlah 100). */
export const PORSI_NILAI = { dokumen: 50, pretest: 25, posttest: 25 } as const;

/** Pegawai (operator) milik satu OPD. */
export function pegawaiOpd(opdId: string): Pengguna[] {
  return PENGGUNA_LIST.filter((p) => p.peran === "operator" && p.opdId === opdId);
}

/** Jumlah dokumen per status untuk satu pegawai pada satu kegiatan. */
export function hitungStatusPegawai(penggunaId: string, kegiatanId: string) {
  const hasil: Record<StatusDokumen, number> = { belum: 0, disetujui: 0 };
  for (const d of DOKUMEN_LIST) {
    if (d.penggunaId === penggunaId && d.kegiatanId === kegiatanId) hasil[d.status] += 1;
  }
  return hasil;
}

/** Kelengkapan dokumen satu pegawai (0–100): persentase item berstatus "disetujui". */
export function hitungKelengkapanPegawai(penggunaId: string, kegiatanId: string) {
  const total = ITEM_LIST.filter((i) => i.kegiatanId === kegiatanId).length;
  if (total === 0) return 0;
  return Math.round((hitungStatusPegawai(penggunaId, kegiatanId).disetujui / total) * 100);
}

/** Jumlah dokumen per status seluruh pegawai satu OPD. */
export function hitungStatus(opdId: string, kegiatanId: string) {
  const hasil: Record<StatusDokumen, number> = { belum: 0, disetujui: 0 };
  for (const d of DOKUMEN_LIST) {
    if (d.opdId === opdId && d.kegiatanId === kegiatanId) hasil[d.status] += 1;
  }
  return hasil;
}

/** Kelengkapan OPD = rata-rata kelengkapan pegawainya; 0 bila belum ada pegawai. */
export function hitungKelengkapan(opdId: string, kegiatanId: string) {
  const pegawai = pegawaiOpd(opdId);
  if (pegawai.length === 0) return 0;
  const jumlah = pegawai.reduce((s, p) => s + hitungKelengkapanPegawai(p.id, kegiatanId), 0);
  return Math.round(jumlah / pegawai.length);
}

/** Nilai satu quiz (0–100) untuk satu pegawai; null bila belum dikerjakan. aktif=false bila saklar quiz dimatikan. */
function nilaiQuiz(kegiatanId: string, jenis: JenisQuiz, opdId: string, penggunaId: string) {
  const kegiatan = KEGIATAN_LIST.find((k) => k.id === kegiatanId);
  const q = ambilQuizOpd(kegiatan, jenis, opdId, penggunaId);
  const nilai = q.hasil ? hitungHasil(q.soal, q.hasil.jawaban).nilai : null;
  return { aktif: q.aktif, nilai };
}

/**
 * Rekap nilai satu pegawai pada satu kegiatan.
 * Nilai akhir = 50% dokumen + 25% Pre-Test + 25% Post-Test.
 * Quiz yang belum dikerjakan dihitung 0. Quiz yang saklarnya dimatikan admin
 * dikeluarkan, dan porsi yang tersisa dihitung ulang secara proporsional.
 */
export function rekapPegawai(penggunaId: string, kegiatanId: string) {
  const opdId = PENGGUNA_LIST.find((p) => p.id === penggunaId)?.opdId ?? "";
  const kelengkapan = hitungKelengkapanPegawai(penggunaId, kegiatanId);
  const pre = nilaiQuiz(kegiatanId, "pretest", opdId, penggunaId);
  const post = nilaiQuiz(kegiatanId, "posttest", opdId, penggunaId);

  const komponen = [
    { porsi: PORSI_NILAI.dokumen, nilai: kelengkapan, aktif: true },
    { porsi: PORSI_NILAI.pretest, nilai: pre.nilai ?? 0, aktif: pre.aktif },
    { porsi: PORSI_NILAI.posttest, nilai: post.nilai ?? 0, aktif: post.aktif },
  ].filter((k) => k.aktif);

  const totalPorsi = komponen.reduce((s, k) => s + k.porsi, 0);
  const nilaiAkhir =
    totalPorsi === 0 ? 0 : komponen.reduce((s, k) => s + k.nilai * k.porsi, 0) / totalPorsi;

  return {
    penggunaId,
    opdId,
    kegiatanId,
    kelengkapan,
    preTest: pre.nilai,
    postTest: post.nilai,
    nilaiAkhir: bulatkan1(nilaiAkhir),
  };
}

/**
 * Rekap satu OPD = rata-rata rekap pegawainya (pegawai yang belum mengerjakan
 * dihitung 0 dan tetap ikut dirata-ratakan).
 */
export function rekapOpd(opdId: string, kegiatanId: string) {
  const daftar = pegawaiOpd(opdId).map((p) => rekapPegawai(p.id, kegiatanId));
  const rata = (nilai: (r: (typeof daftar)[number]) => number) =>
    daftar.length === 0 ? 0 : bulatkan1(daftar.reduce((s, r) => s + nilai(r), 0) / daftar.length);

  return {
    opdId,
    kegiatanId,
    jumlahPegawai: daftar.length,
    kelengkapan: rata((r) => r.kelengkapan),
    preTest: rata((r) => r.preTest ?? 0),
    postTest: rata((r) => r.postTest ?? 0),
    nilaiAkhir: rata((r) => r.nilaiAkhir),
  };
}

/** Rekap semua OPD yang punya pegawai + rata-rata. OPD tanpa pegawai tidak ditampilkan. */
export function rekapSemuaOpd(kegiatanId: string) {
  const baris = OPD_LIST.filter((opd) => pegawaiOpd(opd.id).length > 0).map((opd) => ({
    opd,
    ...rekapOpd(opd.id, kegiatanId),
  }));
  const rataRata =
    baris.length === 0 ? 0 : bulatkan1(baris.reduce((s, b) => s + b.nilaiAkhir, 0) / baris.length);
  return { baris, rataRata };
}