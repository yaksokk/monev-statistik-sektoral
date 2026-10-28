import Link from "next/link";
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { StatusDokumen } from "@/lib/types";

export interface BarisDokumen {
  id: string;
  nama: string;
  status: StatusDokumen;
}

interface Props {
  namaKegiatan: string | null; // null = tidak ada kegiatan aktif
  baris: BarisDokumen[];
}

export default function PanelDokumen({ namaKegiatan, baris }: Props) {
  const disetujui = baris.filter((b) => b.status === "disetujui").length;
  const persen = baris.length === 0 ? 0 : (disetujui / baris.length) * 100;

  return (
    <section
      aria-labelledby="judul-dokumen"
      className="rounded-card border border-line bg-surface p-5 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="judul-dokumen" className="flex items-center gap-2 text-lg font-semibold text-ink">
            <FileText className="size-5 text-navy-500" aria-hidden />
            Kelengkapan Dokumen
          </h2>
          {namaKegiatan && <p className="mt-1 text-sm text-ink-muted">{namaKegiatan}</p>}
        </div>
        {namaKegiatan && (
          <Link
            href="/opd/daftar-dokumen"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Buka Daftar Dokumen
          </Link>
        )}
      </div>

      {!namaKegiatan ? (
        <p className="mt-4 text-sm text-ink-muted">Belum ada kegiatan yang aktif.</p>
      ) : (
        <>
          <div className="mt-4">
            <p className="tabular text-sm text-ink-muted">
              <span className="font-semibold text-ink">{disetujui}</span> dari {baris.length}{" "}
              dokumen disetujui
            </p>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={Math.round(persen)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Kelengkapan dokumen"
            >
              <div className="h-full rounded-full bg-primary" style={{ width: `${persen}%` }} />
            </div>
          </div>

          <ul className="mt-4 grid gap-2.5 lg:grid-cols-2">
            {baris.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-muted px-4 py-3 text-sm text-ink"
              >
                <span className="min-w-0 truncate">{b.nama}</span>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}