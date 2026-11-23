import ModulClient from "@/components/modul/ModulClient";
import KartuQuiz from "@/components/quiz/KartuQuiz";
import { ambilKegiatanAktif } from "@/lib/data/kegiatan";
import { ambilBabModul, ambilIdBabSelesaiSaya, ambilModul } from "@/lib/data/modul";
import { ambilQuizPegawai, finalkanSesiSaya } from "@/lib/data/quiz";
import { ambilOperator } from "@/lib/operator";
import { waktuSekarang } from "@/lib/presensi";

const PEMBINAAN = 2;

interface Props {
  searchParams: Promise<{ bab?: string }>;
}

export default async function Pembinaan2Page({ searchParams }: Props) {
  const { pengguna, opd } = await ambilOperator();
  const { bab } = await searchParams;
  const sekarang = waktuSekarang();

  // quiz mengikuti kegiatan aktif; Post-Test yang dimatikan admin disembunyikan
  const kegiatan = await ambilKegiatanAktif();
  await finalkanSesiSaya();
  const [modul, babSelesai, pre, post] = await Promise.all([
    ambilModul(),
    ambilIdBabSelesaiSaya(pengguna.id),
    ambilQuizPegawai(kegiatan, "pretest", pengguna.id),
    ambilQuizPegawai(kegiatan, "posttest", pengguna.id),
  ]);
  const babList = modul
    ? (await ambilBabModul(modul.id)).filter((b) => b.pembinaan === PEMBINAAN)
    : [];

  // bab dari tautan dashboard; id tidak dikenal jatuh ke bab pertama
  const indeksAwal = Math.max(
    0,
    babList.findIndex((b) => b.id === bab),
  );


  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Pembinaan {PEMBINAAN}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Modul Pembelajaran
{post.aktif ? " dan Post-Test" : ""} · {opd.nama}
        </p>
      </header>

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

      {post.aktif && (
        <KartuQuiz
          nama="Post-Test"
          deskripsi="Uji kompetensi akhir untuk mengukur peningkatan pemahaman."
          href="/opd/pembinaan-2/post-test"
          pengaturan={post.pengaturan}
          jumlahSoal={post.jumlahSoal}
          ringkasan={post.hasil}
          sekarang={sekarang}
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