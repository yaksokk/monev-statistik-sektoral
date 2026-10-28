import Link from "next/link";
import {
  BookOpen,
  Boxes,
  Check,
  Flag,
  ListChecks,
  Medal,
  Network,
  RefreshCw,
  Table,
} from "lucide-react";

export interface BabRingkas {
  id: string;
  urutan: number;
  judul: string;
  selesai: boolean;
}

// ikon mengikuti urutan bab; bab di luar daftar memakai BookOpen
const IKON_BAB = [Flag, Boxes, Network, RefreshCw, Table, Medal];

export default function PanelModul({ babList }: { babList: BabRingkas[] }) {
  return (
    <section
      aria-labelledby="judul-modul"
      className="rounded-card border border-line bg-surface p-5 shadow-card"
    >
      <h2 id="judul-modul" className="flex items-center gap-2 text-lg font-semibold text-ink">
        <ListChecks className="size-5 text-navy-500" aria-hidden />
        Progress Penuntasan Modul (Bab)
      </h2>

      {babList.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">Belum ada bab modul.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {babList.map((bab) => {
            const Ikon = IKON_BAB[bab.urutan - 1] ?? BookOpen;
            return (
              <li
                key={bab.id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                  bab.selesai
                    ? "border-status-disetujui-fg/30 bg-status-disetujui-bg"
                    : "border-line bg-surface-muted"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3 text-ink">
                  <Ikon className="size-4 shrink-0 text-navy-500" aria-hidden />
                  <span className="truncate">
                    Bab {bab.urutan}: {bab.judul}
                  </span>
                </span>

                {bab.selesai ? (
                  <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-status-disetujui-fg">
                    <Check className="size-4" aria-hidden />
                    Selesai
                  </span>
                ) : (
                  <Link
                    href={`/opd/modul-pembelajaran?bab=${bab.id}`}
                    className="shrink-0 font-semibold text-primary hover:underline"
                  >
                    Pelajari
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}