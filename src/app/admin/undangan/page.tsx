import { ambilDaftarOpd } from "@/lib/data/opd";
import { ambilUndanganAdmin } from "@/lib/data/undangan";
import UndanganClient from "./UndanganClient";

export default async function UndanganPage() {
  const [daftar, opdList] = await Promise.all([ambilUndanganAdmin(), ambilDaftarOpd()]);
  return <UndanganClient daftar={daftar} opdList={opdList} />;
}