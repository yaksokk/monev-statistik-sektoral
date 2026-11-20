import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuizClient from "@/components/quiz/QuizClient";
import { ambilKegiatanAktif } from "@/lib/data/kegiatan";
import { ambilQuizPegawai, finalkanSesiSaya } from "@/lib/data/quiz";
import { ambilOperator } from "@/lib/operator";

const KELAS_PESAN = "rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink-muted";

export default async function PostTestPage() {
  const { pengguna, opd } = await ambilOperator();

  const kegiatan = await ambilKegiatanAktif();
  // sesi yang waktunya sudah lewat (browser ditutup) dijadikan hasil dulu
  await finalkanSesiSaya();
  const [pre, post] = await Promise.all([
    ambilQuizPegawai(kegiatan, "pretest", pengguna.id),
    ambilQuizPegawai(kegiatan, "posttest", pengguna.id, { rincian: true }),
  ]);

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
        /* Kunci tidak pernah dikirim ke browser sebelum jawaban terkirim; penilaian di server */
        <QuizClient
          kegiatanId={kegiatan.id}
          jenis="posttest"
          nama="Post-Test"
          pengaturan={post.pengaturan}
          jumlahSoal={post.jumlahSoal}
          hasil={post.hasil}
          review={post.review}
          sesi={post.sesi}
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