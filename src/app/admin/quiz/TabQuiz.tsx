"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, KeyRound, Pencil, Plus, Trash2, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import {
  LABEL_QUIZ,
  dampakPerubahan,
  hurufOpsi,
  quizAktif,
  soalAktif,
  soalBisaDiubah,
  statusWaktuQuiz,
  validasiPengaturan,
  type HasilValidasi,
  type MasukanPengaturan,
} from "@/lib/quiz";
import type {
  HasilQuiz,
  JenisQuiz,
  Kegiatan,
  LogPerubahanQuiz,
  PengaturanQuiz,
  SoalQuiz,
} from "@/lib/types";
import {
  GAYA_STATUS_WAKTU,
  LABEL_STATUS_WAKTU,
  LEBAR_DIALOG,
  Lencana,
  kartu,
  kolomInput,
  ringkas,
  teksWaktu,
  tombolBahaya,
  tombolSekunder,
  tombolUtama,
} from "./ui";

export type DataSoal = { pertanyaan: string; opsi: string[]; kunci: number; pembahasan: string };

export type AksiTabQuiz = {
  simpanPengaturan: (m: MasukanPengaturan) => void;
  tambahSoal: (d: DataSoal) => void;
  ubahSoal: (id: string, d: DataSoal) => void;
  hapusSoal: (id: string) => void;
  geser: (id: string, arah: -1 | 1) => void;
  ubahKunci: (id: string, kunci: number) => void;
  ubahAktif: (id: string, aktif: boolean) => void;
};

const LABEL_LOG = {
  kunci: "mengoreksi kunci",
  nonaktif: "menonaktifkan soal",
  aktifkan: "mengaktifkan soal",
  izin_ulang: "mengizinkan kerjakan ulang",
} as const;

/* ------------------------------ pengaturan ------------------------------ */

function BagianPengaturan({
  jenis,
  pengaturan,
  jumlahSoalAktif,
  jumlahHasil,
  totalOpd,
  sekarang,
  arsip,
  onSimpan,
}: {
  jenis: JenisQuiz;
  pengaturan: PengaturanQuiz | undefined;
  jumlahSoalAktif: number;
  jumlahHasil: number;
  totalOpd: number;
  sekarang: string | null;
  arsip: boolean;
  onSimpan: (m: MasukanPengaturan) => void;
}) {
  const [buka, setBuka] = useState(pengaturan?.waktuBuka ?? "");
  const [batas, setBatas] = useState(pengaturan?.batasAkhir ?? "");
  const [durasi, setDurasi] = useState(String(pengaturan?.durasiMenit ?? 15));

  const masukan: MasukanPengaturan = {
    waktuBuka: buka || null,
    batasAkhir: batas || null,
    durasiMenit: durasi.trim() === "" ? NaN : Number(durasi),
  };
  const validasi: HasilValidasi = sekarang
    ? validasiPengaturan(masukan, jumlahSoalAktif, sekarang)
    : { galat: {}, peringatan: [] };
  const { galat, peringatan } = validasi;
  const adaGalat = Object.keys(galat).length > 0;
  const status = sekarang ? statusWaktuQuiz(pengaturan, sekarang) : null;
  const terbatas = !!pengaturan?.hanyaBerizin || status === "ditutup";

  function simpan(e: FormEvent) {
    e.preventDefault();
    if (arsip || !sekarang || adaGalat) return;
    onSimpan(masukan);
  }

  return (
    <section aria-labelledby={`judul-pengaturan-${jenis}`} className={kartu}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`judul-pengaturan-${jenis}`} className="font-semibold text-ink">
          Pengaturan
        </h2>
        <div className="flex items-center gap-3 text-sm">
          {status && <Lencana kelas={GAYA_STATUS_WAKTU[status]}>{LABEL_STATUS_WAKTU[status]}</Lencana>}
          <span className="tabular text-ink-muted">
            {jumlahHasil} dari {totalOpd} OPD sudah mengerjakan
          </span>
        </div>
      </div>

      <form onSubmit={simpan} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor={`buka-${jenis}`} className="text-sm font-medium text-ink">
              Waktu buka <span className="font-normal text-ink-muted">(opsional)</span>
            </label>
            <input
              id={`buka-${jenis}`}
              type="datetime-local"
              value={buka}
              onChange={(e) => setBuka(e.target.value)}
              disabled={arsip}
              aria-invalid={!!galat.waktuBuka}
              aria-describedby={galat.waktuBuka ? `galat-buka-${jenis}` : undefined}
              className={kolomInput}
            />
            {galat.waktuBuka && (
              <p id={`galat-buka-${jenis}`} role="alert" className="text-xs text-status-revisi-fg">
                {galat.waktuBuka}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`batas-${jenis}`} className="text-sm font-medium text-ink">
              Batas akhir <span className="font-normal text-ink-muted">(opsional)</span>
            </label>
            <input
              id={`batas-${jenis}`}
              type="datetime-local"
              value={batas}
              onChange={(e) => setBatas(e.target.value)}
              disabled={arsip}
              aria-invalid={!!galat.batasAkhir}
              aria-describedby={galat.batasAkhir ? `galat-batas-${jenis}` : undefined}
              className={kolomInput}
            />
            {galat.batasAkhir && (
              <p id={`galat-batas-${jenis}`} role="alert" className="text-xs text-status-revisi-fg">
                {galat.batasAkhir}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`durasi-${jenis}`} className="text-sm font-medium text-ink">
              Durasi (menit)
            </label>
            <input
              id={`durasi-${jenis}`}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={durasi}
              onChange={(e) => setDurasi(e.target.value)}
              disabled={arsip}
              aria-invalid={!!galat.durasiMenit}
              aria-describedby={galat.durasiMenit ? `galat-durasi-${jenis}` : undefined}
              className={kolomInput}
            />
            {galat.durasiMenit && (
              <p id={`galat-durasi-${jenis}`} role="alert" className="text-xs text-status-revisi-fg">
                {galat.durasiMenit}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-ink-muted">
          Waktu buka kosong berarti quiz belum dibuka. Batas akhir kosong berarti tanpa batas. Batas akhir juga
          memotong waktu pengerjaan: OPD yang mulai mepet batas akhir hanya mendapat sisa waktu, dan jawabannya
          terkirim otomatis pada batas akhir.
        </p>
        {terbatas && (
          <p className="text-xs text-ink-muted">
            Setelah batas akhir pertama lewat, hanya OPD yang diizinkan lewat tab Rekap Hasil yang bisa
            mengerjakan lagi. Atur batas akhir baru agar izin itu berlaku.
          </p>
        )}
        {peringatan.length > 0 && (
          <ul role="note" className="space-y-1 text-sm text-status-menunggu-fg">
            {peringatan.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={arsip || sekarang === null || adaGalat} className={tombolUtama}>
            Simpan pengaturan
          </button>
        </div>
      </form>
    </section>
  );
}

/* ------------------------------ form soal ------------------------------ */

type IsianSoal = { pertanyaan: string; opsi: string[]; kunci: number | null; pembahasan: string };

const MIN_OPSI = 2;
const MAKS_OPSI = 6;

function FormSoal({
  awal,
  onSimpan,
  onBatal,
}: {
  awal: IsianSoal;
  onSimpan: (d: DataSoal) => void;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");

  function ubahOpsi(i: number, teks: string) {
    setV({ ...v, opsi: v.opsi.map((o, j) => (j === i ? teks : o)) });
  }

  function hapusOpsi(i: number) {
    if (v.opsi.length <= MIN_OPSI) return;
    let kunci = v.kunci;
    if (kunci !== null) kunci = kunci === i ? null : kunci > i ? kunci - 1 : kunci;
    setV({ ...v, opsi: v.opsi.filter((_, j) => j !== i), kunci });
  }

  function kirim(e: FormEvent) {
    e.preventDefault();
    const pertanyaan = v.pertanyaan.trim();
    const opsi = v.opsi.map((o) => o.trim());
    if (!pertanyaan) return setGalat("Teks soal wajib diisi.");
    if (opsi.some((o) => !o)) return setGalat("Semua opsi wajib diisi.");
    if (v.kunci === null) return setGalat("Pilih satu opsi sebagai kunci jawaban.");
    onSimpan({ pertanyaan, opsi, kunci: v.kunci, pembahasan: v.pembahasan.trim() });
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="soal-teks" className="text-sm font-medium text-ink">
          Teks soal
        </label>
        <textarea
          id="soal-teks"
          rows={3}
          value={v.pertanyaan}
          onChange={(e) => setV({ ...v, pertanyaan: e.target.value })}
          className={kolomInput}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">Opsi jawaban (pilih satu sebagai kunci)</legend>
        {v.opsi.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="kunci"
              checked={v.kunci === i}
              onChange={() => setV({ ...v, kunci: i })}
              aria-label={`Jadikan opsi ${hurufOpsi(i)} kunci`}
              className="size-4 shrink-0 accent-(--color-primary)"
            />
            <span className="w-5 shrink-0 text-sm font-medium text-ink-muted">{hurufOpsi(i)}.</span>
            <input
              value={o}
              onChange={(e) => ubahOpsi(i, e.target.value)}
              aria-label={`Opsi ${hurufOpsi(i)}`}
              className={kolomInput}
            />
            <button
              type="button"
              onClick={() => hapusOpsi(i)}
              disabled={v.opsi.length <= MIN_OPSI}
              aria-label={`Hapus opsi ${hurufOpsi(i)}`}
              className={tombolSekunder}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setV({ ...v, opsi: [...v.opsi, ""] })}
          disabled={v.opsi.length >= MAKS_OPSI}
          className={tombolSekunder}
        >
          <Plus className="size-4" aria-hidden />
          Tambah opsi
        </button>
        <p className="text-xs text-ink-muted">Minimal {MIN_OPSI} dan maksimal {MAKS_OPSI} opsi.</p>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="soal-bahas" className="text-sm font-medium text-ink">
          Pembahasan <span className="font-normal text-ink-muted">(opsional)</span>
        </label>
        <textarea
          id="soal-bahas"
          rows={3}
          value={v.pembahasan}
          onChange={(e) => setV({ ...v, pembahasan: e.target.value })}
          className={kolomInput}
        />
        <p className="text-xs text-ink-muted">Bila kosong, bagian pembahasan tidak tampil di hasil OPD.</p>
      </div>

      {galat && (
        <p role="alert" className="text-sm text-status-revisi-fg">
          {galat}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onBatal} className={tombolSekunder}>
          Batal
        </button>
        <button type="submit" className={tombolUtama}>
          Simpan soal
        </button>
      </div>
    </form>
  );
}

/* ------------------------------ tab ------------------------------ */

type Props = {
  jenis: JenisQuiz;
  kegiatan: Kegiatan;
  arsip: boolean;
  totalOpd: number;
  pengaturan: PengaturanQuiz | undefined;
  soal: SoalQuiz[]; // soal quiz ini, sudah urut
  hasil: HasilQuiz[]; // hasil quiz ini pada kegiatan ini
  log: LogPerubahanQuiz[];
  sekarang: string | null;
  aksi: AksiTabQuiz;
};

export default function TabQuiz({
  jenis,
  kegiatan,
  arsip,
  totalOpd,
  pengaturan,
  soal,
  hasil,
  log,
  sekarang,
  aksi,
}: Props) {
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [koreksi, setKoreksi] = useState<{ id: string; kunci: number } | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);

  const label = LABEL_QUIZ[jenis];

  if (!quizAktif(kegiatan, jenis)) {
    return (
      <p role="note" className="rounded-lg border border-line bg-surface-muted px-4 py-3 text-sm text-ink-muted">
        {label} tidak dipakai di kegiatan ini. Aktifkan lewat{" "}
        <Link href="/admin/kegiatan" className="font-medium text-primary underline">
          Kelola Kegiatan
        </Link>
        .
      </p>
    );
  }

  const siap = !arsip && sekarang !== null;
  const bisaUbah = siap && soalBisaDiubah(pengaturan, hasil.length, sekarang);
  const modeKoreksi = siap && !bisaUbah;

  const diedit = form?.id ? soal.find((s) => s.id === form.id) : undefined;
  const dihapus = hapusId ? soal.find((s) => s.id === hapusId) : undefined;
  const dikoreksi = koreksi ? soal.find((s) => s.id === koreksi.id) : undefined;
  const ditoggle = toggleId ? soal.find((s) => s.id === toggleId) : undefined;

  const dampakKoreksi =
    dikoreksi && koreksi
      ? dampakPerubahan(
          soal,
          soal.map((s) => (s.id === dikoreksi.id ? { ...s, kunci: koreksi.kunci } : s)),
          hasil,
        )
      : null;
  const dampakToggle = ditoggle
    ? dampakPerubahan(
        soal,
        soal.map((s) => (s.id === ditoggle.id ? { ...s, aktif: !s.aktif } : s)),
        hasil,
      )
    : null;

  function simpanSoal(d: DataSoal) {
    if (diedit) aksi.ubahSoal(diedit.id, d);
    else aksi.tambahSoal(d);
    setForm(null);
  }

  function terapkanKoreksi() {
    if (!koreksi || !dikoreksi || koreksi.kunci === dikoreksi.kunci) return setKoreksi(null);
    aksi.ubahKunci(dikoreksi.id, koreksi.kunci);
    setKoreksi(null);
  }

  function terapkanToggle() {
    if (ditoggle) aksi.ubahAktif(ditoggle.id, !ditoggle.aktif);
    setToggleId(null);
  }

  const urutLog = [...log].sort((a, b) => (a.waktu < b.waktu ? 1 : -1));

  return (
    <div className="space-y-6">
      {arsip && (
        <p role="note" className="rounded-lg border border-line bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          Kegiatan ini diarsipkan, jadi hanya bisa dilihat. Untuk koreksi, aktifkan kembali lewat{" "}
          <Link href="/admin/kegiatan" className="font-medium text-primary underline">
            Kelola Kegiatan
          </Link>
          .
        </p>
      )}

      <BagianPengaturan
        key={`${pengaturan?.waktuBuka}|${pengaturan?.batasAkhir}|${pengaturan?.durasiMenit}`}
        jenis={jenis}
        pengaturan={pengaturan}
        jumlahSoalAktif={soalAktif(soal).length}
        jumlahHasil={hasil.length}
        totalOpd={totalOpd}
        sekarang={sekarang}
        arsip={arsip}
        onSimpan={aksi.simpanPengaturan}
      />

      <section aria-labelledby={`judul-soal-${jenis}`} className={kartu}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={`judul-soal-${jenis}`} className="font-semibold text-ink">
            Daftar soal
          </h2>
          <button
            type="button"
            onClick={() => setForm({ id: null })}
            disabled={!bisaUbah}
            className={tombolUtama}
          >
            <Plus className="size-4" aria-hidden />
            Tambah soal
          </button>
        </div>

        {modeKoreksi && (
          <p className="mt-3 text-sm text-ink-muted">
            Soal terkunci karena quiz sudah dibuka atau sudah ada OPD yang mengerjakan. Yang masih bisa:
            koreksi kunci dan nonaktifkan soal.
          </p>
        )}

        {soal.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Belum ada soal untuk quiz ini.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {soal.map((s, i) => (
              <li key={s.id} className="space-y-3 rounded-lg border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">
                    <span className="tabular text-ink-muted">{i + 1}. </span>
                    {s.pertanyaan}
                  </p>
                  {!s.aktif && <Lencana kelas="bg-surface-muted text-ink-muted">Nonaktif</Lencana>}
                </div>
                <ul className="space-y-1 text-sm">
                  {s.opsi.map((o, j) => (
                    <li key={j} className={j === s.kunci ? "font-medium text-status-disetujui-fg" : "text-ink-muted"}>
                      {hurufOpsi(j)}. {o}
                      {j === s.kunci && " (kunci)"}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-ink-muted">
                  {s.pembahasan ? `Pembahasan: ${s.pembahasan}` : "Tanpa pembahasan."}
                </p>
                {(bisaUbah || modeKoreksi) && (
                  <div className="flex flex-wrap justify-end gap-2">
                    {bisaUbah ? (
                      <>
                        <button
                          type="button"
                          onClick={() => aksi.geser(s.id, -1)}
                          disabled={i === 0}
                          aria-label={`Naikkan soal ${i + 1}`}
                          className={tombolSekunder}
                        >
                          <ArrowUp className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => aksi.geser(s.id, 1)}
                          disabled={i === soal.length - 1}
                          aria-label={`Turunkan soal ${i + 1}`}
                          className={tombolSekunder}
                        >
                          <ArrowDown className="size-4" aria-hidden />
                        </button>
                        <button type="button" onClick={() => setForm({ id: s.id })} className={tombolSekunder}>
                          <Pencil className="size-4" aria-hidden />
                          Ubah
                        </button>
                        <button type="button" onClick={() => setHapusId(s.id)} className={tombolSekunder}>
                          <Trash2 className="size-4" aria-hidden />
                          Hapus
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setKoreksi({ id: s.id, kunci: s.kunci })}
                          className={tombolSekunder}
                        >
                          <KeyRound className="size-4" aria-hidden />
                          Koreksi kunci
                        </button>
                        <button type="button" onClick={() => setToggleId(s.id)} className={tombolSekunder}>
                          {s.aktif ? (
                            <EyeOff className="size-4" aria-hidden />
                          ) : (
                            <Eye className="size-4" aria-hidden />
                          )}
                          {s.aktif ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-ink-muted">
          Urutan soal diacak per OPD, urutan opsi tidak. Nilai dihitung dari jawaban OPD dan kunci yang berlaku,
          jadi koreksi kunci langsung memperbarui nilai.
        </p>
      </section>

      {urutLog.length > 0 && (
        <details className={kartu}>
          <summary className="cursor-pointer font-semibold text-ink">
            Riwayat perubahan ({urutLog.length})
          </summary>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {urutLog.map((l) => {
              const s = soal.find((x) => x.id === l.soalId);
              const detailKunci =
                l.jenis === "kunci" && l.kunciLama !== undefined && l.kunciBaru !== undefined
                  ? `, ${hurufOpsi(l.kunciLama)} menjadi ${hurufOpsi(l.kunciBaru)}`
                  : "";
              return (
                <li key={l.id}>
                  <span className="tabular">{teksWaktu(l.waktu, "–")}</span>: {l.admin} {LABEL_LOG[l.jenis]}
                  {s ? ` "${ringkas(s.pertanyaan)}"` : ""}
                  {detailKunci}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <Dialog
        buka={!!form}
        onTutup={() => setForm(null)}
        judul={diedit ? "Ubah soal" : "Tambah soal"}
        lebar={LEBAR_DIALOG}
      >
        <FormSoal
          awal={{
            pertanyaan: diedit?.pertanyaan ?? "",
            opsi: diedit ? [...diedit.opsi] : ["", "", "", ""],
            kunci: diedit?.kunci ?? null,
            pembahasan: diedit?.pembahasan ?? "",
          }}
          onSimpan={simpanSoal}
          onBatal={() => setForm(null)}
        />
      </Dialog>

      <Dialog buka={!!dihapus} onTutup={() => setHapusId(null)} judul="Hapus soal">
        <p className="text-sm text-ink-muted">
          Hapus soal <span className="font-medium text-ink">{dihapus ? ringkas(dihapus.pertanyaan) : ""}</span>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setHapusId(null)} className={tombolSekunder}>
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              if (dihapus) aksi.hapusSoal(dihapus.id);
              setHapusId(null);
            }}
            className={tombolBahaya}
          >
            Hapus
          </button>
        </div>
      </Dialog>

      <Dialog buka={!!dikoreksi} onTutup={() => setKoreksi(null)} judul="Koreksi kunci" lebar={LEBAR_DIALOG}>
        {dikoreksi && koreksi && dampakKoreksi && (
          <>
            <p className="text-sm font-medium text-ink">{dikoreksi.pertanyaan}</p>
            <fieldset className="space-y-2">
              <legend className="sr-only">Kunci jawaban baru</legend>
              {dikoreksi.opsi.map((o, j) => (
                <label key={j} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    name="kunci-baru"
                    checked={koreksi.kunci === j}
                    onChange={() => setKoreksi({ ...koreksi, kunci: j })}
                    className="size-4 shrink-0 accent-(--color-primary)"
                  />
                  <span>
                    {hurufOpsi(j)}. {o}
                    {j === dikoreksi.kunci && <span className="text-ink-muted"> (kunci sekarang)</span>}
                  </span>
                </label>
              ))}
            </fieldset>
            <p role="status" className="text-sm text-ink-muted">
              {koreksi.kunci === dikoreksi.kunci
                ? "Pilih opsi lain untuk melihat dampaknya."
                : dampakKoreksi.nilaiBerubah === 0
                  ? "Tidak ada OPD yang nilainya berubah."
                  : `${dampakKoreksi.nilaiBerubah} OPD nilainya berubah.`}
              {dampakKoreksi.statusBerubah !== null &&
                ` ${dampakKoreksi.statusBerubah} OPD statusnya berubah (lulus atau tidak lulus).`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setKoreksi(null)} className={tombolSekunder}>
                Batal
              </button>
              <button
                type="button"
                onClick={terapkanKoreksi}
                disabled={koreksi.kunci === dikoreksi.kunci}
                className={tombolUtama}
              >
                Terapkan koreksi
              </button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog
        buka={!!ditoggle}
        onTutup={() => setToggleId(null)}
        judul={ditoggle?.aktif ? "Nonaktifkan soal" : "Aktifkan soal"}
      >
        {ditoggle && dampakToggle && (
          <>
            <p className="text-sm text-ink-muted">
              {ditoggle.aktif
                ? "Soal ini tidak dihitung lagi dalam nilai, tapi tetap tercatat."
                : "Soal ini dihitung lagi dalam nilai."}{" "}
              <span className="font-medium text-ink">{ringkas(ditoggle.pertanyaan)}</span>
            </p>
            <p role="status" className="text-sm text-ink-muted">
              {dampakToggle.nilaiBerubah === 0
                ? "Tidak ada OPD yang nilainya berubah."
                : `${dampakToggle.nilaiBerubah} OPD nilainya berubah.`}
              {dampakToggle.statusBerubah !== null &&
                ` ${dampakToggle.statusBerubah} OPD statusnya berubah (lulus atau tidak lulus).`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setToggleId(null)} className={tombolSekunder}>
                Batal
              </button>
              <button type="button" onClick={terapkanToggle} className={tombolUtama}>
                {ditoggle.aktif ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}