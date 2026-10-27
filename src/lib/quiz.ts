import type { PengaturanQuiz, SoalQuiz } from "@/lib/types";

export type StatusQuiz = "selesai" | "belum_dibuka" | "terkunci" | "terbuka";

// Pengacak dengan seed tetap, supaya urutan soal satu OPD selalu sama
function buatAcak(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hanya urutan soal yang diacak, urutan opsi tetap
export function acakSoal(soal: SoalQuiz[], seed: string): SoalQuiz[] {
  const acak = buatAcak(seed);
  const hasil = [...soal];
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

// sekarang berformat yyyy-mm-ddTHH:mm (lihat waktuSekarang di lib/presensi.ts)
export function statusQuiz(
  pengaturan: PengaturanQuiz,
  sudahSelesai: boolean,
  sekarang: string,
): StatusQuiz {
  if (sudahSelesai) return "selesai";
  if (pengaturan.akses === "belum_dibuka") return "belum_dibuka";
  if (pengaturan.akses === "ditutup" || sekarang > pengaturan.batasAkhir) return "terkunci";
  return "terbuka";
}

// Nilai = jumlah benar / jumlah soal x 100. Soal tanpa jawaban dihitung salah
export function hitungHasil(soal: SoalQuiz[], jawaban: Record<string, number>) {
  const total = soal.length;
  const benar = soal.filter((s) => jawaban[s.id] === s.kunci).length;
  return {
    benar,
    salah: total - benar,
    total,
    nilai: total === 0 ? 0 : (benar / total) * 100,
  };
}

export function formatNilai(nilai: number) {
  return String(Math.round(nilai * 10) / 10).replace(".", ",");
}

export function formatSisa(detik: number) {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  return `${String(menit).padStart(2, "0")}:${String(sisa).padStart(2, "0")}`;
}

export function hurufOpsi(indeks: number) {
  return String.fromCharCode(65 + indeks);
}