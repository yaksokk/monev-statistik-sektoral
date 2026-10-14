import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DOKUMEN_LIST, ITEM_LIST, KEGIATAN_LIST, TAHAP_LIST } from "@/data/dummy";
import { ambilOperator } from "@/lib/operator";
import { hitungKelengkapan, hitungStatus, rekapOpd } from "@/lib/rekap";
import { STATUS_LABEL, type StatusDokumen } from "@/lib/types";

const URUTAN_STATUS: StatusDokumen[] = ["belum", "menunggu", "disetujui", "revisi"];

function formatTanggal(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNilai(n: number) {
  return n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

export default async function DashboardOpdPage({
  searchParams,
}: {
  searchParams: Promise<{ kegiatan?: string }>;
}) {
  const { kegiatan: kegiatanId } = await searchParams;
  const { opd } = await ambilOperator();

  const kegiatan =
    KEGIATAN_LIST.find((k) => k.id === kegiatanId) ?? KEGIATAN_LIST[0];

  const jumlahStatus = hitungStatus(opd.id, kegiatan.id);
  const rekap = rekapOpd(opd.id, kegiatan.id);

  const perluRevisi = DOKUMEN_LIST.filter(
    (d) =>
      d.opdId === opd.id && d.kegiatanId === kegiatan.id && d.status === "revisi",
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Dashboard OPD</h1>
        <p className="mt-1 text-sm text-ink-muted">{opd.nama}</p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Pilih kegiatan">
        {KEGIATAN_LIST.map((k) => {
          const aktif = k.id === kegiatan.id;
          return (
            <Link
              key={k.id}
              href={`/opd/dashboard?kegiatan=${k.id}`}
              aria-current={aktif ? "page" : undefined}
              className={
                aktif
                  ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-ink hover:bg-surface-muted"
              }
            >
              {k.nama}
            </Link>
          );
        })}
      </nav>

      <section
        aria-label="Ringkasan status dokumen"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {URUTAN_STATUS.map((status) => (
          <div
            key={status}
            className="rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <StatusBadge status={status} />
            <p className="tabular mt-3 text-3xl font-semibold text-ink">
              {jumlahStatus[status]}
            </p>
            <p className="text-xs text-ink-muted">dokumen</p>
          </div>
        ))}
      </section>

      <section aria-label="Progres per tahap" className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold text-ink">Progres per tahap</h2>
          <p className="text-sm text-ink-muted">
            Nilai akhir sementara:{" "}
            <span className="tabular font-semibold text-ink">
              {formatNilai(rekap.nilaiAkhir)}
            </span>
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {TAHAP_LIST.map((tahap) => {
            const kelengkapan = hitungKelengkapan(opd.id, kegiatan.id, tahap.id);
            const ujian = rekap.perTahap.find((t) => t.tahapId === tahap.id)?.ujian;
            const totalItem = ITEM_LIST.filter((i) => i.tahapId === tahap.id).length;

            return (
              <article
                key={tahap.id}
                className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink">{tahap.nama}</h3>
                  <span className="tabular rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                    {tahap.bobot}%
                  </span>
                </div>

                <p className="mt-1 text-xs text-ink-muted">
                  Tenggat {formatTanggal(kegiatan.tenggat[tahap.id])} · {totalItem} item
                </p>

                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted">Kelengkapan</span>
                    <span className="tabular font-medium text-ink">
                      {formatNilai(kelengkapan)}%
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted"
                    role="progressbar"
                    aria-valuenow={Math.round(kelengkapan)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Kelengkapan ${tahap.nama}`}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${kelengkapan}%` }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-sm text-ink-muted">
                  Nilai ujian:{" "}
                  <span className="tabular font-medium text-ink">
                    {ujian == null ? "Belum ada" : formatNilai(ujian)}
                  </span>
                </p>

                <Link
                  href={`/opd/unggah?kegiatan=${kegiatan.id}&tahap=${tahap.id}`}
                  className="mt-5 rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-hover"
                >
                  Lihat &amp; unggah
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {perluRevisi.length > 0 && (
        <section
          aria-label="Dokumen perlu revisi"
          className="rounded-card border border-line bg-surface p-5 shadow-card"
        >
          <h2 className="text-lg font-semibold text-ink">
            {STATUS_LABEL.revisi} ({perluRevisi.length})
          </h2>
          <ul className="mt-3 divide-y divide-line">
            {perluRevisi.map((d) => {
              const item = ITEM_LIST.find((i) => i.id === d.itemId);
              return (
                <li
                  key={d.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{item?.nama}</p>
                    <p className="text-sm text-ink-muted">
                      {d.catatanRevisi ?? "Tanpa catatan dari admin."}
                    </p>
                  </div>
                  <Link
                    href={`/opd/unggah?kegiatan=${kegiatan.id}&tahap=${d.tahapId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Perbaiki
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}