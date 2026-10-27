import QuizClient from "@/components/quiz/QuizClient";
import {
  HASIL_QUIZ_LIST,
  PENGATURAN_EVALUASI,
  PENGATURAN_POSTTEST,
  PENGATURAN_PRETEST,
  SOAL_EVALUASI,
} from "@/data/dummy";
import { ambilOperator } from "@/lib/operator";

export default async function EvaluasiPendalamanPage() {
  const { opd } = await ambilOperator();

  const hasilOpd = HASIL_QUIZ_LIST.filter((h) => h.opdId === opd.id);
  const hasil = hasilOpd.find((h) => h.quizId === PENGATURAN_EVALUASI.id) ?? null;

  // Terkunci sampai Pre-Test dan Post-Test sama-sama selesai
  const belumSelesai = [PENGATURAN_PRETEST, PENGATURAN_POSTTEST]
    .filter((q) => !hasilOpd.some((h) => h.quizId === q.id))
    .map((q) => (q.id === PENGATURAN_PRETEST.id ? "Pre-Test" : "Post-Test"));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Evaluasi Pendalaman</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Evaluasi pemahaman mendalam penerapan SDI & EPSS · {opd.nama}
        </p>
      </header>

      {/* Dummy: kunci ikut dikirim ke browser. Setelah ada server, penilaian dilakukan di server */}
      <QuizClient
        opdId={opd.id}
        nama="Evaluasi Pendalaman"
        pengaturan={PENGATURAN_EVALUASI}
        soalList={SOAL_EVALUASI}
        hasilAwal={hasil}
        prasyarat={{
          terpenuhi: belumSelesai.length === 0,
          pesan: `Evaluasi Pendalaman baru terbuka setelah ${belumSelesai.join(" dan ")} selesai dikerjakan.`,
        }}
      />
    </div>
  );
}