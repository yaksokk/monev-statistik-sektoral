import { ambilAdmin } from "@/lib/pengguna";
import {
  ambilDaftarKegiatan,
  ambilIdItemBerdata,
  ambilItemDokumen,
  ambilRingkasanKegiatan,
} from "@/lib/data/kegiatan";
import type { ItemDokumen } from "@/lib/types";
import KegiatanClient from "./KegiatanClient";

export default async function KelolaKegiatanPage() {
  await ambilAdmin();

  const [daftar, semuaItem, ringkasan, idItemBerdata] = await Promise.all([
    ambilDaftarKegiatan(),
    ambilItemDokumen(),
    ambilRingkasanKegiatan(),
    ambilIdItemBerdata(),
  ]);

  // kegiatan yang sudah punya data: tidak boleh dihapus
  const idBerdata = ringkasan.filter((r) => r.berdata).map((r) => r.kegiatanId);

  // jumlah OPD yang sudah mengerjakan, kunci "kegiatanId:quizId"
  const hasilQuiz: Record<string, number> = {};
  // isi kegiatan yang ikut terhapus bila kegiatan dihapus
  const isi: Record<string, { item: number; sesi: number; soal: number }> = {};
  for (const r of ringkasan) {
    hasilQuiz[`${r.kegiatanId}:pretest`] = r.hasilPretest;
    hasilQuiz[`${r.kegiatanId}:posttest`] = r.hasilPosttest;
    isi[r.kegiatanId] = { item: r.jumlahItem, sesi: r.jumlahSesi, soal: r.jumlahSoal };
  }

  const item: Record<string, ItemDokumen[]> = {};
  for (const i of semuaItem) (item[i.kegiatanId] ??= []).push(i);

  return (
    <KegiatanClient
      daftar={daftar}
      idBerdata={idBerdata}
      hasilQuiz={hasilQuiz}
      isi={isi}
      item={item}
      idItemBerdata={idItemBerdata}
    />
  );
}