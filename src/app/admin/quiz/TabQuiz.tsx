"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { AMBANG_POSTTEST } from "@/lib/dashboard";
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

// Yang boleh diubah setelah quiz dibuka: teks soal, teks opsi, kunci, pembahasan
// (jumlah dan urutan opsi tetap, supaya indeks jawaban pegawai tidak bergeser)
export type EditTerkunci = { pertanyaan: string; opsi: string[]; kunci: number; pembahasan: string };

export type MasukanPengaturanAdmin = MasukanPengaturan & { acakSoal: boolean };

// Semua aksi mengembalikan teks galat dari server, atau null bila berhasil
export type AksiTabQuiz = {
  simpanPengaturan: (m: MasukanPengaturanAdmin) => Promise<string | null>;
  tambahSoal: (d: DataSoal) => Promise<string | null>;
  ubahSoal: (id: string, d: DataSoal) => Promise<string | null>;
  hapusSoal: (id: string) => Promise<string | null>;
  geser: (id: string, arah: -1 | 1) => Promise<string | null>;
  editTerkunci: (id: string, d: EditTerkunci) => Promise<string | null>;
  ubahAktif: (id: string, aktif: boolean) => Promise<string | null>;
};

const LABEL_LOG = {
  kunci: "mengoreksi kunci",
  edit: "mengedit soal",
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
  totalPegawai,
  sekarang,
  arsip,
  acakTerkunci,
  onSimpan,
}: {
  jenis: JenisQuiz;
  pengaturan: PengaturanQuiz | undefined;
  jumlahSoalAktif: number;
  jumlahHasil: number;
  totalPegawai: number;
  sekarang: string | null;
  arsip: boolean;
  acakTerkunci: boolean; // pilihan acak soal tidak bisa diubah setelah quiz dibuka
  onSimpan: (m: MasukanPengaturanAdmin) => Promise<string | null>;
}) {
  const [buka, setBuka] = useState(pengaturan?.waktuBuka ?? "");
  const [batas, setBatas] = useState(pengaturan?.batasAkhir ?? "");
  const [durasi, setDurasi] = useState(String(pengaturan?.durasiMenit ?? 15));
  const [acak, setAcak] = useState(pengaturan?.acakSoal ?? true);
  const [proses, setProses] = useState(false);
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null);

  const masukan: MasukanPengaturanAdmin = {
    waktuBuka: buka || null,
    batasAkhir: batas || null,
    durasiMenit: durasi.trim() === "" ? NaN : Number(durasi),
    acakSoal: acak,
  };
  const validasi: HasilValidasi = sekarang
    ? validasiPengaturan(masukan, jumlahSoalAktif, sekarang)
    : { galat: {}, peringatan: [] };
  const { galat, peringatan } = validasi;
  const adaGalat = Object.keys(galat).length > 0;
  const status = sekarang ? statusWaktuQuiz(pengaturan, sekarang) : null;
  const terbatas = !!pengaturan?.hanyaBerizin || status === "ditutup";

  async function simpan(e: FormEvent) {
    e.preventDefault();
    if (arsip || !sekarang || adaGalat || proses) return;
    setProses(true);
    setGalatSimpan(null);
    const g = await onSimpan(masukan);
    setProses(false);
    if (g) setGalatSimpan(g);
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
            {jumlahHasil} dari {totalPegawai} pegawai sudah mengerjakan
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

        <div className="space-y-1.5">
          <label htmlFor={`acak-${jenis}`} className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              id={`acak-${jenis}`}
              type="checkbox"
              checked={acak}
              onChange={(e) => setAcak(e.target.checked)}
              disabled={arsip || acakTerkunci}
              className="size-4 shrink-0 accent-(--color-primary)"
            />
            Acak urutan soal per pegawai
          </label>
          <p className="text-xs text-ink-muted">
            Bila dimatikan, semua pegawai melihat soal sesuai urutan di daftar soal. Pilihan ini terkunci setelah
            quiz dibuka atau sudah ada pegawai yang mengerjakan.
          </p>
        </div>

        <p className="text-xs text-ink-muted">
          Waktu buka kosong berarti quiz belum dibuka. Batas akhir kosong berarti tanpa batas. Batas akhir juga
          memotong waktu pengerjaan: OPD yang mulai mepet batas akhir hanya mendapat sisa waktu, dan jawabannya
          terkirim otomatis pada batas akhir.
        </p>
        {terbatas && (
          <p className="text-xs text-ink-muted">
            Setelah batas akhir pertama lewat, hanya pegawai yang diizinkan lewat tab Rekap Hasil yang bisa
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
        {galatSimpan && (
          <p role="alert" className="text-sm text-status-revisi-fg">
            {galatSimpan}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={arsip || sekarang === null || adaGalat || proses}
            className={tombolUtama}
          >
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
  onSimpan: (d: DataSoal) => Promise<string | null>;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  function ubahOpsi(i: number, teks: string) {
    setV({ ...v, opsi: v.opsi.map((o, j) => (j === i ? teks : o)) });
  }

  function hapusOpsi(i: number) {
    if (v.opsi.length <= MIN_OPSI) return;
    let kunci = v.kunci;
    if (kunci !== null) kunci = kunci === i ? null : kunci > i ? kunci - 1 : kunci;
    setV({ ...v, opsi: v.opsi.filter((_, j) => j !== i), kunci });
  }

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (proses) return;
    const pertanyaan = v.pertanyaan.trim();
    const opsi = v.opsi.map((o) => o.trim());
    if (!pertanyaan) return setGalat("Teks soal wajib diisi.");
    if (opsi.some((o) => !o)) return setGalat("Semua opsi wajib diisi.");
    if (v.kunci === null) return setGalat("Pilih satu opsi sebagai kunci jawaban.");

    setGalat("");
    setProses(true);
    const g = await onSimpan({ pertanyaan, opsi, kunci: v.kunci, pembahasan: v.pembahasan.trim() });
    setProses(false);
    if (g) setGalat(g);
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
        <button type="button" onClick={onBatal} disabled={proses} className={tombolSekunder}>
          Batal
        </button>
        <button type="submit" disabled={proses} className={tombolUtama}>
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
  totalPegawai: number;
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
  totalPegawai,
  pengaturan,
  soal,
  hasil,
  log,
  sekarang,
  aksi,
}: Props) {
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [edit, setEdit] = useState<({ id: string } & EditTerkunci) | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [tertunda, setTertunda] = useState<DataSoal | null>(null);
  const [proses, setProses] = useState(false);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);

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
  // hanya Post-Test yang punya status lulus (nilai minimal)
  const lulus = jenis === "posttest" ? (nilai: number) => nilai >= AMBANG_POSTTEST : undefined;

  const diedit = form?.id ? soal.find((s) => s.id === form.id) : undefined;
  const dihapus = hapusId ? soal.find((s) => s.id === hapusId) : undefined;
  const disunting = edit ? soal.find((s) => s.id === edit.id) : undefined;
  const ditoggle = toggleId ? soal.find((s) => s.id === toggleId) : undefined;
  const dialogTerbuka = !!form || !!tertunda || !!dihapus || !!disunting || !!ditoggle;

  // Hanya perubahan kunci yang memengaruhi nilai; teks opsi tidak
  const dampakEdit =
    disunting && edit
      ? dampakPerubahan(
          soal,
          soal.map((s) => (s.id === disunting.id ? { ...s, kunci: edit.kunci } : s)),
          hasil,
          lulus,
        )
      : null;
  const teksKosong = !!edit && edit.pertanyaan.trim() === "";
  const opsiKosong = !!edit && edit.opsi.some((o) => o.trim() === "");
  const tidakBerubah =
    !!edit &&
    !!disunting &&
    edit.kunci === disunting.kunci &&
    edit.pertanyaan.trim() === disunting.pertanyaan &&
    edit.pembahasan.trim() === disunting.pembahasan &&
    edit.opsi.length === disunting.opsi.length &&
    edit.opsi.every((o, j) => o.trim() === disunting.opsi[j]);

  const dampakToggle = ditoggle
    ? dampakPerubahan(
        soal,
        soal.map((s) => (s.id === ditoggle.id ? { ...s, aktif: !s.aktif } : s)),
        hasil,
        lulus,
      )
    : null;
  const dampakHapus =
  dihapus && hasil.length > 0
    ? dampakPerubahan(
        soal,
        soal.map((s) => (s.id === dihapus.id ? { ...s, aktif: false } : s)),
        hasil,
        lulus,
      )
    : null;
  // soal baru aktif, dan dihitung salah bagi pegawai yang belum menjawabnya
  const dampakTambah =
    tertunda && hasil.length > 0 && soal.length > 0
      ? dampakPerubahan(
          soal,
          [
            ...soal,
            {
              ...soal[0],
              id: "__baru__",
              urutan: soal.length + 1,
              aktif: true,
              pertanyaan: tertunda.pertanyaan,
              opsi: tertunda.opsi,
              kunci: tertunda.kunci,
              pembahasan: tertunda.pembahasan,
            },
          ],
          hasil,
          lulus,
        )
      : null;

  // Menjalankan aksi ke server: dialog tetap terbuka dan menampilkan galat bila gagal
  async function jalankan(kerja: () => Promise<string | null>, selesai: () => void) {
    if (proses) return;
    setProses(true);
    setGalatAksi(null);
    const galat = await kerja();
    setProses(false);
    if (galat) setGalatAksi(galat);
    else selesai();
  }

  function tutupDialog() {
    setForm(null);
    setTertunda(null);
    setHapusId(null);
    setEdit(null);
    setToggleId(null);
    setGalatAksi(null);
  }

  // Galat dikembalikan ke FormSoal agar tampil di dalam form
  async function simpanSoal(d: DataSoal): Promise<string | null> {
    if (diedit) {
      const galat = await aksi.ubahSoal(diedit.id, d);
      if (!galat) tutupDialog();
      return galat;
    }
    // sudah ada hasil: minta konfirmasi dulu
    if (hasil.length > 0) {
      setForm(null);
      setTertunda(d);
      return null;
    }
    const galat = await aksi.tambahSoal(d);
    if (!galat) tutupDialog();
    return galat;
  }

  function terapkanTambah() {
    if (!tertunda) return;
    const d = tertunda;
    void jalankan(() => aksi.tambahSoal(d), tutupDialog);
  }

  function terapkanEdit() {
    if (!edit || !disunting || teksKosong || opsiKosong || tidakBerubah) return tutupDialog();
    const id = disunting.id;
    const d = {
      pertanyaan: edit.pertanyaan.trim(),
      opsi: edit.opsi.map((o) => o.trim()),
      kunci: edit.kunci,
      pembahasan: edit.pembahasan.trim(),
    };
    void jalankan(() => aksi.editTerkunci(id, d), tutupDialog);
  }

  function terapkanToggle() {
    if (!ditoggle) return;
    const { id, aktif } = ditoggle;
    void jalankan(() => aksi.ubahAktif(id, !aktif), tutupDialog);
  }

  function terapkanHapus() {
    if (!dihapus) return;
    const id = dihapus.id;
    void jalankan(() => aksi.hapusSoal(id), tutupDialog);
  }

  const urutLog = [...log].sort((a, b) => (a.waktu < b.waktu ? 1 : -1));

  const pesanGalat = galatAksi && (
    <p role="alert" className="text-sm text-status-revisi-fg">
      {galatAksi}
    </p>
  );

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
        key={`${pengaturan?.waktuBuka}|${pengaturan?.batasAkhir}|${pengaturan?.durasiMenit}|${pengaturan?.acakSoal}`}
        jenis={jenis}
        pengaturan={pengaturan}
        jumlahSoalAktif={soalAktif(soal).length}
        jumlahHasil={hasil.length}
        totalPegawai={totalPegawai}
        sekarang={sekarang}
        arsip={arsip}
        acakTerkunci={!bisaUbah}
        onSimpan={aksi.simpanPengaturan}
      />

      <section aria-labelledby={`judul-soal-${jenis}`} className={kartu}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id={`judul-soal-${jenis}`} className="font-semibold text-ink">
            Daftar soal
          </h2>
          <button
            type="button"
            onClick={() => {
              setGalatAksi(null);
              setForm({ id: null });
            }}
            disabled={arsip}
            className={tombolUtama}
          >
            <Plus className="size-4" aria-hidden />
            Tambah soal
          </button>
        </div>

        {modeKoreksi && (
          <p className="mt-3 text-sm text-ink-muted">
            Soal terkunci karena quiz sudah dibuka atau sudah ada pegawai yang mengerjakan. Yang masih bisa:
            tambah soal, edit teks soal, teks opsi, pembahasan, dan kunci, nonaktifkan soal, serta hapus soal.
          </p>
        )}
        {!dialogTerbuka && galatAksi && <div className="mt-3">{pesanGalat}</div>}

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
                          onClick={() => void jalankan(() => aksi.geser(s.id, -1), () => {})}
                          disabled={i === 0 || proses}
                          aria-label={`Naikkan soal ${i + 1}`}
                          className={tombolSekunder}
                        >
                          <ArrowUp className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => void jalankan(() => aksi.geser(s.id, 1), () => {})}
                          disabled={i === soal.length - 1 || proses}
                          aria-label={`Turunkan soal ${i + 1}`}
                          className={tombolSekunder}
                        >
                          <ArrowDown className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGalatAksi(null);
                            setForm({ id: s.id });
                          }}
                          className={tombolSekunder}
                        >
                          <Pencil className="size-4" aria-hidden />
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGalatAksi(null);
                            setHapusId(s.id);
                          }}
                          className={tombolSekunder}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Hapus
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setGalatAksi(null);
                            setEdit({
                              id: s.id,
                              kunci: s.kunci,
                              pertanyaan: s.pertanyaan,
                              opsi: [...s.opsi],
                              pembahasan: s.pembahasan,
                            });
                          }}
                          className={tombolSekunder}
                        >
                          <Pencil className="size-4" aria-hidden />
                          Edit soal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGalatAksi(null);
                            setHapusId(s.id); 
                          }}
                          className={tombolSekunder}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGalatAksi(null);
                            setToggleId(s.id);
                          }}
                          className={tombolSekunder}
                        >
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
          Urutan soal diacak per pegawai bila pilihan acak di Pengaturan menyala, urutan opsi tidak. Nilai
          dihitung dari jawaban OPD dan kunci yang berlaku, jadi koreksi kunci langsung memperbarui nilai.
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

      <Dialog buka={!!form} onTutup={tutupDialog} judul={diedit ? "Ubah soal" : "Tambah soal"} lebar={LEBAR_DIALOG}>
        <FormSoal
          awal={{
            pertanyaan: diedit?.pertanyaan ?? "",
            opsi: diedit ? [...diedit.opsi] : ["", "", "", ""],
            kunci: diedit?.kunci ?? null,
            pembahasan: diedit?.pembahasan ?? "",
          }}
          onSimpan={simpanSoal}
          onBatal={tutupDialog}
        />
      </Dialog>

      <Dialog buka={!!tertunda} onTutup={tutupDialog} judul="Tambah soal">
        {tertunda && (
          <>
            <p className="text-sm text-ink-muted">
              Pegawai yang sudah mengerjakan belum menjawab soal ini, jadi soal baru dihitung salah bagi mereka.{" "}
              <span className="font-medium text-ink">{ringkas(tertunda.pertanyaan)}</span>
            </p>
            <p role="status" className="text-sm text-ink-muted">
              {dampakTambah && dampakTambah.nilaiBerubah > 0
                ? `${dampakTambah.nilaiBerubah} pegawai nilainya berubah.`
                : "Tidak ada pegawai yang nilainya berubah."}
              {dampakTambah?.statusBerubah != null &&
                ` ${dampakTambah.statusBerubah} pegawai statusnya berubah (lulus atau tidak lulus).`}
            </p>
            {pesanGalat}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={tutupDialog} disabled={proses} className={tombolSekunder}>
                Batal
              </button>
              <button type="button" onClick={terapkanTambah} disabled={proses} className={tombolUtama}>
                Tambahkan soal
              </button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog buka={!!dihapus} onTutup={tutupDialog} judul="Hapus soal">
        <p className="text-sm text-ink-muted">
          Hapus soal <span className="font-medium text-ink">{dihapus ? ringkas(dihapus.pertanyaan) : ""}</span>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
        {pesanGalat}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={tutupDialog} disabled={proses} className={tombolSekunder}>
            Batal
          </button>
          <button type="button" onClick={terapkanHapus} disabled={proses} className={tombolBahaya}>
            Hapus
          </button>
        </div>
      </Dialog>

      <Dialog buka={!!disunting} onTutup={tutupDialog} judul="Edit soal" lebar={LEBAR_DIALOG}>
        {disunting && edit && dampakEdit && (
          <>
            <div className="space-y-1.5">
              <label htmlFor="edit-teks" className="text-sm font-medium text-ink">
                Teks soal
              </label>
              <textarea
                id="edit-teks"
                rows={3}
                value={edit.pertanyaan}
                onChange={(e) => setEdit({ ...edit, pertanyaan: e.target.value })}
                aria-invalid={teksKosong}
                className={kolomInput}
              />
              {teksKosong && (
                <p role="alert" className="text-xs text-status-revisi-fg">
                  Teks soal wajib diisi.
                </p>
              )}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">Opsi jawaban (pilih satu sebagai kunci)</legend>
              {edit.opsi.map((o, j) => (
                <div key={j} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="kunci-edit"
                    checked={edit.kunci === j}
                    onChange={() => setEdit({ ...edit, kunci: j })}
                    aria-label={`Jadikan opsi ${hurufOpsi(j)} kunci`}
                    className="size-4 shrink-0 accent-(--color-primary)"
                  />
                  <span className="w-5 shrink-0 text-sm font-medium text-ink-muted">{hurufOpsi(j)}.</span>
                  <input
                    value={o}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        opsi: edit.opsi.map((x, k) => (k === j ? e.target.value : x)),
                      })
                    }
                    aria-label={`Opsi ${hurufOpsi(j)}`}
                    aria-invalid={o.trim() === ""}
                    className={kolomInput}
                  />
                  {j === disunting.kunci && (
                    <span className="shrink-0 text-xs text-ink-muted">(kunci sekarang)</span>
                  )}
                </div>
              ))}
              {opsiKosong && (
                <p role="alert" className="text-xs text-status-revisi-fg">
                  Semua opsi wajib diisi.
                </p>
              )}
              <p className="text-xs text-ink-muted">Jumlah dan urutan opsi tidak bisa diubah.</p>
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="edit-bahas" className="text-sm font-medium text-ink">
                Pembahasan <span className="font-normal text-ink-muted">(opsional)</span>
              </label>
              <textarea
                id="edit-bahas"
                rows={3}
                value={edit.pembahasan}
                onChange={(e) => setEdit({ ...edit, pembahasan: e.target.value })}
                className={kolomInput}
              />
            </div>

            {edit.kunci !== disunting.kunci && (
              <p role="status" className="text-sm text-ink-muted">
                {dampakEdit.nilaiBerubah === 0
                  ? "Tidak ada pegawai yang nilainya berubah."
                  : `${dampakEdit.nilaiBerubah} pegawai nilainya berubah.`}
                {dampakEdit.statusBerubah !== null &&
                  ` ${dampakEdit.statusBerubah} pegawai statusnya berubah (lulus atau tidak lulus).`}
              </p>
            )}
            {pesanGalat}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={tutupDialog} disabled={proses} className={tombolSekunder}>
                Batal
              </button>
              <button
                type="button"
                onClick={terapkanEdit}
                disabled={teksKosong || opsiKosong || tidakBerubah || proses}
                className={tombolUtama}
              >
                Simpan perubahan
              </button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog
        buka={!!ditoggle}
        onTutup={tutupDialog}
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
                ? "Tidak ada pegawai yang nilainya berubah."
                : `${dampakToggle.nilaiBerubah} pegawai nilainya berubah.`}
              {dampakToggle.statusBerubah !== null &&
                ` ${dampakToggle.statusBerubah} pegawai statusnya berubah (lulus atau tidak lulus).`}
            </p>
            {dampakHapus && (
              <p role="status" className="text-sm text-ink-muted">
                {dampakHapus.nilaiBerubah === 0
                  ? "Tidak ada pegawai yang nilainya berubah."
                  : `${dampakHapus.nilaiBerubah} pegawai nilainya berubah.`}
                {dampakHapus.statusBerubah !== null &&
                  ` ${dampakHapus.statusBerubah} pegawai statusnya berubah (lulus atau tidak lulus).`}
              </p>
            )}
            {pesanGalat}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={tutupDialog} disabled={proses} className={tombolSekunder}>
                Batal
              </button>
              <button type="button" onClick={terapkanToggle} disabled={proses} className={tombolUtama}>
                {ditoggle.aktif ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}