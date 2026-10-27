import { BAB_LIST, BAB_SELESAI_LIST, MODUL_LIST } from "@/data/modul";
import { ambilOperator } from "@/lib/operator";
import ModulClient from "./ModulClient";

export default async function ModulPembelajaranPage() {
  const { opd } = await ambilOperator();

  const modul = MODUL_LIST[0];
  const babList = BAB_LIST.filter((b) => b.modulId === modul.id).sort(
    (a, b) => a.urutan - b.urutan,
  );
  const babSelesaiAwal = BAB_SELESAI_LIST.filter((s) => s.opdId === opd.id).map((s) => s.babId);

  return <ModulClient modul={modul} babList={babList} babSelesaiAwal={babSelesaiAwal} />;
}