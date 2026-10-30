import { Suspense } from "react";
import { KEGIATAN_LIST, OPD_LIST, PRESENSI_LIST, SESI_LIST } from "@/data/dummy";
import DaftarHadirAdminClient from "./DaftarHadirAdminClient";

type SearchParams = Promise<{ kegiatan?: string }>;

export default function KelolaDaftarHadirPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Kelola Daftar Hadir</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Atur sesi pembinaan, ambang kehadiran, dan pantau kehadiran OPD per kegiatan.
        </p>
      </header>

      {/* isi bergantung pada ?kegiatan=, jadi dialirkan di balik Suspense */}
      <Suspense fallback={<p className="text-sm text-ink-muted">Memuat daftar hadir…</p>}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: SearchParams }) {
  const { kegiatan: param } = await searchParams;

  // default: kegiatan aktif, kalau tidak ada pakai yang pertama
  const kegiatan =
    KEGIATAN_LIST.find((k) => k.id === param) ??
    KEGIATAN_LIST.find((k) => k.aktif) ??
    KEGIATAN_LIST[0];

  if (!kegiatan) {
    return <p className="text-sm text-ink-muted">Belum ada kegiatan. Tambahkan lewat menu Kegiatan.</p>;
  }

  return (
    <DaftarHadirAdminClient
      kegiatanId={kegiatan.id}
      kegiatanAwal={KEGIATAN_LIST}
      opdList={OPD_LIST}
      sesiAwal={SESI_LIST}
      presensiAwal={PRESENSI_LIST}
    />
  );
}