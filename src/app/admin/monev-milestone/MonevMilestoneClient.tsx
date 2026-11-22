"use client";

import { useState } from "react";
import { ExternalLink, Link2, Pencil } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import type { Milestone } from "@/lib/types";
import { hapusLinkOutput, simpanLinkOutput } from "./actions";

const dasarTombol =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
const tombolUtama = `${dasarTombol} bg-primary text-white hover:bg-primary-hover`;
const tombolSekunder = `${dasarTombol} border border-line bg-surface text-ink hover:bg-surface-muted`;
const tombolBahaya = `${dasarTombol} border border-line bg-surface text-status-revisi-fg hover:bg-surface-muted`;
const kolomInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary";

function FormLink({
  teks,
  awal,
  onSimpan,
  onHapus,
  onBatal,
}: {
  teks: string;
  awal: string;
  onSimpan: (link: string) => Promise<string | null>; // teks galat dari server, atau null bila berhasil
  onHapus: () => Promise<string | null>;
  onBatal: () => void;
}) {
  const [link, setLink] = useState(awal);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function simpan() {
    if (proses) return;
    const bersih = link.trim();
    if (!bersih) return setGalat("Link wajib diisi.");
    if (!bersih.toLowerCase().startsWith("https://")) return setGalat("Link harus diawali https://");

    setGalat("");
    setProses(true);
    const g = await onSimpan(bersih);
    setProses(false);
    if (g) setGalat(g);
  }

  async function hapus() {
    if (proses) return;
    setGalat("");
    setProses(true);
    const g = await onHapus();
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">{teks}</p>
      <div className="space-y-1.5">
        <label htmlFor="mm-link" className="text-sm font-medium">
          Link dokumen
        </label>
        <input
          id="mm-link"
          type="url"
          placeholder="https://"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className={kolomInput}
        />
      </div>
      {galat && (
        <p role="alert" className="text-sm text-status-revisi-fg">
          {galat}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {awal && (
          <button type="button" onClick={hapus} disabled={proses} className={`${tombolBahaya} mr-auto`}>
            Hapus link
          </button>
        )}
        <button type="button" onClick={onBatal} disabled={proses} className={tombolSekunder}>
          Batal
        </button>
        <button type="button" onClick={simpan} disabled={proses} className={tombolUtama}>
          Simpan
        </button>
      </div>
    </div>
  );
}

// Data dan link berasal dari server. Setelah tiap aksi, halaman disegarkan server (revalidatePath),
// jadi tidak ada salinan data di state.
export default function MonevMilestoneClient({ milestoneList }: { milestoneList: Milestone[] }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [pesan, setPesan] = useState("");

  const diedit = editId
    ? milestoneList.flatMap((m) => m.output).find((o) => o.id === editId)
    : undefined;

  async function simpan(link: string): Promise<string | null> {
    if (!editId) return "Output tidak ditemukan.";
    const r = await simpanLinkOutput(editId, link);
    if (!r.ok) return r.pesan;
    setPesan("Link dokumen disimpan.");
    setEditId(null);
    return null;
  }

  async function hapus(): Promise<string | null> {
    if (!editId) return "Output tidak ditemukan.";
    const r = await hapusLinkOutput(editId);
    if (!r.ok) return r.pesan;
    setPesan("Link dokumen dihapus.");
    setEditId(null);
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-ink">Monev Milestone</h1>
        <p className="text-sm text-ink-muted">
          Milestone berdasarkan Tujuan Aksi Perubahan MITRA SUKSES
        </p>
      </header>

      <p role="status" className="min-h-5 text-sm text-ink-muted">
        {pesan}
      </p>

      <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
        <table className="w-full min-w-184 border-collapse text-sm">
          <thead>
            <tr className="bg-surface-muted text-left text-xs font-semibold text-ink-muted">
              <th scope="col" className="w-40 px-4 py-3">
                Tujuan
              </th>
              <th scope="col" className="w-56 px-4 py-3">
                Jadwal
              </th>
              <th scope="col" className="px-4 py-3">
                Output Hasil
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {milestoneList.map((m) => (
              <tr key={m.id} className="align-top">
                <th scope="row" className="px-4 py-4 text-left font-semibold text-ink">
                  {m.tujuan}
                </th>
                <td className="px-4 py-4 text-ink">{m.jadwal}</td>
                <td className="px-4 py-4">
                  <ul className="space-y-4">
                    {m.output.map((o) => {
                      const link = o.linkDokumen;
                      return (
                        <li key={o.id} className="space-y-2">
                          <p className="text-ink">{o.teks}</p>
                          <div className="flex flex-wrap gap-2">
                            {link ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={tombolSekunder}
                              >
                                Lihat dokumen
                                <ExternalLink className="size-3.5" aria-hidden />
                              </a>
                            ) : (
                              <button type="button" disabled className={tombolSekunder}>
                                Lihat dokumen
                                <ExternalLink className="size-3.5" aria-hidden />
                              </button>
                            )}
                            <button type="button" onClick={() => setEditId(o.id)} className={tombolSekunder}>
                              {link ? (
                                <Pencil className="size-3.5" aria-hidden />
                              ) : (
                                <Link2 className="size-3.5" aria-hidden />
                              )}
                              {link ? "Ubah link" : "Isi link"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        buka={!!diedit}
        onTutup={() => setEditId(null)}
        judul="Link dokumen output"
        lebar="w-[min(36rem,calc(100%-2rem))]"
      >
        {diedit && (
          <FormLink
            teks={diedit.teks}
            awal={diedit.linkDokumen ?? ""}
            onSimpan={simpan}
            onHapus={hapus}
            onBatal={() => setEditId(null)}
          />
        )}
      </Dialog>
    </div>
  );
}