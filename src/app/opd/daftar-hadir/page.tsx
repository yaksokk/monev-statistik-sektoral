import { PRESENSI_LIST, SESI_LIST } from "@/data/dummy";
import { ambilOperator } from "@/lib/operator";
import DaftarHadirClient from "./DaftarHadirClient";

export default async function DaftarHadirPage() {
  const { opd } = await ambilOperator();

  const sesiList = [...SESI_LIST].sort((a, b) => a.urutan - b.urutan);
  const presensi = PRESENSI_LIST.filter((p) => p.opdId === opd.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Daftar Hadir Pembinaan</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Isi presensi sesuai jadwal sesi pembinaan Statistik Sektoral · {opd.nama}
        </p>
      </header>

      <DaftarHadirClient opdId={opd.id} sesiList={sesiList} presensiAwal={presensi} />
    </div>
  );
}