import { Suspense } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DOKUMEN_LIST, KEGIATAN_LIST, TAHAP_LIST } from "@/data/dummy";
import { rekapSemuaOpd } from "@/lib/rekap";
import { STATUS_LABEL, type StatusDokumen } from "@/lib/types";
import RekapClient from "./RekapClient";

const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

type SearchParams = Promise<{ kegiatan?: string }>;

export default function HalamanPimpinan({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary">Ringkasan Monev</h1>
      <p className="mt-1 text-ink-muted">
        Perkembangan kelengkapan dokumen dan nilai seluruh OPD.
      </p>

      {/* isi bergantung pada ?kegiatan=, jadi dialirkan di balik Suspense */}
      <Suspense fallback={<p className="mt-6 text-sm text-ink-muted">Memuat ringkasan…</p>}>
        <IsiPimpinan searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function IsiPimpinan({ searchParams }: { searchParams: SearchParams }) {
  const { kegiatan: kegiatanParam } = await searchParams;
  const kegiatan = KEGIATAN_LIST.find((k) => k.id === kegiatanParam) ?? KEGIATAN_LIST[0];

  const semuaStatus = Object.keys(STATUS_LABEL) as StatusDokumen[];
  const jumlah: Record<StatusDokumen, number> = { belum: 0, menunggu: 0, disetujui: 0, revisi: 0 };
  for (const d of DOKUMEN_LIST) {
    if (d.kegiatanId === kegiatan.id) jumlah[d.status] += 1;
  }
  const total = semuaStatus.reduce((s, k) => s + jumlah[k], 0);

  const { baris, rataRata } = rekapSemuaOpd(kegiatan.id);

  // OPD lengkap = semua item di ketiga tahap sudah disetujui
  const opdLengkap = baris.filter((b) => b.perTahap.every((t) => t.kelengkapan === 100)).length;

  return (
    <>
      {/* pilih kegiatan */}
      <div className="mt-6 flex flex-wrap gap-2">
        {KEGIATAN_LIST.map((k) => {
          const aktif = k.id === kegiatan.id;
          return (
            <Link
              key={k.id}
              href={`/pimpinan?kegiatan=${k.id}`}
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

      {/* ringkasan utama */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-ink-muted">Rata-rata nilai akhir seluruh OPD</p>
          <p className="tabular mt-3 text-3xl font-semibold text-primary">{fmt(rataRata)}</p>
        </div>
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <p className="text-sm text-ink-muted">OPD dengan dokumen lengkap</p>
          <p className="tabular mt-3 text-3xl font-semibold text-primary">
            {opdLengkap}
            <span className="text-lg font-normal text-ink-muted"> dari {baris.length} OPD</span>
          </p>
        </div>
      </div>

      {/* jumlah dokumen per status */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <RekapClient baris={baris} tahap={TAHAP_LIST} rataRata={rataRata} />
    </>
  );
}