import { BAB_LIST, BAB_SELESAI_LIST, MODUL_LIST } from "@/data/modul";
import { ambilOperator } from "@/lib/operator";
import ModulClient from "./ModulClient";

interface Props {
  searchParams: Promise<{ bab?: string }>;
}

export default async function ModulPembelajaranPage({ searchParams }: Props) {
  const { opd } = await ambilOperator();
  const { bab } = await searchParams;

  const modul = MODUL_LIST[0];
  const babList = BAB_LIST.filter((b) => b.modulId === modul.id).sort(
    (a, b) => a.urutan - b.urutan,
  );
  const babSelesaiAwal = BAB_SELESAI_LIST.filter((s) => s.opdId === opd.id).map((s) => s.babId);

  // bab dari tautan dashboard; id tidak dikenal jatuh ke bab pertama
  const indeksAwal = Math.max(
    0,
    babList.findIndex((b) => b.id === bab),
  );

  return (
    <ModulClient
      modul={modul}
      babList={babList}
      babSelesaiAwal={babSelesaiAwal}
      indeksAwal={indeksAwal}
    />
  );
}