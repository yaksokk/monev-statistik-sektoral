import { Suspense } from "react";
import {
  HASIL_QUIZ_LIST,
  KEGIATAN_LIST,
  OPD_LIST,
  PENGATURAN_QUIZ_LIST,
  PRESENSI_LIST,
  SESI_LIST,
  SOAL_QUIZ_LIST,
} from "@/data/dummy";
import {
  susunRekapOpd,
  susunRingkasan,
  type DataDashboardAdmin,
} from "@/lib/ringkasan-admin";
import HeaderKegiatan from "./HeaderKegiatan";
import RekapDashboardClient from "./RekapDashboardClient";

// Semua masih data dummy; nanti diganti data backend
const DATA: DataDashboardAdmin = {
  opdList: OPD_LIST,
  sesiList: SESI_LIST,
  presensiList: PRESENSI_LIST,
  soalList: SOAL_QUIZ_LIST,
  pengaturanList: PENGATURAN_QUIZ_LIST,
  hasilList: HASIL_QUIZ_LIST,
};

type SearchParams = Promise<{ kegiatan?: string }>;

export default function DashboardAdmin({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
      <p className="mt-1 text-ink-muted">Ringkasan pembinaan dan kelengkapan dokumen seluruh OPD.</p>

      {/* isi bergantung pada ?kegiatan=, jadi dialirkan di balik Suspense */}
      <Suspense fallback={<p className="mt-6 text-sm text-ink-muted">Memuat ringkasan…</p>}>
        <IsiDashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function IsiDashboard({ searchParams }: { searchParams: SearchParams }) {
  const { kegiatan: kegiatanParam } = await searchParams;

  // Pilihan di URL (termasuk arsip), kalau tidak ada atau tidak ditemukan: kegiatan aktif
  const kegiatan =
    KEGIATAN_LIST.find((k) => k.id === kegiatanParam) ?? KEGIATAN_LIST.find((k) => k.aktif);

  if (!kegiatan) {
    return <HeaderKegiatan kegiatan={undefined} daftar={KEGIATAN_LIST} />;
  }

  const baris = susunRekapOpd(kegiatan, DATA);
  const ringkasan = susunRingkasan(kegiatan, baris);

  return (
    <>
      <HeaderKegiatan kegiatan={kegiatan} daftar={KEGIATAN_LIST} />

      {/* key: pindah kegiatan mengembalikan kartu terpilih, pencarian, dan urutan ke awal */}
      <RekapDashboardClient
        key={kegiatan.id}
        kegiatan={kegiatan}
        ringkasan={ringkasan}
        baris={baris}
      />
    </>
  );
}