"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Copy, FileSpreadsheet, KeyRound, Pencil, Plus, Search } from "lucide-react";
import type { Opd, Pengguna } from "@/lib/types";

export type BarisOpd = { opd: Opd; operator: Pengguna };

const tombolUtama =
  "inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const tombolSekunder =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const kolomInput =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary";

function Dialog({ buka, onTutup, judul, children }: { buka: boolean; onTutup: () => void; judul: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (buka && !d.open) d.showModal();
    if (!buka && d.open) d.close();
  }, [buka]);

  return (
    <dialog
      ref={ref}
      onClose={onTutup}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-card border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/40"
    >
      {buka && (
        <div className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{judul}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}

function buatSandi() {
  const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const acak = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(acak, (n) => huruf[n % huruf.length]).join("");
}

type Isian = { nama: string; singkatan: string; namaOperator: string; email: string };

function FormOpd({ awal, onSimpan, onBatal }: { awal: Isian; onSimpan: (v: Isian) => void; onBatal: () => void }) {
  const [v, setV] = useState(awal);
  const [galat, setGalat] = useState("");

  function kirim() {
    if (Object.values(v).some((x) => !x.trim())) return setGalat("Semua kolom wajib diisi.");
    if (!/^\S+@\S+\.\S+$/.test(v.email)) return setGalat("Format email belum benar.");
    onSimpan({ nama: v.nama.trim(), singkatan: v.singkatan.trim(), namaOperator: v.namaOperator.trim(), email: v.email.trim() });
  }

  const kolom: { kunci: keyof Isian; label: string; tipe?: string }[] = [
    { kunci: "nama", label: "Nama OPD" },
    { kunci: "singkatan", label: "Singkatan" },
    { kunci: "namaOperator", label: "Nama operator" },
    { kunci: "email", label: "Email operator", tipe: "email" },
  ];

  return (
    <div className="space-y-4">
      {kolom.map((k) => (
        <div key={k.kunci} className="space-y-1.5">
          <label htmlFor={`f-${k.kunci}`} className="text-sm font-medium">
            {k.label}
          </label>
          <input
            id={`f-${k.kunci}`}
            type={k.tipe ?? "text"}
            value={v[k.kunci]}
            onChange={(e) => setV({ ...v, [k.kunci]: e.target.value })}
            className={kolomInput}
          />
        </div>
      ))}
      {galat && (
        <p role="alert" className="text-sm text-status-revisi-fg">
          {galat}
        </p>
      )}
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

export default function OpdClient({ awal }: { awal: BarisOpd[] }) {
  const [baris, setBaris] = useState(awal);
  const [cari, setCari] = useState("");
  const [form, setForm] = useState<{ id: string | null } | null>(null);
  const [impor, setImpor] = useState(false);
  const [fileImpor, setFileImpor] = useState<File | null>(null);
  const [reset, setReset] = useState<{ b: BarisOpd; sandi: string | null } | null>(null);
  const [pesan, setPesan] = useState("");

  const tampil = baris.filter(({ opd, operator }) =>
    `${opd.nama} ${opd.singkatan} ${operator.nama} ${operator.email}`.toLowerCase().includes(cari.toLowerCase()),
  );

  const diedit = form?.id ? baris.find((b) => b.opd.id === form.id) : undefined;

  function simpan(v: Isian) {
    if (diedit) {
      setBaris((prev) =>
        prev.map((b) =>
          b.opd.id === diedit.opd.id
            ? {
                opd: { ...b.opd, nama: v.nama, singkatan: v.singkatan },
                operator: { ...b.operator, nama: v.namaOperator, email: v.email },
              }
            : b,
        ),
      );
      setPesan(`Data ${v.singkatan} diperbarui.`);
    } else {
      const no = baris.reduce((m, b) => Math.max(m, Number(b.opd.id.replace(/\D/g, ""))), 0) + 1;
      const id = `opd-${String(no).padStart(2, "0")}`;
      const opd: Opd = { id, nama: v.nama, singkatan: v.singkatan };
      const operator: Pengguna = {
        id: `usr-op-${String(no).padStart(2, "0")}`,
        nama: v.namaOperator,
        email: v.email,
        peran: "operator",
        opdId: id,
      };
      setBaris((prev) => [...prev, { opd, operator }]);
      setPesan(`${v.singkatan} ditambahkan.`);
    }
    setForm(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-ink">OPD dan akun</h1>
          <p className="tabular text-sm text-ink-muted">{baris.length} OPD terdaftar</p>
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
          <button onClick={() => setForm({ id: null })} className={tombolUtama}>
            <Plus className="size-4" aria-hidden />
            Tambah OPD
          </button>
        </div>
      </header>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
        <input
          type="search"
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari OPD atau operator"
          aria-label="Cari OPD atau operator"
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
              <th className="px-4 py-3 font-medium">Operator</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tampil.map((b) => (
              <tr key={b.opd.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{b.opd.nama}</p>
                  <p className="text-ink-muted">{b.opd.singkatan}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{b.operator.nama}</p>
                  <p className="text-ink-muted">{b.operator.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setForm({ id: b.opd.id })} className={tombolSekunder}>
                      <Pencil className="size-4" aria-hidden />
                      Ubah
                    </button>
                    <button onClick={() => setReset({ b, sandi: null })} className={tombolSekunder}>
                      <KeyRound className="size-4" aria-hidden />
                      Reset sandi
                    </button>
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

      <Dialog buka={!!form} onTutup={() => setForm(null)} judul={diedit ? "Ubah OPD" : "Tambah OPD"}>
        <FormOpd
          awal={
            diedit
              ? { nama: diedit.opd.nama, singkatan: diedit.opd.singkatan, namaOperator: diedit.operator.nama, email: diedit.operator.email }
              : { nama: "", singkatan: "", namaOperator: "", email: "" }
          }
          onSimpan={simpan}
          onBatal={() => setForm(null)}
        />
      </Dialog>

      <Dialog buka={impor} onTutup={() => setImpor(false)} judul="Impor OPD dari Excel">
        <p className="text-sm text-ink-muted">
          Siapkan file .xlsx atau .csv dengan kolom: Nama OPD, Singkatan, Nama operator, Email operator. Satu baris untuk satu OPD.
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
              Buat kata sandi sementara untuk {reset.b.operator.nama} ({reset.b.opd.singkatan})? Kata sandi lama tidak berlaku lagi.
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
            <p className="text-sm text-ink-muted">Sampaikan kata sandi ini ke operator. Kata sandi hanya tampil sekali.</p>
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
