import { OPD_LIST, UNDANGAN_LIST } from "@/data/dummy";
import UndanganClient from "./UndanganClient";

export default function UndanganPage() {
  return <UndanganClient awal={UNDANGAN_LIST} opdList={OPD_LIST} />;
}