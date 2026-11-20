import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuizClient from "@/components/quiz/QuizClient";
import { ambilKegiatanAktif } from "@/lib/data/kegiatan";
import { ambilQuizPegawai, finalkanSesiSaya } from "@/lib/data/quiz";
import { ambilOperator } from "@/lib/operator";

const KELAS_PESAN = "rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink-muted";

export default async function PreTestPage() {
  const { pengguna, opd } = await ambilOperator();

  const kegiatan = await ambilKegiatanAktif();
  // sesi yang waktunya sudah lewat (browser ditutup) dijadikan hasil dulu
  await finalkanSesiSaya();
  const pre = await ambilQuizPegawai(kegiatan, "pretest", pengguna.id, { rincian: true });

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
        /* Kunci tidak pernah dikirim ke browser sebelum jawaban terkirim; penilaian di server */
        <QuizClient
          kegiatanId={kegiatan.id}
          jenis="pretest"
          nama="Pre-Test"
          pengaturan={pre.pengaturan}
          jumlahSoal={pre.jumlahSoal}
          hasil={pre.hasil}
          review={pre.review}
          sesi={pre.sesi}
          diizinkan={pre.diizinkan}
        />
      )}
    </div>
  );
}