"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Pencil, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import type { Kegiatan } from "@/lib/types";

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

type Isian = { nama: string; mulai: string; selesai: string; tenggat: string; bobot: string };

function FormKegiatan({
  awal,
  onSimpan,
  onBatal,
}: {
  awal: Isian;
  onSimpan: (v: Isian) => void;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");

  function kirim() {
    if (!v.nama.trim() || !v.mulai || !v.selesai || !v.tenggat || v.bobot === "") {
      return setGalat("Semua kolom wajib diisi.");
    }
    if (v.selesai < v.mulai) return setGalat("Tanggal selesai tidak boleh sebelum tanggal mulai.");
    const bobot = Number(v.bobot);
    if (Number.isNaN(bobot) || bobot < 0 || bobot > 100) {
      return setGalat("Bobot harus berupa angka 0 sampai 100.");
    }
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="k-tenggat" className="text-sm font-medium">
            Tenggat unggah dokumen
          </label>
          <input
            id="k-tenggat"
            type="date"
            value={v.tenggat}
            onChange={(e) => setV({ ...v, tenggat: e.target.value })}
            className={kolomInput}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="k-bobot" className="text-sm font-medium">
            Bobot nilai (%)
          </label>
          <input
            id="k-bobot"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="any"
            value={v.bobot}
            onChange={(e) => setV({ ...v, bobot: e.target.value })}
            className={kolomInput}
          />
        </div>
      </div>

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

export default function KegiatanClient({ awal }: { awal: Kegiatan[] }) {
  const [daftar, setDaftar] = useState(awal);
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [pesan, setPesan] = useState("");
  // Tanggal hari ini dibaca setelah hidrasi agar tidak dibekukan saat prerender.
  const [hariIni, setHariIni] = useState<string | null>(null);

  useEffect(() => {
    setHariIni(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" }));
  }, []);

  const diedit = form?.id ? daftar.find((k) => k.id === form.id) : undefined;
  const totalBobot = daftar.reduce((s, k) => s + k.bobot, 0);

  function simpan(v: Isian) {
    const bobot = Number(v.bobot);
    if (diedit) {
      setDaftar((prev) =>
        prev.map((k) =>
          k.id === diedit.id
            ? { ...k, nama: v.nama, tanggalMulai: v.mulai, tanggalSelesai: v.selesai, tenggat: v.tenggat, bobot }
            : k,
        ),
      );
      setPesan(`${v.nama} diperbarui.`);
    } else {
      const no = daftar.reduce((m, k) => Math.max(m, Number(k.id.replace(/\D/g, ""))), 0) + 1;
      setDaftar((prev) => [
        ...prev,
        {
          id: `kegiatan-${no}`,
          nama: v.nama,
          tanggalMulai: v.mulai,
          tanggalSelesai: v.selesai,
          tenggat: v.tenggat,
          bobot,
        },
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
                <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                  <span className="text-ink">Tenggat unggah dokumen</span>
                  <span className="tabular flex items-center gap-1.5 text-ink-muted">
                    <CalendarClock className="size-4" aria-hidden />
                    {k.tenggat ? tanggal(k.tenggat) : "Belum diatur"}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                  <span className="text-ink">Bobot nilai</span>
                  <span className="tabular font-semibold text-ink">{k.bobot}%</span>
                </li>
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
        <h2 className="font-semibold text-ink">Total bobot</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Bobot tiap kegiatan dipakai untuk menghitung nilai akhir OPD. Totalnya sebaiknya 100%.
        </p>
        <p className="tabular mt-3 text-2xl font-semibold text-ink">{totalBobot}%</p>
        {totalBobot !== 100 && (
          <p role="alert" className="mt-1 text-sm text-status-revisi-fg">
            Total bobot belum 100%. Periksa bobot tiap kegiatan.
          </p>
        )}
      </section>

      <Dialog buka={!!form} onTutup={() => setForm(null)} judul={diedit ? "Ubah kegiatan" : "Tambah kegiatan"}>
        <FormKegiatan
          awal={
            diedit
              ? {
                  nama: diedit.nama,
                  mulai: diedit.tanggalMulai,
                  selesai: diedit.tanggalSelesai,
                  tenggat: diedit.tenggat,
                  bobot: String(diedit.bobot),
                }
              : { nama: "", mulai: "", selesai: "", tenggat: "", bobot: "" }
          }
          onSimpan={simpan}
          onBatal={() => setForm(null)}
        />
      </Dialog>
    </div>
  );
}