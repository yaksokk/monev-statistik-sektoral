import type { ReactNode } from "react";
import { formatWaktu } from "@/lib/presensi";
import type { StatusWaktuQuiz } from "@/lib/quiz";

const dasarTombol =
  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
export const tombolUtama = `${dasarTombol} bg-primary text-white hover:bg-primary-hover`;
export const tombolSekunder = `${dasarTombol} border border-line bg-surface text-ink hover:bg-surface-muted`;
export const tombolBahaya = `${dasarTombol} bg-status-revisi-fg text-white hover:opacity-90`;
export const kolomInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary disabled:bg-surface-muted disabled:text-ink-muted";
export const kartu = "rounded-card border border-line bg-surface p-4 shadow-card sm:p-5";

export const LENCANA = {
  hijau: "bg-status-disetujui-bg text-status-disetujui-fg",
  kuning: "bg-status-menunggu-bg text-status-menunggu-fg",
  abu: "bg-status-belum-bg text-status-belum-fg",
  merah: "bg-status-revisi-bg text-status-revisi-fg",
  netral: "bg-surface-muted text-ink-muted",
};

export const LABEL_STATUS_WAKTU: Record<StatusWaktuQuiz, string> = {
  belum_dibuka: "Belum dibuka",
  dibuka: "Dibuka",
  ditutup: "Ditutup",
};

export const GAYA_STATUS_WAKTU: Record<StatusWaktuQuiz, string> = {
  belum_dibuka: LENCANA.netral,
  dibuka: LENCANA.hijau,
  ditutup: LENCANA.abu,
};

export const LEBAR_DIALOG = "w-[min(40rem,calc(100%-2rem))]";

export function Lencana({ kelas, children }: { kelas: string; children: ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${kelas}`}>
      {children}
    </span>
  );
}

export function teksWaktu(waktu: string | null, kosong: string) {
  if (!waktu) return kosong;
  const { tanggal, jam } = formatWaktu(waktu);
  return `${tanggal}, ${jam}`;
}

export function ringkas(teks: string, maks = 60) {
  return teks.length > maks ? `${teks.slice(0, maks).trimEnd()}…` : teks;
}