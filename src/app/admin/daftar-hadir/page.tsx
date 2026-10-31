import { KEGIATAN_LIST, OPD_LIST, PRESENSI_LIST, SESI_LIST } from "@/data/dummy";
import DaftarHadirAdminClient from "./DaftarHadirAdminClient";

export default function KelolaDaftarHadirPage() {
  // kegiatan aktif, kalau tidak ada pakai yang pertama
  const kegiatan = KEGIATAN_LIST.find((k) => k.aktif) ?? KEGIATAN_LIST[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Kelola Daftar Hadir</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Atur sesi pembinaan, ambang kehadiran, dan pantau kehadiran OPD.
        </p>
      </header>

      {kegiatan ? (
        <DaftarHadirAdminClient
          kegiatanId={kegiatan.id}
          kegiatanAwal={KEGIATAN_LIST}
          opdList={OPD_LIST}
          sesiAwal={SESI_LIST}
          presensiAwal={PRESENSI_LIST}
        />
      ) : (
        <p className="text-sm text-ink-muted">Belum ada kegiatan. Tambahkan lewat menu Kegiatan.</p>
      )}
    </div>
  );
}