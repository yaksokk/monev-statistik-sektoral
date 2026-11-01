"use client";

import { useState } from "react";
import { ExternalLink, Link2, Pencil } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import type { AspekMonev } from "@/lib/types";

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
  onSimpan: (link: string) => void;
  onHapus: () => void;
  onBatal: () => void;
}) {
  const [link, setLink] = useState(awal);
  const [galat, setGalat] = useState("");

  function simpan() {
    const bersih = link.trim();
    if (!bersih) return setGalat("Link wajib diisi.");
    if (!bersih.toLowerCase().startsWith("https://")) return setGalat("Link harus diawali https://");
    onSimpan(bersih);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">{teks}</p>
      <div className="space-y-1.5">
        <label htmlFor="mi-link" className="text-sm font-medium">
          Link dokumen
        </label>
        <input
          id="mi-link"
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
          <button onClick={onHapus} className={`${tombolBahaya} mr-auto`}>
            Hapus link
          </button>
        )}
        <button onClick={onBatal} className={tombolSekunder}>
          Batal
        </button>
        <button onClick={simpan} className={tombolUtama}>
          Simpan
        </button>
      </div>
    </div>
  );
}

export default function MonevIndikatorClient({ aspekList }: { aspekList: AspekMonev[] }) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [pesan, setPesan] = useState("");

  const diedit = editId
    ? aspekList.flatMap((a) => a.indikator).find((i) => i.id === editId)
    : undefined;

  function simpan(link: string) {
    if (!editId) return;
    setLinks((prev) => ({ ...prev, [editId]: link }));
    setPesan("Link dokumen disimpan.");
    setEditId(null);
  }

  function hapus() {
    if (!editId) return;
    setLinks((prev) => {
      const { [editId]: _, ...sisa } = prev;
      return sisa;
    });
    setPesan("Link dokumen dihapus.");
    setEditId(null);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-ink">Monev Indikator Keberhasilan</h1>
        <p className="text-sm text-ink-muted">
          Kondisi aktual, kondisi yang diharapkan, dan indikator keberhasilan per aspek.
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
                Aspek
              </th>
              <th scope="col" className="px-4 py-3">
                Kondisi Aktual
              </th>
              <th scope="col" className="px-4 py-3">
                Kondisi yang Diharapkan
              </th>
              <th scope="col" className="w-96 px-4 py-3">
                Indikator Keberhasilan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {aspekList.map((a) => (
              <tr key={a.id} className="align-top">
                <th scope="row" className="px-4 py-4 text-left font-semibold text-ink">
                  {a.nama}
                </th>
                <td className="px-4 py-4 text-ink">{a.kondisiAktual}</td>
                <td className="px-4 py-4 text-ink">{a.kondisiDiharapkan}</td>
                <td className="px-4 py-4">
                  <ul className="space-y-4">
                    {a.indikator.map((i) => {
                      const link = links[i.id];
                      return (
                        <li key={i.id} className="space-y-2">
                          <p className="text-ink">{i.teks}</p>
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
                              <button disabled className={tombolSekunder}>
                                Lihat dokumen
                                <ExternalLink className="size-3.5" aria-hidden />
                              </button>
                            )}
                            <button onClick={() => setEditId(i.id)} className={tombolSekunder}>
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
        judul="Link dokumen indikator"
        lebar="w-[min(36rem,calc(100%-2rem))]"
      >
        {diedit && (
          <FormLink
            teks={diedit.teks}
            awal={links[diedit.id] ?? ""}
            onSimpan={simpan}
            onHapus={hapus}
            onBatal={() => setEditId(null)}
          />
        )}
      </Dialog>
    </div>
  );
}