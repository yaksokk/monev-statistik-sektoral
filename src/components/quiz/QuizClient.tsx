"use client";

import { Check, ChevronLeft, ChevronRight, Clock, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { kirimQuiz, mulaiQuiz, simpanJawaban } from "@/app/opd/quiz/actions";
import { Dialog } from "@/components/ui/Dialog";
import { formatWaktu, waktuSekarang } from "@/lib/presensi";
import { formatNilai, formatSisa, hurufOpsi, statusQuiz } from "@/lib/quiz";
import type {
  JenisQuiz,
  PengaturanQuiz,
  RingkasanHasil,
  ReviewSoal,
  SesiPegawai,
} from "@/lib/types";

// Syarat sebelum quiz boleh dimulai, mis. Post-Test menunggu Pre-Test selesai
type Prasyarat = { terpenuhi: boolean; pesan: string };

type Props = {
  kegiatanId: string;
  jenis: JenisQuiz;
  nama: string; // "Pre-Test" atau "Post-Test"
  pengaturan: PengaturanQuiz;
  jumlahSoal: number; // soal aktif
  hasil: RingkasanHasil | null;
  review: ReviewSoal[] | null;
  sesi: SesiPegawai | null; // pengerjaan yang sedang berjalan
  prasyarat?: Prasyarat;
  diizinkan?: boolean; // pegawai punya izin kerjakan ulang dari admin
};

const KELAS_TOMBOL_SEKUNDER =
  "flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted disabled:opacity-50";

export default function QuizClient(props: Props) {
  const { kegiatanId, jenis, nama, pengaturan, jumlahSoal, hasil, review, sesi, prasyarat, diizinkan } = props;

  if (hasil) return <HasilQuiz pengaturan={pengaturan} hasil={hasil} review={review ?? []} />;
  if (sesi) {
    return (
      <PengerjaanQuiz
        key={sesi.mulai}
        kegiatanId={kegiatanId}
        jenis={jenis}
        nama={nama}
        pengaturan={pengaturan}
        sesi={sesi}
      />
    );
  }
  return (
    <MulaiQuiz
      kegiatanId={kegiatanId}
      jenis={jenis}
      nama={nama}
      pengaturan={pengaturan}
      jumlahSoal={jumlahSoal}
      prasyarat={prasyarat}
      diizinkan={diizinkan}
    />
  );
}

/* ---------------------------- Hasil ---------------------------- */
function HasilQuiz({
  pengaturan,
  hasil,
  review,
}: {
  pengaturan: PengaturanQuiz;
  hasil: RingkasanHasil;
  review: ReviewSoal[];
}) {
  const { benar, salah, total, nilai } = hasil;
  const waktuSelesai = formatWaktu(hasil.selesai);

  return (
    <div className="space-y-6">
      <section
        aria-label="Ringkasan hasil"
        className="rounded-card border border-line bg-surface p-5 shadow-card"
      >
        <h2 className="text-lg font-semibold text-ink">{pengaturan.judul}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Terkirim {waktuSelesai.tanggal}, pukul {waktuSelesai.jam}
        </p>

        {hasil.otomatis && (
          <p className="mt-3 rounded-lg bg-status-menunggu-bg px-3 py-2 text-sm text-status-menunggu-fg">
            Jawaban terkirim otomatis karena waktu habis. Soal yang belum dijawab dihitung salah.
          </p>
        )}

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-primary-soft p-4">
            <dt className="text-sm text-ink-muted">Nilai</dt>
            <dd className="tabular text-3xl font-semibold text-primary">{formatNilai(nilai)}</dd>
          </div>
          <div className="rounded-lg bg-status-disetujui-bg p-4">
            <dt className="text-sm text-status-disetujui-fg">Jawaban benar</dt>
            <dd className="tabular text-3xl font-semibold text-status-disetujui-fg">
              {benar}
              <span className="text-base font-normal"> dari {total}</span>
            </dd>
          </div>
          <div className="rounded-lg bg-status-revisi-bg p-4">
            <dt className="text-sm text-status-revisi-fg">Jawaban salah</dt>
            <dd className="tabular text-3xl font-semibold text-status-revisi-fg">
              {salah}
              <span className="text-base font-normal"> dari {total}</span>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-label="Pembahasan soal">
        <h2 className="mb-3 text-lg font-semibold text-ink">Pembahasan</h2>
        <ol className="space-y-4">
          {review.map((soal, i) => {
            const dipilih = soal.pilihan;
            const dijawab = dipilih !== null;
            const betul = dipilih === soal.kunci;

            return (
              <li
                key={soal.id}
                className="rounded-card border border-line bg-surface p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ink-muted">Soal {i + 1}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      betul
                        ? "bg-status-disetujui-bg text-status-disetujui-fg"
                        : "bg-status-revisi-bg text-status-revisi-fg"
                    }`}
                  >
                    {betul ? "Benar" : dijawab ? "Salah" : "Tidak dijawab"}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-ink">{soal.pertanyaan}</p>

                <ul className="mt-3 space-y-2">
                  {soal.opsi.map((teks, j) => {
                    const kunci = j === soal.kunci;
                    const pilihan = j === dipilih;
                    const kelas = kunci
                      ? "border-status-disetujui-fg bg-status-disetujui-bg text-status-disetujui-fg"
                      : pilihan
                        ? "border-status-revisi-fg bg-status-revisi-bg text-status-revisi-fg"
                        : "border-line text-ink";
                    const keterangan =
                      kunci && pilihan
                        ? "Jawaban Anda, benar"
                        : kunci
                          ? "Kunci jawaban"
                          : pilihan
                            ? "Jawaban Anda, salah"
                            : null;

                    return (
                      <li
                        key={j}
                        className={`flex flex-wrap items-start justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm ${kelas}`}
                      >
                        <span>
                          <span className="font-semibold">{hurufOpsi(j)}.</span> {teks}
                        </span>
                        {keterangan && <span className="text-xs font-semibold">{keterangan}</span>}
                      </li>
                    );
                  })}
                </ul>

                {soal.pembahasan && (
                  <div className="mt-3 rounded-lg bg-surface-muted p-3 text-sm text-ink">
                    <p className="font-semibold">Pembahasan</p>
                    <p className="mt-1 text-ink-muted">{soal.pembahasan}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

/* -------------------------- Pengerjaan -------------------------- */
function PengerjaanQuiz({
  kegiatanId,
  jenis,
  nama,
  pengaturan,
  sesi,
}: {
  kegiatanId: string;
  jenis: JenisQuiz;
  nama: string;
  pengaturan: PengaturanQuiz;
  sesi: SesiPegawai;
}) {
  const router = useRouter();
  const [jawaban, setJawaban] = useState<Record<string, number>>(sesi.jawaban);
  const [indeks, setIndeks] = useState(0);
  const [sisaDetik, setSisaDetik] = useState(sesi.sisaDetik);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [waktuHabis, setWaktuHabis] = useState(sesi.sisaDetik === 0);
  const [galat, setGalat] = useState<string | null>(null);
  const [gagalSimpan, setGagalSimpan] = useState(false);
  const [mengirim, mulaiKirim] = useTransition();

  // jawaban terbaru untuk dikirim, dan antrean simpan agar urutan klik terjaga
  const jawabanRef = useRef(sesi.jawaban);
  const antrian = useRef<Promise<unknown>>(Promise.resolve());
  const sudahKirim = useRef(false);

  const kirim = useCallback(
    (otomatis: boolean) => {
      sudahKirim.current = true;
      setGalat(null);
      mulaiKirim(async () => {
        const r = await kirimQuiz(kegiatanId, jenis, jawabanRef.current, otomatis);
        if (!r.ok) {
          sudahKirim.current = false;
          setGalat(r.pesan);
          // mungkin sudah terkirim di tempat lain atau sesinya sudah ditutup server
          router.refresh();
        }
      });
    },
    [kegiatanId, jenis, router],
  );

  // Hitung mundur dari sisa waktu server; saat habis, jawaban terkirim otomatis
  useEffect(() => {
    const berakhir = Date.now() + sesi.sisaDetik * 1000;
    const timer = setInterval(() => {
      const sisa = Math.max(0, Math.ceil((berakhir - Date.now()) / 1000));
      setSisaDetik(sisa);
      if (sisa === 0) {
        clearInterval(timer);
        setWaktuHabis(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sesi.sisaDetik]);

  useEffect(() => {
    if (waktuHabis && !sudahKirim.current) kirim(true);
  }, [waktuHabis, kirim]);

  function pilih(soalId: string, pilihan: number) {
    const baru = { ...jawabanRef.current, [soalId]: pilihan };
    jawabanRef.current = baru;
    setJawaban(baru);
    antrian.current = antrian.current
      .then(() => simpanJawaban(kegiatanId, jenis, soalId, pilihan))
      .then((r) => setGagalSimpan(!r.ok))
      .catch(() => setGagalSimpan(true));
  }

  const total = sesi.soal.length;
  const soal = sesi.soal[indeks];
  const terjawab = sesi.soal.filter((s) => jawaban[s.id] !== undefined).length;
  const semuaTerjawab = terjawab === total;
  const hampirHabis = sisaDetik <= 60;
  const terkunci = waktuHabis || mengirim;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
        <div>
          <p className="text-sm text-ink-muted">{pengaturan.judul}</p>
          <p className="tabular text-sm font-medium text-ink">
            {terjawab} dari {total} soal terjawab
          </p>
        </div>
        <p
          role="timer"
          className={`tabular flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
            hampirHabis ? "bg-status-revisi-bg text-status-revisi-fg" : "bg-primary-soft text-primary"
          }`}
        >
          <Clock className="size-4" aria-hidden />
          Sisa waktu {formatSisa(sisaDetik)}
        </p>
      </div>

      {waktuHabis && (
        <p role="status" className="rounded-lg bg-status-menunggu-bg px-3 py-2 text-sm text-status-menunggu-fg">
          Waktu habis. Jawaban dikirim otomatis, soal yang belum dijawab dihitung salah.
        </p>
      )}
      {galat && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-sm text-status-revisi-fg">
          <p>{galat}</p>
          {waktuHabis && (
            <button type="button" onClick={() => kirim(true)} disabled={mengirim} className={KELAS_TOMBOL_SEKUNDER}>
              Kirim ulang
            </button>
          )}
        </div>
      )}
      {gagalSimpan && (
        <p role="status" className="text-sm text-ink-muted">
          Jawaban terakhir belum tersimpan di server. Jawaban tetap ada di halaman ini dan ikut terkirim saat Anda
          menekan Kirim.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <section
          aria-label="Soal"
          className="rounded-card border border-line bg-surface p-5 shadow-card lg:col-span-3"
        >
          <p className="tabular text-sm font-medium text-ink-muted">
            Soal {indeks + 1} dari {total}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-ink">{soal.pertanyaan}</h2>

          <fieldset className="mt-4 space-y-2" disabled={terkunci}>
            <legend className="sr-only">Pilihan jawaban</legend>
            {soal.opsi.map((teks, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-line px-4 py-3 text-sm text-ink hover:bg-surface-muted has-checked:border-primary has-checked:bg-primary-soft"
              >
                <input
                  type="radio"
                  name={`soal-${soal.id}`}
                  checked={jawaban[soal.id] === i}
                  onChange={() => pilih(soal.id, i)}
                  className="mt-0.5 accent-(--color-primary)"
                />
                <span>
                  <span className="font-semibold">{hurufOpsi(i)}.</span> {teks}
                </span>
              </label>
            ))}
          </fieldset>

          <div className="mt-6 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setIndeks((i) => i - 1)}
              disabled={indeks === 0}
              className={KELAS_TOMBOL_SEKUNDER}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setIndeks((i) => i + 1)}
              disabled={indeks === total - 1}
              className={KELAS_TOMBOL_SEKUNDER}
            >
              Berikutnya
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </section>

        <aside
          aria-label="Daftar nomor soal"
          className="h-fit rounded-card border border-line bg-surface p-5 shadow-card"
        >
          <h2 className="text-sm font-semibold text-ink">Nomor Soal</h2>
          <ul className="mt-3 grid grid-cols-5 gap-2 lg:grid-cols-4">
            {sesi.soal.map((s, i) => {
              const sudah = jawaban[s.id] !== undefined;
              const aktif = i === indeks;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setIndeks(i)}
                    aria-current={aktif ? "step" : undefined}
                    aria-label={`Soal ${i + 1}, ${sudah ? "sudah dijawab" : "belum dijawab"}`}
                    className={`tabular relative flex h-10 w-full items-center justify-center rounded-lg border text-sm font-medium ${
                      aktif
                        ? "border-primary bg-primary text-white"
                        : sudah
                          ? "border-status-disetujui-fg bg-status-disetujui-bg text-status-disetujui-fg"
                          : "border-line bg-surface text-ink hover:bg-surface-muted"
                    }`}
                  >
                    {i + 1}
                    {sudah && (
                      <Check
                        className="absolute -right-1 -top-1 size-4 rounded-full bg-status-disetujui-fg p-0.5 text-white"
                        aria-hidden
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-ink-muted">Tanda centang berarti soal sudah dijawab.</p>

          <button
            type="button"
            onClick={() => setKonfirmasi(true)}
            disabled={!semuaTerjawab || terkunci}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            <Send className="size-4" aria-hidden />
            Kirim Jawaban
          </button>
          {!semuaTerjawab && (
            <p className="mt-2 text-xs text-ink-muted">Jawab semua soal untuk bisa mengirim.</p>
          )}
        </aside>
      </div>

      <Dialog buka={konfirmasi} onTutup={() => setKonfirmasi(false)} judul="Kirim jawaban?">
        <p className="text-sm text-ink-muted">
          Semua {total} soal sudah dijawab. Jawaban tidak bisa diubah setelah dikirim, dan {nama}
          hanya bisa dikerjakan satu kali.
        </p>
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
            onClick={() => {
              setKonfirmasi(false);
              kirim(false);
            }}
            disabled={mengirim}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            Kirim jawaban
          </button>
        </div>
      </Dialog>
    </div>
  );
}

/* ---------------------------- Mulai ---------------------------- */
function MulaiQuiz({
  kegiatanId,
  jenis,
  nama,
  pengaturan,
  jumlahSoal,
  prasyarat,
  diizinkan = true,
}: {
  kegiatanId: string;
  jenis: JenisQuiz;
  nama: string;
  pengaturan: PengaturanQuiz;
  jumlahSoal: number;
  prasyarat?: Prasyarat;
  diizinkan?: boolean;
}) {
  const [sekarang, setSekarang] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [memulai, mulaiProses] = useTransition();

  const pesanSyarat = prasyarat && !prasyarat.terpenuhi ? prasyarat.pesan : null;

  // Waktu dihitung di browser, diperbarui tiap 30 detik agar batas akhir tepat waktu
  useEffect(() => {
    const awal = setTimeout(() => setSekarang(waktuSekarang()), 0);
    const timer = setInterval(() => setSekarang(waktuSekarang()), 30_000);
    return () => {
      clearTimeout(awal);
      clearInterval(timer);
    };
  }, []);

  function mulai() {
    if (pesanSyarat) return;
    const waktu = waktuSekarang();
    setSekarang(waktu);

    // batas akhir bisa saja lewat saat halaman terbuka
    if (statusQuiz(pengaturan, false, waktu, diizinkan) !== "terbuka") {
      setGalat(`${nama} sudah tidak bisa dimulai.`);
      return;
    }
    if (jumlahSoal === 0) {
      setGalat(`${nama} belum punya soal.`);
      return;
    }

    setGalat(null);
    // Server membuat sesi (waktu mulai, urutan soal); halaman lalu menampilkan soalnya
    mulaiProses(async () => {
      const r = await mulaiQuiz(kegiatanId, jenis);
      if (!r.ok) setGalat(r.pesan);
    });
  }

  const status = sekarang ? statusQuiz(pengaturan, false, sekarang, diizinkan) : null;
  const batas = pengaturan.batasAkhir ? formatWaktu(pengaturan.batasAkhir) : null;

  return (
    <section
      aria-label={`Mulai ${nama}`}
      className="max-w-2xl rounded-card border border-line bg-surface p-5 shadow-card"
    >
      <h2 className="text-lg font-semibold text-ink">{pengaturan.judul}</h2>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-surface-muted p-3">
          <dt className="text-sm text-ink-muted">Jumlah soal</dt>
          <dd className="tabular font-semibold text-ink">{jumlahSoal} soal</dd>
        </div>
        <div className="rounded-lg bg-surface-muted p-3">
          <dt className="text-sm text-ink-muted">Durasi</dt>
          <dd className="tabular font-semibold text-ink">{pengaturan.durasiMenit} menit</dd>
        </div>
        <div className="rounded-lg bg-surface-muted p-3">
          <dt className="text-sm text-ink-muted">Batas akhir</dt>
          <dd className="tabular font-semibold text-ink">
            {batas ? `${batas.tanggal}, ${batas.jam}` : "Tanpa batas"}
          </dd>
        </div>
      </dl>

      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-muted">
        <li>{nama} hanya bisa dikerjakan satu kali.</li>
        <li>Waktu berjalan sejak tombol Mulai ditekan. Soal baru tampil setelah itu.</li>
        {batas && (
          <li>
            Waktu pengerjaan berakhir paling lambat pada batas akhir, jadi bila Anda mulai mendekati batas
            akhir, waktunya lebih singkat dari durasi.
          </li>
        )}
        <li>Semua soal harus dijawab sebelum jawaban bisa dikirim.</li>
        <li>
          Bila waktu habis, jawaban terkirim otomatis. Soal yang belum dijawab dihitung salah.
        </li>
        <li>Nilai, jawaban benar, dan pembahasan tampil setelah jawaban terkirim.</li>
      </ul>

      {pesanSyarat && (
        <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-muted">
          {pesanSyarat}
        </p>
      )}
      {!pesanSyarat && status === "belum_dibuka" && (
        <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-muted">
          {nama} belum dibuka oleh admin.
        </p>
      )}
      {!pesanSyarat && status === "terkunci" && (
        <p className="mt-4 rounded-lg bg-status-revisi-bg px-3 py-2 text-sm text-status-revisi-fg">
          {nama} sudah ditutup dan tidak bisa dikerjakan lagi.
        </p>
      )}
      {galat && (
        <p role="alert" className="mt-4 text-sm text-status-revisi-fg">
          {galat}
        </p>
      )}

      <button
        type="button"
        onClick={mulai}
        disabled={status !== "terbuka" || pesanSyarat !== null || memulai}
        className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
      >
        Mulai Mengerjakan
      </button>
    </section>
  );
}