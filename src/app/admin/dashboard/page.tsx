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

export default function DashboardAdmin() {
  const kegiatan = KEGIATAN_LIST.find((k) => k.aktif);

  const baris = kegiatan ? susunRekapOpd(kegiatan, DATA) : [];
  const ringkasan = kegiatan ? susunRingkasan(kegiatan, baris) : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
      <p className="mt-1 text-ink-muted">Ringkasan pembinaan dan kelengkapan dokumen seluruh OPD.</p>

      <HeaderKegiatan kegiatan={kegiatan} />

      {kegiatan && ringkasan && (
        <RekapDashboardClient kegiatan={kegiatan} ringkasan={ringkasan} baris={baris} />
      )}
    </div>
  );
}