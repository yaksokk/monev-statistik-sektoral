import { hitungHasil, quizAktif } from "@/lib/quiz";
import type { HasilQuiz, Kegiatan, SoalQuiz } from "@/lib/types";

export const AMBANG_POSTTEST = 75; // nilai


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

// N-Gain hanya dihitung bila Pre-Test dan Post-Test sama-sama aktif di kegiatan
export function nGainTersedia(kegiatan: Kegiatan) {
  return quizAktif(kegiatan, "pretest") && quizAktif(kegiatan, "posttest");
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