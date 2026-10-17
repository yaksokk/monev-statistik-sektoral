import { DOKUMEN_LIST, ITEM_LIST, KEGIATAN_LIST, NILAI_UJIAN_LIST, OPD_LIST } from "@/data/dummy";
import type { StatusDokumen } from "@/lib/types";

const bulatkan1 = (n: number) => Math.round(n * 10) / 10;

/** Jumlah dokumen per status untuk satu OPD pada satu kegiatan. */
export function hitungStatus(opdId: string, kegiatanId: string) {
  const hasil: Record<StatusDokumen, number> = { belum: 0, menunggu: 0, disetujui: 0, revisi: 0 };
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

export function ambilNilaiUjian(opdId: string, kegiatanId: string) {
  return (
    NILAI_UJIAN_LIST.find((n) => n.opdId === opdId && n.kegiatanId === kegiatanId)?.nilai ?? null
  );
}

/**
 * Rekap nilai satu OPD di semua kegiatan.
 * RUMUS SEMENTARA: nilai kegiatan = rata-rata(kelengkapan, ujian), ujian kosong dihitung 0.
 * Nilai akhir = jumlah (nilai kegiatan × bobot kegiatan / 100).
 * Ganti setelah rumus resmi disepakati.
 */
export function rekapOpd(opdId: string) {
  const perKegiatan = KEGIATAN_LIST.map((kegiatan) => {
    const kelengkapan = hitungKelengkapan(opdId, kegiatan.id);
    const ujian = ambilNilaiUjian(opdId, kegiatan.id);
    const nilai = (kelengkapan + (ujian ?? 0)) / 2;
    return { kegiatanId: kegiatan.id, bobot: kegiatan.bobot, kelengkapan, ujian, nilai };
  });
  const nilaiAkhir = perKegiatan.reduce((sum, k) => sum + (k.nilai * k.bobot) / 100, 0);
  return { opdId, perKegiatan, nilaiAkhir: bulatkan1(nilaiAkhir) };
}

/** Rekap semua OPD + rata-rata keseluruhan, untuk dashboard admin. */
export function rekapSemuaOpd() {
  const baris = OPD_LIST.map((opd) => ({ opd, ...rekapOpd(opd.id) }));
  const rataRata =
    baris.length === 0 ? 0 : bulatkan1(baris.reduce((s, b) => s + b.nilaiAkhir, 0) / baris.length);
  return { baris, rataRata };
}