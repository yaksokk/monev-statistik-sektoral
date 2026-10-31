import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronRight, Clock, type LucideIcon } from "lucide-react";
import { formatWaktu } from "@/lib/presensi";
import type { PerluTindakan } from "@/lib/ringkasan-admin";

// Daftar OPD dipotong supaya satu butir tidak terlalu panjang
const TAMPIL_OPD = 5;

function Butir({
  href,
  ikon: Ikon,
  judul,
  children,
}: {
  href: string;
  ikon: LucideIcon;
  judul: string;
  children?: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 px-5 py-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-status-menunggu-bg text-status-menunggu-fg">
          <Ikon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{judul}</span>
          {children && <span className="mt-0.5 block text-xs text-ink-muted">{children}</span>}
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden />
      </Link>
    </li>
  );
}

export default function PerluTindakanAdmin({
  tindakan,
  arsip,
}: {
  tindakan: PerluTindakan;
  arsip: boolean;
}) {
  const { quizMendekatiBatas, hariDekat } = tindakan;
  const kosong = quizMendekatiBatas.length === 0;

  return (
    <section
      aria-labelledby="judul-tindakan"
      className="mt-6 overflow-hidden rounded-card border border-line bg-surface shadow-card"
    >
      <div className="border-b border-line px-5 py-4">
        <h2 id="judul-tindakan" className="text-base font-semibold text-ink">
          Perlu tindakan admin
        </h2>
        <p className="text-sm text-ink-muted">
          Quiz dengan batas akhir dalam {hariDekat} hari dan OPD yang belum mengerjakan.
        </p>
      </div>

      {arsip ? (
        <p className="px-5 py-4 text-sm text-ink-muted">
          Kegiatan arsip hanya bisa dilihat, tidak ada tindakan.
        </p>
      ) : kosong ? (
        <p className="flex items-center gap-2 px-5 py-4 text-sm text-ink-muted">
          <Check className="size-4 text-status-disetujui-fg" aria-hidden />
          Tidak ada yang perlu ditindak saat ini.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {quizMendekatiBatas.map((q) => {
            const { tanggal, jam } = formatWaktu(q.batasAkhir);
            const sisa = q.opdBelum.length - TAMPIL_OPD;
            return (
              <Butir
                key={q.jenis}
                href="/admin/quiz"
                ikon={Clock}
                judul={`${q.opdBelum.length} OPD belum mengerjakan ${q.label}`}
              >
                Batas akhir {tanggal}, {jam} ({q.sisaHari} hari lagi):{" "}
                {q.opdBelum
                  .slice(0, TAMPIL_OPD)
                  .map((o) => o.singkatan)
                  .join(", ")}
                {sisa > 0 && ` dan ${sisa} lainnya`}
              </Butir>
            );
          })}
        </ul>
      )}
    </section>
  );
}