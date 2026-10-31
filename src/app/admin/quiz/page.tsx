import { Suspense } from "react";
import {
  HASIL_QUIZ_LIST,
  IZIN_KERJA_ULANG_LIST,
  KEGIATAN_LIST,
  LOG_PERUBAHAN_QUIZ_LIST,
  OPD_LIST,
  PENGATURAN_QUIZ_LIST,
  SOAL_QUIZ_LIST,
} from "@/data/dummy";
import QuizAdminClient from "./QuizAdminClient";

type SearchParams = Promise<{ kegiatan?: string }>;

export default function KelolaQuizPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Kelola Quiz</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Atur soal, waktu, dan durasi Pre-Test dan Post-Test, lalu pantau hasil OPD per kegiatan.
        </p>
      </header>

      {/* isi bergantung pada ?kegiatan=, jadi dialirkan di balik Suspense */}
      <Suspense fallback={<p className="text-sm text-ink-muted">Memuat kelola quiz…</p>}>
        <Isi searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: SearchParams }) {
  const { kegiatan: param } = await searchParams;

  // default: kegiatan aktif, kalau tidak ada pakai yang pertama
  const kegiatan =
    KEGIATAN_LIST.find((k) => k.id === param) ??
    KEGIATAN_LIST.find((k) => k.aktif) ??
    KEGIATAN_LIST[0];

  if (!kegiatan) {
    return <p className="text-sm text-ink-muted">Belum ada kegiatan. Tambahkan lewat menu Kegiatan.</p>;
  }

  return (
    <QuizAdminClient
      kegiatanId={kegiatan.id}
      kegiatanAwal={KEGIATAN_LIST}
      opdList={OPD_LIST}
      soalAwal={SOAL_QUIZ_LIST}
      pengaturanAwal={PENGATURAN_QUIZ_LIST}
      hasilAwal={HASIL_QUIZ_LIST}
      izinAwal={IZIN_KERJA_ULANG_LIST}
      logAwal={LOG_PERUBAHAN_QUIZ_LIST}
    />
  );
}