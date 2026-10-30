import { KEGIATAN_LIST, PRESENSI_LIST, SESI_LIST } from "@/data/dummy";
import { ambilOperator } from "@/lib/operator";
import { sesiKegiatan } from "@/lib/presensi";
import DaftarHadirClient from "./DaftarHadirClient";

export default async function DaftarHadirPage() {
  const { opd } = await ambilOperator();

  // OPD hanya melihat sesi kegiatan aktif
  const kegiatan = KEGIATAN_LIST.find((k) => k.aktif);
  const sesiList = kegiatan ? sesiKegiatan(SESI_LIST, kegiatan.id) : [];
  const idSesi = new Set(sesiList.map((s) => s.id));
  const presensi = PRESENSI_LIST.filter((p) => p.opdId === opd.id && idSesi.has(p.sesiId));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Daftar Hadir Pembinaan</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Isi presensi sesuai jadwal sesi pembinaan Statistik Sektoral · {opd.nama}
        </p>
      </header>

      {kegiatan ? (
        <DaftarHadirClient opdId={opd.id} sesiList={sesiList} presensiAwal={presensi} />
      ) : (
        <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-ink-muted shadow-card">
          Belum ada kegiatan aktif.
        </p>
      )}
    </div>
  );
}