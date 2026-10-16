"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { CalendarClock, FileUp, Lock, MessageSquareWarning, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Dokumen, ItemDokumen, Kegiatan, Opd } from "@/lib/types";

const MAKS_MB = 10;
const TIPE_BOLEH = ["application/pdf", "image/jpeg", "image/png"];

type Props = {
  opd: Opd;
  kegiatan: Kegiatan[];
  item: ItemDokumen[];
  dokumen: Dokumen[];
  kegiatanAwal?: string;
};

function tanggal(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("id-ID", {
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

export default function UnggahClient({ opd, kegiatan, item, dokumen, kegiatanAwal }: Props) {
  const [daftar, setDaftar] = useState(dokumen);
  const [kegiatanId, setKegiatanId] = useState(
    kegiatan.find((k) => k.id === kegiatanAwal)?.id ?? kegiatan[0].id,
  );
  const [galat, setGalat] = useState<{ dokId: string; pesan: string } | null>(null);
  const [hariIni, setHariIni] = useState<string | null>(null);

  // tanggal dihitung di browser agar tidak terkunci saat build
  useEffect(() => {
    setHariIni(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" }));
  }, []);

  const kegiatanAktif = kegiatan.find((k) => k.id === kegiatanId)!;
  const lewat = hariIni !== null && hariIni > kegiatanAktif.tenggat;

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
    .map((i) => ({
      item: i,
      dok: daftar.find((d) => d.kegiatanId === kegiatanId && d.itemId === i.id),
    }))
    .filter((b): b is { item: ItemDokumen; dok: Dokumen } => !!b.dok);

  const total = baris.length;
  const ok = baris.filter((b) => b.dok.status === "disetujui").length;
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

      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-ink">{kegiatanAktif.nama}</h2>
              <span className="tabular rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                Bobot {kegiatanAktif.bobot}%
              </span>
            </div>
            <p
              className={`mt-1 flex items-center gap-1.5 text-sm ${
                lewat ? "text-status-revisi-fg" : "text-ink-muted"
              }`}
            >
              <CalendarClock className="size-4" aria-hidden />
              Tenggat {tanggal(kegiatanAktif.tenggat)}
              {lewat && " (sudah lewat)"}
            </p>
          </div>
          <div className="w-full sm:w-56">
            <div className="tabular mb-1 flex justify-between text-xs text-ink-muted">
              <span>
                Disetujui {ok} dari {total}
              </span>
              <span>{persen}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={persen}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Dokumen disetujui ${kegiatanAktif.nama}`}
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