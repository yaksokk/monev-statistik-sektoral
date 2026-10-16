import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DOKUMEN_LIST, ITEM_LIST, KEGIATAN_LIST } from "@/data/dummy";
import { ambilOperator } from "@/lib/operator";
import { hitungStatus, rekapOpd } from "@/lib/rekap";
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

export default async function DashboardOpdPage() {
  const { opd } = await ambilOperator();
  const rekap = rekapOpd(opd.id);

  // jumlah dokumen per status, dijumlahkan dari semua kegiatan
  const jumlahStatus: Record<StatusDokumen, number> = {
    belum: 0,
    menunggu: 0,
    disetujui: 0,
    revisi: 0,
  };
  for (const k of KEGIATAN_LIST) {
    const per = hitungStatus(opd.id, k.id);
    for (const s of URUTAN_STATUS) jumlahStatus[s] += per[s];
  }

  const perluRevisi = DOKUMEN_LIST.filter(
    (d) => d.opdId === opd.id && d.status === "revisi",
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Dashboard OPD</h1>
        <p className="mt-1 text-sm text-ink-muted">{opd.nama}</p>
      </header>

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
            <p className="text-xs text-ink-muted">dokumen, semua kegiatan</p>
          </div>
        ))}
      </section>

      <section aria-label="Progres per kegiatan" className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold text-ink">Progres per kegiatan</h2>
          <p className="text-sm text-ink-muted">
            Nilai akhir sementara:{" "}
            <span className="tabular font-semibold text-ink">
              {formatNilai(rekap.nilaiAkhir)}
            </span>
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {KEGIATAN_LIST.map((kegiatan) => {
            const data = rekap.perKegiatan.find((k) => k.kegiatanId === kegiatan.id);
            const kelengkapan = data?.kelengkapan ?? 0;
            const ujian = data?.ujian ?? null;

            return (
              <article
                key={kegiatan.id}
                className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink">{kegiatan.nama}</h3>
                  <span className="tabular rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                    Bobot {kegiatan.bobot}%
                  </span>
                </div>

                <p className="mt-1 text-xs text-ink-muted">
                  Tenggat {formatTanggal(kegiatan.tenggat)} · {ITEM_LIST.length} item
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
                    aria-label={`Kelengkapan ${kegiatan.nama}`}
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
                  href={`/opd/unggah?kegiatan=${kegiatan.id}`}
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
              const kegiatan = KEGIATAN_LIST.find((k) => k.id === d.kegiatanId);
              return (
                <li
                  key={d.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{item?.nama}</p>
                    <p className="text-xs text-ink-muted">{kegiatan?.nama}</p>
                    <p className="text-sm text-ink-muted">
                      {d.catatanRevisi ?? "Tanpa catatan dari admin."}
                    </p>
                  </div>
                  <Link
                    href={`/opd/unggah?kegiatan=${d.kegiatanId}`}
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