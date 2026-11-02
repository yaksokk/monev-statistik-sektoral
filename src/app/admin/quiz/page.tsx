import {
  HASIL_QUIZ_LIST,
  IZIN_KERJA_ULANG_LIST,
  KEGIATAN_LIST,
  LOG_PERUBAHAN_QUIZ_LIST,
  OPD_LIST,
  PENGATURAN_QUIZ_LIST,
  PENGGUNA_LIST,
  SOAL_QUIZ_LIST,
} from "@/data/dummy";
import QuizAdminClient from "./QuizAdminClient";

// Pegawai OPD (operator); izin kerjakan ulang dan rekap hasil per pegawai
const PEGAWAI_LIST = PENGGUNA_LIST.filter((p) => p.peran === "operator" && p.opdId);

export default function KelolaQuizPage() {
  // kegiatan aktif, kalau tidak ada pakai yang pertama
  const kegiatan = KEGIATAN_LIST.find((k) => k.aktif) ?? KEGIATAN_LIST[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Kelola Quiz</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Atur soal, waktu, dan durasi Pre-Test dan Post-Test, lalu pantau hasil tiap pegawai.
        </p>
      </header>

      {kegiatan ? (
        <QuizAdminClient
          kegiatanId={kegiatan.id}
          kegiatanAwal={KEGIATAN_LIST}
          opdList={OPD_LIST}
          penggunaList={PEGAWAI_LIST}
          soalAwal={SOAL_QUIZ_LIST}
          pengaturanAwal={PENGATURAN_QUIZ_LIST}
          hasilAwal={HASIL_QUIZ_LIST}
          izinAwal={IZIN_KERJA_ULANG_LIST}
          logAwal={LOG_PERUBAHAN_QUIZ_LIST}
        />
      ) : (
        <p className="text-sm text-ink-muted">Belum ada kegiatan. Tambahkan lewat menu Kegiatan.</p>
      )}
    </div>
  );
}