import ModulClient from "@/components/modul/ModulClient";
import KartuQuiz from "@/components/quiz/KartuQuiz";
import { HASIL_QUIZ_LIST, PENGATURAN_PRETEST, SOAL_PRETEST } from "@/data/dummy";
import { BAB_LIST, BAB_SELESAI_LIST, MODUL_LIST } from "@/data/modul";
import { ambilOperator } from "@/lib/operator";
import { waktuSekarang } from "@/lib/presensi";

const PEMBINAAN = 1;

interface Props {
  searchParams: Promise<{ bab?: string }>;
}

export default async function Pembinaan1Page({ searchParams }: Props) {
  const { opd } = await ambilOperator();
  const { bab } = await searchParams;
  const sekarang = waktuSekarang();

  const modul = MODUL_LIST[0];
  const babList = BAB_LIST.filter(
    (b) => b.modulId === modul.id && b.pembinaan === PEMBINAAN,
  ).sort((a, b) => a.urutan - b.urutan);
  const babSelesaiAwal = BAB_SELESAI_LIST.filter((s) => s.opdId === opd.id).map((s) => s.babId);

  // bab dari tautan dashboard; id tidak dikenal jatuh ke bab pertama
  const indeksAwal = Math.max(
    0,
    babList.findIndex((b) => b.id === bab),
  );

  const hasil =
    HASIL_QUIZ_LIST.find((h) => h.opdId === opd.id && h.quizId === PENGATURAN_PRETEST.id) ?? null;

  const rentang =
    babList.length > 0
      ? `bab ${babList[0].urutan}-${babList[babList.length - 1].urutan}`
      : "belum ada bab";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Pembinaan {PEMBINAAN}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Pre-Test dan Modul Pembelajaran {rentang} · {opd.nama}
        </p>
      </header>

      <KartuQuiz
        nama="Pre-Test"
        deskripsi="Uji pemahaman dasar sebelum mempelajari modul."
        href="/opd/pembinaan-1/pre-test"
        pengaturan={PENGATURAN_PRETEST}
        soalList={SOAL_PRETEST}
        hasil={hasil}
        sekarang={sekarang}
      />

      {babList.length > 0 ? (
        <ModulClient
          modul={modul}
          babList={babList}
          babSelesaiAwal={babSelesaiAwal}
          indeksAwal={indeksAwal}
        />
      ) : (
        <p className="text-sm text-ink-muted">Belum ada bab modul untuk pembinaan ini.</p>
      )}
    </div>
  );
}