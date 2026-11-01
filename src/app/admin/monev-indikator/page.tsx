import { ASPEK_MONEV_LIST } from "@/data/monev-indikator";
import MonevIndikatorClient from "./MonevIndikatorClient";

export default function MonevIndikatorPage() {
  return <MonevIndikatorClient aspekList={ASPEK_MONEV_LIST} />;
}