import { ambilDaftarKegiatan } from "@/lib/data/kegiatan";
import { ambilDaftarOpd, ambilPegawaiOpd } from "@/lib/data/opd";
import { ambilPresensiKegiatan } from "@/lib/data/presensi";
import { ambilSesiKegiatan } from "@/lib/data/sesi";
import { ambilAdmin } from "@/lib/pengguna";
import DaftarHadirAdminClient from "./DaftarHadirAdminClient";

export default async function KelolaDaftarHadirPage() {
  await ambilAdmin();

  // kegiatan aktif, kalau tidak ada pakai yang pertama
  const daftar = await ambilDaftarKegiatan();
  const kegiatan = daftar.find((k) => k.aktif) ?? daftar[0];

  let data = null;
  if (kegiatan) {
    const sesiList = await ambilSesiKegiatan(kegiatan.id);
    const [opdList, pegawaiList, presensi] = await Promise.all([
      ambilDaftarOpd(),
      ambilPegawaiOpd(),
      ambilPresensiKegiatan(sesiList.map((s) => s.id)),
    ]);
    data = { kegiatan, sesiList, opdList, pegawaiList, presensi };
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Kelola Daftar Hadir</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Atur sesi pembinaan, ambang kehadiran, dan pantau kehadiran pegawai OPD.
        </p>
      </header>

      {data ? (
        <DaftarHadirAdminClient {...data} />
      ) : (
        <p className="text-sm text-ink-muted">Belum ada kegiatan. Tambahkan lewat menu Kegiatan.</p>
      )}
    </div>
  );
}