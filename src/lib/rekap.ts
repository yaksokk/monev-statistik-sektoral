import {
  DOKUMEN_LIST,
  ITEM_LIST,
  NILAI_UJIAN_LIST,
  OPD_LIST,
  TAHAP_LIST,
} from "@/data/dummy";
import type { StatusDokumen } from "@/lib/types";

/** Jumlah dokumen per status untuk satu OPD pada satu kegiatan (opsional per tahap). */
export function hitungStatus(opdId: string, kegiatanId: string, tahapId?: string) {
  const hasil: Record<StatusDokumen, number> = { belum: 0, menunggu: 0, disetujui: 0, revisi: 0 };
  for (const d of DOKUMEN_LIST) {
    if (d.opdId !== opdId || d.kegiatanId !== kegiatanId) continue;
    if (tahapId && d.tahapId !== tahapId) continue;
    hasil[d.status] += 1;
  }
  return hasil;
}

/** Nilai kelengkapan (0–100): persentase item yang berstatus "disetujui". */
export function hitungKelengkapan(opdId: string, kegiatanId: string, tahapId: string) {
  const total = ITEM_LIST.filter((i) => i.tahapId === tahapId).length;
  const disetujui = hitungStatus(opdId, kegiatanId, tahapId).disetujui;
  return Math.round((disetujui / total) * 100);
}

export function ambilNilaiUjian(opdId: string, tahapId: string) {
  return NILAI_UJIAN_LIST.find((n) => n.opdId === opdId && n.tahapId === tahapId)?.nilai ?? null;
}

/**
 * Rekap nilai satu OPD pada satu kegiatan.
 * RUMUS SEMENTARA: nilai tahap = rata-rata(kelengkapan, ujian), ujian kosong dihitung 0.
 * Ganti setelah rumus resmi disepakati.
 */
export function rekapOpd(opdId: string, kegiatanId: string) {
  const perTahap = TAHAP_LIST.map((tahap) => {
    const kelengkapan = hitungKelengkapan(opdId, kegiatanId, tahap.id);
    const ujian = ambilNilaiUjian(opdId, tahap.id);
    const nilai = (kelengkapan + (ujian ?? 0)) / 2;
    return { tahapId: tahap.id, bobot: tahap.bobot, kelengkapan, ujian, nilai };
  });
  const nilaiAkhir = perTahap.reduce((sum, t) => sum + (t.nilai * t.bobot) / 100, 0);
  return { opdId, perTahap, nilaiAkhir: Math.round(nilaiAkhir * 10) / 10 };
}

/** Rekap semua OPD + rata-rata keseluruhan, untuk dashboard admin. */
export function rekapSemuaOpd(kegiatanId: string) {
  const baris = OPD_LIST.map((opd) => ({ opd, ...rekapOpd(opd.id, kegiatanId) }));
  const rataRata =
    Math.round((baris.reduce((s, b) => s + b.nilaiAkhir, 0) / baris.length) * 10) / 10;
  return { baris, rataRata };
}
