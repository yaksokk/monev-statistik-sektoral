import ModulClient from "@/components/modul/ModulClient";
import KartuQuiz from "@/components/quiz/KartuQuiz";
import { ambilKegiatanAktif } from "@/lib/data/kegiatan";
import { ambilBabModul, ambilIdBabSelesaiSaya, ambilModul } from "@/lib/data/modul";
import { ambilQuizPegawai, finalkanSesiSaya } from "@/lib/data/quiz";
import { ambilOperator } from "@/lib/operator";
import { waktuSekarang } from "@/lib/presensi";

const PEMBINAAN = 1;

interface Props {
  searchParams: Promise<{ bab?: string }>;
}

export default async function Pembinaan1Page({ searchParams }: Props) {
  const { pengguna, opd } = await ambilOperator();
  const { bab } = await searchParams;
  const sekarang = waktuSekarang();

  // quiz mengikuti kegiatan aktif; Pre-Test yang dimatikan admin disembunyikan
  const kegiatan = await ambilKegiatanAktif();
  await finalkanSesiSaya();
  const [modul, babSelesai, pre] = await Promise.all([
    ambilModul(),
    ambilIdBabSelesaiSaya(pengguna.id),
    ambilQuizPegawai(kegiatan, "pretest", pengguna.id),
  ]);
  const babList = modul
    ? (await ambilBabModul(modul.id)).filter((b) => b.pembinaan === PEMBINAAN)
    : [];

  // bab dari tautan dashboard; id tidak dikenal jatuh ke bab pertama
  const indeksAwal = Math.max(
    0,
    babList.findIndex((b) => b.id === bab),
  );

  const rentang =
    babList.length > 0
      ? `bab ${babList[0].urutan}-${babList[babList.length - 1].urutan}`
      : "belum ada bab";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Pembinaan {PEMBINAAN}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {pre.aktif ? "Pre-Test dan " : ""}Modul Pembelajaran {rentang} · {opd.nama}
        </p>
      </header>

      {pre.aktif && (
        <KartuQuiz
          nama="Pre-Test"
          deskripsi="Uji pemahaman dasar sebelum mempelajari modul."
          href="/opd/pembinaan-1/pre-test"
          pengaturan={pre.pengaturan}
          jumlahSoal={pre.jumlahSoal}
          ringkasan={pre.hasil}
          sekarang={sekarang}
          diizinkan={pre.diizinkan}
        />
      )}

      {modul && babList.length > 0 ? (
        <ModulClient
          modul={modul}
          babList={babList}
          babSelesai={babSelesai}
          indeksAwal={indeksAwal}
        />
      ) : (
        <p className="text-sm text-ink-muted">Belum ada bab modul untuk pembinaan ini.</p>
      )}
    </div>
  );
}