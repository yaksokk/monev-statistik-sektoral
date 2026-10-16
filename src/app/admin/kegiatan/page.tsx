import { KEGIATAN_LIST } from "@/data/dummy";
import KegiatanClient from "./KegiatanClient";

export default function KelolaKegiatanPage() {
  return <KegiatanClient awal={KEGIATAN_LIST} />;
}