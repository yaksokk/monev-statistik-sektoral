"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCheck, ExternalLink } from "lucide-react";
import type { BabModul, ModulPembelajaran } from "@/lib/types";
import { batalkanSelesai, tandaiSelesai } from "./actions";

interface Props {
  modul: ModulPembelajaran;
  babList: BabModul[];
  babSelesai: string[]; // id bab yang sudah ditandai pegawai ini, dari server
  indeksAwal?: number;
}

export default function ModulClient({ modul, babList, babSelesai, indeksAwal = 0 }: Props) {
  const [indeks, setIndeks] = useState(indeksAwal);
  const [galat, setGalat] = useState("");
  const [proses, mulai] = useTransition();

  // Tampilan langsung berubah saat tombol ditekan; setelah server menjawab, data asli dari props yang berlaku
  const [selesai, ubahOptimis] = useOptimistic(
    babSelesai,
    (lama: string[], u: { id: string; sudah: boolean }) =>
      u.sudah ? [...lama.filter((x) => x !== u.id), u.id] : lama.filter((x) => x !== u.id),
  );

  // Admin bisa menghapus bab saat halaman terbuka; jaga agar indeks tetap di dalam daftar
  const i = Math.min(indeks, babList.length - 1);
  const bab = babList[i];
  const sudahSelesai = selesai.includes(bab.id);
  const adaSebelumnya = i > 0;
  const adaSelanjutnya = i < babList.length - 1;
  const materiAda = bab.linkMateri !== "";

  function ubahSelesai() {
    const id = bab.id;
    const sudah = !sudahSelesai;
    setGalat("");
    mulai(async () => {
      ubahOptimis({ id, sudah });
      const hasil = sudah ? await tandaiSelesai(id) : await batalkanSelesai(id);
      if (!hasil.ok) setGalat(hasil.pesan);
    });
  }

  return (
    <section className="rounded-card bg-surface p-5 shadow-card sm:p-8">
      <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-navy-800 sm:text-3xl">
            <BookOpen className="size-7 shrink-0 text-navy-600" aria-hidden />
            Modul {modul.urutan}: {modul.judul}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{modul.subjudul}</p>
        </div>

        <div className="sm:w-72">
          <label htmlFor="pilih-bab" className="sr-only">
            Pilih bab
          </label>
          <select
            id="pilih-bab"
            value={i}
            onChange={(e) => {
              setGalat("");
              setIndeks(Number(e.target.value));
            }}
            className="w-full rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-ink focus:border-navy-600 focus:outline-none focus:ring-2 focus:ring-navy-600/30"
          >
            {babList.map((b, n) => (
              <option key={b.id} value={n}>
                {b.judul}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="py-8">
        <h2 className="text-xl font-semibold text-navy-800">{bab.judul}</h2>

        {materiAda ? (
          <>
            <p className="mt-2 max-w-prose text-ink-muted">
              Materi bab ini tersedia di Google Drive. Pelajari sampai selesai, lalu tekan
              &quot;Sudah selesai&quot; di bawah.
            </p>

            <a
              href={bab.linkMateri}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600"
            >
              <ExternalLink className="size-4" aria-hidden />
              Buka materi di Google Drive
            </a>
          </>
        ) : (
          <p className="mt-2 max-w-prose text-ink-muted">Materi belum tersedia.</p>
        )}
      </div>

      <footer className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setIndeks(i - 1)}
          disabled={!adaSebelumnya}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Sebelumnya
        </button>

        <button
          type="button"
          onClick={ubahSelesai}
          disabled={proses || !materiAda}
          aria-pressed={sudahSelesai}
          title={sudahSelesai ? "Tekan lagi untuk membatalkan" : undefined}
          className={
            (sudahSelesai
              ? "inline-flex items-center justify-center gap-2 rounded-lg border border-status-disetujui-fg/30 bg-status-disetujui-bg px-5 py-2.5 text-sm font-semibold text-status-disetujui-fg hover:brightness-95"
              : "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted") +
            " disabled:cursor-not-allowed disabled:opacity-60"
          }
        >
          <CheckCheck className="size-4" aria-hidden />
          {sudahSelesai ? "Sudah selesai" : "Tandai sudah selesai"}
        </button>

        <button
          type="button"
          onClick={() => setIndeks(i + 1)}
          disabled={!adaSelanjutnya}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Selanjutnya
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </footer>

      {galat && (
        <p role="alert" className="mt-3 text-sm text-status-revisi-fg">
          {galat}
        </p>
      )}
    </section>
  );
}