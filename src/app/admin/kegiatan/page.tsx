import { DOKUMEN_LIST, HASIL_QUIZ_LIST, KEGIATAN_LIST, NILAI_UJIAN_LIST } from "@/data/dummy";
import KegiatanClient from "./KegiatanClient";

export default function KelolaKegiatanPage() {
  // kegiatan yang sudah punya dokumen terunggah, nilai, atau hasil quiz
  const idBerdata = new Set<string>();
  for (const d of DOKUMEN_LIST) if (d.status !== "belum") idBerdata.add(d.kegiatanId);
  for (const n of NILAI_UJIAN_LIST) if (n.nilai !== null) idBerdata.add(n.kegiatanId);
  for (const h of HASIL_QUIZ_LIST) idBerdata.add(h.kegiatanId);

  // jumlah OPD yang sudah mengerjakan, kunci "kegiatanId:quizId"
  const hasilQuiz: Record<string, number> = {};
  for (const h of HASIL_QUIZ_LIST) {
    const kunci = `${h.kegiatanId}:${h.quizId}`;
    hasilQuiz[kunci] = (hasilQuiz[kunci] ?? 0) + 1;
  }

  return <KegiatanClient awal={KEGIATAN_LIST} idBerdata={[...idBerdata]} hasilQuiz={hasilQuiz} />;
}