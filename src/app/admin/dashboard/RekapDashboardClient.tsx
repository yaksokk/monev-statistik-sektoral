"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { formatNGain } from "@/lib/dashboard";
import { formatNilai } from "@/lib/quiz";
import type { BarisRekapOpd, RingkasanKegiatan } from "@/lib/ringkasan-admin";
import type { Kegiatan } from "@/lib/types";
import KartuRingkasan, { susunKartu } from "./KartuRingkasan";

interface Kolom {
  id: string;
  judul: string;
  urut: (b: BarisRekapOpd) => number | null; // null selalu di paling bawah
  sel: (b: BarisRekapOpd) => ReactNode;
}

interface Grup {
  id: string;
  judul: string;
  kolom: Kolom[];
}

interface Urutan {
  kolom: string;
  arah: "turun" | "naik";
}

const NADA = {
  hijau: "bg-status-disetujui-bg text-status-disetujui-fg",
  merah: "bg-status-revisi-bg text-status-revisi-fg",
  abu: "bg-status-belum-bg text-status-belum-fg",
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

// Semua rekapan tampil sekaligus. Kelompok Pre-Test, Post-Test, dan N-Gain
// hanya ada bila quiz-nya aktif. Nilai akhir sengaja tidak ada (rumusnya masih sementara).
function susunGrup(r: RingkasanKegiatan): Grup[] {
  const grup: Grup[] = [
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

  const nilai: Kolom[] = [];
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

interface Props {
  kegiatan: Kegiatan;
  ringkasan: RingkasanKegiatan;
  baris: BarisRekapOpd[];
}

export default function RekapDashboardClient({ kegiatan, ringkasan, baris }: Props) {
  const [urut, setUrut] = useState<Urutan | null>(null);
  const [cari, setCari] = useState("");

  const kartu = susunKartu(kegiatan, ringkasan);
  const grup = useMemo(() => susunGrup(ringkasan), [ringkasan]);
  const kolom = useMemo(() => grup.flatMap((g) => g.kolom), [grup]);

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
              {tampil.length} dari {baris.length} OPD · klik judul kolom untuk mengurutkan
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
                  rowSpan={2}
                  className="sticky left-0 z-10 min-w-56 bg-surface-muted px-5 py-3 align-bottom font-medium"
                >
                  OPD
                </th>
                {grup.map((g) => (
                  <th
                    key={g.id}
                    scope="colgroup"
                    colSpan={g.kolom.length}
                    className="whitespace-nowrap border-l text-center border-line px-5 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide"
                  >
                    {g.judul}
                  </th>
                ))}
              </tr>
              <tr>
                {grup.map((g) =>
                  g.kolom.map((k, i) => {
                    const arah = urut?.kolom === k.id ? urut.arah : null;
                    const Ikon =
                      arah === null ? ArrowUpDown : arah === "turun" ? ArrowDown : ArrowUp;
                    return (
                      <th
                        key={k.id}
                        scope="col"
                        aria-sort={
                          arah === null ? undefined : arah === "turun" ? "descending" : "ascending"
                        }
                        className={`whitespace-nowrap px-5 pb-3 pt-1 font-medium ${i === 0 ? "border-l border-line" : ""}`}
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
                  }),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tampil.map((b) => (
                <tr key={b.opd.id}>
                  <td className="sticky left-0 z-10 min-w-56 bg-surface px-5 py-3 font-medium text-ink">
                    {b.opd.nama}
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
    </>
  );
}