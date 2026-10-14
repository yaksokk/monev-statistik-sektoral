"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_LABEL, type StatusDokumen } from "@/lib/types";

export type BarisDokumen = {
  id: string;
  opdId: string;
  opdNama: string;
  opdSingkatan: string;
  tahapId: string;
  tahapNama: string;
  itemNama: string;
  status: StatusDokumen;
  namaFile: string | null;
  diunggahPada: string | null;
  catatanRevisi: string | null;
};

type Filter = "perhatian" | "semua" | StatusDokumen;

// zona waktu dipatok supaya hasil server dan browser sama
const tglTenggat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const tglUnggah = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Makassar",
});

const kurang = (s: StatusDokumen) => s === "belum" || s === "revisi";

function cocok(s: StatusDokumen, f: Filter) {
  if (f === "semua") return true;
  if (f === "perhatian") return kurang(s);
  return s === f;
}

const PILIHAN: { nilai: Filter; label: string }[] = [
  { nilai: "perhatian", label: "Perlu tindak lanjut" },
  { nilai: "belum", label: STATUS_LABEL.belum },
  { nilai: "revisi", label: STATUS_LABEL.revisi },
  { nilai: "menunggu", label: STATUS_LABEL.menunggu },
  { nilai: "disetujui", label: STATUS_LABEL.disetujui },
  { nilai: "semua", label: "Semua" },
];

export default function DaftarDokumenClient({
  dokumen,
  tahap,
  tenggat,
}: {
  dokumen: BarisDokumen[];
  tahap: { id: string; nama: string }[];
  tenggat: Record<string, string>;
}) {
  const [filter, setFilter] = useState<Filter>("perhatian");
  const [tahapId, setTahapId] = useState("semua");
  const [cari, setCari] = useState("");
  const [terbuka, setTerbuka] = useState<Set<string>>(new Set());

  const jumlahFilter = useMemo(() => {
    const hasil: Record<Filter, number> = {
      perhatian: 0,
      semua: dokumen.length,
      belum: 0,
      menunggu: 0,
      disetujui: 0,
      revisi: 0,
    };
    for (const d of dokumen) {
      hasil[d.status] += 1;
      if (kurang(d.status)) hasil.perhatian += 1;
    }
    return hasil;
  }, [dokumen]);

  const kelompok = useMemo(() => {
    const kata = cari.trim().toLowerCase();
    const peta = new Map<
      string,
      { opdId: string; opdNama: string; semua: BarisDokumen[]; tampil: BarisDokumen[] }
    >();

    for (const d of dokumen) {
      let g = peta.get(d.opdId);
      if (!g) {
        g = { opdId: d.opdId, opdNama: d.opdNama, semua: [], tampil: [] };
        peta.set(d.opdId, g);
      }
      g.semua.push(d);
      if (cocok(d.status, filter) && (tahapId === "semua" || d.tahapId === tahapId)) {
        g.tampil.push(d);
      }
    }

    return [...peta.values()]
      .filter((g) => {
        if (g.tampil.length === 0) return false;
        if (!kata) return true;
        const sing = g.semua[0].opdSingkatan.toLowerCase();
        return g.opdNama.toLowerCase().includes(kata) || sing.includes(kata);
      })
      .map((g) => ({
        ...g,
        belum: g.semua.filter((d) => d.status === "belum").length,
        revisi: g.semua.filter((d) => d.status === "revisi").length,
        disetujui: g.semua.filter((d) => d.status === "disetujui").length,
      }))
      .sort(
        (a, b) =>
          b.belum + b.revisi - (a.belum + a.revisi) || a.opdNama.localeCompare(b.opdNama, "id"),
      );
  }, [dokumen, filter, tahapId, cari]);

  function toggle(id: string) {
    setTerbuka((lama) => {
      const baru = new Set(lama);
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      return baru;
    });
  }

  return (
    <div className="mt-8 overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">Daftar dokumen per OPD</h2>
        <p className="text-sm text-ink-muted">
          OPD dengan dokumen kurang atau perlu revisi terbanyak ditampilkan paling atas.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PILIHAN.map((p) => {
            const aktif = filter === p.nilai;
            return (
              <button
                key={p.nilai}
                type="button"
                aria-pressed={aktif}
                onClick={() => setFilter(p.nilai)}
                className={
                  aktif
                    ? "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-muted"
                }
              >
                {p.label} <span className="tabular opacity-80">({jumlahFilter[p.nilai]})</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <select
            value={tahapId}
            onChange={(e) => setTahapId(e.target.value)}
            aria-label="Filter tahap"
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <option value="semua">Semua tahap</option>
            {tahap.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
              </option>
            ))}
          </select>
          <div className="flex gap-3 text-sm sm:ml-auto">
            <button
              type="button"
              onClick={() => setTerbuka(new Set(kelompok.map((g) => g.opdId)))}
              className="text-primary hover:underline"
            >
              Buka semua
            </button>
            <button
              type="button"
              onClick={() => setTerbuka(new Set())}
              className="text-primary hover:underline"
            >
              Tutup semua
            </button>
          </div>
        </div>
      </div>

      {kelompok.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-ink-muted">
          Tidak ada dokumen yang cocok dengan filter ini.
        </p>
      )}

      <ul className="divide-y divide-line">
        {kelompok.map((g) => {
          const buka = terbuka.has(g.opdId);
          return (
            <li key={g.opdId}>
              <button
                type="button"
                onClick={() => toggle(g.opdId)}
                aria-expanded={buka}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-surface-muted"
              >
                <span>
                  <span className="block font-medium text-ink">{g.opdNama}</span>
                  <span className="tabular block text-xs text-ink-muted">
                    {g.belum} belum diunggah · {g.revisi} perlu revisi · {g.disetujui} disetujui
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-sm text-ink-muted">
                  <span className="tabular">{g.tampil.length} dokumen</span>
                  <ChevronDown
                    className={`size-4 transition-transform ${buka ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </span>
              </button>

              {buka && (
                <ul className="divide-y divide-line border-t border-line bg-surface-muted/40">
                  {g.tampil.map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{d.itemNama}</p>
                        <p className="text-xs text-ink-muted">
                          {d.tahapNama}
                          {tenggat[d.tahapId] && (
                            <> · Tenggat {tglTenggat.format(new Date(tenggat[d.tahapId]))}</>
                          )}
                        </p>
                        {d.status === "revisi" && d.catatanRevisi && (
                          <p className="mt-1 text-sm text-status-revisi-fg">
                            Catatan: {d.catatanRevisi}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-1 sm:items-end">
                        <StatusBadge status={d.status} />
                        {d.namaFile && (
                          <p className="text-xs text-ink-muted">
                            {d.namaFile}
                            {d.diunggahPada && <> · {tglUnggah.format(new Date(d.diunggahPada))}</>}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}