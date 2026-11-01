"use client";

import { useState } from "react";
import {
  ChevronRight,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  Link2,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { linkHttps } from "@/lib/dashboard";
import type { Opd, Pengguna } from "@/lib/types";

const tombolUtama =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const tombolSekunder =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const kolomInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary";

const dua = (n: number) => String(n).padStart(2, "0");
const angkaId = (id: string) => Number(id.replace(/\D/g, "")) || 0;

function buatSandi() {
  const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const acak = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(acak, (n) => huruf[n % huruf.length]).join("");
}

function Isian({
  id,
  label,
  tipe = "text",
  nilai,
  onUbah,
}: {
  id: string;
  label: string;
  tipe?: string;
  nilai: string;
  onUbah: (v: string) => void;
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
    </div>
  );
}

function Galat({ pesan }: { pesan: string }) {
  if (!pesan) return null;
  return (
    <p role="alert" className="text-sm text-status-revisi-fg">
      {pesan}
    </p>
  );
}

type IsianOpd = { nama: string; singkatan: string; namaPegawai: string; email: string };

// denganPegawai = true saat tambah OPD: pegawai pertama diisi sekaligus
function FormOpd({
  awal,
  denganPegawai,
  emailDipakai,
  onSimpan,
  onBatal,
}: {
  awal: IsianOpd;
  denganPegawai: boolean;
  emailDipakai: (email: string) => boolean;
  onSimpan: (v: IsianOpd) => void;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");

  function kirim() {
    const wajib: (keyof IsianOpd)[] = denganPegawai
      ? ["nama", "singkatan", "namaPegawai", "email"]
      : ["nama", "singkatan"];
    if (wajib.some((k) => !v[k].trim())) return setGalat("Semua kolom wajib diisi.");
    if (denganPegawai) {
      if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) return setGalat("Format email belum benar.");
      if (emailDipakai(v.email.trim())) return setGalat("Email ini sudah dipakai pegawai lain.");
    }
    onSimpan({
      nama: v.nama.trim(),
      singkatan: v.singkatan.trim(),
      namaPegawai: v.namaPegawai.trim(),
      email: v.email.trim(),
    });
  }

  return (
    <div className="space-y-4">
      <Isian id="f-nama" label="Nama OPD" nilai={v.nama} onUbah={(x) => setV({ ...v, nama: x })} />
      <Isian
        id="f-singkatan"
        label="Singkatan"
        nilai={v.singkatan}
        onUbah={(x) => setV({ ...v, singkatan: x })}
      />
      {denganPegawai && (
        <>
          <Isian
            id="f-nama-pegawai"
            label="Nama pegawai pertama"
            nilai={v.namaPegawai}
            onUbah={(x) => setV({ ...v, namaPegawai: x })}
          />
          <Isian
            id="f-email"
            label="Email pegawai"
            tipe="email"
            nilai={v.email}
            onUbah={(x) => setV({ ...v, email: x })}
          />
        </>
      )}
      <Galat pesan={galat} />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBatal} className={tombolSekunder}>
          Batal
        </button>
        <button onClick={kirim} className={tombolUtama}>
          Simpan
        </button>
      </div>
    </div>
  );
}

type IsianPegawai = { nama: string; email: string };

function FormPegawai({
  awal,
  emailDipakai,
  onSimpan,
  onBatal,
}: {
  awal: IsianPegawai;
  emailDipakai: (email: string) => boolean;
  onSimpan: (v: IsianPegawai) => void;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");

  function kirim() {
    const nama = v.nama.trim();
    const email = v.email.trim();
    if (!nama || !email) return setGalat("Semua kolom wajib diisi.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setGalat("Format email belum benar.");
    if (emailDipakai(email)) return setGalat("Email ini sudah dipakai pegawai lain.");
    onSimpan({ nama, email });
  }

  return (
    <div className="space-y-4">
      <Isian id="p-nama" label="Nama pegawai" nilai={v.nama} onUbah={(x) => setV({ ...v, nama: x })} />
      <Isian
        id="p-email"
        label="Email pegawai"
        tipe="email"
        nilai={v.email}
        onUbah={(x) => setV({ ...v, email: x })}
      />
      <Galat pesan={galat} />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBatal} className={tombolSekunder}>
          Batal
        </button>
        <button onClick={kirim} className={tombolUtama}>
          Simpan
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
  onSimpan: (link: string) => void;
  onBatal: () => void;
}) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");
  const aman = linkHttps(v.trim());

  function kirim() {
    const teks = v.trim();
    if (teks && !linkHttps(teks)) return setGalat("Link harus diawali https://");
    onSimpan(teks);
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
          <button disabled className={`${tombolSekunder} disabled:cursor-not-allowed disabled:opacity-50`}>
            <ExternalLink className="size-4" aria-hidden />
            Buka link
          </button>
        )}
        <div className="flex gap-2">
          <button onClick={onBatal} className={tombolSekunder}>
            Batal
          </button>
          <button onClick={kirim} className={tombolUtama}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  opdAwal: Opd[];
  pegawaiAwal: Pengguna[];
}

export default function OpdClient({ opdAwal, pegawaiAwal }: Props) {
  const [opdList, setOpdList] = useState(opdAwal);
  const [pegawai, setPegawai] = useState(pegawaiAwal);
  const [cari, setCari] = useState("");
  const [pesan, setPesan] = useState("");

  const [idOpd, setIdOpd] = useState<string | null>(null); // popup daftar pegawai
  const [formOpd, setFormOpd] = useState<{ id: string | null } | null>(null);
  const [formPegawai, setFormPegawai] = useState<{ id: string | null; opdId: string } | null>(null);
  const [idLink, setIdLink] = useState<string | null>(null); // id pegawai
  const [reset, setReset] = useState<{ p: Pengguna; sandi: string | null } | null>(null);
  const [impor, setImpor] = useState(false);
  const [fileImpor, setFileImpor] = useState<File | null>(null);

  const pegawaiOpd = (opdId: string) => pegawai.filter((p) => p.opdId === opdId);

  // OPD tanpa pegawai tidak ditampilkan
  const tampil = opdList.filter((opd) => {
    const milik = pegawaiOpd(opd.id);
    if (milik.length === 0) return false;
    const q = cari.trim().toLowerCase();
    if (!q) return true;
    const teks = `${opd.nama} ${opd.singkatan} ${milik.map((p) => `${p.nama} ${p.email}`).join(" ")}`;
    return teks.toLowerCase().includes(q);
  });

  const opdPopup = idOpd ? opdList.find((o) => o.id === idOpd) : undefined;
  const pegawaiPopup = opdPopup ? pegawaiOpd(opdPopup.id) : [];
  const opdDiedit = formOpd?.id ? opdList.find((o) => o.id === formOpd.id) : undefined;
  const pegawaiDiedit = formPegawai?.id ? pegawai.find((p) => p.id === formPegawai.id) : undefined;
  const opdFormPegawai = formPegawai ? opdList.find((o) => o.id === formPegawai.opdId) : undefined;
  const pegawaiLink = idLink ? pegawai.find((p) => p.id === idLink) : undefined;

  const emailDipakai = (email: string, kecuali?: string) =>
    pegawai.some((p) => p.email.toLowerCase() === email.toLowerCase() && p.id !== kecuali);

  function idPegawaiBaru() {
    return `usr-op-${dua(pegawai.reduce((m, p) => Math.max(m, angkaId(p.id)), 0) + 1)}`;
  }

  function simpanOpd(v: IsianOpd) {
    if (opdDiedit) {
      setOpdList((prev) =>
        prev.map((o) => (o.id === opdDiedit.id ? { ...o, nama: v.nama, singkatan: v.singkatan } : o)),
      );
      setPesan(`Data ${v.singkatan} diperbarui.`);
    } else {
      const id = `opd-${dua(opdList.reduce((m, o) => Math.max(m, angkaId(o.id)), 0) + 1)}`;
      const pertama: Pengguna = {
        id: idPegawaiBaru(),
        nama: v.namaPegawai,
        email: v.email,
        peran: "operator",
        opdId: id,
      };
      setOpdList((prev) => [...prev, { id, nama: v.nama, singkatan: v.singkatan }]);
      setPegawai((prev) => [...prev, pertama]);
      setPesan(`${v.singkatan} ditambahkan dengan satu pegawai.`);
    }
    setFormOpd(null);
  }

  function simpanPegawai(v: IsianPegawai) {
    if (!formPegawai) return;
    if (pegawaiDiedit) {
      setPegawai((prev) =>
        prev.map((p) => (p.id === pegawaiDiedit.id ? { ...p, nama: v.nama, email: v.email } : p)),
      );
      setPesan(`Data ${v.nama} diperbarui.`);
    } else {
      setPegawai((prev) => [
        ...prev,
        { id: idPegawaiBaru(), nama: v.nama, email: v.email, peran: "operator", opdId: formPegawai.opdId },
      ]);
      setPesan(`${v.nama} ditambahkan.`);
    }
    setFormPegawai(null);
  }

  function simpanLink(link: string) {
    if (!pegawaiLink) return;
    const { id, nama } = pegawaiLink;
    setPegawai((prev) => prev.map((p) => (p.id === id ? { ...p, linkSertifikat: link || undefined } : p)));
    setPesan(link ? `Link sertifikat ${nama} disimpan.` : `Link sertifikat ${nama} dihapus.`);
    setIdLink(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-ink">OPD dan akun</h1>
          <p className="tabular text-sm text-ink-muted">
            {tampil.length} OPD · {pegawai.length} pegawai terdaftar · klik baris OPD untuk melihat pegawai
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setFileImpor(null);
              setImpor(true);
            }}
            className={tombolSekunder}
          >
            <FileSpreadsheet className="size-4" aria-hidden />
            Impor dari Excel
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
                  Tidak ada OPD yang cocok dengan pencarian.
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
                        <p className="text-ink-muted">{p.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <KolomSertifikat pegawai={p} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
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
                          <button onClick={() => setReset({ p, sandi: null })} className={tombolSekunder}>
                            <KeyRound className="size-4" aria-hidden />
                            Reset sandi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
              ? { nama: opdDiedit.nama, singkatan: opdDiedit.singkatan, namaPegawai: "", email: "" }
              : { nama: "", singkatan: "", namaPegawai: "", email: "" }
          }
          denganPegawai={!opdDiedit}
          emailDipakai={(e) => emailDipakai(e)}
          onSimpan={simpanOpd}
          onBatal={() => setFormOpd(null)}
        />
      </Dialog>

      <Dialog
        buka={!!formPegawai}
        onTutup={() => setFormPegawai(null)}
        judul={`${pegawaiDiedit ? "Ubah pegawai" : "Tambah pegawai"} ${opdFormPegawai?.singkatan ?? ""}`}
      >
        <FormPegawai
          awal={
            pegawaiDiedit
              ? { nama: pegawaiDiedit.nama, email: pegawaiDiedit.email }
              : { nama: "", email: "" }
          }
          emailDipakai={(e) => emailDipakai(e, pegawaiDiedit?.id)}
          onSimpan={simpanPegawai}
          onBatal={() => setFormPegawai(null)}
        />
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

      <Dialog buka={impor} onTutup={() => setImpor(false)} judul="Impor OPD dari Excel">
        <p className="text-sm text-ink-muted">
          Siapkan file .xlsx atau .csv dengan kolom: Nama OPD, Singkatan, Nama pegawai, Email pegawai. Satu
          baris untuk satu pegawai; baris dengan OPD yang sama digabung menjadi satu OPD.
        </p>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={(e) => setFileImpor(e.target.files?.[0] ?? null)}
          aria-label="Pilih file impor"
          className="block w-full text-sm text-ink file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-surface-muted"
        />
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setImpor(false)} className={tombolSekunder}>
            Batal
          </button>
          <button
            disabled={!fileImpor}
            onClick={() => {
              // pembacaan isi file menunggu backend
              setPesan(`File ${fileImpor!.name} diterima. Isinya belum diproses karena backend belum tersambung.`);
              setImpor(false);
            }}
            className={`${tombolUtama} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Impor
          </button>
        </div>
      </Dialog>

      <Dialog buka={!!reset} onTutup={() => setReset(null)} judul="Reset kata sandi">
        {reset && !reset.sandi && (
          <>
            <p className="text-sm text-ink-muted">
              Buat kata sandi sementara untuk {reset.p.nama}
              {reset.p.opdId ? ` (${opdList.find((o) => o.id === reset.p.opdId)?.singkatan ?? ""})` : ""}?
              Kata sandi lama tidak berlaku lagi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReset(null)} className={tombolSekunder}>
                Batal
              </button>
              <button onClick={() => setReset({ ...reset, sandi: buatSandi() })} className={tombolUtama}>
                Buat kata sandi
              </button>
            </div>
          </>
        )}
        {reset?.sandi && (
          <>
            <p className="text-sm text-ink-muted">
              Sampaikan kata sandi ini ke pegawai. Kata sandi hanya tampil sekali.
            </p>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-4 py-3">
              <code className="tabular text-base font-semibold text-ink">{reset.sandi}</code>
              <button
                onClick={() => navigator.clipboard.writeText(reset.sandi!)}
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
    </div>
  );
}