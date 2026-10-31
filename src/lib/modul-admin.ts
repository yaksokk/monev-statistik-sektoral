import type { BabModul, BabSelesai, Opd } from "@/lib/types";

export type Pembinaan = BabModul["pembinaan"];
export const DAFTAR_PEMBINAAN: Pembinaan[] = [1, 2];

// Dipakai agar bab baru atau yang pindah pembinaan jatuh di urutan terakhir kelompoknya
export const URUTAN_TERAKHIR = Number.MAX_SAFE_INTEGER;

export function babModul(semua: BabModul[], modulId: string) {
  return semua.filter((b) => b.modulId === modulId).sort((a, b) => a.urutan - b.urutan);
}

// Pembinaan 1 di depan Pembinaan 2, lalu nomor bab dirapatkan 1..n
export function rapikanBab(semua: BabModul[], modulId: string): BabModul[] {
  const lain = semua.filter((b) => b.modulId !== modulId);
  const sendiri = semua
    .filter((b) => b.modulId === modulId)
    .sort((a, b) => a.pembinaan - b.pembinaan || a.urutan - b.urutan)
    .map((b, i) => ({ ...b, urutan: i + 1 }));
  return [...lain, ...sendiri];
}

// Tukar urutan dengan bab di sebelahnya, hanya dalam pembinaan yang sama
export function geserBab(semua: BabModul[], id: string, arah: -1 | 1): BabModul[] {
  const bab = semua.find((b) => b.id === id);
  if (!bab) return semua;
  const sebaya = semua
    .filter((b) => b.modulId === bab.modulId && b.pembinaan === bab.pembinaan)
    .sort((a, b) => a.urutan - b.urutan);
  const tetangga = sebaya[sebaya.findIndex((b) => b.id === id) + arah];
  if (!tetangga) return semua;
  return semua.map((b) =>
    b.id === bab.id
      ? { ...b, urutan: tetangga.urutan }
      : b.id === tetangga.id
        ? { ...b, urutan: bab.urutan }
        : b,
  );
}

export function idBabBaru(semua: BabModul[], modulId: string) {
  const maks = semua.reduce((m, b) => {
    const cocok = /-b(\d+)$/.exec(b.id);
    return cocok ? Math.max(m, Number(cocok[1])) : m;
  }, 0);
  return `${modulId}-b${maks + 1}`;
}

export function jumlahSelesaiBab(selesai: BabSelesai[], babId: string) {
  return selesai.filter((s) => s.babId === babId).length;
}

// OPD yang sudah dan belum menandai satu bab selesai
export function pantauBab(babId: string, selesai: BabSelesai[], opdList: Opd[]) {
  const catatan = new Map(selesai.filter((s) => s.babId === babId).map((s) => [s.opdId, s.selesaiPada]));
  return {
    sudah: opdList
      .filter((o) => catatan.has(o.id))
      .map((opd) => ({ opd, selesaiPada: catatan.get(opd.id)! })),
    belum: opdList.filter((o) => !catatan.has(o.id)),
  };
}