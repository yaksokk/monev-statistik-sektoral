import { ambilDokumenKegiatan } from "@/lib/data/dokumen";
import { ambilItemKegiatan, ambilKegiatanAktif } from "@/lib/data/kegiatan";
import { ambilPresensiKegiatan } from "@/lib/data/presensi";
import { ambilDataQuizAdmin } from "@/lib/data/quiz";
import { ambilSesiKegiatan } from "@/lib/data/sesi";
import { ambilAdmin } from "@/lib/pengguna";
import {
  susunRekapOpd,
  susunRekapPegawai,
  susunRingkasan,
  type DataDashboardAdmin,
} from "@/lib/ringkasan-admin";
import RekapDashboardClient from "./RekapDashboardClient";

export default async function DashboardAdmin() {
  await ambilAdmin();

  const kegiatan = await ambilKegiatanAktif();

  let isi: React.ReactNode = null;
  if (kegiatan) {
    const sesiList = await ambilSesiKegiatan(kegiatan.id);
    // ambilDataQuizAdmin juga menjadikan sesi quiz yang waktunya lewat sebagai hasil
    const [quiz, presensiList, dokumenList, itemList] = await Promise.all([
      ambilDataQuizAdmin(kegiatan.id),
      ambilPresensiKegiatan(sesiList.map((s) => s.id)),
      ambilDokumenKegiatan(kegiatan.id),
      ambilItemKegiatan(kegiatan.id),
    ]);

    const data: DataDashboardAdmin = {
      opdList: quiz.opdList,
      penggunaList: quiz.penggunaList,
      sesiList,
      presensiList,
      soalList: quiz.soalList,
      pengaturanList: quiz.pengaturanList,
      hasilList: quiz.hasilList,
      itemList,
      dokumenList,
    };

    const pegawai = susunRekapPegawai(kegiatan, data);
    const baris = susunRekapOpd(kegiatan, pegawai, data.opdList);
    const ringkasan = susunRingkasan(kegiatan, pegawai);
    isi = <RekapDashboardClient kegiatan={kegiatan} ringkasan={ringkasan} baris={baris} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
      <p className="mt-1 text-ink-muted">Ringkasan pembinaan dan kelengkapan dokumen seluruh pegawai OPD.</p>
      {isi}
    </div>
  );
}