"use client";

import { useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { formatNGain, hitungNGain, nGainTersedia } from "@/lib/dashboard";
import {
  JENIS_QUIZ,
  LABEL_QUIZ,
  cariPengaturan,
  formatNilai,
  hitungHasil,
  hurufOpsi,
  quizAktif,
  soalQuiz,
  statusWaktuQuiz,
} from "@/lib/quiz";
import type {
  HasilQuiz,
  IzinKerjaUlang,
  JenisQuiz,
  Kegiatan,
  Opd,
  PengaturanQuiz,
  Pengguna,
  SoalQuiz,
} from "@/lib/types";
import {
  LENCANA,
  LEBAR_DIALOG,
  Lencana,
  kartu,
  kolomInput,
  teksWaktu,
  tombolBahaya,
  tombolSekunder,
  tombolUtama,
} from "./ui";

export type TargetIzin = { penggunaId: string; jenis: JenisQuiz };

const kunciSel = (t: TargetIzin) => `${t.penggunaId}:${t.jenis}`;

type Props = {
  kegiatan: Kegiatan;
  arsip: boolean;
  opdList: Opd[];
  penggunaList: Pengguna[]; // pegawai OPD (operator)
  soalList: SoalQuiz[]; // soal kegiatan ini
  pengaturanList: PengaturanQuiz[]; // pengaturan kegiatan ini
  hasil: HasilQuiz[]; // hasil kegiatan ini
  izin: IzinKerjaUlang[]; // izin kegiatan ini
  sekarang: string | null;
  onIzin: (target: TargetIzin[]) => void;
};

export default function TabRekap({
  kegiatan,
  arsip,
  opdList,
  penggunaList,
  soalList,
  pengaturanList,
  hasil,
  izin,
  sekarang,
  onIzin,
}: Props) {
  const [cari, setCari] = useState("");
  const [pilihan, setPilihan] = useState<string[]>([]);
  const [detail, setDetail] = useState<TargetIzin | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<TargetIzin[] | null>(null);

  const dataJenis = JENIS_QUIZ.map((jenis) => ({
    jenis,
    aktif: quizAktif(kegiatan, jenis),
    soal: soalQuiz(soalList, kegiatan.id, jenis),
    pengaturan: cariPengaturan(pengaturanList, kegiatan.id, jenis),
  }));
  const dataDari = (jenis: JenisQuiz) => dataJenis.find((d) => d.jenis === jenis)!;
  const namaOpd = (id: string | undefined) => opdList.find((o) => o.id === id)?.nama ?? "–";
  const namaPegawai = (id: string) => penggunaList.find((p) => p.id === id)?.nama ?? id;
  const hasilDari = (penggunaId: string, jenis: JenisQuiz) =>
    hasil.find((h) => h.penggunaId === penggunaId && h.quizId === jenis);

  const kata = cari.trim().toLowerCase();
  const pegawaiTampil = penggunaList.filter((p) =>
    `${p.nama} ${namaOpd(p.opdId)}`.toLowerCase().includes(kata),
  );

  const hasilDetail = detail ? hasilDari(detail.penggunaId, detail.jenis) : undefined;
  const soalDetail = detail ? dataDari(detail.jenis).soal : [];
  const barisDetail = hasilDetail
    ? hasilDetail.urutanSoal
        .map((id) => soalDetail.find((s) => s.id === id))
        .filter((s): s is SoalQuiz => !!s)
    : [];
  const ringkasDetail = hasilDetail ? hitungHasil(soalDetail, hasilDetail.jawaban) : null;

  function pilih(t: TargetIzin, nilai: boolean) {
    const k = kunciSel(t);
    setPilihan((prev) => (nilai ? [...prev.filter((x) => x !== k), k] : prev.filter((x) => x !== k)));
  }

  function targetDariPilihan(): TargetIzin[] {
    return pilihan.map((k) => {
      const [penggunaId, jenis] = k.split(":") as [string, JenisQuiz];
      return { penggunaId, jenis };
    });
  }

  function terapkan() {
    if (!konfirmasi) return;
    onIzin(konfirmasi);
    setKonfirmasi(null);
    setDetail(null);
    setPilihan([]);
  }

  // jenis yang batas akhirnya sudah lewat, izinnya baru berlaku setelah batas akhir baru diatur
  const jenisDitutup = konfirmasi
    ? [...new Set(konfirmasi.map((t) => t.jenis))].filter(
        (j) => sekarang && statusWaktuQuiz(dataDari(j).pengaturan, sekarang) === "ditutup",
      )
    : [];
  const pegawaiNGainKosong = konfirmasi
    ? konfirmasi
        .filter(
          (t) =>
            t.jenis === "pretest" && dataDari("posttest").aktif && !!hasilDari(t.penggunaId, "posttest"),
        )
        .map((t) => namaPegawai(t.penggunaId))
    : [];

  const nGainBerlaku = nGainTersedia(kegiatan);

  // N-Gain kosong ("–") bila salah satu quiz belum dikerjakan atau dimatikan
  function teksNGain(penggunaId: string) {
    if (!nGainBerlaku) return "–";
    const nilai = (jenis: JenisQuiz) => {
      const h = hasilDari(penggunaId, jenis);
      return h ? hitungHasil(dataDari(jenis).soal, h.jawaban).nilai : null;
    };
    const n = hitungNGain(nilai("pretest"), nilai("posttest"));
    return n === null ? "–" : formatNGain(n);
  }

  function sel(penggunaId: string, jenis: JenisQuiz) {
    const d = dataDari(jenis);
    if (!d.aktif) return <span className="text-ink-muted">–</span>;
    const h = hasilDari(penggunaId, jenis);
    if (h) {
      const r = hitungHasil(d.soal, h.jawaban);
      const t = { penggunaId, jenis };
      return (
        <div className="flex items-center gap-2">
          {!arsip && (
            <input
              type="checkbox"
              checked={pilihan.includes(kunciSel(t))}
              onChange={(e) => pilih(t, e.target.checked)}
              aria-label={`Pilih ${namaPegawai(penggunaId)} untuk ${LABEL_QUIZ[jenis]}`}
              className="size-4 shrink-0 accent-(--color-primary)"
            />
          )}
          <button
            type="button"
            onClick={() => setDetail(t)}
            title="Lihat detail"
            className="rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="tabular font-semibold text-ink">{formatNilai(r.nilai)}</span>
            <span className="tabular block text-xs text-ink-muted">
              {r.benar} benar, {r.salah} salah
            </span>
          </button>
        </div>
      );
    }
    const diizinkan = izin.some((i) => i.penggunaId === penggunaId && i.quizId === jenis);
    return diizinkan ? (
      <Lencana kelas={LENCANA.kuning}>Diizinkan mengerjakan ulang</Lencana>
    ) : (
      <Lencana kelas={LENCANA.netral}>Belum mengerjakan</Lencana>
    );
  }

  return (
    <section aria-labelledby="judul-rekap-quiz" className={kartu}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="judul-rekap-quiz" className="font-semibold text-ink">
          Rekap hasil pegawai
        </h2>
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari pegawai atau OPD…"
            aria-label="Cari pegawai atau OPD"
            className={`${kolomInput} pl-9`}
          />
        </div>
      </div>

      {pilihan.length > 0 && (
        <div
          role="region"
          aria-label="Aksi untuk pengerjaan terpilih"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-muted px-4 py-3 text-sm"
        >
          <span className="tabular text-ink">{pilihan.length} pengerjaan dipilih</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPilihan([])} className={tombolSekunder}>
              Batal pilih
            </button>
            <button type="button" onClick={() => setKonfirmasi(targetDariPilihan())} className={tombolUtama}>
              <RotateCcw className="size-4" aria-hidden />
              Izinkan kerjakan ulang
            </button>
          </div>
        </div>
      )}

      {pegawaiTampil.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-muted">Tidak ada pegawai yang cocok.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-208 text-left text-sm">
            <thead>
              <tr className="bg-surface-muted text-xs uppercase text-ink-muted">
                <th scope="col" className="rounded-l-lg px-3 py-2.5 font-semibold">Pegawai</th>
                {JENIS_QUIZ.map((j) => (
                  <th key={j} scope="col" className="px-3 py-2.5 font-semibold">
                    {LABEL_QUIZ[j]}
                    {!dataDari(j).aktif && (
                      <span className="block text-xs font-normal normal-case">Tidak dipakai</span>
                    )}
                  </th>
                ))}
                <th scope="col" className="rounded-r-lg px-3 py-2.5 font-semibold">
                  N-Gain
                  {!nGainBerlaku && (
                    <span className="block text-xs font-normal normal-case">Tidak dihitung</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pegawaiTampil.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-3">
                    <span className="block font-medium text-ink">{p.nama}</span>
                    <span className="block text-xs text-ink-muted">{namaOpd(p.opdId)}</span>
                  </td>
                  {JENIS_QUIZ.map((j) => (
                    <td key={j} className="px-3 py-3">
                      {sel(p.id, j)}
                    </td>
                  ))}
                  <td className="tabular px-3 py-3 text-ink">{teksNGain(p.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-muted">
        Klik nilai untuk melihat jawaban pegawai. Izin kerjakan ulang menghapus hasil lama pegawai itu; setelah batas
        akhir pertama lewat, hanya pegawai yang diizinkan yang bisa mengerjakan lagi.
      </p>

      <Dialog buka={!!hasilDetail} onTutup={() => setDetail(null)} judul="Detail pengerjaan" lebar={LEBAR_DIALOG}>
        {detail && hasilDetail && ringkasDetail && (
          <>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Pegawai</dt>
                <dd className="font-medium text-ink">{namaPegawai(detail.penggunaId)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">OPD</dt>
                <dd className="font-medium text-ink">
                  {namaOpd(penggunaList.find((p) => p.id === detail.penggunaId)?.opdId)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Quiz</dt>
                <dd className="font-medium text-ink">{LABEL_QUIZ[detail.jenis]}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Nilai</dt>
                <dd className="tabular font-medium text-ink">
                  {formatNilai(ringkasDetail.nilai)} ({ringkasDetail.benar} benar, {ringkasDetail.salah} salah)
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Pengiriman</dt>
                <dd className="text-ink">{hasilDetail.otomatis ? "Otomatis, waktu habis" : "Dikirim OPD"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Mulai</dt>
                <dd className="tabular text-ink">{teksWaktu(hasilDetail.mulai, "–")}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Selesai</dt>
                <dd className="tabular text-ink">{teksWaktu(hasilDetail.selesai, "–")}</dd>
              </div>
            </dl>

            <ol className="space-y-3">
              {barisDetail.map((s, i) => {
                const jawab = hasilDetail.jawaban[s.id];
                const benar = s.aktif && jawab === s.kunci;
                return (
                  <li key={s.id} className="space-y-1 rounded-lg border border-line p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-ink">
                        <span className="tabular text-ink-muted">{i + 1}. </span>
                        {s.pertanyaan}
                      </p>
                      {!s.aktif ? (
                        <Lencana kelas={LENCANA.netral}>Tidak dihitung</Lencana>
                      ) : benar ? (
                        <Lencana kelas={LENCANA.hijau}>Benar</Lencana>
                      ) : (
                        <Lencana kelas={LENCANA.merah}>Salah</Lencana>
                      )}
                    </div>
                    <p className="text-ink-muted">
                      Jawaban pegawai:{" "}
                      {jawab === undefined ? "Tidak dijawab" : `${hurufOpsi(jawab)}. ${s.opsi[jawab] ?? ""}`}
                    </p>
                    <p className="text-ink-muted">
                      Kunci: {hurufOpsi(s.kunci)}. {s.opsi[s.kunci]}
                    </p>
                  </li>
                );
              })}
            </ol>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDetail(null)} className={tombolSekunder}>
                Tutup
              </button>
              {!arsip && (
                <button type="button" onClick={() => setKonfirmasi([detail])} className={tombolUtama}>
                  <RotateCcw className="size-4" aria-hidden />
                  Izinkan kerjakan ulang
                </button>
              )}
            </div>
          </>
        )}
      </Dialog>

      <Dialog buka={!!konfirmasi} onTutup={() => setKonfirmasi(null)} judul="Izinkan kerjakan ulang?">
        {konfirmasi && (
          <>
            <p className="text-sm text-ink-muted">
              Hasil dan jawaban lama pada {konfirmasi.length} pengerjaan berikut akan dihapus dan tidak bisa
              dikembalikan.
            </p>
            <ul className="max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-ink">
              {konfirmasi.map((t) => (
                <li key={kunciSel(t)}>
                  {namaPegawai(t.penggunaId)}, {LABEL_QUIZ[t.jenis]}
                </li>
              ))}
            </ul>
            {jenisDitutup.length > 0 ? (
              <p role="note" className="text-sm text-status-menunggu-fg">
                Batas akhir {jenisDitutup.map((j) => LABEL_QUIZ[j]).join(" dan ")} sudah lewat. Izin baru
                berlaku setelah Anda mengatur batas akhir baru di tab quiz itu, dan hanya pegawai yang diizinkan yang
                bisa mengerjakan.
              </p>
            ) : (
              <p className="text-sm text-ink-muted">
                Pegawai bisa mengerjakan lagi selama quiz masih terbuka.
              </p>
            )}
            {pegawaiNGainKosong.length > 0 && (
              <p role="note" className="text-sm text-status-menunggu-fg">
                N-Gain {pegawaiNGainKosong.join(", ")} kosong sampai Pre-Test dikerjakan lagi.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setKonfirmasi(null)} className={tombolSekunder}>
                Batal
              </button>
              <button type="button" onClick={terapkan} className={tombolBahaya}>
                Hapus hasil dan izinkan
              </button>
            </div>
          </>
        )}
      </Dialog>
    </section>
  );
}