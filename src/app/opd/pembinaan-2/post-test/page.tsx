import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuizClient from "@/components/quiz/QuizClient";
import {
  HASIL_QUIZ_LIST,
  PENGATURAN_POSTTEST,
  PENGATURAN_PRETEST,
  SOAL_POSTTEST,
} from "@/data/dummy";
import { ambilOperator } from "@/lib/operator";

export default async function PostTestPage() {
  const { opd } = await ambilOperator();

  const hasilOpd = HASIL_QUIZ_LIST.filter((h) => h.opdId === opd.id);
  const hasil = hasilOpd.find((h) => h.quizId === PENGATURAN_POSTTEST.id) ?? null;
  const sudahPreTest = hasilOpd.some((h) => h.quizId === PENGATURAN_PRETEST.id);

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/opd/pembinaan-2"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke Pembinaan 2
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Post-Test</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Uji kompetensi akhir untuk mengukur peningkatan pemahaman pasca pelatihan · {opd.nama}
        </p>
      </header>

      {/* Dummy: kunci ikut dikirim ke browser. Setelah ada server, penilaian dilakukan di server */}
      <QuizClient
        opdId={opd.id}
        nama="Post-Test"
        pengaturan={PENGATURAN_POSTTEST}
        soalList={SOAL_POSTTEST}
        hasilAwal={hasil}
        prasyarat={{
          terpenuhi: sudahPreTest,
          pesan: "Post-Test baru terbuka setelah Pre-Test selesai dikerjakan.",
        }}
      />
    </div>
  );
}