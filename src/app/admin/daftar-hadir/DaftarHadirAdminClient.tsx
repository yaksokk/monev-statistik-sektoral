"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import {
  apakahLulusKehadiran,
  formatWaktu,
  hitungKehadiran,
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
  type Presensi,
  type SesiPembinaan,
  type StatusKehadiran,
} from "@/lib/types";

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

function Lencana({
  kelas,
  children,
}: {
  kelas: string;
  children: string;
}) {
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
  onSimpan: (nilai: number) => void;
}) {
  const [isi, setIsi] = useState(String(ambang));
  const [galat, setGalat] = useState("");

  function simpan(e: FormEvent) {
    e.preventDefault();
    const n = Number(isi);
    if (isi.trim() === "" || !Number.isInteger(n) || n < 1 || n > 100) {
      return setGalat("Ambang harus bilangan bulat 1 sampai 100.");
    }
    setGalat("");
    onSimpan(n);
  }

  return (
    <section aria-labelledby="judul-ambang" className={kartu}>
      <h2 id="judul-ambang" className="font-semibold text-ink">
        Ambang kehadiran
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        OPD lulus kehadiran bila persentasenya mencapai ambang ini. Persentase dihitung dari semua
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
            disabled={arsip}
            className={`${kolomInput} w-32`}
          />
        </div>
        <button type="submit" disabled={arsip || Number(isi) === ambang} className={tombolUtama}>
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
  onSimpan: (v: Isian) => void;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");

  function kirim(e: FormEvent) {
    e.preventDefault();
    if (!v.judul.trim()) return setGalat("Judul sesi wajib diisi.");
    if (v.buka && v.batas && v.batas <= v.buka) {
      return setGalat("Batas pengisian harus setelah waktu buka.");
    }
    // batas yang diubah harus di masa depan, supaya sesi tidak langsung terkunci lagi
    if (v.batas && v.batas !== batasLama && v.batas <= sekarang) {
      return setGalat("Batas pengisian harus di masa depan.");
    }
    onSimpan({ ...v, judul: v.judul.trim() });
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
            Waktu buka <span className="font-normal text-ink-muted">(opsional)</span>
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
            Batas pengisian <span className="font-normal text-ink-muted">(opsional)</span>
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
        <button type="button" onClick={onBatal} className={tombolSekunder}>
          Batal
        </button>
        <button type="submit" className={tombolUtama}>
          Simpan
        </button>
      </div>
    </form>
  );
}

/* ------------------------------ halaman ------------------------------ */

type Props = {
  kegiatanId: string;
  kegiatanAwal: Kegiatan[];
  opdList: Opd[];
  sesiAwal: SesiPembinaan[];
  presensiAwal: Presensi[];
};

export default function DaftarHadirAdminClient({
  kegiatanId,
  kegiatanAwal,
  opdList,
  sesiAwal,
  presensiAwal,
}: Props) {
  const [kegiatanList, setKegiatanList] = useState(kegiatanAwal);
  const [sesiList, setSesiList] = useState(sesiAwal);
  const [presensi, setPresensi] = useState(presensiAwal);
  const [sekarang, setSekarang] = useState<string | null>(null);
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [hapusSesiId, setHapusSesiId] = useState<string | null>(null);
  const [terpilih, setTerpilih] = useState<{ opdId: string; sesiId: string } | null>(null);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState("");

  // Waktu dihitung di browser, diperbarui tiap 30 detik agar status sesi ikut berubah
  useEffect(() => {
    setSekarang(waktuSekarang());
    const timer = setInterval(() => setSekarang(waktuSekarang()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const kegiatan = kegiatanList.find((k) => k.id === kegiatanId);
  if (!kegiatan) return null;

  const arsip = !!kegiatan.arsip;
  const sesi = sesiKegiatan(sesiList, kegiatan.id);
  const idSesi = new Set(sesi.map((s) => s.id));
  const jumlahIsi = (sesiId: string) => presensi.filter((p) => p.sesiId === sesiId).length;

  const diedit = form?.id ? sesiList.find((s) => s.id === form.id) : undefined;
  const dihapus = hapusSesiId ? sesiList.find((s) => s.id === hapusSesiId) : undefined;

  const rec = terpilih
    ? presensi.find((p) => p.opdId === terpilih.opdId && p.sesiId === terpilih.sesiId)
    : undefined;
  const opdRec = rec ? opdList.find((o) => o.id === rec.opdId) : undefined;
  const sesiRec = rec ? sesiList.find((s) => s.id === rec.sesiId) : undefined;

  const kata = cari.trim().toLowerCase();
  const opdTampil = opdList.filter((o) => `${o.nama} ${o.singkatan}`.toLowerCase().includes(kata));

  function simpanAmbang(nilai: number) {
    if (arsip) return;
    setKegiatanList((prev) =>
      prev.map((k) => (k.id === kegiatan!.id ? { ...k, ambangKehadiran: nilai } : k)),
    );
    setPesan(`Ambang kehadiran diatur ke ${nilai}%.`);
  }

  function simpanSesi(v: Isian) {
    if (arsip) return;
    const waktuBuka = v.buka || null;
    const batasPengisian = v.batas || null;

    if (diedit) {
      setSesiList((prev) =>
        prev.map((s) => (s.id === diedit.id ? { ...s, judul: v.judul, waktuBuka, batasPengisian } : s)),
      );
      setPesan(`${v.judul} diperbarui.`);
    } else {
      const no = sesiList.reduce((m, s) => Math.max(m, Number(s.id.replace(/\D/g, ""))), 0) + 1;
      setSesiList((prev) => [
        ...prev,
        {
          id: `sesi-${no}`,
          kegiatanId: kegiatan!.id,
          urutan: sesi.length + 1,
          judul: v.judul,
          waktuBuka,
          batasPengisian,
        },
      ]);
      setPesan(`${v.judul} ditambahkan.`);
    }
    setForm(null);
  }

  function hapusSesi() {
    if (!dihapus || arsip || jumlahIsi(dihapus.id) > 0) return setHapusSesiId(null);
    setSesiList((prev) => {
      const sisa = prev.filter((s) => s.id !== dihapus.id);
      // nomor sesi hanya label urutan, dirapatkan lagi setelah ada yang dihapus
      const urutan = new Map(
        sesiKegiatan(sisa, dihapus.kegiatanId).map((s, i) => [s.id, i + 1] as [string, number]),
      );
      return sisa.map((s) => (urutan.has(s.id) ? { ...s, urutan: urutan.get(s.id)! } : s));
    });
    setPesan(`${dihapus.judul} dihapus.`);
    setHapusSesiId(null);
  }

  function hapusKehadiran() {
    if (!rec || arsip) return;
    setPresensi((prev) => prev.filter((p) => p.id !== rec.id));
    setPesan(`Kehadiran ${opdRec?.nama ?? "OPD"} pada ${sesiRec ? labelSesi(sesiRec) : "sesi"} dihapus.`);
    setKonfirmasi(false);
    setTerpilih(null);
  }

  function tutupDetail() {
    setTerpilih(null);
    setKonfirmasi(false);
  }

  function selRekap(opdId: string, s: SesiPembinaan) {
    const p = presensi.find((x) => x.opdId === opdId && x.sesiId === s.id);
    if (p) {
      return (
        <button
          type="button"
          onClick={() => setTerpilih({ opdId, sesiId: s.id })}
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
      {/* pilih kegiatan */}
      <nav aria-label="Pilih kegiatan" className="flex flex-wrap gap-2">
        {kegiatanList.map((k) => {
          const terpilihTab = k.id === kegiatan.id;
          return (
            <Link
              key={k.id}
              href={`/admin/daftar-hadir?kegiatan=${k.id}`}
              aria-current={terpilihTab ? "page" : undefined}
              className={
                terpilihTab
                  ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                  : "rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink-muted hover:bg-surface-muted"
              }
            >
              {k.nama}
              {k.arsip ? " (arsip)" : k.aktif ? " (aktif)" : ""}
            </Link>
          );
        })}
      </nav>

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
                        {terisi} dari {opdList.length} OPD
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
          menghapus kehadiran yang sudah masuk.
        </p>
      </section>

      {/* rekap OPD x sesi */}
      <section aria-labelledby="judul-rekap" className={kartu}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="judul-rekap" className="font-semibold text-ink">
            Rekap kehadiran OPD
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
              placeholder="Cari OPD…"
              aria-label="Cari OPD"
              className={`${kolomInput} pl-9`}
            />
          </div>
        </div>

        {sesi.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Tambahkan sesi untuk melihat rekap.</p>
        ) : opdTampil.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Tidak ada OPD yang cocok.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-184 text-left text-sm">
              <thead>
                <tr className="bg-surface-muted text-xs uppercase text-ink-muted">
                  <th scope="col" className="rounded-l-lg px-3 py-2.5 font-semibold">OPD</th>
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
                {opdTampil.map((opd) => {
                  const k = hitungKehadiran(opd.id, sesi, presensi);
                  const lulus = apakahLulusKehadiran(k.persen, kegiatan);
                  return (
                    <tr key={opd.id}>
                      <td className="px-3 py-3 font-medium text-ink">{opd.nama}</td>
                      {sesi.map((s) => (
                        <td key={s.id} className="px-3 py-3">
                          {selRekap(opd.id, s)}
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
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-muted">
          Persentase dihitung dari semua sesi kegiatan. Hadir tepat waktu dan terlambat dihitung
          hadir; izin tugas dinas dan tidak mengisi tidak. Warna hijau berarti sudah mencapai ambang{" "}
          {kegiatan.ambangKehadiran}%.
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
      <Dialog buka={!!dihapus} onTutup={() => setHapusSesiId(null)} judul="Hapus sesi">
        <p className="text-sm text-ink-muted">
          Hapus sesi <span className="font-medium text-ink">{dihapus ? labelSesi(dihapus) : ""}</span>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setHapusSesiId(null)} className={tombolSekunder}>
            Batal
          </button>
          <button type="button" onClick={hapusSesi} className={tombolBahaya}>
            Hapus
          </button>
        </div>
      </Dialog>

      {/* detail kehadiran */}
      <Dialog buka={!!rec} onTutup={tutupDetail} judul="Detail kehadiran">
        {rec && opdRec && sesiRec && (
          <>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-ink-muted">OPD</dt>
                <dd className="font-medium text-ink">{opdRec.nama}</dd>
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
                <dt className="text-ink-muted">Catatan OPD</dt>
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
      <Dialog buka={konfirmasi && !!rec} onTutup={() => setKonfirmasi(false)} judul="Hapus kehadiran?">
        <p className="text-sm text-ink-muted">
          Kehadiran <span className="font-medium text-ink">{opdRec?.nama}</span> pada{" "}
          <span className="font-medium text-ink">{sesiRec ? labelSesi(sesiRec) : ""}</span> akan
          dihapus. OPD bisa mengisi lagi selama sesi masih dibuka.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setKonfirmasi(false)} className={tombolSekunder}>
            Batal
          </button>
          <button type="button" onClick={hapusKehadiran} className={tombolBahaya}>
            Hapus
          </button>
        </div>
      </Dialog>
    </div>
  );
}