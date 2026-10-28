import ModulClient from "@/components/modul/ModulClient";
import KartuQuiz from "@/components/quiz/KartuQuiz";
import {
  HASIL_QUIZ_LIST,
  PENGATURAN_POSTTEST,
  PENGATURAN_PRETEST,
  SOAL_POSTTEST,
} from "@/data/dummy";
import { BAB_LIST, BAB_SELESAI_LIST, MODUL_LIST } from "@/data/modul";
import { ambilOperator } from "@/lib/operator";
import { waktuSekarang } from "@/lib/presensi";

const PEMBINAAN = 2;

interface Props {
  searchParams: Promise<{ bab?: string }>;
}

export default async function Pembinaan2Page({ searchParams }: Props) {
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

  const hasilOpd = HASIL_QUIZ_LIST.filter((h) => h.opdId === opd.id);
  const hasil = hasilOpd.find((h) => h.quizId === PENGATURAN_POSTTEST.id) ?? null;
  const sudahPreTest = hasilOpd.some((h) => h.quizId === PENGATURAN_PRETEST.id);

  const rentang =
    babList.length > 0
      ? `bab ${babList[0].urutan}-${babList[babList.length - 1].urutan}`
      : "belum ada bab";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Pembinaan {PEMBINAAN}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Modul Pembelajaran {rentang} dan Post-Test · {opd.nama}
        </p>
      </header>

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

      <KartuQuiz
        nama="Post-Test"
        deskripsi="Uji kompetensi akhir untuk mengukur peningkatan pemahaman."
        href="/opd/pembinaan-2/post-test"
        pengaturan={PENGATURAN_POSTTEST}
        soalList={SOAL_POSTTEST}
        hasil={hasil}
        sekarang={sekarang}
        prasyarat={{
          terpenuhi: sudahPreTest,
          pesan: "Post-Test baru terbuka setelah Pre-Test selesai dikerjakan.",
        }}
      />
    </div>
  );
}