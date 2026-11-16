import { ambilDaftarOpd, ambilPegawaiOpd } from "@/lib/data/opd";
import { ambilAdmin } from "@/lib/pengguna";
import OpdClient from "./OpdClient";

export default async function KelolaOpdPage() {
  await ambilAdmin();
  const [opd, pegawai] = await Promise.all([ambilDaftarOpd(), ambilPegawaiOpd()]);

  // Semua OPD dikirim, termasuk yang belum punya pegawai
  return <OpdClient opdAwal={opd} pegawaiAwal={pegawai} />;
}