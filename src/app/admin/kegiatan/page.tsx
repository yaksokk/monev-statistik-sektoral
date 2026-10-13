import { KEGIATAN_LIST, TAHAP_LIST } from "@/data/dummy";
import KegiatanClient from "./KegiatanClient";

export default function KelolaKegiatanPage() {
  return <KegiatanClient awal={KEGIATAN_LIST} tahap={TAHAP_LIST} />;
}
