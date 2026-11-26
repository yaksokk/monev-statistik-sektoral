import { ambilDokumenSaya } from "@/lib/data/dokumen";
import { ambilItemKegiatan, ambilKegiatanAktif } from "@/lib/data/kegiatan";
import { ambilOperator } from "@/lib/operator";
import DaftarDokumenClient from "./DaftarDokumenClient";

export default async function DaftarDokumenPage() {
  const { pengguna, opd } = await ambilOperator();

  // OPD hanya melihat kegiatan yang sedang aktif (ditentukan admin)
  const kegiatan = await ambilKegiatanAktif();

  if (!kegiatan) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-ink">Daftar dokumen</h1>
        <p className="text-sm text-ink-muted">Belum ada kegiatan yang aktif.</p>
      </div>
    );
  }

  // hanya item milik kegiatan aktif dan dokumen milik pegawai yang sedang login
  const [item, dokumen] = await Promise.all([
    ambilItemKegiatan(kegiatan.id),
    ambilDokumenSaya(pengguna.id, opd.id, kegiatan.id),
  ]);

  const opdAman = { id: opd.id, nama: opd.nama, singkatan: opd.singkatan };

  return (
    <DaftarDokumenClient
      opd={opdAman}
      kegiatan={kegiatan}
      item={item}
      dokumen={dokumen}
      unggahDibuka={kegiatan.unggahDibuka ?? false}
    />
  );
}