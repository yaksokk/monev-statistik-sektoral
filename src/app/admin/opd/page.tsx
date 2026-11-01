import { OPD_LIST, PENGGUNA_LIST } from "@/data/dummy";
import OpdClient from "./OpdClient";

export default function KelolaOpdPage() {
  const pegawai = PENGGUNA_LIST.filter((p) => p.peran === "operator" && p.opdId);

  // Semua OPD dikirim (termasuk yang belum punya pegawai) supaya id OPD baru tidak bentrok
  return <OpdClient opdAwal={OPD_LIST} pegawaiAwal={pegawai} />;
}