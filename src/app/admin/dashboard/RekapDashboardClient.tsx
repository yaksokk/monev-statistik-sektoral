"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { formatNGain } from "@/lib/dashboard";
import { formatNilai } from "@/lib/quiz";
import type {
  BarisPegawai,
  BarisRekapOpd,
  RingkasanKegiatan,
} from "@/lib/ringkasan-admin";
import type { Kegiatan } from "@/lib/types";
import KartuRingkasan, { susunKartu } from "./KartuRingkasan";

interface Kolom<T> {
  id: string;
  judul: string;
  urut: (b: T) => number | null; // null selalu di paling bawah
  sel: (b: T) => ReactNode;
}

interface Grup<T> {
  id: string;
  judul: string;
  kolom: Kolom<T>[];
}

interface Urutan {
  kolom: string;
  arah: "turun" | "naik";
}

const NADA = {
  hijau: "bg-status-disetujui-bg text-status-disetujui-fg",
  merah: "bg-status-revisi-bg text-status-revisi-fg",
};

function Lencana({ nada, children }: { nada: keyof typeof NADA; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${NADA[nada]}`}
    >
      {children}
    </span>
  );
}

const nilaiAtauBelum = (n: number | null) =>
  n === null ? <span className="text-ink-muted">Belum</span> : formatNilai(n);

const tombolSekunder =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// Kolom tabel OPD: hanya jumlah pegawai dan nilai rata-rata (belum mengerjakan dihitung 0)
function susunKolomOpd(r: RingkasanKegiatan): Kolom<BarisRekapOpd>[] {
  const kolom: Kolom<BarisRekapOpd>[] = [
    {
      id: "pegawai",
      judul: "Pegawai",
      urut: (b) => b.pegawai.length,
      sel: (b) => b.pegawai.length,
    },
  ];
  if (r.aktif.pretest) {
    kolom.push({
      id: "pre",
      judul: "Pre-Test",
      urut: (b) => b.preTest,
      sel: (b) => (b.preTest === null ? "-" : formatNilai(b.preTest)),
    });
  }
  if (r.aktif.posttest) {
    kolom.push({
      id: "post",
      judul: "Post-Test",
      urut: (b) => b.postTest,
      sel: (b) => (b.postTest === null ? "-" : formatNilai(b.postTest)),
    });
  }
  if (r.nGainTersedia) {
    kolom.push({
      id: "ngain",
      judul: "N-Gain",
      urut: (b) => b.nGain,
      sel: (b) => (b.nGain === null ? "-" : formatNGain(b.nGain)),
    });
  }
  return kolom;
}

// Kolom popup per pegawai. Kelompok Pre-Test, Post-Test, dan N-Gain hanya ada bila quiz-nya aktif.
// Nilai akhir sengaja tidak ada (rumusnya masih sementara).
function susunGrupPegawai(r: RingkasanKegiatan): Grup<BarisPegawai>[] {
  const grup: Grup<BarisPegawai>[] = [
    {
      id: "kehadiran",
      judul: "Kehadiran",
      kolom: [
        {
          id: "hadir",
          judul: "Sesi dihadiri",
          urut: (b) => b.kehadiran.hadir,
          sel: (b) => `${b.kehadiran.hadir} dari ${b.kehadiran.total}`,
        },
        {
          id: "persen",
          judul: "Persen",
          urut: (b) => b.kehadiran.persen,
          sel: (b) => `${formatNilai(b.kehadiran.persen)}%`,
        },
      ],
    },
  ];

  const nilai: Kolom<BarisPegawai>[] = [];
  if (r.aktif.pretest) {
    nilai.push({
      id: "pre",
      judul: "Pre-Test",
      urut: (b) => b.preTest,
      sel: (b) => nilaiAtauBelum(b.preTest),
    });
  }
  if (r.aktif.posttest) {
    nilai.push({
      id: "post",
      judul: "Post-Test",
      urut: (b) => b.postTest,
      sel: (b) => nilaiAtauBelum(b.postTest),
    });
  }
  if (r.nGainTersedia) {
    nilai.push({
      id: "ngain",
      judul: "N-Gain",
      urut: (b) => b.nGain,
      sel: (b) => (b.nGain === null ? "-" : formatNGain(b.nGain)),
    });
  }
  if (nilai.length > 0) grup.push({ id: "nilai", judul: "Nilai quiz", kolom: nilai });

  grup.push({
    id: "dokumen",
    judul: "Dokumen",
    kolom: [
      {
        id: "disetujui",
        judul: "Disetujui",
        urut: (b) => b.dokumen.status.disetujui,
        sel: (b) => b.dokumen.status.disetujui,
      },
      {
        id: "belum",
        judul: "Belum",
        urut: (b) => b.dokumen.status.belum,
        sel: (b) => b.dokumen.status.belum,
      },
      {
        id: "kelengkapan",
        judul: "Kelengkapan",
        urut: (b) => b.dokumen.kelengkapan,
        sel: (b) => `${formatNilai(b.dokumen.kelengkapan)}%`,
      },
    ],
  });

  grup.push({
    id: "kelulusan",
    judul: "Kelulusan",
    kolom: [
      {
        id: "status",
        judul: "Status",
        urut: (b) => (b.lulus ? 1 : 0),
        sel: (b) => (
          <Lencana nada={b.lulus ? "hijau" : "merah"}>{b.lulus ? "Lulus" : "Belum lulus"}</Lencana>
        ),
      },
    ],
  });

  return grup;
}

// Isi popup: rekap semua pegawai satu OPD
function TabelPegawai({ baris, ringkasan }: { baris: BarisPegawai[]; ringkasan: RingkasanKegiatan }) {
  const grup = useMemo(() => susunGrupPegawai(ringkasan), [ringkasan]);

  return (
    <div className="overflow-x-auto rounded-card border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-muted text-ink-muted">
          <tr>
            <th scope="col" rowSpan={2} className="min-w-48 px-5 py-3 align-bottom font-medium">
              Pegawai
            </th>
            {grup.map((g) => (
              <th
                key={g.id}
                scope="colgroup"
                colSpan={g.kolom.length}
                className="whitespace-nowrap border-l border-line px-5 pb-1 pt-3 text-center text-xs font-semibold uppercase tracking-wide"
              >
                {g.judul}
              </th>
            ))}
          </tr>
          <tr>
            {grup.map((g) =>
              g.kolom.map((k, i) => (
                <th
                  key={k.id}
                  scope="col"
                  className={`whitespace-nowrap px-5 pb-3 pt-1 font-medium ${i === 0 ? "border-l border-line" : ""}`}
                >
                  {k.judul}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {baris.map((b) => (
            <tr key={b.pegawai.id}>
              <td className="min-w-48 px-5 py-3">
                <p className="font-medium text-ink">{b.pegawai.nama}</p>
                <p className="text-xs text-ink-muted">{b.pegawai.email}</p>
              </td>
              {grup.map((g) =>
                g.kolom.map((k, i) => (
                  <td
                    key={k.id}
                    className={`tabular whitespace-nowrap px-5 py-3 text-ink ${i === 0 ? "border-l border-line" : ""}`}
                  >
                    {k.sel(b)}
                  </td>
                )),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  kegiatan: Kegiatan;
  ringkasan: RingkasanKegiatan;
  baris: BarisRekapOpd[];
}

export default function RekapDashboardClient({ kegiatan, ringkasan, baris }: Props) {
  const [urut, setUrut] = useState<Urutan | null>(null);
  const [cari, setCari] = useState("");
  const [idOpd, setIdOpd] = useState<string | null>(null);

  const kartu = susunKartu(kegiatan, ringkasan);
  const kolom = useMemo(() => susunKolomOpd(ringkasan), [ringkasan]);
  const opdTerpilih = idOpd ? baris.find((b) => b.opd.id === idOpd) : undefined;

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    const hasil = baris.filter(
      (b) =>
        q === "" || b.opd.nama.toLowerCase().includes(q) || b.opd.singkatan.toLowerCase().includes(q),
    );
    const kolomUrut = urut ? kolom.find((k) => k.id === urut.kolom) : undefined;
    if (!urut || !kolomUrut) return hasil;

    return [...hasil].sort((a, b) => {
      const x = kolomUrut.urut(a);
      const y = kolomUrut.urut(b);
      if (x === null && y === null) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return urut.arah === "turun" ? y - x : x - y;
    });
  }, [baris, cari, urut, kolom]);

  // klik pertama: tertinggi ke terendah, klik berikutnya: bergantian
  function klikJudul(id: string) {
    setUrut((u) => ({ kolom: id, arah: u?.kolom === id && u.arah === "turun" ? "naik" : "turun" }));
  }

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kartu.map(({ id, ...isi }) => (
          <KartuRingkasan key={id} {...isi} />
        ))}
      </div>

      <section
        aria-labelledby="judul-rekap"
        className="mt-8 overflow-hidden rounded-card border border-line bg-surface shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id="judul-rekap" className="text-base font-semibold text-ink">
              Rekap per OPD
            </h2>
            <p className="tabular text-sm text-ink-muted">
              {tampil.length} dari {baris.length} OPD · nilai adalah rata-rata pegawai, yang belum
              mengerjakan dihitung 0 · klik nama OPD untuk melihat rekap pegawai
            </p>
          </div>
          <label className="relative block">
            <span className="sr-only">Cari OPD</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              type="search"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari OPD"
              className="w-56 rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-ink-muted">
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 min-w-56 bg-surface-muted px-5 py-3 font-medium"
                >
                  OPD
                </th>
                {kolom.map((k) => {
                  const arah = urut?.kolom === k.id ? urut.arah : null;
                  const Ikon = arah === null ? ArrowUpDown : arah === "turun" ? ArrowDown : ArrowUp;
                  return (
                    <th
                      key={k.id}
                      scope="col"
                      aria-sort={
                        arah === null ? undefined : arah === "turun" ? "descending" : "ascending"
                      }
                      className="whitespace-nowrap px-5 py-3 font-medium"
                    >
                      <button
                        type="button"
                        onClick={() => klikJudul(k.id)}
                        className="inline-flex items-center gap-1.5 font-medium hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        {k.judul}
                        <Ikon
                          className={`size-3.5 ${arah === null ? "text-ink-muted" : "text-primary"}`}
                          aria-hidden
                        />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tampil.map((b) => (
                <tr key={b.opd.id}>
                  <td className="sticky left-0 z-10 min-w-56 bg-surface px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setIdOpd(b.opd.id)}
                      aria-haspopup="dialog"
                      className="text-left font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      {b.opd.nama}
                    </button>
                  </td>
                  {kolom.map((k) => (
                    <td key={k.id} className="tabular whitespace-nowrap px-5 py-3 text-ink">
                      {k.sel(b)}
                    </td>
                  ))}
                </tr>
              ))}
              {tampil.length === 0 && (
                <tr>
                  <td colSpan={kolom.length + 1} className="px-5 py-6 text-center text-ink-muted">
                    Tidak ada OPD yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        buka={!!opdTerpilih}
        onTutup={() => setIdOpd(null)}
        judul={`Rekap pegawai ${opdTerpilih?.opd.nama ?? ""}`}
        lebar="w-[min(64rem,calc(100%-2rem))]"
      >
        {opdTerpilih && (
          <>
            <p className="tabular text-sm text-ink-muted">
              {opdTerpilih.lulus} dari {opdTerpilih.pegawai.length} pegawai lulus
            </p>
            <TabelPegawai baris={opdTerpilih.pegawai} ringkasan={ringkasan} />
            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => setIdOpd(null)} className={tombolSekunder}>
                Tutup
              </button>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}