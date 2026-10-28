import { hitungHasil } from "@/lib/quiz";
import type { HasilQuiz, Presensi, SesiPembinaan, SoalQuiz } from "@/lib/types";

export const AMBANG_KEHADIRAN = 75; // persen
export const AMBANG_POSTTEST = 75; // nilai

// Penyebut = semua sesi. Sesi tidak diisi atau izin tidak dihitung hadir
export function hitungKehadiran(sesiList: SesiPembinaan[], presensi: Presensi[]) {
  const hadir = sesiList.filter((s) =>
    presensi.some(
      (p) => p.sesiId === s.id && (p.status === "tepat_waktu" || p.status === "terlambat"),
    ),
  ).length;
  const total = sesiList.length;
  return { hadir, total, persen: total === 0 ? 0 : (hadir / total) * 100 };
}

// hasil sudah difilter per OPD; null bila quiz belum dikerjakan
export function ambilNilaiQuiz(hasil: HasilQuiz[], quizId: string, soal: SoalQuiz[]) {
  const h = hasil.find((x) => x.quizId === quizId);
  return h ? hitungHasil(soal, h.jawaban).nilai : null;
}

// N-Gain = (post - pre) / (100 - pre). Pre 100 tidak bisa dihitung
export function hitungNGain(pre: number | null, post: number | null) {
  if (pre === null || post === null || pre >= 100) return null;
  return (post - pre) / (100 - pre);
}

export function formatNGain(n: number) {
  return (Math.round(n * 100) / 100 + 0).toFixed(2).replace(".", ",");
}

// hanya URL https yang lolos
export function linkHttps(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}