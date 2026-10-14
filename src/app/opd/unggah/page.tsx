import { DOKUMEN_LIST, ITEM_LIST, KEGIATAN_LIST, TAHAP_LIST } from "@/data/dummy";
import { ambilOperator } from "@/lib/operator";
import UnggahClient from "./UnggahClient";

export default async function UnggahPage({
  searchParams,
}: {
  searchParams: Promise<{ kegiatan?: string; tahap?: string }>;
}) {
  const { kegiatan, tahap } = await searchParams;
  const { opd } = await ambilOperator();

  // hanya dokumen milik OPD yang sedang login
  const dokumen = DOKUMEN_LIST.filter((d) => d.opdId === opd.id);

  return (
    <UnggahClient
      opd={opd}
      kegiatan={KEGIATAN_LIST}
      tahap={TAHAP_LIST}
      item={ITEM_LIST}
      dokumen={dokumen}
      kegiatanAwal={kegiatan}
      tahapAwal={tahap}
    />
  );
}