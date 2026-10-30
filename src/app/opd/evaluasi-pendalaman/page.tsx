import QuizClient from "@/components/quiz/QuizClient";
import { ambilOperator } from "@/lib/operator";
import { ambilQuizOpd, kegiatanBerjalan } from "@/lib/quiz-opd";

const KELAS_PESAN = "rounded-lg bg-surface-muted px-4 py-3 text-sm text-ink-muted";

export default async function EvaluasiPendalamanPage() {
  const { opd } = await ambilOperator();

  const kegiatan = kegiatanBerjalan();
  const pre = ambilQuizOpd(kegiatan, "pretest", opd.id);
  const post = ambilQuizOpd(kegiatan, "posttest", opd.id);
  const evaluasi = ambilQuizOpd(kegiatan, "evaluasi", opd.id);

  // Terkunci sampai Pre-Test dan Post-Test yang aktif sama-sama selesai
  const belumSelesai = [
    pre.aktif && !pre.hasil ? "Pre-Test" : null,
    post.aktif && !post.hasil ? "Post-Test" : null,
  ].filter((nama): nama is string => nama !== null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Evaluasi Pendalaman</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Evaluasi pemahaman mendalam penerapan SDI & EPSS · {opd.nama}
        </p>
      </header>

      {!evaluasi.aktif ? (
        <p className={KELAS_PESAN}>Evaluasi Pendalaman tidak dipakai di kegiatan ini.</p>
      ) : !kegiatan || !evaluasi.pengaturan ? (
        <p className={KELAS_PESAN}>Evaluasi Pendalaman belum dibuka oleh admin.</p>
      ) : (
        /* Dummy: kunci ikut dikirim ke browser. Setelah ada server, penilaian dilakukan di server */
        <QuizClient
          opdId={opd.id}
          kegiatanId={kegiatan.id}
          nama="Evaluasi Pendalaman"
          pengaturan={evaluasi.pengaturan}
          soalList={evaluasi.soal}
          hasilAwal={evaluasi.hasil}
          diizinkan={evaluasi.diizinkan}
          prasyarat={{
            terpenuhi: belumSelesai.length === 0,
            pesan: `Evaluasi Pendalaman baru terbuka setelah ${belumSelesai.join(" dan ")} selesai dikerjakan.`,
          }}
        />
      )}
    </div>
  );
}