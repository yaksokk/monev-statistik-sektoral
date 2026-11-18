"use client";

import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import {
  LEBAR_DIALOG,
  Lencana,
  kartu,
  kolomInput,
  ringkas,
  tombolBahaya,
  tombolSekunder,
  tombolUtama,
} from "@/app/admin/quiz/ui";
import { DAFTAR_PEMBINAAN, type Pembinaan } from "@/lib/modul-admin";
import type { BabModul, ModulPembelajaran } from "@/lib/types";

export type DataModul = { judul: string; subjudul: string };
export type DataBab = { judul: string; linkMateri: string; pembinaan: Pembinaan };

// Setiap aksi mengembalikan pesan galat, atau null bila berhasil
export type AksiTabKelola = {
  simpanModul: (d: DataModul) => Promise<string | null>;
  tambahBab: (d: DataBab) => Promise<string | null>;
  ubahBab: (id: string, d: DataBab) => Promise<string | null>;
  hapusBab: (id: string) => Promise<string | null>;
  geser: (id: string, arah: -1 | 1) => Promise<string | null>;
};

/* ------------------------------ form modul ------------------------------ */

function FormModul({
  modul,
  onSimpan,
}: {
  modul: ModulPembelajaran | undefined;
  onSimpan: (d: DataModul) => Promise<string | null>;
}) {
  const [judul, setJudul] = useState(modul?.judul ?? "");
  const [subjudul, setSubjudul] = useState(modul?.subjudul ?? "");
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (!judul.trim()) return setGalat("Judul modul wajib diisi.");
    setGalat("");
    setProses(true);
    const g = await onSimpan({ judul: judul.trim(), subjudul: subjudul.trim() });
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <section aria-labelledby="judul-modul" className={kartu}>
      <h2 id="judul-modul" className="font-semibold text-ink">
        Modul
      </h2>
      {!modul && (
        <p role="note" className="mt-2 text-sm text-ink-muted">
          Kegiatan ini belum punya modul. Isi judul lalu simpan untuk membuatnya.
        </p>
      )}
      <form onSubmit={kirim} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="modul-judul" className="text-sm font-medium text-ink">
            Judul modul
          </label>
          <input
            id="modul-judul"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            aria-invalid={!!galat}
            className={kolomInput}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="modul-subjudul" className="text-sm font-medium text-ink">
            Subjudul <span className="font-normal text-ink-muted">(opsional)</span>
          </label>
          <input
            id="modul-subjudul"
            value={subjudul}
            onChange={(e) => setSubjudul(e.target.value)}
            className={kolomInput}
          />
        </div>
        {galat && (
          <p role="alert" className="text-sm text-status-revisi-fg">
            {galat}
          </p>
        )}
        <div className="flex justify-end">
          <button type="submit" disabled={proses} className={tombolUtama}>
            {modul ? "Simpan modul" : "Buat modul"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ------------------------------ form bab ------------------------------ */

function FormBab({
  awal,
  onSimpan,
  onBatal,
}: {
  awal: { judul: string; linkMateri: string; pembinaan: Pembinaan };
  onSimpan: (d: DataBab) => Promise<string | null>;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    const judul = v.judul.trim();
    const linkMateri = v.linkMateri.trim();
    if (!judul) return setGalat("Judul bab wajib diisi.");
    if (!linkMateri) return setGalat("Link materi wajib diisi.");
    if (!/^https:\/\//i.test(linkMateri)) return setGalat("Link materi harus diawali https://");
    setGalat("");
    setProses(true);
    const g = await onSimpan({ judul, linkMateri, pembinaan: v.pembinaan });
    // bila berhasil, induk menutup dialog sehingga form ini hilang
    if (g) {
      setGalat(g);
      setProses(false);
    }
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="bab-judul" className="text-sm font-medium text-ink">
          Judul bab
        </label>
        <input
          id="bab-judul"
          value={v.judul}
          onChange={(e) => setV({ ...v, judul: e.target.value })}
          className={kolomInput}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="bab-link" className="text-sm font-medium text-ink">
          Link materi (Google Drive)
        </label>
        <input
          id="bab-link"
          inputMode="url"
          value={v.linkMateri}
          onChange={(e) => setV({ ...v, linkMateri: e.target.value })}
          className={kolomInput}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="bab-pembinaan" className="text-sm font-medium text-ink">
          Masuk ke
        </label>
        <select
          id="bab-pembinaan"
          value={v.pembinaan}
          onChange={(e) => setV({ ...v, pembinaan: Number(e.target.value) as Pembinaan })}
          className={kolomInput}
        >
          {DAFTAR_PEMBINAAN.map((p) => (
            <option key={p} value={p}>
              Pembinaan {p}
            </option>
          ))}
        </select>
      </div>
      {galat && (
        <p role="alert" className="text-sm text-status-revisi-fg">
          {galat}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onBatal} disabled={proses} className={tombolSekunder}>
          Batal
        </button>
        <button type="submit" disabled={proses} className={tombolUtama}>
          Simpan bab
        </button>
      </div>
    </form>
  );
}

/* ------------------------------ tab ------------------------------ */

type Props = {
  modul: ModulPembelajaran | undefined;
  babList: BabModul[]; // bab modul ini, sudah urut
  jumlahSelesai: Record<string, number>; // id bab -> jumlah pegawai yang sudah selesai
  aksi: AksiTabKelola;
  sibuk: boolean; // true selama ada aksi berjalan: tombol geser dan hapus dinonaktifkan
};

export default function TabKelola({ modul, babList, jumlahSelesai, aksi, sibuk }: Props) {
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [galatHapus, setGalatHapus] = useState("");

  const diedit = form?.id ? babList.find((b) => b.id === form.id) : undefined;
  const dihapus = hapusId ? babList.find((b) => b.id === hapusId) : undefined;
  const terdampak = dihapus ? (jumlahSelesai[dihapus.id] ?? 0) : 0;

  async function simpanBab(d: DataBab): Promise<string | null> {
    const g = diedit ? await aksi.ubahBab(diedit.id, d) : await aksi.tambahBab(d);
    if (!g) setForm(null);
    return g;
  }

  async function konfirmasiHapus() {
    if (!dihapus) return;
    setGalatHapus("");
    const g = await aksi.hapusBab(dihapus.id);
    if (g) setGalatHapus(g);
    else setHapusId(null);
  }

  function tutupHapus() {
    setHapusId(null);
    setGalatHapus("");
  }

  return (
    <div className="space-y-6">
      <FormModul modul={modul} onSimpan={aksi.simpanModul} />

      <section aria-labelledby="judul-bab" className={kartu}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="judul-bab" className="font-semibold text-ink">
            Daftar bab
          </h2>
          <button type="button" onClick={() => setForm({ id: null })} disabled={!modul} className={tombolUtama}>
            <Plus className="size-4" aria-hidden />
            Tambah bab
          </button>
        </div>

        {!modul ? (
          <p className="py-8 text-center text-sm text-ink-muted">Buat modul dulu sebelum menambah bab.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {DAFTAR_PEMBINAAN.map((p) => {
              const daftar = babList.filter((b) => b.pembinaan === p);
              return (
                <div key={p} className="space-y-3">
                  <h3 className="text-sm font-semibold text-ink-muted">Pembinaan {p}</h3>
                  {daftar.length === 0 ? (
                    <p className="text-sm text-ink-muted">Belum ada bab.</p>
                  ) : (
                    <ul className="space-y-3">
                      {daftar.map((b, i) => (
                        <li key={b.id} className="space-y-3 rounded-lg border border-line p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <p className="font-medium text-ink">
                              Bab {b.urutan}: {b.judul}
                            </p>
                            <Lencana kelas="bg-surface-muted text-ink-muted">
                              {jumlahSelesai[b.id] ?? 0} pegawai selesai
                            </Lencana>
                          </div>
                          {b.linkMateri ? (
                            <a
                              href={b.linkMateri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-primary underline"
                            >
                              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                              {ringkas(b.linkMateri, 70)}
                            </a>
                          ) : (
                            <p className="text-sm text-ink-muted">Link materi belum diisi.</p>
                          )}
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void aksi.geser(b.id, -1)}
                              disabled={i === 0 || sibuk}
                              aria-label={`Naikkan bab ${b.urutan}`}
                              className={tombolSekunder}
                            >
                              <ArrowUp className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => void aksi.geser(b.id, 1)}
                              disabled={i === daftar.length - 1 || sibuk}
                              aria-label={`Turunkan bab ${b.urutan}`}
                              className={tombolSekunder}
                            >
                              <ArrowDown className="size-4" aria-hidden />
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm({ id: b.id })}
                              disabled={sibuk}
                              className={tombolSekunder}
                            >
                              <Pencil className="size-4" aria-hidden />
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() => setHapusId(b.id)}
                              disabled={sibuk}
                              className={tombolSekunder}
                            >
                              <Trash2 className="size-4" aria-hidden />
                              Hapus
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Dialog
        buka={!!form}
        onTutup={() => setForm(null)}
        judul={diedit ? "Ubah bab" : "Tambah bab"}
        lebar={LEBAR_DIALOG}
      >
        {form && (
          <FormBab
            awal={{
              judul: diedit?.judul ?? "",
              linkMateri: diedit?.linkMateri ?? "",
              pembinaan: diedit?.pembinaan ?? 1,
            }}
            onSimpan={simpanBab}
            onBatal={() => setForm(null)}
          />
        )}
      </Dialog>

      <Dialog buka={!!dihapus} onTutup={tutupHapus} judul="Hapus bab">
        {dihapus && (
          <>
            <p className="text-sm text-ink-muted">
              Hapus <span className="font-medium text-ink">Bab {dihapus.urutan}: {dihapus.judul}</span>?{" "}
              {terdampak > 0
                ? `${terdampak} pegawai sudah menandai bab ini selesai, dan catatannya ikut hilang.`
                : "Belum ada pegawai yang menandai bab ini selesai."}{" "}
              Tindakan ini tidak bisa dibatalkan.
            </p>
            {galatHapus && (
              <p role="alert" className="mt-3 text-sm text-status-revisi-fg">
                {galatHapus}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={tutupHapus} disabled={sibuk} className={tombolSekunder}>
                Batal
              </button>
              <button type="button" onClick={konfirmasiHapus} disabled={sibuk} className={tombolBahaya}>
                Hapus
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}