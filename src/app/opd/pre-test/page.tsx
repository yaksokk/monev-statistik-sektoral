import QuizClient from "@/components/quiz/QuizClient";
import { HASIL_QUIZ_LIST, PENGATURAN_PRETEST, SOAL_PRETEST } from "@/data/dummy";
import { ambilOperator } from "@/lib/operator";

export default async function PreTestPage() {
  const { opd } = await ambilOperator();

  const hasil =
    HASIL_QUIZ_LIST.find((h) => h.opdId === opd.id && h.quizId === PENGATURAN_PRETEST.id) ?? null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Pre-Test</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Uji pemahaman dasar sebelum mempelajari Modul Pembinaan Statistik Sektoral · {opd.nama}
        </p>
      </header>

      {/* Dummy: kunci ikut dikirim ke browser. Setelah ada server, penilaian dilakukan di server */}
      <QuizClient
        opdId={opd.id}
        nama="Pre-Test"
        pengaturan={PENGATURAN_PRETEST}
        soalList={SOAL_PRETEST}
        hasilAwal={hasil}
      />
    </div>
  );
}