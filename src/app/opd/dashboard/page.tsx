import { CalendarCheck, ClipboardList, GraduationCap, LayoutDashboard, TrendingUp } from "lucide-react";
import { ambilDokumenSaya } from "@/lib/data/dokumen";
import { ambilItemKegiatan, ambilKegiatanAktif } from "@/lib/data/kegiatan";
import { ambilBabModul, ambilIdBabSelesaiSaya, ambilModul } from "@/lib/data/modul";
import { ambilPresensiSaya } from "@/lib/data/presensi";
import { ambilQuizPegawai, finalkanSesiSaya } from "@/lib/data/quiz";
import { ambilSesiKegiatan } from "@/lib/data/sesi";
import { ambilUndanganSaya } from "@/lib/data/undangan";
import {
  formatNGain,
  hitungNGain,
  linkHttps,
  nGainTersedia,
  tentukanKelulusan,
} from "@/lib/dashboard";
import { ambilOperator } from "@/lib/operator";
import { hitungKehadiranPegawai } from "@/lib/presensi";
import { formatNilai } from "@/lib/quiz";
import KartuMetrik from "./KartuMetrik";
import PanelDokumen, { type BarisDokumen } from "./PanelDokumen";
import PanelKelulusan from "./PanelKelulusan";
import PanelModul from "./PanelModul";
import KartuUndangan from "./KartuUndangan";

export default async function DashboardOpdPage() {
  const { pengguna, opd } = await ambilOperator();

  // presensi, ambang, dan dokumen mengikuti kegiatan aktif
  const kegiatan = await ambilKegiatanAktif();

  // sesi quiz yang waktunya lewat dijadikan hasil dulu, sebelum nilai dibaca
  await finalkanSesiSaya();

  const [sesiAktif, pre, post, undangan, modul, idBabSelesai, itemList, dokumenList] =
    await Promise.all([
      kegiatan ? ambilSesiKegiatan(kegiatan.id) : Promise.resolve([]),
      ambilQuizPegawai(kegiatan, "pretest", pengguna.id),
      ambilQuizPegawai(kegiatan, "posttest", pengguna.id),
      ambilUndanganSaya(),
      ambilModul(),
      ambilIdBabSelesaiSaya(pengguna.id),
      kegiatan ? ambilItemKegiatan(kegiatan.id) : Promise.resolve([]),
      kegiatan ? ambilDokumenSaya(pengguna.id, opd.id, kegiatan.id) : Promise.resolve([]),
    ]);

  // kehadiran
  const presensi = await ambilPresensiSaya(
    pengguna.id,
    opd.id,
    sesiAktif.map((s) => s.id),
  );
  const kehadiran = hitungKehadiranPegawai(pengguna.id, sesiAktif, presensi);

  // nilai quiz sudah dihitung di lib/data/quiz.ts; null bila belum dikerjakan
  const nilaiPre = pre.hasil?.nilai ?? null;
  const nilaiPost = post.hasil?.nilai ?? null;
  const nGainBerlaku = kegiatan ? nGainTersedia(kegiatan) : true;
  const nGain = nGainBerlaku ? hitungNGain(nilaiPre, nilaiPost) : null;

  // kelengkapan dokumen bukan syarat kelulusan
  const { syarat, lulus } = tentukanKelulusan({
    persenKehadiran: kehadiran.persen,
    ambangKehadiran: kegiatan?.ambangKehadiran ?? null,
    preAktif: pre.aktif,
    postAktif: post.aktif,
    nilaiPre,
    nilaiPost,
  });
  // link baru dikirim ke komponen bila semua syarat terpenuhi
  const linkSertifikat = lulus ? linkHttps(pengguna.linkSertifikat) : null;

  // progress bab
  const babSelesai = new Set(idBabSelesai);
  const babList = modul ? (await ambilBabModul(modul.id)).map((b) => ({
        id: b.id,
        urutan: b.urutan,
        judul: b.judul,
        pembinaan: b.pembinaan,
        selesai: babSelesai.has(b.id),
      }))
    : [];

  // dokumen kegiatan aktif
  const barisDokumen: BarisDokumen[] = itemList.map((item) => ({
    id: item.id,
    nama: item.nama,
    status: dokumenList.find((d) => d.itemId === item.id)?.status ?? "belum",
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-navy-800 sm:text-3xl">
          <LayoutDashboard className="size-7 shrink-0 text-navy-600" aria-hidden />
          Ukuran &amp; Metrik Peserta Pembinaan
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Rekapitulasi capaian, kehadiran, peningkatan pemahaman (Gain Score), dan status
          sertifikasi peserta · {opd.nama}
        </p>
      </header>

      <div className="space-y-2">
        {undangan.length === 0 ? (
          <KartuUndangan judul="Surat Undangan" tanggal={null} link={null} />
        ) : (
          undangan.map((u) => (
            <KartuUndangan
              key={u.id}
              judul={u.judul}
              tanggal={u.dikirimPada.slice(0, 10)}
              link={linkHttps(u.link)}
            />
          ))
        )}
      </div>

      <section
        aria-label="Ringkasan capaian"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KartuMetrik
          ikon={CalendarCheck}
          warna="navy"
          label="Tingkat Kehadiran"
          nilai={kegiatan ? `${Math.round(kehadiran.persen)}%` : "–"}
          keterangan={
            kegiatan ? `${kehadiran.hadir} dari ${kehadiran.total} Sesi` : "Belum ada kegiatan aktif"
          }
        />
        <KartuMetrik
          ikon={ClipboardList}
          warna="amber"
          label="Nilai Pre-Test"
          nilai={!pre.aktif ? "–" : nilaiPre === null ? "Belum" : formatNilai(nilaiPre)}
          keterangan={pre.aktif ? "Kemampuan Awal" : "Tidak dipakai"}
        />
        <KartuMetrik
          ikon={GraduationCap}
          warna="hijau"
          label="Nilai Post-Test"
          nilai={!post.aktif ? "–" : nilaiPost === null ? "Belum" : formatNilai(nilaiPost)}
          keterangan={post.aktif ? "Kemampuan Akhir" : "Tidak dipakai"}
        />
        <KartuMetrik
          ikon={TrendingUp}
          warna="netral"
          label="N-Gain Score"
          nilai={!nGainBerlaku ? "–" : nGain === null ? "0,00" : formatNGain(nGain)}
          keterangan={
            !nGainBerlaku ? "Tidak dihitung" : nGain === null ? "Belum Diukur" : "Peningkatan Pemahaman"
          }
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelModul babList={babList} />
        <PanelKelulusan
          persenKehadiran={kehadiran.persen}
          ambangKehadiran={kegiatan?.ambangKehadiran ?? null}
          teksNilaiPost={nilaiPost === null ? "Belum" : formatNilai(nilaiPost)}
          teksNilaiPre={nilaiPre === null ? "Belum" : formatNilai(nilaiPre)}
          syarat={syarat}
          lulus={lulus}
          linkSertifikat={linkSertifikat}
        />
      </div>

      <PanelDokumen namaKegiatan={kegiatan?.nama ?? null} baris={barisDokumen} />
    </div>
  );
}