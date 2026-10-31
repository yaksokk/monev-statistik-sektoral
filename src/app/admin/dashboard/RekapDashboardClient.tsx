"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { formatNGain } from "@/lib/dashboard";
import { formatNilai } from "@/lib/quiz";
import type { BarisRekapOpd, RingkasanKegiatan } from "@/lib/ringkasan-admin";
import type { Kegiatan } from "@/lib/types";
import KartuRingkasan, { susunKartu, type IdKartu } from "./KartuRingkasan";

interface Kolom {
  id: string;
  judul: string;
  urut: (b: BarisRekapOpd) => number | null; // null selalu di paling bawah
  sel: (b: BarisRekapOpd) => ReactNode;
}

interface Urutan {
  kolom: string;
  arah: "turun" | "naik";
}

const JUDUL_TABEL: Record<IdKartu, string> = {
  lulus: "Status kelulusan",
  kehadiran: "Kehadiran",
  pretest: "Nilai Pre-Test",
  posttest: "Nilai Post-Test",
  ngain: "N-Gain",
  dokumen: "Kelengkapan dokumen",
};

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

const kolomPersen: Kolom = {
  id: "persen",
  judul: "Kehadiran",
  urut: (b) => b.kehadiran.persen,
  sel: (b) => `${formatNilai(b.kehadiran.persen)}%`,
};

// Kolom mengikuti kartu yang dipilih. Nilai akhir sengaja tidak ada (rumusnya masih sementara).
function kolomUntuk(id: IdKartu, r: RingkasanKegiatan): Kolom[] {
  switch (id) {
    case "lulus":
      return [
        kolomPersen,
        ...(r.aktif.posttest
          ? [
              {
                id: "post",
                judul: "Post-Test",
                urut: (b: BarisRekapOpd) => b.postTest,
                sel: (b: BarisRekapOpd) => nilaiAtauBelum(b.postTest),
              },
            ]
          : []),
        {
          id: "status",
          judul: "Status",
          urut: (b) => (b.lulus ? 1 : 0),
          sel: (b) => (
            <Lencana nada={b.lulus ? "hijau" : "merah"}>
              {b.lulus ? "Lulus" : "Belum lulus"}
            </Lencana>
          ),
        },
      ];
    case "kehadiran":
      return [
        {
          id: "hadir",
          judul: "Sesi dihadiri",
          urut: (b) => b.kehadiran.hadir,
          sel: (b) => `${b.kehadiran.hadir} dari ${b.kehadiran.total}`,
        },
        { ...kolomPersen, judul: "Persen kehadiran" },
        {
          id: "status",
          judul: "Status kehadiran",
          urut: (b) => (b.kehadiran.lulus ? 1 : 0),
          sel: (b) => (
            <Lencana nada={b.kehadiran.lulus ? "hijau" : "merah"}>
              {b.kehadiran.lulus ? "Lulus" : "Belum lulus"}
            </Lencana>
          ),
        },
      ];
    case "pretest":
      return [
        {
          id: "pre",
          judul: "Nilai Pre-Test",
          urut: (b) => b.preTest,
          sel: (b) => nilaiAtauBelum(b.preTest),
        },
      ];
    case "posttest":
      return [
        {
          id: "post",
          judul: "Nilai Post-Test",
          urut: (b) => b.postTest,
          sel: (b) => nilaiAtauBelum(b.postTest),
        },
        {
          id: "status",
          judul: "Status Post-Test",
          // lulus 2, belum lulus 1, belum mengerjakan 0
          urut: (b) => (b.postTest === null ? 0 : b.syarat.postTest ? 2 : 1),
          sel: (b) =>
            b.postTest === null ? (
              <Lencana nada="abu">Belum mengerjakan</Lencana>
            ) : (
              <Lencana nada={b.syarat.postTest ? "hijau" : "merah"}>
                {b.syarat.postTest ? "Lulus" : "Belum lulus"}
              </Lencana>
            ),
        },
      ];
    case "ngain":
      return [
        {
          id: "pre",
          judul: "Pre-Test",
          urut: (b) => b.preTest,
          sel: (b) => nilaiAtauBelum(b.preTest),
        },
        {
          id: "post",
          judul: "Post-Test",
          urut: (b) => b.postTest,
          sel: (b) => nilaiAtauBelum(b.postTest),
        },
        {
          id: "ngain",
          judul: "N-Gain",
          urut: (b) => b.nGain,
          sel: (b) => (b.nGain === null ? "-" : formatNGain(b.nGain)),
        },
      ];
    case "dokumen":
      return [
        {
          id: "disetujui",
          judul: "Disetujui",
          urut: (b) => b.dokumen.status.disetujui,
          sel: (b) => b.dokumen.status.disetujui,
        },
        {
          id: "menunggu",
          judul: "Menunggu",
          urut: (b) => b.dokumen.status.menunggu,
          sel: (b) => b.dokumen.status.menunggu,
        },
        {
          id: "revisi",
          judul: "Revisi",
          urut: (b) => b.dokumen.status.revisi,
          sel: (b) => b.dokumen.status.revisi,
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
      ];
  }
}

interface Props {
  kegiatan: Kegiatan;
  ringkasan: RingkasanKegiatan;
  baris: BarisRekapOpd[];
}

export default function RekapDashboardClient({ kegiatan, ringkasan, baris }: Props) {
  const [kartuAktif, setKartuAktif] = useState<IdKartu>("lulus");
  const [urut, setUrut] = useState<Urutan | null>(null);
  const [cari, setCari] = useState("");

  const kartu = susunKartu(kegiatan, ringkasan);
  const kolom = useMemo(() => kolomUntuk(kartuAktif, ringkasan), [kartuAktif, ringkasan]);

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

  function pilihKartu(id: IdKartu) {
    setKartuAktif(id);
    setUrut(null);
  }

  // klik pertama: tertinggi ke terendah, klik berikutnya: bergantian
  function klikJudul(id: string) {
    setUrut((u) => ({ kolom: id, arah: u?.kolom === id && u.arah === "turun" ? "naik" : "turun" }));
  }

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kartu.map(({ id, ...isi }) => (
          <KartuRingkasan
            key={id}
            {...isi}
            terpilih={id === kartuAktif}
            onKlik={() => pilihKartu(id)}
          />
        ))}
      </div>

      <section
        aria-labelledby="judul-rekap"
        className="mt-8 overflow-hidden rounded-card border border-line bg-surface shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id="judul-rekap" className="text-base font-semibold text-ink">
              Rekap per OPD: {JUDUL_TABEL[kartuAktif]}
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
                <th scope="col" className="px-5 py-3 font-medium">
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
                      className="px-5 py-3 font-medium"
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
                  <td className="px-5 py-3 font-medium text-ink">{b.opd.nama}</td>
                  {kolom.map((k) => (
                    <td key={k.id} className="tabular px-5 py-3 text-ink">
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
    </>
  );
}