"use client";

import { useEffect, useId, useState, type ChangeEvent, type DragEvent } from "react";
import { CalendarClock, ExternalLink, FileText, FileUp, Trash2, Upload, X } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Galat } from "@/components/ui/Galat";
import { KonfirmasiHapus } from "@/components/ui/KonfirmasiHapus";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { bukaDiTabBaru } from "@/lib/buka-tautan";
import {
  BUCKET_DOKUMEN,
  MAKS_MB,
  MIME_EKSTENSI,
  buatPathDokumen,
  cekBerkas,
  ekstensiDari,
} from "@/lib/dokumen-berkas";
import { buatKlienBrowser } from "@/lib/supabase/client";
import { STATUS_LABEL, type Dokumen, type ItemDokumen, type Kegiatan, type Opd } from "@/lib/types";
import { buatLinkDokumen, catatUnggahan, hapusDokumen } from "./actions";

type Props = {
  opd: Opd;
  kegiatan: Kegiatan;
  item: ItemDokumen[];
  dokumen: Dokumen[];
};

const tombolKecil =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function tanggal(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// diunggahPada berisi tanggal dan jam (timestamp dari database)
function waktu(iso: string) {
  if (iso.length === 10) return tanggal(iso);
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  });
}

function ukuran(byte: number) {
  return byte < 1024 * 1024
    ? `${Math.max(1, Math.round(byte / 1024))} KB`
    : `${(byte / 1024 / 1024).toFixed(1)} MB`;
}

type PilihanDokumen = { dok: Dokumen; nama: string };

// Dipisah agar isian kembali kosong setiap popup dibuka
function FormUnggah({
  pilihan,
  onBatal,
  onKirim,
}: {
  pilihan: PilihanDokumen[];
  onBatal: () => void;
  onKirim: (dokId: string, file: File) => Promise<string | null>;
}) {
  const idSelect = useId();
  const idFile = useId();
  const [dokId, setDokId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [galat, setGalat] = useState("");
  const [seret, setSeret] = useState(false);
  const [proses, setProses] = useState(false);

  const terpilih = pilihan.find((p) => p.dok.id === dokId);

  function terimaFile(daftarFile: FileList | null | undefined) {
    if (!daftarFile || daftarFile.length === 0) return;
    if (daftarFile.length > 1) {
      setGalat("Hanya satu file untuk setiap dokumen.");
      return;
    }
    const f = daftarFile[0];
    const pesan = cekBerkas(f.name, f.size);
    if (pesan) {
      setGalat(pesan);
      return;
    }
    setGalat("");
    setFile(f);
  }

  function saatPilih(e: ChangeEvent<HTMLInputElement>) {
    terimaFile(e.target.files);
    e.target.value = "";
  }

  function saatLepas(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setSeret(false);
    terimaFile(e.dataTransfer.files);
  }

  async function kirim() {
    if (!dokId) return setGalat("Pilih dokumen yang akan diunggah.");
    if (!file) return setGalat("Pilih atau seret file terlebih dahulu.");
    setGalat("");
    setProses(true);
    const g = await onKirim(dokId, file);
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={idSelect} className="text-sm font-medium text-ink">
          Dokumen
        </label>
        <select
          id={idSelect}
          value={dokId}
          disabled={proses}
          onChange={(e) => {
            setDokId(e.target.value);
            setGalat("");
          }}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <option value="">Pilih dokumen…</option>
          {pilihan.map(({ dok, nama }) => (
            <option key={dok.id} value={dok.id}>
              {nama} ({STATUS_LABEL[dok.status]})
            </option>
          ))}
        </select>
        {terpilih?.dok.namaFile && (
          <p className="text-xs text-ink-muted">
            File sebelumnya ({terpilih.dok.namaFile}) akan diganti.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium text-ink">File</span>
        {file ? (
          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-muted p-3">
            <FileText className="size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{file.name}</p>
              <p className="tabular text-xs text-ink-muted">{ukuran(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={proses}
              aria-label="Hapus file yang dipilih"
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <label
            htmlFor={idFile}
            onDragOver={(e) => {
              e.preventDefault();
              setSeret(true);
            }}
            onDragLeave={() => setSeret(false)}
            onDrop={saatLepas}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary ${
              seret
                ? "border-primary bg-primary-soft"
                : "border-line bg-surface-muted hover:border-primary"
            }`}
          >
            <FileUp className="size-6 text-primary" aria-hidden />
            <span className="text-sm text-ink">
              Seret file ke sini atau{" "}
              <span className="font-medium text-primary underline">pilih file</span>
            </span>
            <span className="text-xs text-ink-muted">
              PDF, JPG, atau PNG, maksimal {MAKS_MB} MB
            </span>
            <input
              id={idFile}
              type="file"
              className="sr-only"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={saatPilih}
            />
          </label>
        )}
      </div>

      <Galat pesan={galat} />

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onBatal}
          disabled={proses}
          className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={kirim}
          disabled={proses}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {proses ? "Mengunggah..." : "Unggah"}
        </button>
      </div>
    </div>
  );
}

// Data berasal dari server (props); setelah aksi berhasil, halaman disegarkan lewat revalidatePath
export default function DaftarDokumenClient({ opd, kegiatan, item, dokumen }: Props) {
  const [dialogBuka, setDialogBuka] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [galatBuka, setGalatBuka] = useState("");
  const [hapus, setHapus] = useState<{ dok: Dokumen; nama: string } | null>(null);
  const [hariIni, setHariIni] = useState<string | null>(null);

  // tanggal dihitung di browser agar tidak terkunci saat build
   // tanggal dihitung di browser agar tidak terkunci saat build
  useEffect(() => {
    const awal = setTimeout(
      () => setHariIni(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" })),
      0,
    );
    return () => clearTimeout(awal);
  }, []);

  const lewat = hariIni !== null && hariIni > kegiatan.tenggat;

  const baris = item
    .map((i) => ({ item: i, dok: dokumen.find((d) => d.itemId === i.id) }))
    .filter((b): b is { item: ItemDokumen; dok: Dokumen } => !!b.dok);

  const total = baris.length;
  const ok = baris.filter((b) => b.dok.status === "disetujui").length;
  const persen = total ? Math.round((ok / total) * 100) : 0;

  // semua dokumen bisa diunggah ulang, file lama diganti
  const pilihan: PilihanDokumen[] = baris.map((b) => ({ dok: b.dok, nama: b.item.nama }));

  // Urutan: unggah ke Storage, lalu catat ke baris dokumen (server membersihkan bila gagal)
  async function kirim(dokId: string, file: File): Promise<string | null> {
    const dok = dokumen.find((d) => d.id === dokId);
    const ext = ekstensiDari(file.name);
    if (!dok || !dok.penggunaId || !ext) return "Dokumen tidak ditemukan.";
    const pesan = cekBerkas(file.name, file.size);
    if (pesan) return pesan;

    const path = buatPathDokumen(dok.penggunaId, dok.itemId, ext);
    const { error } = await buatKlienBrowser()
      .storage.from(BUCKET_DOKUMEN)
      .upload(path, file, { contentType: MIME_EKSTENSI[ext], upsert: false });
    if (error) return "Gagal mengunggah file. Coba lagi.";

    let r: Awaited<ReturnType<typeof catatUnggahan>>;
    try {
      r = await catatUnggahan(dok.itemId, path, file.name);
    } catch {
      // Hasil di server tidak diketahui: file jangan dihapus dari sini
      return "Koneksi terputus. Muat ulang halaman untuk memeriksa hasilnya.";
    }
    if (!r.ok) return r.pesan;

    const nama = item.find((i) => i.id === dok.itemId)?.nama;
    setInfo(`${nama ?? "Dokumen"} berhasil diunggah.`);
    setDialogBuka(false);
    return null;
  }

  async function buka(dok: Dokumen) {
    setGalatBuka("");
    const g = await bukaDiTabBaru(() => buatLinkDokumen(dok.itemId));
    if (g) setGalatBuka(g);
  }

  async function jalankanHapus(): Promise<string | null> {
    if (!hapus) return null;
    const r = await hapusDokumen(hapus.dok.itemId);
    if (!r.ok) return r.pesan;
    setInfo(`${hapus.nama} dihapus.`);
    setHapus(null);
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-ink">Daftar dokumen</h1>
          <p className="text-sm text-ink-muted">{opd.nama}</p>
        </div>
        <button
          type="button"
          disabled={pilihan.length === 0}
          onClick={() => {
            setInfo(null);
            setDialogBuka(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="size-4" aria-hidden />
          Unggah dokumen
        </button>
      </header>

      {info && (
        <p
          role="status"
          className="rounded-lg bg-status-disetujui-bg p-3 text-sm text-status-disetujui-fg"
        >
          {info}
        </p>
      )}
      <Galat pesan={galatBuka} />

      <section className="rounded-card border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-ink">{kegiatan.nama}</h2>
              <span className="tabular rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                Bobot {kegiatan.bobot}%
              </span>
            </div>
            <p
              className={`mt-1 flex items-center gap-1.5 text-sm ${
                lewat ? "text-status-revisi-fg" : "text-ink-muted"
              }`}
            >
              <CalendarClock className="size-4" aria-hidden />
              Tenggat {tanggal(kegiatan.tenggat)}
              {lewat && " (sudah lewat)"}
            </p>
          </div>
          <div className="w-full sm:w-64">
            <div className="tabular mb-1 flex justify-between text-sm text-ink">
              <span className="font-medium">
                {ok} dari {total} dokumen disetujui
              </span>
              <span className="text-ink-muted">{persen}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={persen}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Dokumen disetujui ${kegiatan.nama}`}
            >
              <div className="h-full bg-primary" style={{ width: `${persen}%` }} />
            </div>
          </div>
        </div>

        <ul className="divide-y divide-line">
          {baris.map(({ item: i, dok }) => (
            <li key={dok.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-ink">{i.nama}</p>
                  {dok.namaFile && dok.diunggahPada ? (
                    <p className="truncate text-sm text-ink-muted">
                      {dok.namaFile} · {waktu(dok.diunggahPada)}
                    </p>
                  ) : (
                    <p className="text-sm text-ink-muted">Belum ada file</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {dok.namaFile && (
                    <>
                      <button type="button" onClick={() => buka(dok)} className={tombolKecil}>
                        <ExternalLink className="size-4" aria-hidden />
                        Buka
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInfo(null);
                          setHapus({ dok, nama: i.nama });
                        }}
                        aria-label={`Hapus file ${i.nama}`}
                        className={`${tombolKecil} text-status-revisi-fg`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                        Hapus
                      </button>
                    </>
                  )}
                  <StatusBadge status={dok.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Dialog buka={dialogBuka} onTutup={() => setDialogBuka(false)} judul="Unggah dokumen">
        <FormUnggah
          pilihan={pilihan}
          onBatal={() => setDialogBuka(false)}
          onKirim={kirim}
        />
      </Dialog>

      <Dialog buka={!!hapus} onTutup={() => setHapus(null)} judul="Hapus file dokumen">
        {hapus && (
          <KonfirmasiHapus
            teks={`Hapus file ${hapus.dok.namaFile ?? ""} untuk "${hapus.nama}"? Status kembali ke Belum dan file dihapus permanen.`}
            onYa={jalankanHapus}
            onBatal={() => setHapus(null)}
          />
        )}
      </Dialog>
    </div>
  );
}