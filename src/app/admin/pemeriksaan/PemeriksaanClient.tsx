"use client";

import { Fragment, useState, type FormEvent } from "react";
import { Eye } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  STATUS_LABEL,
  type Dokumen,
  type ItemDokumen,
  type Kegiatan,
  type Opd,
  type StatusDokumen,
} from "@/lib/types";

interface Props {
  dokumenAwal: Dokumen[];
  opdList: Opd[];
  itemList: ItemDokumen[];
  kegiatanList: Kegiatan[];
}

const SEMUA = "semua";
const KELAS_FILTER =
  "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink";

// Sementara semua dokumen menampilkan berkas contoh yang sama
const BERKAS_CONTOH = "/contoh/contoh-dokumen.pdf";

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export function PemeriksaanClient({
  dokumenAwal,
  opdList,
  itemList,
  kegiatanList,
}: Props) {
  const [dokumen, setDokumen] = useState(dokumenAwal);
  const [kegiatanId, setKegiatanId] = useState(kegiatanList[0].id);
  const [opdId, setOpdId] = useState(SEMUA);
  const [status, setStatus] = useState<StatusDokumen | typeof SEMUA>("menunggu");
  const [revisiId, setRevisiId] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [info, setInfo] = useState("");
  const [lihat, setLihat] = useState<Dokumen | null>(null);

  const namaOpd = (id: string) => opdList.find((o) => o.id === id)?.nama ?? id;
  const namaItem = (id: string) => itemList.find((i) => i.id === id)?.nama ?? id;

  const tampil = dokumen.filter(
    (d) =>
      d.kegiatanId === kegiatanId &&
      (opdId === SEMUA || d.opdId === opdId) &&
      (status === SEMUA || d.status === status),
  );

  function ubah(id: string, statusBaru: StatusDokumen, catatanRevisi: string | null) {
    setDokumen((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: statusBaru, catatanRevisi } : d)),
    );
  }

  function setujui(d: Dokumen) {
    ubah(d.id, "disetujui", null);
    setInfo(`${namaItem(d.itemId)} dari ${namaOpd(d.opdId)} disetujui.`);
  }

  function kirimRevisi(e: FormEvent, d: Dokumen) {
    e.preventDefault();
    const teks = catatan.trim();
    if (!teks) return;
    ubah(d.id, "revisi", teks);
    setInfo(`Revisi diminta untuk ${namaItem(d.itemId)} dari ${namaOpd(d.opdId)}.`);
    setRevisiId(null);
    setCatatan("");
  }

  return (
    <div>
      {/* filter */}
      <div className="flex flex-wrap gap-4">
        <label className="text-sm text-ink-muted">
          Kegiatan
          <select
            className={`${KELAS_FILTER} mt-1 block`}
            value={kegiatanId}
            onChange={(e) => setKegiatanId(e.target.value)}
          >
            {kegiatanList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-ink-muted">
          OPD
          <select
            className={`${KELAS_FILTER} mt-1 block`}
            value={opdId}
            onChange={(e) => setOpdId(e.target.value)}
          >
            <option value={SEMUA}>Semua OPD</option>
            {opdList.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nama}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-ink-muted">
          Status
          <select
            className={`${KELAS_FILTER} mt-1 block`}
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusDokumen | typeof SEMUA)}
          >
            <option value={SEMUA}>Semua status</option>
            {(Object.keys(STATUS_LABEL) as StatusDokumen[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p role="status" className="mt-4 min-h-5 text-sm text-ink-muted">
        {info}
      </p>

      {/* daftar dokumen */}
      <div className="mt-2 overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="border-b border-line px-5 py-3 text-sm text-ink-muted">
          <span className="tabular font-medium text-ink">{tampil.length}</span> dokumen
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-ink-muted">
              <tr>
                <th className="px-5 py-3 font-medium">OPD</th>
                <th className="px-5 py-3 font-medium">Dokumen</th>
                <th className="px-5 py-3 font-medium">Berkas</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tampil.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink-muted">
                    Tidak ada dokumen yang cocok dengan filter.
                  </td>
                </tr>
              )}
              {tampil.map((d) => (
                <Fragment key={d.id}>
                  <tr>
                    <td className="px-5 py-3 font-medium text-ink">{namaOpd(d.opdId)}</td>
                    <td className="px-5 py-3 text-ink">{namaItem(d.itemId)}</td>
                    <td className="tabular px-5 py-3">
                      {d.namaFile ? (
                        <>
                          <span className="text-ink">{d.namaFile}</span>
                          {d.diunggahPada && (
                            <span className="block text-xs text-ink-muted">
                              Diunggah {tanggal(d.diunggahPada)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-ink-muted">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={d.status} />
                      {d.status === "revisi" && d.catatanRevisi && (
                        <span className="mt-1 block max-w-xs text-xs text-ink-muted">
                          {d.catatanRevisi}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {d.namaFile && (
                          <button
                            type="button"
                            onClick={() => setLihat(d)}
                            aria-label={`Lihat ${d.namaFile}`}
                            title="Lihat dokumen"
                            className="rounded-md border border-line bg-surface p-1.5 text-ink hover:bg-surface-muted"
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </button>
                        )}
                        {d.status === "menunggu" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setujui(d)}
                              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRevisiId(d.id);
                                setCatatan("");
                              }}
                              className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted"
                            >
                              Minta revisi
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {revisiId === d.id && (
                    <tr className="bg-surface-muted">
                      <td colSpan={5} className="px-5 py-4">
                        <form onSubmit={(e) => kirimRevisi(e, d)}>
                          <label className="block text-sm font-medium text-ink">
                            Catatan revisi untuk {namaOpd(d.opdId)}
                            <textarea
                              value={catatan}
                              onChange={(e) => setCatatan(e.target.value)}
                              rows={3}
                              required
                              className="mt-1 block w-full max-w-xl rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
                            />
                          </label>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="submit"
                              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
                            >
                              Kirim revisi
                            </button>
                            <button
                              type="button"
                              onClick={() => setRevisiId(null)}
                              className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted"
                            >
                              Batal
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* pratinjau dokumen */}
      <Dialog
        buka={lihat !== null}
        onTutup={() => setLihat(null)}
        judul={lihat ? namaItem(lihat.itemId) : ""}
        lebar="w-[min(60rem,calc(100%-2rem))]"
      >
        {lihat && (
          <>
            <p className="text-sm text-ink-muted">
              {namaOpd(lihat.opdId)} · {lihat.namaFile}
            </p>
            <iframe
              src={BERKAS_CONTOH}
              title={`Pratinjau ${lihat.namaFile}`}
              className="h-[65vh] w-full rounded-lg border border-line"
            />
            <div className="flex justify-between gap-2">
              <a
                href={BERKAS_CONTOH}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted"
              >
                Buka di tab baru
              </a>
              <button
                type="button"
                onClick={() => setLihat(null)}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
              >
                Tutup
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}