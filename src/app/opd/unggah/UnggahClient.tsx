"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { CalendarClock, FileUp, Lock, MessageSquareWarning, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Dokumen, ItemTahap, Kegiatan, Opd, Tahap } from "@/lib/types";

const MAKS_MB = 10;
const TIPE_BOLEH = ["application/pdf", "image/jpeg", "image/png"];

type Props = {
  opd: Opd;
  kegiatan: Kegiatan[];
  tahap: Tahap[];
  item: ItemTahap[];
  dokumen: Dokumen[];
};

function tanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function waktu(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  });
}

export default function UnggahClient({ opd, kegiatan, tahap, item, dokumen }: Props) {
  const [daftar, setDaftar] = useState(dokumen);
  const [kegiatanId, setKegiatanId] = useState(kegiatan[0].id);
  const [tahapId, setTahapId] = useState(tahap[0].id);
  const [galat, setGalat] = useState<{ dokId: string; pesan: string } | null>(null);
  const [hariIni, setHariIni] = useState<string | null>(null);

  // tanggal dihitung di browser agar tidak terkunci saat build
  useEffect(() => {
    setHariIni(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" }));
  }, []);

  const kegiatanAktif = kegiatan.find((k) => k.id === kegiatanId)!;
  const tahapAktif = tahap.find((t) => t.id === tahapId)!;
  const tenggat = kegiatanAktif.tenggat[tahapId];
  const lewat = hariIni !== null && hariIni > tenggat;

  function hitung(tid: string) {
    const items = item.filter((i) => i.tahapId === tid);
    const ok = items.filter((i) =>
      daftar.some((d) => d.kegiatanId === kegiatanId && d.itemId === i.id && d.status === "disetujui"),
    ).length;
    return { ok, total: items.length };
  }

  function pilihFile(dok: Dokumen, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!TIPE_BOLEH.includes(file.type)) {
      setGalat({ dokId: dok.id, pesan: "Format harus PDF, JPG, atau PNG." });
      return;
    }
    if (file.size > MAKS_MB * 1024 * 1024) {
      setGalat({ dokId: dok.id, pesan: `Ukuran file maksimal ${MAKS_MB} MB.` });
      return;
    }

    setGalat(null);
    // simulasi: hanya mengubah state browser
    setDaftar((prev) =>
      prev.map((d) =>
        d.id === dok.id
          ? {
              ...d,
              status: "menunggu",
              namaFile: file.name,
              diunggahPada: new Date().toISOString(),
              catatanRevisi: null,
            }
          : d,
      ),
    );
  }

  const baris = item
    .filter((i) => i.tahapId === tahapId)
    .map((i) => ({
      item: i,
      dok: daftar.find((d) => d.kegiatanId === kegiatanId && d.itemId === i.id),
    }))
    .filter((b): b is { item: ItemTahap; dok: Dokumen } => !!b.dok);

  const { ok, total } = hitung(tahapId);
  const persen = total ? Math.round((ok / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-ink">Unggah dokumen</h1>
        <p className="text-sm text-ink-muted">{opd.nama}</p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kegiatan">
        {kegiatan.map((k) => (
          <button
            key={k.id}
            role="tab"
            aria-selected={k.id === kegiatanId}
            onClick={() => {
              setKegiatanId(k.id);
              setGalat(null);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              k.id === kegiatanId
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface text-ink hover:bg-surface-muted"
            }`}
          >
            {k.nama}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {tahap.map((t) => {
          const h = hitung(t.id);
          const aktif = t.id === tahapId;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTahapId(t.id);
                setGalat(null);
              }}
              aria-pressed={aktif}
              className={`rounded-card border p-4 text-left shadow-card transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                aktif ? "border-primary bg-primary-soft" : "border-line bg-surface hover:bg-surface-muted"
              }`}
            >
              <p className="text-sm font-medium text-ink">{t.nama}</p>
              <p className="mt-1 text-xs text-ink-muted">Bobot {t.bobot}%</p>
              <p className="tabular mt-3 text-sm text-ink">
                {h.ok} dari {h.total} disetujui
              </p>
            </button>
          );
        })}
      </div>

      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold text-ink">{tahapAktif.nama}</h2>
            <p className={`mt-1 flex items-center gap-1.5 text-sm ${lewat ? "text-status-revisi-fg" : "text-ink-muted"}`}>
              <CalendarClock className="size-4" aria-hidden />
              Tenggat {tanggal(tenggat)}
              {lewat && " (sudah lewat)"}
            </p>
          </div>
          <div className="w-full sm:w-56">
            <div className="tabular mb-1 flex justify-between text-xs text-ink-muted">
              <span>Disetujui</span>
              <span>{persen}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={persen}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full bg-primary" style={{ width: `${persen}%` }} />
            </div>
          </div>
        </div>

        <ul className="divide-y divide-line">
          {baris.map(({ item: i, dok }) => {
            const terkunci = dok.status === "disetujui";
            const label =
              dok.status === "belum" ? "Unggah" : dok.status === "revisi" ? "Unggah ulang" : "Ganti file";
            return (
              <li key={dok.id} className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-ink">{i.nama}</p>
                    {dok.namaFile && dok.diunggahPada ? (
                      <p className="truncate text-sm text-ink-muted">
                        {dok.namaFile} · {waktu(dok.diunggahPada)}
                      </p>
                    ) : (
                      <p className="text-sm text-ink-muted">Belum ada file</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={dok.status} />
                    {terkunci ? (
                      <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                        <Lock className="size-4" aria-hidden />
                        Terkunci
                      </span>
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary">
                        {dok.status === "belum" ? (
                          <FileUp className="size-4" aria-hidden />
                        ) : (
                          <RefreshCw className="size-4" aria-hidden />
                        )}
                        {label}
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => pilihFile(dok, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {dok.status === "revisi" && dok.catatanRevisi && (
                  <div className="flex gap-2 rounded-lg bg-status-revisi-bg p-3 text-sm text-status-revisi-fg">
                    <MessageSquareWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <p>{dok.catatanRevisi}</p>
                  </div>
                )}

                {galat?.dokId === dok.id && (
                  <p role="alert" className="text-sm text-status-revisi-fg">
                    {galat.pesan}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <p className="border-t border-line p-4 text-xs text-ink-muted sm:px-5">
          Format PDF, JPG, atau PNG, maksimal {MAKS_MB} MB per file.
        </p>
      </section>
    </div>
  );
}
