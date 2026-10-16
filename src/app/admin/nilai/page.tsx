import { KEGIATAN_LIST, NILAI_UJIAN_LIST, OPD_LIST } from "@/data/dummy";
import NilaiClient from "./NilaiClient";

export default function InputNilaiPage() {
  return <NilaiClient opd={OPD_LIST} kegiatan={KEGIATAN_LIST} nilai={NILAI_UJIAN_LIST} />;
}