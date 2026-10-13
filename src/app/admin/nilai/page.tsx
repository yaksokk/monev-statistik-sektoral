import { NILAI_UJIAN_LIST, OPD_LIST, TAHAP_LIST } from "@/data/dummy";
import NilaiClient from "./NilaiClient";

export default function InputNilaiPage() {
  return <NilaiClient opd={OPD_LIST} tahap={TAHAP_LIST} nilai={NILAI_UJIAN_LIST} />;
}
