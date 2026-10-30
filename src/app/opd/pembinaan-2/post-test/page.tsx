import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuizClient from "@/components/quiz/QuizClient";
import { ambilOperator } from "@/lib/operator";
import { ambilQuizOpd, kegiatanBerjalan } from "@/lib/quiz-opd";

const KELAS_PESAN = "rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink-muted";

export default async function PostTestPage() {
  const { opd } = await ambilOperator();

  const kegiatan = kegiatanBerjalan();
  const pre = ambilQuizOpd(kegiatan, "pretest", opd.id);
  const post = ambilQuizOpd(kegiatan, "posttest", opd.id);

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

      {!post.aktif ? (
        <p className={KELAS_PESAN}>Post-Test tidak dipakai di kegiatan ini.</p>
      ) : !kegiatan || !post.pengaturan ? (
        <p className={KELAS_PESAN}>Post-Test belum dibuka oleh admin.</p>
      ) : (
        /* Dummy: kunci ikut dikirim ke browser. Setelah ada server, penilaian dilakukan di server */
        <QuizClient
          opdId={opd.id}
          kegiatanId={kegiatan.id}
          nama="Post-Test"
          pengaturan={post.pengaturan}
          soalList={post.soal}
          hasilAwal={post.hasil}
          diizinkan={post.diizinkan}
          prasyarat={
            pre.aktif
              ? {
                  terpenuhi: pre.hasil !== null,
                  pesan: "Post-Test baru terbuka setelah Pre-Test selesai dikerjakan.",
                }
              : undefined
          }
        />
      )}
    </div>
  );
}