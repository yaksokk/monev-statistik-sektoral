"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import type { rekapSemuaOpd } from "@/lib/rekap";
import type { Tahap } from "@/lib/types";

type Baris = ReturnType<typeof rekapSemuaOpd>["baris"][number];
type Kunci = "nama" | "akhir";
type Arah = "asc" | "desc";

const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });

function TombolUrut({
  label,
  kunci,
  urut,
  onUrut,
}: {
  label: string;
  kunci: Kunci;
  urut: { kunci: Kunci; arah: Arah } | null;
  onUrut: (k: Kunci) => void;
}) {
  const aktif = urut?.kunci === kunci;
  const Ikon = !aktif ? ArrowUpDown : urut.arah === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onUrut(kunci)}
      className="inline-flex items-center gap-1.5 font-medium hover:text-ink"
    >
      {label}
      <Ikon className="size-3.5" aria-hidden />
    </button>
  );
}

export default function RekapClient({
  baris,
  tahap,
  rataRata,
}: {
  baris: Baris[];
  tahap: Tahap[];
  rataRata: number;
}) {
  const [cari, setCari] = useState("");
  const [urut, setUrut] = useState<{ kunci: Kunci; arah: Arah } | null>(null);

  function ubahUrut(kunci: Kunci) {
    setUrut((lama) => {
      if (lama?.kunci === kunci) return { kunci, arah: lama.arah === "asc" ? "desc" : "asc" };
      return { kunci, arah: kunci === "nama" ? "asc" : "desc" };
    });
  }

  const tampil = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    const hasil = baris.filter(
      (b) =>
        !kata ||
        b.opd.nama.toLowerCase().includes(kata) ||
        b.opd.singkatan.toLowerCase().includes(kata),
    );
    if (!urut) return hasil;

    const arah = urut.arah === "asc" ? 1 : -1;
    return [...hasil].sort((a, b) =>
      urut.kunci === "nama"
        ? a.opd.nama.localeCompare(b.opd.nama, "id") * arah
        : (a.nilaiAkhir - b.nilaiAkhir) * arah,
    );
  }, [baris, cari, urut]);

  return (
    <div className="mt-8 overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink">Rekap nilai per OPD</h2>
          <p className="text-sm text-ink-muted">
            Nilai tahap = rata-rata kelengkapan dan ujian (rumus sementara).
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari OPD"
            aria-label="Cari OPD"
            className="w-full rounded-lg border border-line bg-surface py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-ink-muted">
            <tr>
              <th
                className="px-5 py-3"
                aria-sort={
                  urut?.kunci === "nama" ? (urut.arah === "asc" ? "ascending" : "descending") : "none"
                }
              >
                <TombolUrut label="OPD" kunci="nama" urut={urut} onUrut={ubahUrut} />
              </th>
              {tahap.map((t) => (
                <th key={t.id} className="px-5 py-3 font-medium">
                  {t.nama} <span className="font-normal">({t.bobot}%)</span>
                </th>
              ))}
              <th
                className="px-5 py-3 text-right"
                aria-sort={
                  urut?.kunci === "akhir" ? (urut.arah === "asc" ? "ascending" : "descending") : "none"
                }
              >
                <TombolUrut label="Nilai akhir" kunci="akhir" urut={urut} onUrut={ubahUrut} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tampil.length === 0 && (
              <tr>
                <td
                  colSpan={tahap.length + 2}
                  className="px-5 py-8 text-center text-ink-muted"
                >
                  Tidak ada OPD yang cocok dengan pencarian.
                </td>
              </tr>
            )}
            {tampil.map((b) => (
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
              <td className="px-5 py-3 font-semibold text-ink" colSpan={tahap.length + 1}>
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
  );
}