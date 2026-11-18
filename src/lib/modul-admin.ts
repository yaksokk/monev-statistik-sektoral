import type { BabModul, BabSelesai, Pengguna } from "@/lib/types";

export type Pembinaan = BabModul["pembinaan"];
export const DAFTAR_PEMBINAAN: Pembinaan[] = [1, 2];

// Urutan bab dan penomorannya sekarang dijaga fungsi SQL (supabase/migrasi-5-modul.sql)

export function babModul(semua: BabModul[], modulId: string) {
  return semua.filter((b) => b.modulId === modulId).sort((a, b) => a.urutan - b.urutan);
}

export function jumlahSelesaiBab(selesai: BabSelesai[], babId: string) {
  return selesai.filter((s) => s.babId === babId).length;
}

// Pegawai yang sudah dan belum menandai satu bab selesai (urutan mengikuti pegawaiList)
export function pantauBab(babId: string, selesai: BabSelesai[], pegawaiList: Pengguna[]) {
  const catatan = new Map(
    selesai.filter((s) => s.babId === babId).map((s) => [s.penggunaId, s.selesaiPada]),
  );
  return {
    sudah: pegawaiList
      .filter((p) => catatan.has(p.id))
      .map((pegawai) => ({ pegawai, selesaiPada: catatan.get(pegawai.id)! })),
    belum: pegawaiList.filter((p) => !catatan.has(p.id)),
  };
}