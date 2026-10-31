import { DOKUMEN_LIST, ITEM_LIST, KEGIATAN_LIST, OPD_LIST } from "@/data/dummy";
import { hitungHasil } from "@/lib/quiz";
import { ambilQuizOpd } from "@/lib/quiz-opd";
import type { JenisQuiz, StatusDokumen } from "@/lib/types";

const bulatkan1 = (n: number) => Math.round(n * 10) / 10;

/** Porsi nilai akhir (jumlah 100). */
export const PORSI_NILAI = { dokumen: 50, pretest: 25, posttest: 25 } as const;

/** Jumlah dokumen per status untuk satu OPD pada satu kegiatan. */
export function hitungStatus(opdId: string, kegiatanId: string) {
  const hasil: Record<StatusDokumen, number> = { belum: 0, disetujui: 0 };
  for (const d of DOKUMEN_LIST) {
    if (d.opdId === opdId && d.kegiatanId === kegiatanId) hasil[d.status] += 1;
  }
  return hasil;
}

/** Nilai kelengkapan (0–100): persentase item yang berstatus "disetujui". */
export function hitungKelengkapan(opdId: string, kegiatanId: string) {
  const total = ITEM_LIST.filter((i) => i.kegiatanId === kegiatanId).length;
  if (total === 0) return 0;
  return Math.round((hitungStatus(opdId, kegiatanId).disetujui / total) * 100);
}

/** Nilai satu quiz (0–100) untuk satu OPD; null bila belum dikerjakan. aktif=false bila saklar quiz dimatikan. */
function nilaiQuiz(kegiatanId: string, jenis: JenisQuiz, opdId: string) {
  const kegiatan = KEGIATAN_LIST.find((k) => k.id === kegiatanId);
  const q = ambilQuizOpd(kegiatan, jenis, opdId);
  const nilai = q.hasil ? hitungHasil(q.soal, q.hasil.jawaban).nilai : null;
  return { aktif: q.aktif, nilai };
}

/**
 * Rekap nilai satu OPD pada satu kegiatan.
 * Nilai akhir = 50% dokumen + 25% Pre-Test + 25% Post-Test.
 * Quiz yang belum dikerjakan dihitung 0. Quiz yang saklarnya dimatikan admin
 * dikeluarkan, dan porsi yang tersisa dihitung ulang secara proporsional.
 */
export function rekapOpd(opdId: string, kegiatanId: string) {
  const kelengkapan = hitungKelengkapan(opdId, kegiatanId);
  const pre = nilaiQuiz(kegiatanId, "pretest", opdId);
  const post = nilaiQuiz(kegiatanId, "posttest", opdId);

  const komponen = [
    { porsi: PORSI_NILAI.dokumen, nilai: kelengkapan, aktif: true },
    { porsi: PORSI_NILAI.pretest, nilai: pre.nilai ?? 0, aktif: pre.aktif },
    { porsi: PORSI_NILAI.posttest, nilai: post.nilai ?? 0, aktif: post.aktif },
  ].filter((k) => k.aktif);

  const totalPorsi = komponen.reduce((s, k) => s + k.porsi, 0);
  const nilaiAkhir =
    totalPorsi === 0 ? 0 : komponen.reduce((s, k) => s + k.nilai * k.porsi, 0) / totalPorsi;

  return {
    opdId,
    kegiatanId,
    kelengkapan,
    preTest: pre.nilai,
    postTest: post.nilai,
    nilaiAkhir: bulatkan1(nilaiAkhir),
  };
}

/** Rekap semua OPD + rata-rata, untuk dashboard admin. */
export function rekapSemuaOpd(kegiatanId: string) {
  const baris = OPD_LIST.map((opd) => ({ opd, ...rekapOpd(opd.id, kegiatanId) }));
  const rataRata =
    baris.length === 0 ? 0 : bulatkan1(baris.reduce((s, b) => s + b.nilaiAkhir, 0) / baris.length);
  return { baris, rataRata };
}