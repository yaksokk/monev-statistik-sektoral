import { Suspense } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DOKUMEN_LIST, KEGIATAN_LIST, TAHAP_LIST } from "@/data/dummy";
import { rekapSemuaOpd } from "@/lib/rekap";
import { STATUS_LABEL, type StatusDokumen } from "@/lib/types";

const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

type SearchParams = Promise<{ kegiatan?: string }>;

export default function DashboardAdmin({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
      <p className="mt-1 text-ink-muted">Ringkasan kelengkapan dokumen seluruh OPD.</p>

      {/* isi bergantung pada ?kegiatan=, jadi dialirkan di balik Suspense */}
      <Suspense fallback={<p className="mt-6 text-sm text-ink-muted">Memuat ringkasan…</p>}>
        <IsiDashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function IsiDashboard({ searchParams }: { searchParams: SearchParams }) {
  const { kegiatan: kegiatanParam } = await searchParams;
  const kegiatan = KEGIATAN_LIST.find((k) => k.id === kegiatanParam) ?? KEGIATAN_LIST[0];

  // jumlah dokumen per status untuk kegiatan terpilih
  const semuaStatus = Object.keys(STATUS_LABEL) as StatusDokumen[];
  const jumlah: Record<StatusDokumen, number> = { belum: 0, menunggu: 0, disetujui: 0, revisi: 0 };
  for (const d of DOKUMEN_LIST) {
    if (d.kegiatanId === kegiatan.id) jumlah[d.status] += 1;
  }
  const total = semuaStatus.reduce((s, k) => s + jumlah[k], 0);

  const { baris, rataRata } = rekapSemuaOpd(kegiatan.id);

  return (
    <>
      {/* pilih kegiatan */}
      <div className="mt-6 flex flex-wrap gap-2">
        {KEGIATAN_LIST.map((k) => {
          const aktif = k.id === kegiatan.id;
          return (
            <Link
              key={k.id}
              href={`/admin/dashboard?kegiatan=${k.id}`}
              aria-current={aktif ? "page" : undefined}
              className={
                aktif
                  ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                  : "rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink-muted hover:bg-surface-muted"
              }
            >
              {k.nama}
            </Link>
          );
        })}
      </div>

      {/* ringkasan status */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {semuaStatus.map((s) => (
          <div key={s} className="rounded-card border border-line bg-surface p-5 shadow-card">
            <StatusBadge status={s} />
            <p className="tabular mt-4 text-3xl font-semibold text-ink">{jumlah[s]}</p>
            <p className="tabular mt-1 text-sm text-ink-muted">
              {total > 0 ? Math.round((jumlah[s] / total) * 100) : 0}% dari {total} dokumen
            </p>
          </div>
        ))}
      </div>

      {/* rekap nilai per OPD */}
      <div className="mt-8 overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Rekap nilai per OPD</h2>
          <p className="text-sm text-ink-muted">
            Nilai tahap = rata-rata kelengkapan dan ujian (rumus sementara).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-ink-muted">
              <tr>
                <th className="px-5 py-3 font-medium">OPD</th>
                {TAHAP_LIST.map((t) => (
                  <th key={t.id} className="px-5 py-3 font-medium">
                    {t.nama} <span className="font-normal">({t.bobot}%)</span>
                  </th>
                ))}
                <th className="px-5 py-3 text-right font-medium">Nilai akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {baris.map((b) => (
                <tr key={b.opd.id}>
                  <td className="px-5 py-3 font-medium text-ink">{b.opd.nama}</td>
                  {b.perTahap.map((t) => (
                    <td key={t.tahapId} className="tabular px-5 py-3">
                      <span className="font-medium text-ink">{fmt(t.nilai)}</span>
                      <span className="block text-xs text-ink-muted">
                        Kelengkapan {fmt(t.kelengkapan)} · Ujian {t.ujian ?? "-"}
                      </span>
                    </td>
                  ))}
                  <td className="tabular px-5 py-3 text-right font-semibold text-primary">
                    {fmt(b.nilaiAkhir)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-line bg-surface-muted">
              <tr>
                <td className="px-5 py-3 font-semibold text-ink" colSpan={TAHAP_LIST.length + 1}>
                  Rata-rata seluruh OPD
                </td>
                <td className="tabular px-5 py-3 text-right font-semibold text-primary">
                  {fmt(rataRata)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
