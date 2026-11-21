import { ambilDaftarKegiatan } from "@/lib/data/kegiatan";
import { ambilDataQuizAdmin } from "@/lib/data/quiz";
import QuizAdminClient from "./QuizAdminClient";

export default async function KelolaQuizPage() {
  // kegiatan aktif, kalau tidak ada pakai yang pertama
  const daftar = await ambilDaftarKegiatan();
  const kegiatan = daftar.find((k) => k.aktif) ?? daftar[0];
  const data = kegiatan ? await ambilDataQuizAdmin(kegiatan.id) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Kelola Quiz</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Atur soal, waktu, dan durasi Pre-Test dan Post-Test, lalu pantau hasil tiap pegawai.
        </p>
      </header>

      {kegiatan && data ? (
        <QuizAdminClient
          kegiatan={kegiatan}
          opdList={data.opdList}
          penggunaList={data.penggunaList}
          soalList={data.soalList}
          pengaturanList={data.pengaturanList}
          hasilList={data.hasilList}
          izinList={data.izinList}
          logList={data.logList}
        />
      ) : (
        <p className="text-sm text-ink-muted">Belum ada kegiatan. Tambahkan lewat menu Kegiatan.</p>
      )}
    </div>
  );
}