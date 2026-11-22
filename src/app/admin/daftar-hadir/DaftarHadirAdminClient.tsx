"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import {
  apakahLulusKehadiran,
  formatWaktu,
  hitungKehadiranPegawai,
  labelSesi,
  sesiKegiatan,
  statusSesi,
  waktuSekarang,
  type StatusSesi,
} from "@/lib/presensi";
import {
  STATUS_KEHADIRAN_LABEL,
  type Kegiatan,
  type Opd,
  type Pengguna,
  type Presensi,
  type SesiPembinaan,
  type StatusKehadiran,
} from "@/lib/types";
import { hapusKehadiran, hapusSesi, tambahSesi, ubahAmbang, ubahSesi } from "./actions";

type Hasil = { ok: true } | { ok: false; pesan: string };

const dasarTombol =
  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
const tombolUtama = `${dasarTombol} bg-primary text-white hover:bg-primary-hover`;
const tombolSekunder = `${dasarTombol} border border-line bg-surface text-ink hover:bg-surface-muted`;
const tombolBahaya = `${dasarTombol} bg-status-revisi-fg text-white hover:opacity-90`;
const kolomInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary disabled:bg-surface-muted disabled:text-ink-muted";
const kartu = "rounded-card border border-line bg-surface p-4 shadow-card sm:p-5";

const WARNA_LENCANA: Record<StatusKehadiran | "tidak_mengisi", string> = {
  tepat_waktu: "bg-status-disetujui-bg text-status-disetujui-fg",
  terlambat: "bg-status-menunggu-bg text-status-menunggu-fg",
  izin: "bg-status-belum-bg text-status-belum-fg",
  tidak_mengisi: "bg-status-revisi-bg text-status-revisi-fg",
};

const LABEL_SEL: Record<StatusKehadiran, string> = {
  tepat_waktu: "Tepat waktu",
  terlambat: "Terlambat",
  izin: "Izin dinas",
};

const LABEL_STATUS_SESI: Record<StatusSesi, string> = {
  belum_dibuka: "Belum dibuka",
  dibuka: "Dibuka",
  ditutup: "Ditutup",
};

const GAYA_STATUS_SESI: Record<StatusSesi, string> = {
  belum_dibuka: "bg-surface-muted text-ink-muted",
  dibuka: "bg-status-disetujui-bg text-status-disetujui-fg",
  ditutup: "bg-status-belum-bg text-status-belum-fg",
};

function Lencana({ kelas, children }: { kelas: string; children: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${kelas}`}>
      {children}
    </span>
  );
}

function teksWaktu(waktu: string | null, kosong: string) {
  if (!waktu) return kosong;
  const { tanggal, jam } = formatWaktu(waktu);
  return `${tanggal}, ${jam}`;
}

/* ------------------------------ ambang ------------------------------ */

function BagianAmbang({
  ambang,
  arsip,
  onSimpan,
}: {
  ambang: number;
  arsip: boolean;
  onSimpan: (nilai: number) => Promise<string | null>;
}) {
  const [isi, setIsi] = useState(String(ambang));
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    const n = Number(isi);
    if (isi.trim() === "" || !Number.isInteger(n) || n < 1 || n > 100) {
      return setGalat("Ambang harus bilangan bulat 1 sampai 100.");
    }
    setGalat("");
    setProses(true);
    const err = await onSimpan(n);
    setProses(false);
    if (err) setGalat(err);
  }

  return (
    <section aria-labelledby="judul-ambang" className={kartu}>
      <h2 id="judul-ambang" className="font-semibold text-ink">
        Ambang kehadiran
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Pegawai lulus kehadiran bila persentasenya mencapai ambang ini. Persentase dihitung dari semua
        sesi kegiatan.
      </p>
      <form onSubmit={simpan} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label htmlFor="ambang" className="text-sm font-medium text-ink">
            Minimal kehadiran (%)
          </label>
          <input
            id="ambang"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            step={1}
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            disabled={arsip || proses}
            className={`${kolomInput} w-32`}
          />
        </div>
        <button type="submit" disabled={arsip || proses || Number(isi) === ambang} className={tombolUtama}>
          Simpan
        </button>
      </form>
      {galat && (
        <p role="alert" className="mt-2 text-sm text-status-revisi-fg">
          {galat}
        </p>
      )}
    </section>
  );
}

/* ------------------------------ form sesi ------------------------------ */

type Isian = { judul: string; buka: string; batas: string };

function FormSesi({
  awal,
  batasLama,
  sekarang,
  onSimpan,
  onBatal,
}: {
  awal: Isian;
  batasLama: string;
  sekarang: string;
  onSimpan: (v: Isian) => Promise<string | null>;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function kirim(e: FormEvent) {
    e.preventDefault();
    if (proses) return;
    if (!v.judul.trim()) return setGalat("Judul sesi wajib diisi.");
    if (v.buka && v.batas && v.batas <= v.buka) {
      return setGalat("Batas pengisian harus setelah waktu buka.");
    }
    // batas yang diubah harus di masa depan, supaya sesi tidak langsung terkunci lagi
    if (v.batas && v.batas !== batasLama && v.batas <= sekarang) {
      return setGalat("Batas pengisian harus di masa depan.");
    }
    setGalat("");
    setProses(true);
    const err = await onSimpan({ ...v, judul: v.judul.trim() });
    setProses(false);
    if (err) setGalat(err);
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="s-judul" className="text-sm font-medium text-ink">
          Judul sesi
        </label>
        <input
          id="s-judul"
          value={v.judul}
          onChange={(e) => setV({ ...v, judul: e.target.value })}
          className={kolomInput}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="s-buka" className="text-sm font-medium text-ink">
            Waktu buka <span className="font-normal text-ink-muted">(opsional, WITA)</span>
          </label>
          <input
            id="s-buka"
            type="datetime-local"
            value={v.buka}
            onChange={(e) => setV({ ...v, buka: e.target.value })}
            className={kolomInput}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="s-batas" className="text-sm font-medium text-ink">
            Batas pengisian <span className="font-normal text-ink-muted">(opsional, WITA)</span>
          </label>
          <input
            id="s-batas"
            type="datetime-local"
            value={v.batas}
            onChange={(e) => setV({ ...v, batas: e.target.value })}
            className={kolomInput}
          />
        </div>
      </div>
      <p className="text-xs text-ink-muted">
        Waktu buka kosong berarti langsung terbuka. Batas pengisian kosong berarti terbuka sampai
        batas diisi.
      </p>

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
          Simpan
        </button>
      </div>
    </form>
  );
}

/* ------------------------------ halaman ------------------------------ */

type Props = {
  kegiatan: Kegiatan;
  opdList: Opd[];
  pegawaiList: Pengguna[];
  sesiList: SesiPembinaan[];
  presensi: Presensi[];
};

export default function DaftarHadirAdminClient({
  kegiatan,
  opdList,
  pegawaiList,
  sesiList,
  presensi,
}: Props) {
  const [sekarang, setSekarang] = useState<string | null>(null);
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [hapusSesiId, setHapusSesiId] = useState<string | null>(null);
  const [terpilih, setTerpilih] = useState<{ penggunaId: string; sesiId: string } | null>(null);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);
  const [galatAksi, setGalatAksi] = useState("");

  // Waktu WITA dihitung di browser, diperbarui tiap 30 detik agar status sesi ikut berubah
    useEffect(() => {
    const awal = setTimeout(() => setSekarang(waktuSekarang()), 0);
    const timer = setInterval(() => setSekarang(waktuSekarang()), 30_000);
    return () => {
      clearTimeout(awal);
      clearInterval(timer);
    };
  }, []);

  const arsip = !!kegiatan.arsip;
  const sesi = sesiKegiatan(sesiList, kegiatan.id);
  const jumlahIsi = (sesiId: string) => presensi.filter((p) => p.sesiId === sesiId).length;

  const diedit = form?.id ? sesiList.find((s) => s.id === form.id) : undefined;
  const dihapus = hapusSesiId ? sesiList.find((s) => s.id === hapusSesiId) : undefined;

  const rec = terpilih
    ? presensi.find((p) => p.penggunaId === terpilih.penggunaId && p.sesiId === terpilih.sesiId)
    : undefined;
  const pegawaiRec = rec ? pegawaiList.find((p) => p.id === rec.penggunaId) : undefined;
  const opdRec = pegawaiRec ? opdList.find((o) => o.id === pegawaiRec.opdId) : undefined;
  const sesiRec = rec ? sesiList.find((s) => s.id === rec.sesiId) : undefined;

  // OPD sebagai judul kelompok, pegawai sebagai baris; pencarian cocok ke OPD atau nama pegawai
  const kata = cari.trim().toLowerCase();
  const kelompok = opdList
    .map((opd) => {
      const semua = pegawaiList.filter((p) => p.opdId === opd.id);
      const cocokOpd = `${opd.nama} ${opd.singkatan}`.toLowerCase().includes(kata);
      const tampil = cocokOpd ? semua : semua.filter((p) => p.nama.toLowerCase().includes(kata));
      return { opd, semua, tampil, cocokOpd };
    })
    .filter((k) => k.tampil.length > 0 || (k.cocokOpd && k.semua.length === 0));

  async function jalankan(aksi: () => Promise<Hasil>, pesanOk: string): Promise<string | null> {
    const h = await aksi();
    if (!h.ok) return h.pesan;
    setPesan(pesanOk);
    return null;
  }

  function simpanAmbang(nilai: number) {
    return jalankan(() => ubahAmbang(kegiatan.id, nilai), `Ambang kehadiran diatur ke ${nilai}%.`);
  }

  async function simpanSesi(v: Isian) {
    const err = diedit
      ? await jalankan(() => ubahSesi(diedit.id, v), `${v.judul} diperbarui.`)
      : await jalankan(() => tambahSesi(kegiatan.id, v), `${v.judul} ditambahkan.`);
    if (!err) setForm(null);
    return err;
  }

  function tutupHapusSesi() {
    setHapusSesiId(null);
    setGalatAksi("");
  }

  async function prosesHapusSesi() {
    if (!dihapus || proses) return;
    setProses(true);
    const err = await jalankan(() => hapusSesi(dihapus.id), `${dihapus.judul} dihapus.`);
    setProses(false);
    if (err) return setGalatAksi(err);
    tutupHapusSesi();
  }

  function tutupDetail() {
    setTerpilih(null);
    setKonfirmasi(false);
    setGalatAksi("");
  }

  async function prosesHapusKehadiran() {
    if (!rec || proses) return;
    setProses(true);
    const err = await jalankan(
      () => hapusKehadiran(rec.id),
      `Kehadiran ${pegawaiRec?.nama ?? "pegawai"} pada ${sesiRec ? labelSesi(sesiRec) : "sesi"} dihapus.`,
    );
    setProses(false);
    if (err) return setGalatAksi(err);
    tutupDetail();
  }

  function selRekap(penggunaId: string, s: SesiPembinaan) {
    const p = presensi.find((x) => x.penggunaId === penggunaId && x.sesiId === s.id);
    if (p) {
      return (
        <button
          type="button"
          onClick={() => setTerpilih({ penggunaId, sesiId: s.id })}
          title="Lihat detail"
          className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Lencana kelas={WARNA_LENCANA[p.status]}>{LABEL_SEL[p.status]}</Lencana>
        </button>
      );
    }
    if (sekarang && statusSesi(s, sekarang) === "ditutup") {
      return <Lencana kelas={WARNA_LENCANA.tidak_mengisi}>Tidak mengisi</Lencana>;
    }
    return <span className="text-ink-muted">–</span>;
  }

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

      <p role="status" className="min-h-5 text-sm text-ink-muted">
        {pesan}
      </p>

      <BagianAmbang
        key={kegiatan.id}
        ambang={kegiatan.ambangKehadiran}
        arsip={arsip}
        onSimpan={simpanAmbang}
      />

      {/* kelola sesi */}
      <section aria-labelledby="judul-sesi" className={kartu}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="judul-sesi" className="font-semibold text-ink">
            Sesi pembinaan
          </h2>
          <button
            type="button"
            onClick={() => setForm({ id: null })}
            disabled={arsip || sekarang === null}
            className={tombolUtama}
          >
            <Plus className="size-4" aria-hidden />
            Tambah sesi
          </button>
        </div>

        {sesi.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Belum ada sesi untuk kegiatan ini.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-184 text-left text-sm">
              <thead>
                <tr className="bg-surface-muted text-xs uppercase text-ink-muted">
                  <th scope="col" className="rounded-l-lg px-3 py-2.5 font-semibold">Sesi</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Waktu buka</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Batas pengisian</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Terisi</th>
                  <th scope="col" className="rounded-r-lg px-3 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sesi.map((s) => {
                  const status = sekarang ? statusSesi(s, sekarang) : null;
                  const terisi = jumlahIsi(s.id);
                  return (
                    <tr key={s.id}>
                      <td className="px-3 py-3 font-medium text-ink">{labelSesi(s)}</td>
                      <td className="tabular px-3 py-3 text-ink-muted">
                        {teksWaktu(s.waktuBuka, "Langsung terbuka")}
                      </td>
                      <td className="tabular px-3 py-3 text-ink-muted">
                        {teksWaktu(s.batasPengisian, "Tanpa batas")}
                      </td>
                      <td className="px-3 py-3">
                        {status ? (
                          <Lencana kelas={GAYA_STATUS_SESI[status]}>{LABEL_STATUS_SESI[status]}</Lencana>
                        ) : (
                          <span className="text-ink-muted">–</span>
                        )}
                      </td>
                      <td className="tabular px-3 py-3 text-ink-muted">
                        {terisi} dari {pegawaiList.length} pegawai
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setForm({ id: s.id })}
                            disabled={arsip || sekarang === null}
                            aria-label={`Ubah ${labelSesi(s)}`}
                            className={tombolSekunder}
                          >
                            <Pencil className="size-4" aria-hidden />
                            Ubah
                          </button>
                          <button
                            type="button"
                            onClick={() => setHapusSesiId(s.id)}
                            disabled={arsip || terisi > 0}
                            aria-label={`Hapus ${labelSesi(s)}`}
                            title={terisi > 0 ? "Sudah ada kehadiran terisi, tidak bisa dihapus" : undefined}
                            className={tombolSekunder}
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-muted">
          Sesi yang sudah ada kehadiran terisi tidak bisa dihapus. Mengubah judul atau waktu tidak
          menghapus kehadiran yang sudah masuk. Semua waktu dalam WITA.
        </p>
      </section>

      {/* rekap pegawai x sesi, dikelompokkan per OPD */}
      <section aria-labelledby="judul-rekap" className={kartu}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="judul-rekap" className="font-semibold text-ink">
            Rekap kehadiran pegawai
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
              placeholder="Cari OPD atau pegawai…"
              aria-label="Cari OPD atau pegawai"
              className={`${kolomInput} pl-9`}
            />
          </div>
        </div>

        {sesi.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Tambahkan sesi untuk melihat rekap.</p>
        ) : kelompok.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Tidak ada OPD atau pegawai yang cocok.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-184 text-left text-sm">
              <thead>
                <tr className="bg-surface-muted text-xs uppercase text-ink-muted">
                  <th scope="col" className="rounded-l-lg px-3 py-2.5 font-semibold">Pegawai</th>
                  {sesi.map((s) => (
                    <th key={s.id} scope="col" title={s.judul} className="px-3 py-2.5 font-semibold">
                      Sesi {s.urutan}
                    </th>
                  ))}
                  <th scope="col" className="rounded-r-lg px-3 py-2.5 text-right font-semibold">
                    Kehadiran
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {kelompok.map(({ opd, tampil }) => (
                  <Fragment key={opd.id}>
                    <tr className="bg-surface-muted/60">
                      <th
                        scope="colgroup"
                        colSpan={sesi.length + 2}
                        className="px-3 py-2 text-left text-sm font-semibold text-ink"
                      >
                        {opd.nama}
                      </th>
                    </tr>
                    {tampil.length === 0 ? (
                      <tr>
                        <td colSpan={sesi.length + 2} className="px-3 py-3 text-ink-muted">
                          Belum ada pegawai terdaftar.
                        </td>
                      </tr>
                    ) : (
                      tampil.map((pegawai) => {
                        const k = hitungKehadiranPegawai(pegawai.id, sesi, presensi);
                        const lulus = apakahLulusKehadiran(k.persen, kegiatan);
                        return (
                          <tr key={pegawai.id}>
                            <td className="px-3 py-3 font-medium text-ink">{pegawai.nama}</td>
                            {sesi.map((s) => (
                              <td key={s.id} className="px-3 py-3">
                                {selRekap(pegawai.id, s)}
                              </td>
                            ))}
                            <td className="tabular px-3 py-3 text-right">
                              <span
                                className={`font-semibold ${
                                  lulus ? "text-status-disetujui-fg" : "text-status-revisi-fg"
                                }`}
                              >
                                {Math.round(k.persen)}%
                              </span>
                              <span className="block text-xs text-ink-muted">
                                {k.hadir} dari {k.total} sesi
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-muted">
          Persentase dihitung per pegawai dari semua sesi kegiatan. Hadir tepat waktu, hadir terlambat,
          dan izin tugas dinas dihitung hadir; tidak mengisi tidak. Warna hijau berarti sudah mencapai
          ambang {kegiatan.ambangKehadiran}%.
        </p>
      </section>

      {/* tambah / ubah sesi */}
      <Dialog buka={!!form} onTutup={() => setForm(null)} judul={diedit ? "Ubah sesi" : "Tambah sesi"}>
        {sekarang && (
          <FormSesi
            awal={{
              judul: diedit?.judul ?? "",
              buka: diedit?.waktuBuka ?? "",
              batas: diedit?.batasPengisian ?? "",
            }}
            batasLama={diedit?.batasPengisian ?? ""}
            sekarang={sekarang}
            onSimpan={simpanSesi}
            onBatal={() => setForm(null)}
          />
        )}
      </Dialog>

      {/* hapus sesi */}
      <Dialog buka={!!dihapus} onTutup={tutupHapusSesi} judul="Hapus sesi">
        <p className="text-sm text-ink-muted">
          Hapus sesi <span className="font-medium text-ink">{dihapus ? labelSesi(dihapus) : ""}</span>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
        {galatAksi && (
          <p role="alert" className="text-sm text-status-revisi-fg">
            {galatAksi}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={tutupHapusSesi} disabled={proses} className={tombolSekunder}>
            Batal
          </button>
          <button type="button" onClick={prosesHapusSesi} disabled={proses} className={tombolBahaya}>
            Hapus
          </button>
        </div>
      </Dialog>

      {/* detail kehadiran */}
      <Dialog buka={!!rec} onTutup={tutupDetail} judul="Detail kehadiran">
        {rec && pegawaiRec && sesiRec && (
          <>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-ink-muted">Pegawai</dt>
                <dd className="font-medium text-ink">{pegawaiRec.nama}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">OPD</dt>
                <dd className="font-medium text-ink">{opdRec?.nama ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Sesi</dt>
                <dd className="font-medium text-ink">{labelSesi(sesiRec)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Status</dt>
                <dd className="font-medium text-ink">{STATUS_KEHADIRAN_LABEL[rec.status]}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Waktu presensi</dt>
                <dd className="tabular text-ink">{teksWaktu(rec.waktuIsi, "–")}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Catatan pegawai</dt>
                <dd className="text-ink">{rec.catatan ?? "–"}</dd>
              </div>
            </dl>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={tutupDetail} className={tombolSekunder}>
                Tutup
              </button>
              {!arsip && (
                <button type="button" onClick={() => setKonfirmasi(true)} className={tombolBahaya}>
                  <Trash2 className="size-4" aria-hidden />
                  Hapus kehadiran
                </button>
              )}
            </div>
          </>
        )}
      </Dialog>

      {/* konfirmasi hapus kehadiran, dibuka di atas dialog detail */}
      <Dialog
        buka={konfirmasi && !!rec}
        onTutup={() => {
          setKonfirmasi(false);
          setGalatAksi("");
        }}
        judul="Hapus kehadiran?"
      >
        <p className="text-sm text-ink-muted">
          Kehadiran <span className="font-medium text-ink">{pegawaiRec?.nama}</span> pada{" "}
          <span className="font-medium text-ink">{sesiRec ? labelSesi(sesiRec) : ""}</span> akan
          dihapus. Pegawai bisa mengisi lagi selama sesi masih dibuka.
        </p>
        {galatAksi && (
          <p role="alert" className="text-sm text-status-revisi-fg">
            {galatAksi}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setKonfirmasi(false);
              setGalatAksi("");
            }}
            disabled={proses}
            className={tombolSekunder}
          >
            Batal
          </button>
          <button type="button" onClick={prosesHapusKehadiran} disabled={proses} className={tombolBahaya}>
            Hapus
          </button>
        </div>
      </Dialog>
    </div>
  );
}