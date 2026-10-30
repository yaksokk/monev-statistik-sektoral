import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuizClient from "@/components/quiz/QuizClient";
import { ambilOperator } from "@/lib/operator";
import { ambilQuizOpd, kegiatanBerjalan } from "@/lib/quiz-opd";

const KELAS_PESAN = "rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink-muted";

export default async function PreTestPage() {
  const { opd } = await ambilOperator();

  const kegiatan = kegiatanBerjalan();
  const pre = ambilQuizOpd(kegiatan, "pretest", opd.id);

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/opd/pembinaan-1"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke Pembinaan 1
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Pre-Test</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Uji pemahaman dasar sebelum mempelajari Modul Pembinaan Statistik Sektoral · {opd.nama}
        </p>
      </header>

      {!pre.aktif ? (
        <p className={KELAS_PESAN}>Pre-Test tidak dipakai di kegiatan ini.</p>
      ) : !kegiatan || !pre.pengaturan ? (
        <p className={KELAS_PESAN}>Pre-Test belum dibuka oleh admin.</p>
      ) : (
        /* Dummy: kunci ikut dikirim ke browser. Setelah ada server, penilaian dilakukan di server */
        <QuizClient
          opdId={opd.id}
          kegiatanId={kegiatan.id}
          nama="Pre-Test"
          pengaturan={pre.pengaturan}
          soalList={pre.soal}
          hasilAwal={pre.hasil}
          diizinkan={pre.diizinkan}
        />
      )}
    </div>
  );
}