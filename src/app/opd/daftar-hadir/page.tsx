import { ambilKegiatanAktif } from "@/lib/data/kegiatan";
import { ambilPresensiSaya } from "@/lib/data/presensi";
import { ambilSesiKegiatan } from "@/lib/data/sesi";
import { ambilOperator } from "@/lib/operator";
import DaftarHadirClient from "./DaftarHadirClient";

export default async function DaftarHadirPage() {
  const { pengguna, opd } = await ambilOperator();

  const kegiatan = await ambilKegiatanAktif();
  const sesiList = kegiatan ? await ambilSesiKegiatan(kegiatan.id) : [];
  const presensi = await ambilPresensiSaya(
    pengguna.id,
    opd.id,
    sesiList.map((s) => s.id),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Daftar Hadir Pembinaan</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Isi presensi sesuai jadwal sesi pembinaan Statistik Sektoral · {opd.nama}
        </p>
      </header>

      {kegiatan ? (
        <DaftarHadirClient sesiList={sesiList} presensi={presensi} />
      ) : (
        <p className="text-sm text-ink-muted">Belum ada kegiatan aktif.</p>
      )}
    </div>
  );
}