import { ambilDokumenKegiatan } from "@/lib/data/dokumen";
import { ambilItemKegiatan, ambilKegiatanAktif } from "@/lib/data/kegiatan";
import { ambilDaftarOpd, ambilPegawaiOpd } from "@/lib/data/opd";
import { ambilAdmin } from "@/lib/pengguna";
import type { Dokumen, ItemDokumen } from "@/lib/types";
import OpdClient from "./OpdClient";

export default async function KelolaOpdPage() {
  await ambilAdmin();
  const [opd, pegawai, kegiatan] = await Promise.all([
    ambilDaftarOpd(),
    ambilPegawaiOpd(),
    ambilKegiatanAktif(),
  ]);

  // Dokumen hanya untuk kegiatan aktif (dilihat lewat tombol "Dokumen" per pegawai)
  const [item, dokumen]: [ItemDokumen[], Dokumen[]] = kegiatan
    ? await Promise.all([ambilItemKegiatan(kegiatan.id), ambilDokumenKegiatan(kegiatan.id)])
    : [[], []];

  // Semua OPD dikirim, termasuk yang belum punya pegawai
  return (
    <OpdClient
      opdAwal={opd}
      pegawaiAwal={pegawai}
      kegiatanAktif={kegiatan}
      itemAwal={item}
      dokumenAwal={dokumen}
    />
  );
}