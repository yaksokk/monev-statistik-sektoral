"use client";

import { Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "@/components/ui/Dialog";
import {
  catatanWajib,
  formatWaktu,
  labelSesi,
  statusSesi,
  susunRiwayat,
  waktuSekarang,
  type StatusSesi,
} from "@/lib/presensi";
import {
  STATUS_KEHADIRAN_LABEL,
  type Presensi,
  type SesiPembinaan,
  type StatusKehadiran,
} from "@/lib/types";

type Props = {
  opdId: string;
  sesiList: SesiPembinaan[];
  presensiAwal: Presensi[];
};

const URUTAN_STATUS: StatusKehadiran[] = ["tepat_waktu", "terlambat", "izin"];

const KETERANGAN_SESI: Partial<Record<StatusSesi, string>> = {
  sudah_diisi: "sudah diisi",
  belum_dibuka: "belum dibuka",
  terkunci: "ditutup",
};

const WARNA_LENCANA: Record<StatusKehadiran | "tidak_mengisi", string> = {
  tepat_waktu: "bg-status-disetujui-bg text-status-disetujui-fg",
  terlambat: "bg-status-menunggu-bg text-status-menunggu-fg",
  izin: "bg-status-belum-bg text-status-belum-fg",
  tidak_mengisi: "bg-status-revisi-bg text-status-revisi-fg",
};

const KELAS_INPUT =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink disabled:bg-surface-muted disabled:text-ink-muted";

function Lencana({ jenis, children }: { jenis: keyof typeof WARNA_LENCANA; children: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${WARNA_LENCANA[jenis]}`}
    >
      {children}
    </span>
  );
}

export default function DaftarHadirClient({ opdId, sesiList, presensiAwal }: Props) {
  const [presensi, setPresensi] = useState(presensiAwal);
  const [sekarang, setSekarang] = useState<string | null>(null);
  const [sesiId, setSesiId] = useState("");
  const [status, setStatus] = useState<StatusKehadiran>("tepat_waktu");
  const [catatan, setCatatan] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [konfirmasi, setKonfirmasi] = useState(false);

  // Waktu dihitung di browser, diperbarui tiap 30 detik agar sesi terkunci tepat waktu
  useEffect(() => {
    setSekarang(waktuSekarang());
    const timer = setInterval(() => setSekarang(waktuSekarang()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const sesiTerpilih = sesiList.find((s) => s.id === sesiId);
  const riwayat = susunRiwayat(sesiList, presensi, sekarang);
  const adaTerbuka =
    sekarang !== null && sesiList.some((s) => statusSesi(s, presensi, sekarang) === "terbuka");

  function periksa(e: FormEvent) {
    e.preventDefault();
    if (!sesiTerpilih) {
      setGalat("Pilih sesi pembinaan terlebih dahulu.");
      return;
    }
    if (catatanWajib(status) && !catatan.trim()) {
      setGalat("Catatan wajib diisi untuk status ini.");
      return;
    }
    setGalat(null);
    setKonfirmasi(true);
  }

  function kirim() {
    if (!sesiTerpilih) return;
    const waktu = waktuSekarang();
    setSekarang(waktu);
    setKonfirmasi(false);

    // batas waktu bisa saja lewat saat dialog terbuka
    if (statusSesi(sesiTerpilih, presensi, waktu) !== "terbuka") {
      setGalat("Sesi ini sudah tidak bisa diisi.");
      setSesiId("");
      return;
    }

    setPresensi((prev) => [
      ...prev,
      {
        id: `hadir-${opdId}-${sesiTerpilih.id}`,
        opdId,
        sesiId: sesiTerpilih.id,
        status,
        waktuIsi: waktu,
        catatan: catatan.trim() || null,
      },
    ]);
    setSesiId("");
    setStatus("tepat_waktu");
    setCatatan("");
    setGalat(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section
        aria-label="Form isi presensi"
        className="h-fit rounded-card border border-line bg-surface p-5 shadow-card lg:col-span-2"
      >
        <h2 className="text-lg font-semibold text-ink">Form Isi Presensi Sesi</h2>

        <form onSubmit={periksa} className="mt-4 space-y-4">
          <div>
            <label htmlFor="sesi" className="mb-1 block text-sm font-medium text-ink">
              Pilih Sesi Pembinaan
            </label>
            <select
              id="sesi"
              value={sesiId}
              onChange={(e) => setSesiId(e.target.value)}
              disabled={sekarang === null}
              className={KELAS_INPUT}
            >
              <option value="">Pilih sesi…</option>
              {sesiList.map((sesi) => {
                const st = sekarang ? statusSesi(sesi, presensi, sekarang) : null;
                const keterangan = st ? KETERANGAN_SESI[st] : undefined;
                return (
                  <option key={sesi.id} value={sesi.id} disabled={st !== "terbuka"}>
                    {labelSesi(sesi)}
                    {keterangan ? ` (${keterangan})` : ""}
                  </option>
                );
              })}
            </select>
            {sekarang !== null && !adaTerbuka && (
              <p className="mt-1 text-xs text-ink-muted">Belum ada sesi yang bisa diisi.</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-ink">
              Status Kehadiran
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusKehadiran)}
              className={KELAS_INPUT}
            >
              {URUTAN_STATUS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_KEHADIRAN_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="catatan" className="mb-1 block text-sm font-medium text-ink">
              Catatan / Keterangan Tambahan{" "}
              <span className="font-normal text-ink-muted">
                {catatanWajib(status) ? "(wajib)" : "(opsional)"}
              </span>
            </label>
            <textarea
              id="catatan"
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tulis catatan tambahan…"
              className={`${KELAS_INPUT} resize-y placeholder:text-ink-muted`}
            />
          </div>

          {galat && (
            <p role="alert" className="text-sm text-status-revisi-fg">
              {galat}
            </p>
          )}

          <button
            type="submit"
            disabled={sekarang === null}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            <Send className="size-4" aria-hidden />
            Kirim Presensi Kehadiran
          </button>
        </form>
      </section>

      <section
        aria-label="Riwayat kehadiran"
        className="rounded-card border border-line bg-surface p-5 shadow-card lg:col-span-3"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">Riwayat Kehadiran</h2>
          <span className="tabular rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            {presensi.length} tercatat
          </span>
        </div>

        {riwayat.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">Belum ada kehadiran tercatat.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-xl text-left text-sm">
              <thead>
                <tr className="bg-surface-muted text-xs uppercase text-ink-muted">
                  <th scope="col" className="rounded-l-lg px-3 py-2.5 font-semibold">Sesi Pembinaan</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Waktu Presensi</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                  <th scope="col" className="rounded-r-lg px-3 py-2.5 font-semibold">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {riwayat.map((baris) => {
                  if (baris.jenis === "tidak_mengisi") {
                    return (
                      <tr key={baris.sesi.id}>
                        <td className="px-3 py-3 font-medium text-ink">{labelSesi(baris.sesi)}</td>
                        <td className="px-3 py-3 text-ink-muted">–</td>
                        <td className="px-3 py-3">
                          <Lencana jenis="tidak_mengisi">Tidak mengisi</Lencana>
                        </td>
                        <td className="px-3 py-3 text-ink-muted">–</td>
                      </tr>
                    );
                  }

                  const { presensi: p } = baris;
                  const waktu = formatWaktu(p.waktuIsi);
                  return (
                    <tr key={baris.sesi.id}>
                      <td className="px-3 py-3 font-medium text-ink">{labelSesi(baris.sesi)}</td>
                      <td className="tabular px-3 py-3 text-ink-muted">
                        <p>{waktu.tanggal}</p>
                        <p>{waktu.jam}</p>
                      </td>
                      <td className="px-3 py-3">
                        <Lencana jenis={p.status}>{STATUS_KEHADIRAN_LABEL[p.status]}</Lencana>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">{p.catatan ?? "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog buka={konfirmasi} onTutup={() => setKonfirmasi(false)} judul="Kirim presensi?">
        {sesiTerpilih && (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-ink-muted">Sesi</dt>
              <dd className="font-medium text-ink">{labelSesi(sesiTerpilih)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Status</dt>
              <dd className="font-medium text-ink">{STATUS_KEHADIRAN_LABEL[status]}</dd>
            </div>
            {catatan.trim() && (
              <div>
                <dt className="text-ink-muted">Catatan</dt>
                <dd className="text-ink">{catatan.trim()}</dd>
              </div>
            )}
          </dl>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setKonfirmasi(false)}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={kirim}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Kirim presensi
          </button>
        </div>
      </Dialog>
    </div>
  );
}