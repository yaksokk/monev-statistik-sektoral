"use client";

import { useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import type { NilaiUjian, Opd, Tahap } from "@/lib/types";

const tombolUtama =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
const tombolSekunder =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
const kolomCari =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 pl-9 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary";

type Peta = Record<string, string>;

const kunci = (opdId: string, tahapId: string) => `${opdId}|${tahapId}`;

function tidakValid(v: string) {
  if (v === "") return false;
  const n = Number(v);
  return Number.isNaN(n) || n < 0 || n > 100;
}

export default function NilaiClient({
  opd,
  tahap,
  nilai,
}: {
  opd: Opd[];
  tahap: Tahap[];
  nilai: NilaiUjian[];
}) {
  const [tersimpan, setTersimpan] = useState<Peta>(() =>
    Object.fromEntries(nilai.map((n) => [kunci(n.opdId, n.tahapId), n.nilai === null ? "" : String(n.nilai)])),
  );
  const [isian, setIsian] = useState<Peta>(tersimpan);
  const [cari, setCari] = useState("");
  const [hanyaKosong, setHanyaKosong] = useState(false);
  const [impor, setImpor] = useState(false);
  const [fileImpor, setFileImpor] = useState<File | null>(null);
  const [pesan, setPesan] = useState("");
  const [galat, setGalat] = useState("");

  const ambil = (p: Peta, o: string, t: string) => p[kunci(o, t)] ?? "";
  const semuaKunci = opd.flatMap((o) => tahap.map((t) => kunci(o.id, t.id)));
  const berubah = semuaKunci.filter((k) => (isian[k] ?? "") !== (tersimpan[k] ?? ""));

  const tampil = opd.filter((o) => {
    const cocok = `${o.nama} ${o.singkatan}`.toLowerCase().includes(cari.toLowerCase());
    const kosong = tahap.some((t) => ambil(isian, o.id, t.id) === "");
    return cocok && (!hanyaKosong || kosong);
  });

  const belumTerisi = semuaKunci.filter((k) => (tersimpan[k] ?? "") === "").length;

  function rataRata(tahapId: string) {
    const angka = opd
      .map((o) => ambil(tersimpan, o.id, tahapId))
      .filter((v) => v !== "")
      .map(Number);
    if (!angka.length) return "-";
    return (angka.reduce((a, b) => a + b, 0) / angka.length).toFixed(1).replace(".", ",");
  }

  function simpan() {
    if (semuaKunci.some((k) => tidakValid(isian[k] ?? ""))) {
      setPesan("");
      return setGalat("Ada nilai di luar rentang 0 sampai 100. Periksa kolom yang bergaris merah.");
    }
    setGalat("");
    setTersimpan(isian);
    setPesan(`${berubah.length} nilai disimpan.`);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-ink">Nilai ujian</h1>
          <p className="tabular text-sm text-ink-muted">
            {belumTerisi === 0 ? "Semua nilai sudah terisi" : `${belumTerisi} nilai belum terisi`}
          </p>
        </div>
        <button
          onClick={() => {
            setFileImpor(null);
            setImpor(true);
          }}
          className={tombolSekunder}
        >
          <FileSpreadsheet className="size-4" aria-hidden />
          Impor dari Excel
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari OPD"
            aria-label="Cari OPD"
            className={kolomCari}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={hanyaKosong}
            onChange={(e) => setHanyaKosong(e.target.checked)}
            className="size-4 accent-[var(--color-primary)]"
          />
          Hanya yang belum lengkap
        </label>
      </div>

      <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-surface-muted text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">OPD</th>
              {tahap.map((t) => (
                <th key={t.id} className="w-36 px-4 py-3 font-medium">
                  {t.nama}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tampil.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-ink">{o.singkatan}</p>
                  <p className="text-ink-muted">{o.nama}</p>
                </td>
                {tahap.map((t) => {
                  const k = kunci(o.id, t.id);
                  const v = isian[k] ?? "";
                  const ubah = v !== (tersimpan[k] ?? "");
                  const salah = tidakValid(v);
                  return (
                    <td key={t.id} className="px-4 py-2.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="any"
                        value={v}
                        placeholder="-"
                        aria-label={`Nilai ${t.nama} ${o.singkatan}`}
                        aria-invalid={salah}
                        onChange={(e) => {
                          setIsian({ ...isian, [k]: e.target.value });
                          setPesan("");
                          setGalat("");
                        }}
                        className={`tabular w-24 rounded-lg border px-3 py-1.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary ${
                          salah
                            ? "border-status-revisi-fg bg-status-revisi-bg"
                            : ubah
                              ? "border-primary bg-primary-soft"
                              : "border-line bg-surface"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {tampil.length === 0 && (
              <tr>
                <td colSpan={tahap.length + 1} className="px-4 py-10 text-center text-ink-muted">
                  Tidak ada OPD yang cocok.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t border-line bg-surface-muted">
            <tr>
              <th className="px-4 py-3 font-medium text-ink">Rata-rata semua OPD</th>
              {tahap.map((t) => (
                <td key={t.id} className="tabular px-4 py-3 font-semibold text-ink">
                  {rataRata(t.id)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm" role="status">
          {galat ? (
            <p role="alert" className="text-status-revisi-fg">
              {galat}
            </p>
          ) : (
            <p className="text-ink-muted">
              {berubah.length > 0 ? `${berubah.length} perubahan belum disimpan` : pesan}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            disabled={berubah.length === 0}
            onClick={() => {
              setIsian(tersimpan);
              setGalat("");
            }}
            className={tombolSekunder}
          >
            Batalkan perubahan
          </button>
          <button disabled={berubah.length === 0} onClick={simpan} className={tombolUtama}>
            Simpan nilai
          </button>
        </div>
      </div>

      <Dialog buka={impor} onTutup={() => setImpor(false)} judul="Impor nilai dari Excel">
        <p className="text-sm text-ink-muted">
          Siapkan file .xlsx atau .csv dengan kolom: Singkatan OPD, lalu satu kolom nilai untuk tiap tahap. Satu baris untuk satu OPD.
        </p>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={(e) => setFileImpor(e.target.files?.[0] ?? null)}
          aria-label="Pilih file impor"
          className="block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-surface-muted"
        />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setImpor(false)} className={tombolSekunder}>
            Batal
          </button>
          <button
            disabled={!fileImpor}
            onClick={() => {
              // pembacaan isi file menunggu backend
              setPesan(`File ${fileImpor!.name} diterima. Isinya belum diproses karena backend belum tersambung.`);
              setImpor(false);
            }}
            className={tombolUtama}
          >
            Impor
          </button>
        </div>
      </Dialog>
    </div>
  );
}
