"use client";

import { useState } from "react";
import { ExternalLink, Mail, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import type { Opd, Undangan } from "@/lib/types";

const dasarTombol =
  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
const tombolUtama = `${dasarTombol} bg-primary text-white hover:bg-primary-hover`;
const tombolSekunder = `${dasarTombol} border border-line bg-surface text-ink hover:bg-surface-muted`;
const tombolBahaya = `${dasarTombol} bg-status-revisi-fg text-white hover:opacity-90`;
const kolomInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary";

// waktu lokal Makassar, format yyyy-mm-ddTHH:mm
function waktuSekarang() {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Makassar", hour12: false })
    .slice(0, 16)
    .replace(" ", "T");
}

function formatWaktu(iso: string) {
  const tgl = new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${tgl}, ${iso.slice(11, 16).replace(":", ".")}`;
}

function ringkasPenerima(u: Undangan, opdList: Opd[]) {
  if (u.opdIds.length === 0) return "Belum ada penerima";
  if (u.opdIds.length === opdList.length) return `Semua OPD (${opdList.length})`;
  const nama = u.opdIds
    .map((id) => opdList.find((o) => o.id === id)?.singkatan)
    .filter((n): n is string => !!n);
  const tampil = nama.slice(0, 4).join(", ");
  const sisa = nama.length - 4;
  return `${u.opdIds.length} OPD: ${sisa > 0 ? `${tampil}, +${sisa} lainnya` : tampil}`;
}

type Isian = { judul: string; link: string; opdIds: string[] };

function FormUndangan({
  awal,
  opdList,
  bolehKosong,
  labelSimpan,
  onSimpan,
  onBatal,
}: {
  awal: Isian;
  opdList: Opd[];
  bolehKosong: boolean;
  labelSimpan: string;
  onSimpan: (v: Isian) => void;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");
  const semua = opdList.length > 0 && v.opdIds.length === opdList.length;

  function pilihSemua() {
    setV({ ...v, opdIds: semua ? [] : opdList.map((o) => o.id) });
  }

  function pilih(id: string) {
    setV({
      ...v,
      opdIds: v.opdIds.includes(id) ? v.opdIds.filter((x) => x !== id) : [...v.opdIds, id],
    });
  }

  function kirim() {
    const judul = v.judul.trim();
    const link = v.link.trim();
    if (!judul || !link) return setGalat("Judul dan link wajib diisi.");
    if (!link.toLowerCase().startsWith("https://")) return setGalat("Link harus diawali https://");
    if (!bolehKosong && v.opdIds.length === 0) return setGalat("Pilih minimal satu OPD penerima.");
    onSimpan({ judul, link, opdIds: v.opdIds });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="u-judul" className="text-sm font-medium">
          Judul surat
        </label>
        <input id="u-judul" value={v.judul} onChange={(e) => setV({ ...v, judul: e.target.value })} className={kolomInput} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="u-link" className="text-sm font-medium">
          Link Google Drive
        </label>
        <input
          id="u-link"
          type="url"
          placeholder="https://"
          value={v.link}
          onChange={(e) => setV({ ...v, link: e.target.value })}
          className={kolomInput}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Penerima</legend>
        <label className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-sm font-medium">
          <input type="checkbox" checked={semua} onChange={pilihSemua} className="size-4 accent-(--color-primary)" />
          Kirim semua ({opdList.length} OPD)
        </label>
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
          {opdList.map((o) => (
            <label key={o.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-muted">
              <input
                type="checkbox"
                checked={v.opdIds.includes(o.id)}
                onChange={() => pilih(o.id)}
                className="size-4 accent-(--color-primary)"
              />
              <span className="text-ink">{o.nama}</span>
            </label>
          ))}
        </div>
        <p className="tabular text-xs text-ink-muted">{v.opdIds.length} OPD dipilih</p>
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
          {labelSimpan}
        </button>
      </div>
    </div>
  );
}

export default function UndanganClient({ awal, opdList }: { awal: Undangan[]; opdList: Opd[] }) {
  const [daftar, setDaftar] = useState(awal);
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [pesan, setPesan] = useState("");

  const diedit = form?.id ? daftar.find((u) => u.id === form.id) : undefined;
  const dihapus = hapusId ? daftar.find((u) => u.id === hapusId) : undefined;
  const terurut = [...daftar].sort((a, b) => b.dikirimPada.localeCompare(a.dikirimPada));

  function simpan(v: Isian) {
    if (diedit) {
      setDaftar((prev) =>
        prev.map((u) => (u.id === diedit.id ? { ...u, judul: v.judul, link: v.link, opdIds: v.opdIds } : u)),
      );
      setPesan(`${v.judul} diperbarui.`);
    } else {
      const no = daftar.reduce((m, u) => Math.max(m, Number(u.id.replace(/\D/g, ""))), 0) + 1;
      setDaftar((prev) => [
        ...prev,
        { id: `undangan-${no}`, judul: v.judul, link: v.link, dikirimPada: waktuSekarang(), opdIds: v.opdIds },
      ]);
      setPesan(`${v.judul} dikirim ke ${v.opdIds.length} OPD.`);
    }
    setForm(null);
  }

  function tarikSemua(u: Undangan) {
    setDaftar((prev) => prev.map((x) => (x.id === u.id ? { ...x, opdIds: [] } : x)));
    setPesan(`${u.judul} ditarik dari semua OPD.`);
  }

  function hapus() {
    if (!dihapus) return;
    setDaftar((prev) => prev.filter((u) => u.id !== dihapus.id));
    setPesan(`${dihapus.judul} dihapus.`);
    setHapusId(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-ink">Undangan</h1>
          <p className="tabular text-sm text-ink-muted">{daftar.length} undangan</p>
        </div>
        <button onClick={() => setForm({ id: null })} className={tombolUtama}>
          <Send className="size-4" aria-hidden />
          Kirim undangan
        </button>
      </header>

      <p role="status" className="min-h-5 text-sm text-ink-muted">
        {pesan}
      </p>

      {terurut.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-5 text-sm text-ink-muted shadow-card">
          Belum ada undangan.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {terurut.map((u) => (
            <section key={u.id} className="rounded-card border border-line bg-surface shadow-card">
              <div className="space-y-1 border-b border-line p-4 sm:p-5">
                <h2 className="flex items-center gap-2 font-semibold text-ink">
                  <Mail className="size-4 shrink-0 text-ink-muted" aria-hidden />
                  <span className="min-w-0 truncate">{u.judul}</span>
                </h2>
                <p className="text-sm text-ink-muted">Dikirim {formatWaktu(u.dikirimPada)}</p>
              </div>

              <ul className="divide-y divide-line">
                <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                  <span className="text-ink">Penerima</span>
                  <span className="text-right text-ink-muted">{ringkasPenerima(u, opdList)}</span>
                </li>
                <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                  <span className="text-ink">Surat</span>
                  <a
                    href={u.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    Buka surat
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </li>
              </ul>

              <div className="flex flex-wrap justify-end gap-2 border-t border-line p-3 sm:px-5">
                <button
                  onClick={() => tarikSemua(u)}
                  disabled={u.opdIds.length === 0}
                  className={tombolSekunder}
                >
                  <Undo2 className="size-4" aria-hidden />
                  Tarik dari semua
                </button>
                <button onClick={() => setHapusId(u.id)} className={tombolSekunder}>
                  <Trash2 className="size-4" aria-hidden />
                  Hapus
                </button>
                <button onClick={() => setForm({ id: u.id })} className={tombolSekunder}>
                  <Pencil className="size-4" aria-hidden />
                  Ubah
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog
        buka={!!form}
        onTutup={() => setForm(null)}
        judul={diedit ? "Ubah undangan" : "Kirim undangan"}
        lebar="w-[min(40rem,calc(100%-2rem))]"
      >
        <FormUndangan
          awal={
            diedit
              ? { judul: diedit.judul, link: diedit.link, opdIds: diedit.opdIds }
              : { judul: "", link: "", opdIds: [] }
          }
          opdList={opdList}
          bolehKosong={!!diedit}
          labelSimpan={diedit ? "Simpan" : "Kirim"}
          onSimpan={simpan}
          onBatal={() => setForm(null)}
        />
      </Dialog>

      <Dialog buka={!!dihapus} onTutup={() => setHapusId(null)} judul="Hapus undangan">
        <p className="text-sm text-ink-muted">
          Hapus undangan <span className="font-medium text-ink">{dihapus?.judul}</span>? Surat ini hilang dari semua
          OPD penerima. Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setHapusId(null)} className={tombolSekunder}>
            Batal
          </button>
          <button onClick={hapus} className={tombolBahaya}>
            Hapus
          </button>
        </div>
      </Dialog>
    </div>
  );
}