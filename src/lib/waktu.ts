// Waktu aplikasi memakai WITA (UTC+8) tetap. Teks lokal "yyyy-mm-ddTHH:mm" <-> timestamptz.
const OFFSET_MS = 8 * 60 * 60 * 1000;
const POLA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function waktuValid(teks: string): boolean {
  if (!POLA.test(teks)) return false;
  const d = new Date(`${teks}:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 16) === teks;
}

// "2026-10-08T08:00" (WITA) -> ISO dengan zona, siap disimpan ke timestamptz
export function lokalKeIso(teks: string): string {
  return `${teks}:00+08:00`;
}

// timestamptz dari database -> "yyyy-mm-ddTHH:mm" WITA
export function isoKeLokal(iso: string): string {
  return new Date(new Date(iso).getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

export function sekarangWita(): string {
  return isoKeLokal(new Date().toISOString());
}