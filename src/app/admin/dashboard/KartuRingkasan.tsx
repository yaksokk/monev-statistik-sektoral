import {
  Award,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { AMBANG_POSTTEST, formatNGain } from "@/lib/dashboard";
import { formatNilai } from "@/lib/quiz";
import type { RingkasanKegiatan } from "@/lib/ringkasan-admin";
import type { Kegiatan } from "@/lib/types";

export type IdKartu = "lulus" | "kehadiran" | "pretest" | "posttest" | "ngain" | "dokumen";

export interface DefKartu {
  id: IdKartu;
  ikon: LucideIcon;
  label: string;
  nilai: string;
  keterangan: string;
  warna: keyof typeof WARNA;
}

// Warna sama dengan KartuMetrik sisi OPD
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

const nilaiAtauStrip = (n: number | null) => (n === null ? "-" : formatNilai(n));

// Kartu yang quiz-nya dimatikan di Kelola Kegiatan tidak dibuat sama sekali
export function susunKartu(kegiatan: Kegiatan, r: RingkasanKegiatan): DefKartu[] {
  const syarat = [`Kehadiran ≥ ${kegiatan.ambangKehadiran}%`];
  if (r.aktif.posttest) syarat.push(`Post-Test ≥ ${AMBANG_POSTTEST}`);

  const kartu: DefKartu[] = [
    {
      id: "lulus",
      ikon: Award,
      label: "OPD lulus",
      nilai: `${r.lulus} dari ${r.totalOpd}`,
      keterangan: syarat.join(", "),
      warna: "hijau",
    },
    {
      id: "kehadiran",
      ikon: CalendarCheck,
      label: "Rata-rata kehadiran",
      nilai: `${formatNilai(r.rataKehadiran)}%`,
      keterangan: `Minimal ${kegiatan.ambangKehadiran}% untuk lulus`,
      warna: "navy",
    },
  ];

  if (r.aktif.pretest) {
    kartu.push({
      id: "pretest",
      ikon: ClipboardList,
      label: "Rata-rata Pre-Test",
      nilai: nilaiAtauStrip(r.preTest.rata),
      keterangan: `${r.preTest.jumlah} dari ${r.preTest.total} OPD sudah mengerjakan`,
      warna: "netral",
    });
  }
  if (r.aktif.posttest) {
    kartu.push({
      id: "posttest",
      ikon: ClipboardCheck,
      label: "Rata-rata Post-Test",
      nilai: nilaiAtauStrip(r.postTest.rata),
      keterangan: `${r.postTest.jumlah} dari ${r.postTest.total} OPD sudah mengerjakan`,
      warna: "navy",
    });
  }
  if (r.nGainTersedia) {
    kartu.push({
      id: "ngain",
      ikon: TrendingUp,
      label: "Rata-rata N-Gain",
      nilai: r.nGain.rata === null ? "-" : formatNGain(r.nGain.rata),
      keterangan: `${r.nGain.jumlah} OPD punya nilai Pre-Test dan Post-Test`,
      warna: "netral",
    });
  }

  kartu.push({
    id: "dokumen",
    ikon: FileCheck,
    label: "Kelengkapan dokumen",
    nilai: `${formatNilai(r.dokumen.rataKelengkapan)}%`,
    keterangan: `${r.dokumen.totalDokumen} dokumen dari seluruh OPD`,
    warna: "amber",
  });

  return kartu;
}

type Props = Omit<DefKartu, "id">;

// Kartu hanya tampilan ringkasan; semua rekap ada di tabel di bawahnya
export default function KartuRingkasan({
  ikon: Ikon,
  label,
  nilai,
  keterangan,
  warna,
}: Props) {
  const w = WARNA[warna];
  return (
    <div className={`flex w-full items-center gap-4 rounded-card border p-4 shadow-card ${w.kartu}`}>
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