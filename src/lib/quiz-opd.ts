import {
  HASIL_QUIZ_LIST,
  IZIN_KERJA_ULANG_LIST,
  KEGIATAN_LIST,
  PENGATURAN_QUIZ_LIST,
  SOAL_QUIZ_LIST,
} from "@/data/dummy";
import { cariPengaturan, punyaIzin, quizAktif, soalQuiz } from "@/lib/quiz";
import type { JenisQuiz, Kegiatan } from "@/lib/types";

// OPD hanya melihat kegiatan yang sedang berjalan
export function kegiatanBerjalan() {
  return KEGIATAN_LIST.find((k) => k.aktif);
}

// Data satu quiz untuk satu OPD pada satu kegiatan. Tanpa kegiatan: quiz dianggap aktif tapi kosong
export function ambilQuizOpd(kegiatan: Kegiatan | undefined, jenis: JenisQuiz, opdId: string) {
  if (!kegiatan) {
    return { aktif: true, pengaturan: undefined, soal: [], hasil: null, diizinkan: true };
  }
  return {
    aktif: quizAktif(kegiatan, jenis),
    pengaturan: cariPengaturan(PENGATURAN_QUIZ_LIST, kegiatan.id, jenis),
    soal: soalQuiz(SOAL_QUIZ_LIST, kegiatan.id, jenis),
    hasil:
      HASIL_QUIZ_LIST.find(
        (h) => h.opdId === opdId && h.kegiatanId === kegiatan.id && h.quizId === jenis,
      ) ?? null,
    diizinkan: punyaIzin(IZIN_KERJA_ULANG_LIST, kegiatan.id, jenis, opdId),
  };
}