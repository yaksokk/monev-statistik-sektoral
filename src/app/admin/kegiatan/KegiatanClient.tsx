"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Pencil, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import type { Kegiatan, Tahap } from "@/lib/types";

const tombolUtama =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const tombolSekunder =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const kolomInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary";

function tanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function status(k: Kegiatan, hariIni: string) {
  if (hariIni < k.tanggalMulai) return { label: "Belum mulai", aktif: false };
  if (hariIni > k.tanggalSelesai) return { label: "Selesai", aktif: false };
  return { label: "Berlangsung", aktif: true };
}

type Isian = { nama: string; mulai: string; selesai: string; tenggat: Record<string, string> };

function FormKegiatan({
  awal,
  tahap,
  onSimpan,
  onBatal,
}: {
  awal: Isian;
  tahap: Tahap[];
  onSimpan: (v: Isian) => void;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");

  function kirim() {
    const lengkap = v.nama.trim() && v.mulai && v.selesai && tahap.every((t) => v.tenggat[t.id]);
    if (!lengkap) return setGalat("Semua kolom wajib diisi.");
    if (v.selesai < v.mulai) return setGalat("Tanggal selesai tidak boleh sebelum tanggal mulai.");
    onSimpan({ ...v, nama: v.nama.trim() });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="k-nama" className="text-sm font-medium">
          Nama kegiatan
        </label>
        <input id="k-nama" value={v.nama} onChange={(e) => setV({ ...v, nama: e.target.value })} className={kolomInput} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="k-mulai" className="text-sm font-medium">
            Tanggal mulai
          </label>
          <input id="k-mulai" type="date" value={v.mulai} onChange={(e) => setV({ ...v, mulai: e.target.value })} className={kolomInput} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="k-selesai" className="text-sm font-medium">
            Tanggal selesai
          </label>
          <input
            id="k-selesai"
            type="date"
            value={v.selesai}
            onChange={(e) => setV({ ...v, selesai: e.target.value })}
            className={kolomInput}
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-medium">Tenggat per tahap</legend>
        {tahap.map((t) => (
          <div key={t.id} className="grid items-center gap-2 sm:grid-cols-[1fr_11rem]">
            <label htmlFor={`k-${t.id}`} className="text-sm text-ink">
              {t.nama}
            </label>
            <input
              id={`k-${t.id}`}
              type="date"
              value={v.tenggat[t.id] ?? ""}
              onChange={(e) => setV({ ...v, tenggat: { ...v.tenggat, [t.id]: e.target.value } })}
              className={kolomInput}
            />
          </div>
        ))}
      </fieldset>

      {galat && (
        <p role="alert" className="text-sm text-status-revisi-fg">
          {galat}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBatal} className={tombolSekunder}>
          Batal
        </button>
        <button onClick={kirim} className={tombolUtama}>
          Simpan
        </button>
      </div>
    </div>
  );
}

export default function KegiatanClient({ awal, tahap }: { awal: Kegiatan[]; tahap: Tahap[] }) {
  const [daftar, setDaftar] = useState(awal);
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [pesan, setPesan] = useState("");
  // Tanggal hari ini dibaca setelah hidrasi agar tidak dibekukan saat prerender.
  const [hariIni, setHariIni] = useState<string | null>(null);

  useEffect(() => {
    setHariIni(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" }));
  }, []);

  const diedit = form?.id ? daftar.find((k) => k.id === form.id) : undefined;

  function simpan(v: Isian) {
    if (diedit) {
      setDaftar((prev) =>
        prev.map((k) =>
          k.id === diedit.id ? { ...k, nama: v.nama, tanggalMulai: v.mulai, tanggalSelesai: v.selesai, tenggat: v.tenggat } : k,
        ),
      );
      setPesan(`${v.nama} diperbarui.`);
    } else {
      const no = daftar.reduce((m, k) => Math.max(m, Number(k.id.replace(/\D/g, ""))), 0) + 1;
      setDaftar((prev) => [
        ...prev,
        { id: `kegiatan-${no}`, nama: v.nama, tanggalMulai: v.mulai, tanggalSelesai: v.selesai, tenggat: v.tenggat },
      ]);
      setPesan(`${v.nama} ditambahkan.`);
    }
    setForm(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-ink">Kegiatan dan tenggat</h1>
          <p className="tabular text-sm text-ink-muted">{daftar.length} kegiatan</p>
        </div>
        <button onClick={() => setForm({ id: null })} className={tombolUtama}>
          <Plus className="size-4" aria-hidden />
          Tambah kegiatan
        </button>
      </header>

      <p role="status" className="min-h-5 text-sm text-ink-muted">
        {pesan}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {daftar.map((k) => {
          const s = hariIni ? status(k, hariIni) : null;
          return (
            <section key={k.id} className="rounded-card border border-line bg-surface shadow-card">
              <div className="flex items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
                <div className="min-w-0 space-y-1">
                  <h2 className="font-semibold text-ink">{k.nama}</h2>
                  <p className="text-sm text-ink-muted">
                    {tanggal(k.tanggalMulai)} sampai {tanggal(k.tanggalSelesai)}
                  </p>
                </div>
                {s && (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      s.aktif ? "bg-primary-soft text-primary" : "bg-surface-muted text-ink-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                )}
              </div>

              <ul className="divide-y divide-line">
                {tahap.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                    <span className="text-ink">{t.nama}</span>
                    <span className="tabular flex items-center gap-1.5 text-ink-muted">
                      <CalendarClock className="size-4" aria-hidden />
                      {k.tenggat[t.id] ? tanggal(k.tenggat[t.id]) : "Belum diatur"}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-end border-t border-line p-3 sm:px-5">
                <button onClick={() => setForm({ id: k.id })} className={tombolSekunder}>
                  <Pencil className="size-4" aria-hidden />
                  Ubah
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <h2 className="font-semibold text-ink">Bobot tahap</h2>
        <p className="mt-1 text-sm text-ink-muted">Dipakai untuk menghitung nilai akhir tiap OPD. Bobot tahap belum bisa diubah dari halaman ini.</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {tahap.map((t) => (
            <li key={t.id} className="rounded-lg bg-surface-muted px-4 py-3 text-sm">
              <p className="text-ink">{t.nama}</p>
              <p className="tabular mt-1 font-semibold text-ink">{t.bobot}%</p>
            </li>
          ))}
        </ul>
      </section>

      <Dialog buka={!!form} onTutup={() => setForm(null)} judul={diedit ? "Ubah kegiatan" : "Tambah kegiatan"}>
        <FormKegiatan
          awal={
            diedit
              ? { nama: diedit.nama, mulai: diedit.tanggalMulai, selesai: diedit.tanggalSelesai, tenggat: diedit.tenggat }
              : { nama: "", mulai: "", selesai: "", tenggat: {} }
          }
          tahap={tahap}
          onSimpan={simpan}
          onBatal={() => setForm(null)}
        />
      </Dialog>
    </div>
  );
}