import { OPD_LIST, PENGGUNA_LIST } from "@/data/dummy";
import OpdClient, { type BarisOpd } from "./OpdClient";

export default function KelolaOpdPage() {
  const operator = PENGGUNA_LIST.filter((p) => p.peran === "operator");

  const baris: BarisOpd[] = OPD_LIST.flatMap((opd) => {
    const op = operator.find((p) => p.opdId === opd.id);
    return op ? [{ opd, operator: op }] : [];
  });

  return <OpdClient awal={baris} />;
}
