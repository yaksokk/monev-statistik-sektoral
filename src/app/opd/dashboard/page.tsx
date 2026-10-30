import { CalendarCheck, ClipboardList, GraduationCap, LayoutDashboard, TrendingUp } from "lucide-react";
import { BAB_LIST, BAB_SELESAI_LIST, MODUL_LIST } from "@/data/modul";
import {
  DOKUMEN_LIST,
  HASIL_QUIZ_LIST,
  ITEM_LIST,
  KEGIATAN_LIST,
  PENGATURAN_EVALUASI,
  PENGATURAN_POSTTEST,
  PENGATURAN_PRETEST,
  PRESENSI_LIST,
  SESI_LIST,
  SOAL_POSTTEST,
  SOAL_PRETEST,
} from "@/data/dummy";
import {
  AMBANG_POSTTEST,
  ambilNilaiQuiz,
  formatNGain,
  hitungNGain,
  linkHttps,
} from "@/lib/dashboard";
import { ambilOperator } from "@/lib/operator";
import { apakahLulusKehadiran, hitungKehadiran, sesiKegiatan } from "@/lib/presensi";
import { formatNilai } from "@/lib/quiz";
import KartuMetrik from "./KartuMetrik";
import PanelDokumen, { type BarisDokumen } from "./PanelDokumen";
import PanelKelulusan from "./PanelKelulusan";
import PanelModul from "./PanelModul";
import KartuUndangan from "./KartuUndangan";

export default async function DashboardOpdPage() {
  const { opd } = await ambilOperator();

  // presensi, ambang, dan dokumen mengikuti kegiatan aktif
  const kegiatan = KEGIATAN_LIST.find((k) => k.aktif);

  // kehadiran dan quiz
  const sesiAktif = kegiatan ? sesiKegiatan(SESI_LIST, kegiatan.id) : [];
  const hasilOpd = HASIL_QUIZ_LIST.filter((h) => h.opdId === opd.id);

  const kehadiran = hitungKehadiran(opd.id, sesiAktif, PRESENSI_LIST);
  const nilaiPre = ambilNilaiQuiz(hasilOpd, PENGATURAN_PRETEST.id, SOAL_PRETEST);
  const nilaiPost = ambilNilaiQuiz(hasilOpd, PENGATURAN_POSTTEST.id, SOAL_POSTTEST);
  const nGain = hitungNGain(nilaiPre, nilaiPost);
  const evaluasiSelesai = hasilOpd.some((h) => h.quizId === PENGATURAN_EVALUASI.id);

  // syarat kelulusan (kelengkapan dokumen bukan syarat)
  const syarat = {
    presensi: kegiatan ? apakahLulusKehadiran(kehadiran.persen, kegiatan) : false,
    postTest: nilaiPost !== null && nilaiPost >= AMBANG_POSTTEST,
    evaluasi: evaluasiSelesai,
  };
  const lulus = syarat.presensi && syarat.postTest && syarat.evaluasi;
  // link baru dikirim ke komponen bila semua syarat terpenuhi
  const linkSertifikat = lulus ? linkHttps(opd.linkSertifikat) : null;

  // progress bab
  const modul = MODUL_LIST[0];
  const babSelesai = new Set(
    BAB_SELESAI_LIST.filter((s) => s.opdId === opd.id).map((s) => s.babId),
  );
  const babList = modul
    ? BAB_LIST.filter((b) => b.modulId === modul.id)
        .sort((a, b) => a.urutan - b.urutan)
        .map((b) => ({
          id: b.id,
          urutan: b.urutan,
          judul: b.judul,
          pembinaan: b.pembinaan,
          selesai: babSelesai.has(b.id),
        }))
    : [];

  // undangan hanya ditampilkan bila link ada dan berawalan https
  const linkUndangan = linkHttps(kegiatan?.linkUndangan);

  // dokumen kegiatan aktif
  const barisDokumen: BarisDokumen[] = kegiatan
    ? ITEM_LIST.filter((i) => i.kegiatanId === kegiatan.id).map((item) => ({
        id: item.id,
        nama: item.nama,
        status:
          DOKUMEN_LIST.find(
            (d) => d.opdId === opd.id && d.kegiatanId === kegiatan.id && d.itemId === item.id,
          )?.status ?? "belum",
      }))
    : [];

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

      {kegiatan && (
        <KartuUndangan
          judul={kegiatan.judulUndangan ?? "Surat Undangan"}
          tanggal={kegiatan.tanggalUndangan ?? null}
          link={linkUndangan}
        />
      )}

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
          nilai={nilaiPre === null ? "Belum" : formatNilai(nilaiPre)}
          keterangan="Kemampuan Awal"
        />
        <KartuMetrik
          ikon={GraduationCap}
          warna="hijau"
          label="Nilai Post-Test"
          nilai={nilaiPost === null ? "Belum" : formatNilai(nilaiPost)}
          keterangan="Kemampuan Akhir"
        />
        <KartuMetrik
          ikon={TrendingUp}
          warna="netral"
          label="N-Gain Score"
          nilai={nGain === null ? "0,00" : formatNGain(nGain)}
          keterangan={nGain === null ? "Belum Diukur" : "Peningkatan Pemahaman"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PanelModul babList={babList} />
        <PanelKelulusan
          persenKehadiran={kehadiran.persen}
          ambangKehadiran={kegiatan?.ambangKehadiran ?? null}
          teksNilaiPost={nilaiPost === null ? "Belum" : formatNilai(nilaiPost)}
          syarat={syarat}
          lulus={lulus}
          linkSertifikat={linkSertifikat}
        />
      </div>

      <PanelDokumen namaKegiatan={kegiatan?.nama ?? null} baris={barisDokumen} />
    </div>
  );
}