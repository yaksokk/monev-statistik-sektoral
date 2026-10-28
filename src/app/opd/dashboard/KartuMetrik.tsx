import type { LucideIcon } from "lucide-react";

const WARNA = {
  navy: {
    kartu: "border-navy-100 bg-primary-soft",
    ikon: "bg-primary text-white",
    nilai: "text-primary",
  },
  amber: {
    kartu: "border-status-menunggu-bg bg-status-menunggu-bg/40",
    ikon: "bg-status-menunggu-fg text-status-menunggu-bg",
    nilai: "text-status-menunggu-fg",
  },
  hijau: {
    kartu: "border-status-disetujui-bg bg-status-disetujui-bg/40",
    ikon: "bg-status-disetujui-fg text-status-disetujui-bg",
    nilai: "text-status-disetujui-fg",
  },
  netral: {
    kartu: "border-line bg-surface-muted",
    ikon: "bg-navy-500 text-white",
    nilai: "text-navy-600",
  },
};

interface Props {
  ikon: LucideIcon;
  label: string;
  nilai: string;
  keterangan: string;
  warna: keyof typeof WARNA;
}

export default function KartuMetrik({ ikon: Ikon, label, nilai, keterangan, warna }: Props) {
  const w = WARNA[warna];
  return (
    <div className={`flex items-center gap-4 rounded-card border p-4 shadow-card ${w.kartu}`}>
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${w.ikon}`}>
        <Ikon className="size-6" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink-muted">{label}</p>
        <p className={`tabular text-2xl font-bold ${w.nilai}`}>{nilai}</p>
        <p className="text-xs text-ink-muted">{keterangan}</p>
      </div>
    </div>
  );
}