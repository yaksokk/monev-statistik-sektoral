"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  PESAN_USERNAME,
  bersihkanUsername,
  emailKeUsername,
  usernameKeEmail,
  usernameValid,
} from "@/lib/username";
import { Dialog } from "@/components/ui/Dialog";
import { Galat } from "@/components/ui/Galat";
import { KonfirmasiHapus } from "@/components/ui/KonfirmasiHapus";
import { linkHttps } from "@/lib/dashboard";
import { hapusOpd, simpanLinkSertifikat, tambahOpd, ubahOpd } from "./actions";
import { bukaDiTabBaru } from "@/lib/buka-tautan";
import type { Dokumen, ItemDokumen, Kegiatan, Opd, Pengguna } from "@/lib/types";
import { buatLinkDokumenAdmin } from "./actions-dokumen";

const tombolUtama =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const tombolSekunder =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const kolomInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary";
const nonaktif = "disabled:cursor-not-allowed disabled:opacity-50";

const SANDI_MIN = 8;

function buatSandi() {
  const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const acak = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(acak, (n) => huruf[n % huruf.length]).join("");
}

type Balasan = { ok: true } | { ok: false; pesan: string };

// Panggilan ke route handler /api/admin/... (akun pegawai)
async function panggil(
  url: string,
  metode: "POST" | "PATCH" | "DELETE",
  badan?: unknown,
): Promise<Balasan> {
  try {
    const res = await fetch(url, {
      method: metode,
      headers: badan === undefined ? undefined : { "Content-Type": "application/json" },
      body: badan === undefined ? undefined : JSON.stringify(badan),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => null)) as { pesan?: string } | null;
    return { ok: false, pesan: data?.pesan ?? "Terjadi kesalahan. Coba lagi." };
  } catch {
    return { ok: false, pesan: "Tidak bisa terhubung ke server." };
  }
}

function Isian({
  id,
  label,
  tipe = "text",
  nilai,
  onUbah,
  petunjuk,
}: {
  id: string;
  label: string;
  tipe?: string;
  nilai: string;
  onUbah: (v: string) => void;
  petunjuk?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={tipe}
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        className={kolomInput}
      />
      {petunjuk && <p className="text-sm text-ink-muted">{petunjuk}</p>}
    </div>
  );
}

// Sandi diketik admin; tombol "Buat kata sandi" hanya mengisikan saran acak ke kolom
function IsianSandi({
  id,
  label,
  nilai,
  onUbah,
}: {
  id: string;
  label: string;
  nilai: string;
  onUbah: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={nilai}
          onChange={(e) => onUbah(e.target.value)}
          className={kolomInput}
        />
        <button type="button" onClick={() => onUbah(buatSandi())} className={`${tombolSekunder} shrink-0`}>
          <KeyRound className="size-4" aria-hidden />
          Buat kata sandi
        </button>
      </div>
      <p className="text-sm text-ink-muted">Minimal {SANDI_MIN} karakter.</p>
    </div>
  );
}

type IsianOpd = { nama: string; singkatan: string };

// onSimpan mengembalikan pesan galat dari server, atau null bila berhasil
function FormOpd({
  awal,
  jumlahPegawai,
  onSimpan,
  onHapus,
  onBatal,
}: {
  awal: IsianOpd;
  jumlahPegawai?: number; // hanya saat ubah OPD
  onSimpan: (v: IsianOpd) => Promise<string | null>;
  onHapus?: () => void; // hanya saat ubah OPD
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function kirim() {
    if (!v.nama.trim() || !v.singkatan.trim()) return setGalat("Semua kolom wajib diisi.");
    setGalat("");
    setProses(true);
    const g = await onSimpan({ nama: v.nama.trim(), singkatan: v.singkatan.trim() });
    setProses(false);
    if (g) setGalat(g);
  }

  const punyaPegawai = (jumlahPegawai ?? 0) > 0;

  return (
    <div className="space-y-4">
      <Isian id="f-nama" label="Nama OPD" nilai={v.nama} onUbah={(x) => setV({ ...v, nama: x })} />
      <Isian
        id="f-singkatan"
        label="Singkatan"
        nilai={v.singkatan}
        onUbah={(x) => setV({ ...v, singkatan: x })}
      />
      {onHapus && punyaPegawai && (
        <p className="text-sm text-ink-muted">
          OPD ini masih punya {jumlahPegawai} pegawai. Hapus dulu semua pegawainya sebelum menghapus OPD.
        </p>
      )}
      <Galat pesan={galat} />
      <div className={`flex flex-wrap items-center gap-2 pt-2 ${onHapus ? "justify-between" : "justify-end"}`}>
        {onHapus && (
          <button
            type="button"
            onClick={onHapus}
            disabled={punyaPegawai || proses}
            className={`${tombolSekunder} text-status-revisi-fg ${nonaktif}`}
          >
            <Trash2 className="size-4" aria-hidden />
            Hapus OPD
          </button>
        )}
        <div className="flex gap-2">
          <button onClick={onBatal} disabled={proses} className={`${tombolSekunder} ${nonaktif}`}>
            Batal
          </button>
          <button onClick={kirim} disabled={proses} className={`${tombolUtama} ${nonaktif}`}>
            {proses ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

type IsianPegawai = { nama: string; username: string; sandi: string };

function FormPegawai({
  tambah,
  awal,
  opdList,
  opdId,
  onPilihOpd,
  onOpdBaru,
  usernameDipakai,
  onSimpan,
  onBatal,
}: {
  tambah: boolean; // false = ubah pegawai (OPD dan sandi tidak diubah di sini)
  awal: IsianPegawai;
  opdList: Opd[];
  opdId: string;
  onPilihOpd: (id: string) => void;
  onOpdBaru: () => void;
  usernameDipakai: (username: string) => boolean;
  onSimpan: (v: IsianPegawai) => Promise<string | null>;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function kirim() {
    const nama = v.nama.trim();
    const username = bersihkanUsername(v.username);
    if (tambah && !opdId) return setGalat("Pilih OPD dulu.");
    if (!nama || !username || (tambah && !v.sandi)) return setGalat("Semua kolom wajib diisi.");
    if (!usernameValid(username)) return setGalat(PESAN_USERNAME);
    if (usernameDipakai(username)) return setGalat("Username ini sudah dipakai pegawai lain.");
    if (tambah && v.sandi.length < SANDI_MIN) return setGalat(`Kata sandi minimal ${SANDI_MIN} karakter.`);
    setGalat("");
    setProses(true);
    const g = await onSimpan({ nama, username, sandi: v.sandi });
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <div className="space-y-4">
      {tambah && (
        <div className="space-y-1.5">
          <label htmlFor="p-opd" className="text-sm font-medium">
            OPD
          </label>
          <div className="flex gap-2">
            <select
              id="p-opd"
              value={opdId}
              onChange={(e) => onPilihOpd(e.target.value)}
              className={kolomInput}
            >
              <option value="">Pilih OPD</option>
              {opdList.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nama} ({o.singkatan})
                </option>
              ))}
            </select>
            <button type="button" onClick={onOpdBaru} className={`${tombolSekunder} shrink-0`}>
              <Plus className="size-4" aria-hidden />
              OPD baru
            </button>
          </div>
        </div>
      )}
      <Isian id="p-nama" label="Nama pegawai" nilai={v.nama} onUbah={(x) => setV({ ...v, nama: x })} />
      <Isian
        id="p-username"
        label="Username pegawai"
        nilai={v.username}
        onUbah={(x) => setV({ ...v, username: x })}
        petunjuk="3-30 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung. Contoh: dina.diskominfo"
      />
      {tambah && (
        <IsianSandi
          id="p-sandi"
          label="Kata sandi awal"
          nilai={v.sandi}
          onUbah={(x) => setV({ ...v, sandi: x })}
        />
      )}
      <Galat pesan={galat} />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBatal} disabled={proses} className={`${tombolSekunder} ${nonaktif}`}>
          Batal
        </button>
        <button onClick={kirim} disabled={proses} className={`${tombolUtama} ${nonaktif}`}>
          {proses ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </div>
  );
}

function KolomSertifikat({ pegawai }: { pegawai: Pengguna }) {
  if (!linkHttps(pegawai.linkSertifikat)) return <span className="text-ink-muted">Belum diisi</span>;
  return (
    <span className="rounded-full bg-status-disetujui-bg px-2 py-0.5 text-xs font-medium text-status-disetujui-fg">
      Terisi
    </span>
  );
}

function FormLink({
  awal,
  onSimpan,
  onBatal,
}: {
  awal: string;
  onSimpan: (link: string) => Promise<string | null>;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);
  const aman = linkHttps(v.trim());

  async function kirim() {
    const teks = v.trim();
    if (teks && !linkHttps(teks)) return setGalat("Link harus diawali https://");
    setGalat("");
    setProses(true);
    const g = await onSimpan(teks);
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="f-link" className="text-sm font-medium">
          Link sertifikat (Google Drive)
        </label>
        <input
          id="f-link"
          type="url"
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            setGalat("");
          }}
          placeholder="https://drive.google.com/..."
          className={kolomInput}
        />
        <p className="text-sm text-ink-muted">Kosongkan kolom lalu simpan untuk menghapus link.</p>
      </div>
      <Galat pesan={galat} />
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        {aman ? (
          <a href={aman} target="_blank" rel="noopener noreferrer" className={tombolSekunder}>
            <ExternalLink className="size-4" aria-hidden />
            Buka link
          </a>
        ) : (
          <button disabled className={`${tombolSekunder} ${nonaktif}`}>
            <ExternalLink className="size-4" aria-hidden />
            Buka link
          </button>
        )}
        <div className="flex gap-2">
          <button onClick={onBatal} disabled={proses} className={`${tombolSekunder} ${nonaktif}`}>
            Batal
          </button>
          <button onClick={kirim} disabled={proses} className={`${tombolUtama} ${nonaktif}`}>
            {proses ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormReset({
  teksTujuan,
  onSimpan,
  onBatal,
}: {
  teksTujuan: string;
  onSimpan: (sandi: string) => Promise<string | null>;
  onBatal: () => void;
}) {
  const [sandi, setSandi] = useState("");
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function kirim() {
    if (sandi.length < SANDI_MIN) return setGalat(`Kata sandi minimal ${SANDI_MIN} karakter.`);
    setGalat("");
    setProses(true);
    const g = await onSimpan(sandi);
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <>
      <p className="text-sm text-ink-muted">
        Ketik kata sandi sementara untuk {teksTujuan}. Kata sandi lama tidak berlaku lagi dan pegawai wajib
        menggantinya saat masuk.
      </p>
      <IsianSandi id="r-sandi" label="Kata sandi sementara" nilai={sandi} onUbah={setSandi} />
      <Galat pesan={galat} />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBatal} disabled={proses} className={`${tombolSekunder} ${nonaktif}`}>
          Batal
        </button>
        <button onClick={kirim} disabled={proses} className={`${tombolUtama} ${nonaktif}`}>
          {proses ? "Menyimpan..." : "Simpan kata sandi"}
        </button>
      </div>
    </>
  );
}

interface Props {
  opdAwal: Opd[];
  pegawaiAwal: Pengguna[];
  kegiatanAktif: Kegiatan | null;
  itemAwal: ItemDokumen[];
  dokumenAwal: Dokumen[];
}

// Data berasal dari server (props); setelah aksi berhasil, halaman disegarkan
export default function OpdClient({
  opdAwal: opdList,
  pegawaiAwal: pegawai,
  kegiatanAktif,
  itemAwal: itemList,
  dokumenAwal: dokumenList,
}: Props) {
  const router = useRouter();
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState("");

  const [idOpd, setIdOpd] = useState<string | null>(null); // popup daftar pegawai
  const [formOpd, setFormOpd] = useState<{ id: string | null; dariPegawai?: boolean } | null>(null);
  const [formPegawai, setFormPegawai] = useState<{ id: string | null; opdId: string } | null>(null);
  const [idLink, setIdLink] = useState<string | null>(null); // id pegawai
  const [reset, setReset] = useState<{ p: Pengguna; hasil: string | null } | null>(null);
  const [hapusP, setHapusP] = useState<Pengguna | null>(null);
  const [hapusO, setHapusO] = useState<Opd | null>(null);
  const [idDokumen, setIdDokumen] = useState<string | null>(null); // id pegawai
  const [galatBuka, setGalatBuka] = useState("");

  const pegawaiOpd = (opdId: string) => pegawai.filter((p) => p.opdId === opdId);

  // Semua OPD ditampilkan, termasuk yang belum punya pegawai
  const tampil = opdList.filter((opd) => {
    const q = cari.trim().toLowerCase();
    if (!q) return true;
    const milik = pegawaiOpd(opd.id);
    const teks = `${opd.nama} ${opd.singkatan} ${milik
      .map((p) => `${p.nama} ${emailKeUsername(p.email)}`)
      .join(" ")}`;
    return teks.toLowerCase().includes(q);
  });

  const opdPopup = idOpd ? opdList.find((o) => o.id === idOpd) : undefined;
  const pegawaiPopup = opdPopup ? pegawaiOpd(opdPopup.id) : [];
  const opdDiedit = formOpd?.id ? opdList.find((o) => o.id === formOpd.id) : undefined;
  const pegawaiDiedit = formPegawai?.id ? pegawai.find((p) => p.id === formPegawai.id) : undefined;
  const opdFormPegawai = formPegawai ? opdList.find((o) => o.id === formPegawai.opdId) : undefined;
  const pegawaiLink = idLink ? pegawai.find((p) => p.id === idLink) : undefined;
  const pegawaiDokumen = idDokumen ? pegawai.find((p) => p.id === idDokumen) : undefined;

  function waktuUnggah(iso: string) {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar",
    });
  }

  async function bukaDokumen(dokumenId: string) {
    setGalatBuka("");
    const g = await bukaDiTabBaru(() => buatLinkDokumenAdmin(dokumenId));
    if (g) setGalatBuka(g);
  }

  const usernameDipakai = (username: string, kecuali?: string) => {
    const email = usernameKeEmail(username);
    return pegawai.some((p) => p.email.toLowerCase() === email && p.id !== kecuali);
  };

  async function simpanOpd(v: IsianOpd): Promise<string | null> {
    if (opdDiedit) {
      const r = await ubahOpd(opdDiedit.id, v);
      if (!r.ok) return r.pesan;
      setPesan(`Data ${v.singkatan} diperbarui.`);
    } else {
      const r = await tambahOpd(v);
      if (!r.ok) return r.pesan;
      setPesan(`${v.singkatan} ditambahkan.`);
      // Dibuka dari form pegawai: OPD baru langsung terpilih di dropdown
      if (formOpd?.dariPegawai) {
        const idBaru = r.opd.id;
        setFormPegawai((f) => (f ? { ...f, opdId: idBaru } : f));
      }
    }
    setFormOpd(null);
    return null;
  }

  async function simpanPegawai(v: IsianPegawai): Promise<string | null> {
    if (!formPegawai) return null;
    if (pegawaiDiedit) {
      const r = await panggil(`/api/admin/pegawai/${pegawaiDiedit.id}`, "PATCH", {
        nama: v.nama,
        username: v.username,
      });
      if (!r.ok) return r.pesan;
      setPesan(`Data ${v.nama} diperbarui.`);
    } else {
      const r = await panggil("/api/admin/pegawai", "POST", {
        nama: v.nama,
        username: v.username,
        sandi: v.sandi,
        opdId: formPegawai.opdId,
      });
      if (!r.ok) return r.pesan;
      setPesan(`${v.nama} ditambahkan. Sampaikan username dan kata sandi awalnya ke pegawai.`);
    }
    router.refresh();
    setFormPegawai(null);
    return null;
  }

  async function simpanLink(link: string): Promise<string | null> {
    if (!pegawaiLink) return null;
    const { id, nama } = pegawaiLink;
    const r = await simpanLinkSertifikat(id, link);
    if (!r.ok) return r.pesan;
    setPesan(link ? `Link sertifikat ${nama} disimpan.` : `Link sertifikat ${nama} dihapus.`);
    setIdLink(null);
    return null;
  }

  async function simpanReset(sandi: string): Promise<string | null> {
    if (!reset) return null;
    const r = await panggil(`/api/admin/pegawai/${reset.p.id}/reset-sandi`, "POST", { sandi });
    if (!r.ok) return r.pesan;
    setReset({ p: reset.p, hasil: sandi });
    return null;
  }

  async function jalankanHapusPegawai(): Promise<string | null> {
    if (!hapusP) return null;
    const r = await panggil(`/api/admin/pegawai/${hapusP.id}`, "DELETE");
    if (!r.ok) return r.pesan;
    setPesan(`Akun ${hapusP.nama} dihapus.`);
    setHapusP(null);
    router.refresh();
    return null;
  }

  async function jalankanHapusOpd(): Promise<string | null> {
    if (!hapusO) return null;
    const r = await hapusOpd(hapusO.id);
    if (!r.ok) return r.pesan;
    setPesan(`${hapusO.singkatan} dihapus.`);
    setHapusO(null);
    setFormOpd(null);
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-ink">OPD dan akun</h1>
          <p className="tabular text-sm text-ink-muted">
            {opdList.length} OPD · {pegawai.length} pegawai terdaftar · klik baris OPD untuk melihat pegawai
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled className={`${tombolSekunder} ${nonaktif}`}>
            <FileSpreadsheet className="size-4" aria-hidden />
            Impor dari Excel
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
              Segera hadir
            </span>
          </button>
          <button onClick={() => setFormPegawai({ id: null, opdId: "" })} className={tombolSekunder}>
            <UserPlus className="size-4" aria-hidden />
            Tambah pegawai
          </button>
          <button onClick={() => setFormOpd({ id: null })} className={tombolUtama}>
            <Plus className="size-4" aria-hidden />
            Tambah OPD
          </button>
        </div>
      </header>

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
        <input
          type="search"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari OPD atau pegawai"
          aria-label="Cari OPD atau pegawai"
          className={`${kolomInput} pl-9`}
        />
      </div>

      <p role="status" className="min-h-5 text-sm text-ink-muted">
        {pesan}
      </p>

      <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="bg-surface-muted text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">OPD</th>
              <th className="px-4 py-3 font-medium">Pegawai</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tampil.map((opd) => (
              <tr
                key={opd.id}
                onClick={() => setIdOpd(opd.id)}
                className="cursor-pointer hover:bg-surface-muted"
              >
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIdOpd(opd.id);
                    }}
                    aria-haspopup="dialog"
                    className="text-left focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span className="block font-medium text-ink">{opd.nama}</span>
                    <span className="block text-ink-muted">{opd.singkatan}</span>
                  </button>
                </td>
                <td className="tabular px-4 py-3 text-ink">{pegawaiOpd(opd.id).length} pegawai</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormOpd({ id: opd.id });
                      }}
                      className={tombolSekunder}
                    >
                      <Pencil className="size-4" aria-hidden />
                      Ubah OPD
                    </button>
                    <ChevronRight className="size-4 text-ink-muted" aria-hidden />
                  </div>
                </td>
              </tr>
            ))}
            {tampil.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-ink-muted">
                  {cari.trim() ? "Tidak ada OPD yang cocok dengan pencarian." : "Belum ada OPD."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Popup daftar pegawai satu OPD */}
      <Dialog
        buka={!!opdPopup}
        onTutup={() => setIdOpd(null)}
        judul={`Pegawai ${opdPopup?.nama ?? ""}`}
        lebar="w-[min(52rem,calc(100%-2rem))]"
      >
        {opdPopup && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="tabular text-sm text-ink-muted">{pegawaiPopup.length} pegawai</p>
              <button onClick={() => setFormPegawai({ id: null, opdId: opdPopup.id })} className={tombolUtama}>
                <Plus className="size-4" aria-hidden />
                Tambah pegawai
              </button>
            </div>

            <div className="overflow-x-auto rounded-card border border-line">
              <table className="w-full min-w-170 text-left text-sm">
                <thead className="bg-surface-muted text-ink-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Pegawai</th>
                    <th className="px-4 py-3 font-medium">Sertifikat</th>
                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pegawaiPopup.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{p.nama}</p>
                        <p className="text-ink-muted">{emailKeUsername(p.email)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <KolomSertifikat pegawai={p} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setIdDokumen(p.id)} className={tombolSekunder}>
                            <FileText className="size-4" aria-hidden />
                            Dokumen
                          </button>
                          <button onClick={() => setIdLink(p.id)} className={tombolSekunder}>
                            <Link2 className="size-4" aria-hidden />
                            Link sertifikat
                          </button>
                          <button
                            onClick={() => setFormPegawai({ id: p.id, opdId: opdPopup.id })}
                            className={tombolSekunder}
                          >
                            <Pencil className="size-4" aria-hidden />
                            Ubah
                          </button>
                          <button onClick={() => setReset({ p, hasil: null })} className={tombolSekunder}>
                            <KeyRound className="size-4" aria-hidden />
                            Reset sandi
                          </button>
                          <button
                            onClick={() => setHapusP(p)}
                            aria-label={`Hapus akun ${p.nama}`}
                            className={`${tombolSekunder} text-status-revisi-fg`}
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pegawaiPopup.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-ink-muted">
                        Belum ada pegawai di OPD ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIdOpd(null)} className={tombolSekunder}>
                Tutup
              </button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog buka={!!formOpd} onTutup={() => setFormOpd(null)} judul={opdDiedit ? "Ubah OPD" : "Tambah OPD"}>
        <FormOpd
          awal={
            opdDiedit
              ? { nama: opdDiedit.nama, singkatan: opdDiedit.singkatan }
              : { nama: "", singkatan: "" }
          }
          jumlahPegawai={opdDiedit ? pegawaiOpd(opdDiedit.id).length : undefined}
          onSimpan={simpanOpd}
          onHapus={opdDiedit ? () => setHapusO(opdDiedit) : undefined}
          onBatal={() => setFormOpd(null)}
        />
      </Dialog>

      <Dialog
        buka={!!formPegawai}
        onTutup={() => setFormPegawai(null)}
        judul={pegawaiDiedit ? `Ubah pegawai ${opdFormPegawai?.singkatan ?? ""}` : "Tambah pegawai"}
      >
        {formPegawai && (
          <FormPegawai
            tambah={!pegawaiDiedit}
            awal={
              pegawaiDiedit
                ? {
                    nama: pegawaiDiedit.nama,
                    username: emailKeUsername(pegawaiDiedit.email),
                    sandi: "",
                  }
                : { nama: "", username: "", sandi: "" }
            }
            opdList={opdList}
            opdId={formPegawai.opdId}
            onPilihOpd={(id) => setFormPegawai((f) => (f ? { ...f, opdId: id } : f))}
            onOpdBaru={() => setFormOpd({ id: null, dariPegawai: true })}
            usernameDipakai={(u) => usernameDipakai(u, pegawaiDiedit?.id)}
            onSimpan={simpanPegawai}
            onBatal={() => setFormPegawai(null)}
          />
        )}
      </Dialog>

      <Dialog
        buka={!!pegawaiDokumen}
        onTutup={() => {
          setIdDokumen(null);
          setGalatBuka("");
        }}
        judul={`Dokumen ${pegawaiDokumen?.nama ?? ""}`}
        lebar="w-[min(40rem,calc(100%-2rem))]"
      >
        {pegawaiDokumen && (
          <>
            {!kegiatanAktif ? (
              <p className="text-sm text-ink-muted">Belum ada kegiatan yang aktif.</p>
            ) : (
              <>
                <p className="text-sm text-ink-muted">{kegiatanAktif.nama}</p>
                <ul className="divide-y divide-line rounded-card border border-line">
                  {itemList.map((i) => {
                    const d = dokumenList.find(
                      (x) => x.penggunaId === pegawaiDokumen.id && x.itemId === i.id,
                    );
                    return (
                      <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{i.nama}</p>
                          <p className="truncate text-sm text-ink-muted">
                            {d?.namaFile && d.diunggahPada
                              ? `${d.namaFile} · ${waktuUnggah(d.diunggahPada)}`
                              : "Belum ada file"}
                          </p>
                        </div>
                        {d?.namaFile && (
                          <button onClick={() => bukaDokumen(d.id)} className={tombolSekunder}>
                            <ExternalLink className="size-4" aria-hidden />
                            Buka
                          </button>
                        )}
                      </li>
                    );
                  })}
                  {itemList.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-ink-muted">
                      Kegiatan ini belum punya item dokumen.
                    </li>
                  )}
                </ul>
              </>
            )}
            <Galat pesan={galatBuka} />
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setIdDokumen(null);
                  setGalatBuka("");
                }}
                className={tombolSekunder}
              >
                Tutup
              </button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog
        buka={!!pegawaiLink}
        onTutup={() => setIdLink(null)}
        judul={`Link sertifikat ${pegawaiLink?.nama ?? ""}`}
      >
        {pegawaiLink && (
          <FormLink
            awal={pegawaiLink.linkSertifikat ?? ""}
            onSimpan={simpanLink}
            onBatal={() => setIdLink(null)}
          />
        )}
      </Dialog>

      <Dialog buka={!!reset} onTutup={() => setReset(null)} judul="Reset kata sandi">
        {reset && !reset.hasil && (
          <FormReset
            teksTujuan={`${reset.p.nama}${
              reset.p.opdId ? ` (${opdList.find((o) => o.id === reset.p.opdId)?.singkatan ?? ""})` : ""
            }`}
            onSimpan={simpanReset}
            onBatal={() => setReset(null)}
          />
        )}
        {reset?.hasil && (
          <>
            <p className="text-sm text-ink-muted">
              Sampaikan kata sandi ini ke pegawai. Kata sandi hanya tampil sekali.
            </p>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-4 py-3">
              <code className="tabular text-base font-semibold text-ink">{reset.hasil}</code>
              <button
                onClick={() => navigator.clipboard.writeText(reset.hasil!)}
                aria-label="Salin kata sandi"
                className={tombolSekunder}
              >
                <Copy className="size-4" aria-hidden />
                Salin
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setReset(null)} className={tombolUtama}>
                Selesai
              </button>
            </div>
          </>
        )}
      </Dialog>

      <Dialog buka={!!hapusP} onTutup={() => setHapusP(null)} judul="Hapus akun pegawai">
        {hapusP && (
          <KonfirmasiHapus
            teks={`Hapus akun ${hapusP.nama} (${emailKeUsername(hapusP.email)})? Semua data milik pegawai ini (dokumen dan file unggahan, kehadiran, hasil quiz, progres modul) ikut terhapus permanen dan tidak bisa dikembalikan.`}
            onYa={jalankanHapusPegawai}
            onBatal={() => setHapusP(null)}
          />
        )}
      </Dialog>

      <Dialog buka={!!hapusO} onTutup={() => setHapusO(null)} judul="Hapus OPD">
        {hapusO && (
          <KonfirmasiHapus
            teks={`Hapus ${hapusO.nama} (${hapusO.singkatan})? OPD ini tidak punya pegawai. Penghapusan tidak bisa dikembalikan.`}
            onYa={jalankanHapusOpd}
            onBatal={() => setHapusO(null)}
          />
        )}
      </Dialog>
    </div>
  );
}