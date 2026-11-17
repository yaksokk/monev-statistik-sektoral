"use client";

import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  ListChecks,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Galat } from "@/components/ui/Galat";
import { KonfirmasiHapus } from "@/components/ui/KonfirmasiHapus";
import { FITUR_TAMBAH_KEGIATAN } from "@/lib/fitur";
import { JENIS_QUIZ, LABEL_QUIZ, quizAktif } from "@/lib/quiz";
import type { ItemDokumen, JenisQuiz, Kegiatan } from "@/lib/types";
import {
  aktifkanKegiatan,
  arsipkanKegiatan,
  hapusItem,
  hapusKegiatan,
  keluarkanDariArsip,
  nonaktifkanKegiatan,
  tambahItem,
  tambahKegiatan,
  ubahItem,
  ubahKegiatan,
  ubahSaklarQuiz,
} from "./actions";

const dasarTombol =
  "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
const tombolUtama = `${dasarTombol} bg-primary text-white hover:bg-primary-hover`;
const tombolSekunder = `${dasarTombol} border border-line bg-surface text-ink hover:bg-surface-muted`;
const tombolBahaya = `${dasarTombol} bg-status-revisi-fg text-white hover:opacity-90`;
const kolomInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary";

type Balasan = { ok: true } | { ok: false; pesan: string };
type Isi = { item: number; sesi: number; soal: number };

type StatusKegiatan = "aktif" | "nonaktif" | "arsip";

const LABEL_STATUS: Record<StatusKegiatan, string> = {
  aktif: "Aktif",
  nonaktif: "Nonaktif",
  arsip: "Arsip",
};

const GAYA_STATUS: Record<StatusKegiatan, string> = {
  aktif: "bg-primary-soft text-primary",
  nonaktif: "bg-surface-muted text-ink-muted",
  arsip: "bg-surface-muted text-ink-muted",
};

function statusDari(k: Kegiatan): StatusKegiatan {
  if (k.arsip) return "arsip";
  return k.aktif ? "aktif" : "nonaktif";
}

function tanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

type Isian = { nama: string; mulai: string; selesai: string; tenggat: string; bobot: string };

const ISIAN_KOSONG: Isian = { nama: "", mulai: "", selesai: "", tenggat: "", bobot: "" };

// onSimpan mengembalikan pesan galat dari server, atau null bila berhasil
function FormKegiatan({
  awal,
  onSimpan,
  onBatal,
}: {
  awal: Isian;
  onSimpan: (v: Isian) => Promise<string | null>;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function kirim() {
    if (!v.nama.trim() || !v.mulai || !v.selesai || !v.tenggat || v.bobot === "") {
      return setGalat("Semua kolom wajib diisi.");
    }
    if (v.selesai < v.mulai) return setGalat("Tanggal selesai tidak boleh sebelum tanggal mulai.");
    const bobot = Number(v.bobot);
    if (!Number.isInteger(bobot) || bobot < 0 || bobot > 100) {
      return setGalat("Bobot harus bilangan bulat 0 sampai 100.");
    }
    setGalat("");
    setProses(true);
    const g = await onSimpan({ ...v, nama: v.nama.trim() });
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="k-nama" className="text-sm font-medium">
          Nama kegiatan
        </label>
        <input id="k-nama" value={v.nama} onChange={(e) => setV({ ...v, nama: e.target.value })} className={kolomInput} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="k-mulai" className="text-sm font-medium">
            Tanggal mulai
          </label>
          <input id="k-mulai" type="date" value={v.mulai} onChange={(e) => setV({ ...v, mulai: e.target.value })} className={kolomInput} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="k-selesai" className="text-sm font-medium">
            Tanggal selesai
          </label>
          <input
            id="k-selesai"
            type="date"
            value={v.selesai}
            onChange={(e) => setV({ ...v, selesai: e.target.value })}
            className={kolomInput}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="k-tenggat" className="text-sm font-medium">
            Tenggat unggah dokumen
          </label>
          <input
            id="k-tenggat"
            type="date"
            value={v.tenggat}
            onChange={(e) => setV({ ...v, tenggat: e.target.value })}
            className={kolomInput}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="k-bobot" className="text-sm font-medium">
            Bobot nilai (%)
          </label>
          <input
            id="k-bobot"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            value={v.bobot}
            onChange={(e) => setV({ ...v, bobot: e.target.value })}
            className={kolomInput}
          />
        </div>
      </div>

      <Galat pesan={galat} />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBatal} disabled={proses} className={tombolSekunder}>
          Batal
        </button>
        <button onClick={kirim} disabled={proses} className={tombolUtama}>
          {proses ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}

function FormItem({
  awal,
  onSimpan,
  onBatal,
}: {
  awal: string;
  onSimpan: (nama: string) => Promise<string | null>;
  onBatal: () => void;
}) {
  const [nama, setNama] = useState(awal);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function kirim() {
    const n = nama.trim();
    if (!n) return setGalat("Nama item wajib diisi.");
    if (n.length > 200) return setGalat("Nama item terlalu panjang.");
    setGalat("");
    setProses(true);
    const g = await onSimpan(n);
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="i-nama" className="text-sm font-medium">
          Nama item dokumen
        </label>
        <input id="i-nama" value={nama} onChange={(e) => setNama(e.target.value)} className={kolomInput} />
      </div>
      <Galat pesan={galat} />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBatal} disabled={proses} className={tombolSekunder}>
          Batal
        </button>
        <button onClick={kirim} disabled={proses} className={tombolUtama}>
          {proses ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}

function KonfirmasiAktif({
  teks,
  onYa,
  onBatal,
}: {
  teks: string;
  onYa: () => Promise<string | null>;
  onBatal: () => void;
}) {
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function ya() {
    setGalat("");
    setProses(true);
    const g = await onYa();
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <>
      <p className="text-sm text-ink-muted">{teks}</p>
      <Galat pesan={galat} />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBatal} disabled={proses} className={tombolSekunder}>
          Batal
        </button>
        <button onClick={ya} disabled={proses} className={tombolUtama}>
          <Power className="size-4" aria-hidden />
          {proses ? "Memproses..." : "Jadikan aktif"}
        </button>
      </div>
    </>
  );
}

function SaklarQuiz({
  label,
  aktif,
  terkunci,
  jumlahHasil,
  onUbah,
}: {
  label: string;
  aktif: boolean;
  terkunci: boolean;
  jumlahHasil: number;
  onUbah: (nilai: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <div className="min-w-0">
        <span className="text-ink">{label}</span>
        {jumlahHasil > 0 && (
          <span className="tabular ml-2 text-xs text-ink-muted">{jumlahHasil} OPD sudah mengerjakan</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={aktif}
        aria-label={`${label} dipakai`}
        disabled={terkunci}
        onClick={() => onUbah(!aktif)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${aktif ? "bg-primary" : "bg-line"}`}
      >
        <span
          aria-hidden
          className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-surface shadow-card transition-transform ${aktif ? "translate-x-5" : ""}`}
        />
      </button>
    </li>
  );
}

type AksiKartu = {
  sibuk: boolean;
  berdata: boolean;
  jumlahItem: number;
  jumlahHasil: Record<JenisQuiz, number>;
  onSaklar: (jenis: JenisQuiz, nilai: boolean) => void;
  onUbah: () => void;
  onItem: () => void;
  onAktifkan: () => void;
  onNonaktifkan: () => void;
  onArsipkan: () => void;
  onKeluarArsip: () => void;
  onHapus: () => void;
};

function KartuKegiatan({ k, ...aksi }: { k: Kegiatan } & AksiKartu) {
  const s = statusDari(k);
  const dikunci = s === "aktif";
  const tidakBisaHapus = dikunci || aksi.berdata;

  const petunjuk: string[] = [];
  if (dikunci) petunjuk.push("Nonaktifkan dulu untuk mengarsipkan atau menghapus.");
  else if (aksi.berdata) petunjuk.push("Sudah punya data, tidak bisa dihapus.");

  return (
    <section className="rounded-card border border-line bg-surface shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          <h2 className="font-semibold text-ink">{k.nama}</h2>
          <p className="text-sm text-ink-muted">
            {tanggal(k.tanggalMulai)} sampai {tanggal(k.tanggalSelesai)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${GAYA_STATUS[s]}`}>
          {LABEL_STATUS[s]}
        </span>
      </div>

      <ul className="divide-y divide-line">
        <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
          <span className="text-ink">Tenggat unggah dokumen</span>
          <span className="tabular flex items-center gap-1.5 text-ink-muted">
            <CalendarClock className="size-4" aria-hidden />
            {k.tenggat ? tanggal(k.tenggat) : "Belum diatur"}
          </span>
        </li>
        <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
          <span className="text-ink">Bobot nilai</span>
          <span className="tabular font-semibold text-ink">{k.bobot}%</span>
        </li>
        <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
          <span className="text-ink">Item dokumen</span>
          <button onClick={aksi.onItem} className={tombolSekunder}>
            <ListChecks className="size-4" aria-hidden />
            <span className="tabular">{aksi.jumlahItem} item</span>
            <span aria-hidden>·</span>
            Kelola
          </button>
        </li>
      </ul>

      <div className="space-y-3 border-t border-line px-4 py-3 sm:px-5">
        <div className="space-y-0.5">
          <h3 className="text-sm font-medium text-ink">Quiz yang dipakai</h3>
          {s === "arsip" && (
            <p className="text-xs text-ink-muted">Kegiatan diarsipkan, pengaturan quiz terkunci.</p>
          )}
        </div>
        <ul className="space-y-2.5">
          {JENIS_QUIZ.map((jenis) => (
            <SaklarQuiz
              key={jenis}
              label={LABEL_QUIZ[jenis]}
              aktif={quizAktif(k, jenis)}
              terkunci={s === "arsip" || aksi.sibuk}
              jumlahHasil={aksi.jumlahHasil[jenis]}
              onUbah={(nilai) => aksi.onSaklar(jenis, nilai)}
            />
          ))}
        </ul>
      </div>

      <div className="space-y-2 border-t border-line p-3 sm:px-5">
        {petunjuk.map((t) => (
          <p key={t} className="text-xs text-ink-muted">
            {t}
          </p>
        ))}
        <div className="flex flex-wrap justify-end gap-2">
          {s === "aktif" && (
            <button onClick={aksi.onNonaktifkan} disabled={aksi.sibuk} className={tombolSekunder}>
              <PowerOff className="size-4" aria-hidden />
              Nonaktifkan
            </button>
          )}
          {s === "nonaktif" && (
            <button onClick={aksi.onAktifkan} disabled={aksi.sibuk} className={tombolSekunder}>
              <Power className="size-4" aria-hidden />
              Jadikan aktif
            </button>
          )}
          {s === "arsip" && (
            <button onClick={aksi.onKeluarArsip} disabled={aksi.sibuk} className={tombolSekunder}>
              <ArchiveRestore className="size-4" aria-hidden />
              Keluarkan dari arsip
            </button>
          )}
          {s !== "arsip" && (
            <button onClick={aksi.onArsipkan} disabled={aksi.sibuk || dikunci} className={tombolSekunder}>
              <Archive className="size-4" aria-hidden />
              Arsipkan
            </button>
          )}
          <button onClick={aksi.onHapus} disabled={aksi.sibuk || tidakBisaHapus} className={tombolSekunder}>
            <Trash2 className="size-4" aria-hidden />
            Hapus
          </button>
          <button onClick={aksi.onUbah} disabled={aksi.sibuk} className={tombolSekunder}>
            <Pencil className="size-4" aria-hidden />
            Ubah
          </button>
        </div>
      </div>
    </section>
  );
}

interface Props {
  daftar: Kegiatan[];
  idBerdata: string[];
  hasilQuiz: Record<string, number>;
  isi: Record<string, Isi>;
  item: Record<string, ItemDokumen[]>;
  idItemBerdata: string[];
}

// Data berasal dari server (props); setelah aksi berhasil, halaman disegarkan lewat revalidatePath
export default function KegiatanClient({ daftar, idBerdata, hasilQuiz, isi, item, idItemBerdata }: Props) {
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [hapusId, setHapusId] = useState<string | null>(null);
  const [aktifId, setAktifId] = useState<string | null>(null);
  const [matikan, setMatikan] = useState<{ id: string; jenis: JenisQuiz } | null>(null);
  const [idItem, setIdItem] = useState<string | null>(null); // popup item dokumen: id kegiatan
  const [formItem, setFormItem] = useState<{ id: string | null } | null>(null);
  const [hapusItemId, setHapusItemId] = useState<string | null>(null);
  const [pesan, setPesan] = useState("");
  const [galatUmum, setGalatUmum] = useState("");
  const [sibuk, setSibuk] = useState(false);

  const berdata = new Set(idBerdata);
  const itemBerdata = new Set(idItemBerdata);
  const diedit = form?.id ? daftar.find((k) => k.id === form.id) : undefined;
  const dihapus = hapusId ? daftar.find((k) => k.id === hapusId) : undefined;
  const diaktifkan = aktifId ? daftar.find((k) => k.id === aktifId) : undefined;
  const aktifLain = diaktifkan ? daftar.find((x) => x.aktif && x.id !== diaktifkan.id) : undefined;
  const kegiatanMatikan = matikan ? daftar.find((k) => k.id === matikan.id) : undefined;
  const jumlahMatikan = matikan ? (hasilQuiz[`${matikan.id}:${matikan.jenis}`] ?? 0) : 0;
  const kegiatanItem = idItem ? daftar.find((k) => k.id === idItem) : undefined;
  const daftarItem = idItem ? (item[idItem] ?? []) : [];
  const itemDiedit = formItem?.id ? daftarItem.find((i) => i.id === formItem.id) : undefined;
  const itemDihapus = hapusItemId ? daftarItem.find((i) => i.id === hapusItemId) : undefined;
  const totalBobot = daftar.reduce((s, k) => s + k.bobot, 0);
  const berjalan = daftar.filter((k) => !k.arsip);
  const diarsipkan = daftar.filter((k) => k.arsip);

  // Menjalankan aksi server; mengembalikan pesan galat, atau null bila berhasil
  async function jalankan(aksi: () => Promise<Balasan>, sukses: string): Promise<string | null> {
    setSibuk(true);
    setGalatUmum("");
    const r = await aksi();
    setSibuk(false);
    if (!r.ok) return r.pesan;
    setPesan(sukses);
    return null;
  }

  // Untuk tombol tanpa dialog: galat tampil di atas daftar
  async function langsung(aksi: () => Promise<Balasan>, sukses: string) {
    const g = await jalankan(aksi, sukses);
    if (g) {
      setPesan("");
      setGalatUmum(g);
    }
  }

  function aksiUntuk(k: Kegiatan): AksiKartu {
    return {
      sibuk,
      berdata: berdata.has(k.id),
      jumlahItem: item[k.id]?.length ?? 0,
      jumlahHasil: {
        pretest: hasilQuiz[`${k.id}:pretest`] ?? 0,
        posttest: hasilQuiz[`${k.id}:posttest`] ?? 0,
      },
      onSaklar: (jenis, nilai) => ubahSaklar(k, jenis, nilai),
      onUbah: () => setForm({ id: k.id }),
      onItem: () => setIdItem(k.id),
      onAktifkan: () => setAktifId(k.id),
      onNonaktifkan: () => langsung(() => nonaktifkanKegiatan(k.id), `${k.nama} dinonaktifkan.`),
      onArsipkan: () => langsung(() => arsipkanKegiatan(k.id), `${k.nama} diarsipkan.`),
      onKeluarArsip: () => langsung(() => keluarkanDariArsip(k.id), `${k.nama} dikeluarkan dari arsip.`),
      onHapus: () => setHapusId(k.id),
    };
  }

  // Mematikan quiz yang sudah punya hasil perlu konfirmasi dulu
  function ubahSaklar(k: Kegiatan, jenis: JenisQuiz, nilai: boolean) {
    if (k.arsip) return;
    if (!nilai && (hasilQuiz[`${k.id}:${jenis}`] ?? 0) > 0) return setMatikan({ id: k.id, jenis });
    terapkanSaklar(k, jenis, nilai);
  }

  function terapkanSaklar(k: Kegiatan, jenis: JenisQuiz, nilai: boolean) {
    return langsung(
      () => ubahSaklarQuiz(k.id, jenis, nilai),
      `${LABEL_QUIZ[jenis]} ${nilai ? "diaktifkan" : "dimatikan"} di ${k.nama}.`,
    );
  }

  async function konfirmasiMatikan() {
    if (matikan && kegiatanMatikan && !kegiatanMatikan.arsip) {
      await terapkanSaklar(kegiatanMatikan, matikan.jenis, false);
    }
    setMatikan(null);
  }

  async function konfirmasiAktifkan(): Promise<string | null> {
    if (!diaktifkan) return null;
    const g = await jalankan(() => aktifkanKegiatan(diaktifkan.id), `${diaktifkan.nama} diaktifkan.`);
    if (!g) setAktifId(null);
    return g;
  }

  async function jalankanHapus(): Promise<string | null> {
    if (!dihapus) return null;
    const g = await jalankan(() => hapusKegiatan(dihapus.id), `${dihapus.nama} dihapus.`);
    if (!g) setHapusId(null);
    return g;
  }

  async function simpan(v: Isian): Promise<string | null> {
    const masuk = {
      nama: v.nama,
      tanggalMulai: v.mulai,
      tanggalSelesai: v.selesai,
      tenggat: v.tenggat,
      bobot: Number(v.bobot),
    };
    const g = diedit
      ? await jalankan(() => ubahKegiatan(diedit.id, masuk), `${v.nama} diperbarui.`)
      : await jalankan(() => tambahKegiatan(masuk), `${v.nama} ditambahkan.`);
    if (!g) setForm(null);
    return g;
  }

  async function simpanItem(nama: string): Promise<string | null> {
    if (!kegiatanItem) return null;
    const g = itemDiedit
      ? await jalankan(() => ubahItem(itemDiedit.id, nama), "Item diperbarui.")
      : await jalankan(() => tambahItem(kegiatanItem.id, nama), "Item ditambahkan.");
    if (!g) setFormItem(null);
    return g;
  }

  async function jalankanHapusItem(): Promise<string | null> {
    if (!itemDihapus) return null;
    const g = await jalankan(() => hapusItem(itemDihapus.id), `${itemDihapus.nama} dihapus.`);
    if (!g) setHapusItemId(null);
    return g;
  }

  const rincianHapus = dihapus ? isi[dihapus.id] : undefined;
  const teksHapus = dihapus
    ? `Hapus kegiatan ${dihapus.nama}?${
        rincianHapus && rincianHapus.item + rincianHapus.sesi + rincianHapus.soal > 0
          ? ` Ikut terhapus: ${rincianHapus.item} item dokumen, ${rincianHapus.sesi} sesi daftar hadir, ${rincianHapus.soal} soal quiz.`
          : ""
      } Tindakan ini tidak bisa dibatalkan.`
    : "";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-ink">Kegiatan dan tenggat</h1>
          <p className="tabular text-sm text-ink-muted">
            {daftar.length} kegiatan, {diarsipkan.length} diarsipkan
          </p>
        </div>
        {FITUR_TAMBAH_KEGIATAN && (
          <button onClick={() => setForm({ id: null })} className={tombolUtama}>
            <Plus className="size-4" aria-hidden />
            Tambah kegiatan
          </button>
        )}
      </header>

      <div className="space-y-1">
        <p role="status" className="min-h-5 text-sm text-ink-muted">
          {pesan}
        </p>
        <Galat pesan={galatUmum} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {berjalan.map((k) => (
          <KartuKegiatan key={k.id} k={k} {...aksiUntuk(k)} />
        ))}
      </div>

      {diarsipkan.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Diarsipkan</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {diarsipkan.map((k) => (
              <KartuKegiatan key={k.id} k={k} {...aksiUntuk(k)} />
            ))}
          </div>
        </div>
      )}

      <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <h2 className="font-semibold text-ink">Total bobot</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Bobot tiap kegiatan dipakai untuk menghitung nilai akhir OPD. Totalnya sebaiknya 100%.
        </p>
        <p className="tabular mt-3 text-2xl font-semibold text-ink">{totalBobot}%</p>
        {totalBobot !== 100 && (
          <p role="alert" className="mt-1 text-sm text-status-revisi-fg">
            Total bobot belum 100%. Periksa bobot tiap kegiatan.
          </p>
        )}
      </section>

      <Dialog buka={!!form} onTutup={() => setForm(null)} judul={diedit ? "Ubah kegiatan" : "Tambah kegiatan"}>
        <FormKegiatan
          awal={
            diedit
              ? {
                  nama: diedit.nama,
                  mulai: diedit.tanggalMulai,
                  selesai: diedit.tanggalSelesai,
                  tenggat: diedit.tenggat,
                  bobot: String(diedit.bobot),
                }
              : ISIAN_KOSONG
          }
          onSimpan={simpan}
          onBatal={() => setForm(null)}
        />
      </Dialog>

      <Dialog buka={!!diaktifkan} onTutup={() => setAktifId(null)} judul="Jadikan kegiatan aktif">
        {diaktifkan && (
          <KonfirmasiAktif
            teks={
              aktifLain
                ? `${aktifLain.nama} akan menjadi nonaktif, dan ${diaktifkan.nama} menjadi satu-satunya kegiatan yang dilihat OPD.`
                : `${diaktifkan.nama} akan menjadi kegiatan yang dilihat OPD.`
            }
            onYa={konfirmasiAktifkan}
            onBatal={() => setAktifId(null)}
          />
        )}
      </Dialog>

      <Dialog
        buka={!!matikan}
        onTutup={() => setMatikan(null)}
        judul={`Matikan ${matikan ? LABEL_QUIZ[matikan.jenis] : ""}`}
      >
        <p className="text-sm text-ink-muted">
          <span className="tabular font-medium text-ink">{jumlahMatikan} OPD</span> sudah mengerjakan{" "}
          {matikan ? LABEL_QUIZ[matikan.jenis] : ""} di{" "}
          <span className="font-medium text-ink">{kegiatanMatikan?.nama}</span>. Quiz akan disembunyikan dari OPD
          dan tidak dihitung dalam kelulusan maupun N-Gain. Soal dan hasil tidak dihapus, dan muncul lagi bila
          quiz diaktifkan kembali.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setMatikan(null)} disabled={sibuk} className={tombolSekunder}>
            Batal
          </button>
          <button onClick={konfirmasiMatikan} disabled={sibuk} className={tombolBahaya}>
            Matikan
          </button>
        </div>
      </Dialog>

      <Dialog buka={!!dihapus} onTutup={() => setHapusId(null)} judul="Hapus kegiatan">
        {dihapus && <KonfirmasiHapus teks={teksHapus} onYa={jalankanHapus} onBatal={() => setHapusId(null)} />}
      </Dialog>

      {/* Popup item dokumen satu kegiatan */}
      <Dialog
        buka={!!kegiatanItem}
        onTutup={() => setIdItem(null)}
        judul={`Item dokumen ${kegiatanItem?.nama ?? ""}`}
        lebar="w-[min(40rem,calc(100%-2rem))]"
      >
        {kegiatanItem && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="tabular text-sm text-ink-muted">{daftarItem.length} item</p>
              <button onClick={() => setFormItem({ id: null })} className={tombolUtama}>
                <Plus className="size-4" aria-hidden />
                Tambah item
              </button>
            </div>

            <div className="overflow-x-auto rounded-card border border-line">
              <table className="w-full min-w-120 text-left text-sm">
                <thead className="bg-surface-muted text-ink-muted">
                  <tr>
                    <th className="w-12 px-4 py-3 font-medium">No</th>
                    <th className="px-4 py-3 font-medium">Nama item</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {daftarItem.map((i, no) => {
                    const terpakai = itemBerdata.has(i.id);
                    return (
                      <tr key={i.id}>
                        <td className="tabular px-4 py-3 text-ink-muted">{no + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-ink">{i.nama}</p>
                          {terpakai && (
                            <p className="text-xs text-ink-muted">
                              Sudah ada dokumen disetujui, tidak bisa dihapus.
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setFormItem({ id: i.id })} className={tombolSekunder}>
                              <Pencil className="size-4" aria-hidden />
                              Ubah
                            </button>
                            <button
                              onClick={() => setHapusItemId(i.id)}
                              disabled={terpakai}
                              aria-label={`Hapus item ${i.nama}`}
                              className={`${tombolSekunder} text-status-revisi-fg`}
                            >
                              <Trash2 className="size-4" aria-hidden />
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {daftarItem.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-ink-muted">
                        Belum ada item dokumen.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIdItem(null)} className={tombolSekunder}>
                Tutup
              </button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog
        buka={!!formItem}
        onTutup={() => setFormItem(null)}
        judul={itemDiedit ? "Ubah item dokumen" : "Tambah item dokumen"}
      >
        <FormItem awal={itemDiedit?.nama ?? ""} onSimpan={simpanItem} onBatal={() => setFormItem(null)} />
      </Dialog>

      <Dialog buka={!!itemDihapus} onTutup={() => setHapusItemId(null)} judul="Hapus item dokumen">
        {itemDihapus && (
          <KonfirmasiHapus
            teks={`Hapus item ${itemDihapus.nama}? Baris dokumen item ini di semua pegawai ikut terhapus. Tindakan ini tidak bisa dibatalkan.`}
            onYa={jalankanHapusItem}
            onBatal={() => setHapusItemId(null)}
          />
        )}
      </Dialog>
    </div>
  );
}