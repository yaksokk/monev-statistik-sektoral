import { DOKUMEN_LIST, KEGIATAN_LIST, NILAI_UJIAN_LIST } from "@/data/dummy";
import KegiatanClient from "./KegiatanClient";

export default function KelolaKegiatanPage() {
  // kegiatan yang sudah punya dokumen terunggah atau nilai
  const idBerdata = new Set<string>();
  for (const d of DOKUMEN_LIST) if (d.status !== "belum") idBerdata.add(d.kegiatanId);
  for (const n of NILAI_UJIAN_LIST) if (n.nilai !== null) idBerdata.add(n.kegiatanId);

  return <KegiatanClient awal={KEGIATAN_LIST} idBerdata={[...idBerdata]} />;
}