import { ambilAspekMonev } from "@/lib/data/monev";
import MonevIndikatorClient from "./MonevIndikatorClient";

export default async function MonevIndikatorPage() {
  const aspekList = await ambilAspekMonev();
  return <MonevIndikatorClient aspekList={aspekList} />;
}