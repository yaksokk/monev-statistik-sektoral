import { AMBANG_POSTTEST, ambilNilaiQuiz, hitungNGain, nGainTersedia } from "@/lib/dashboard";
import { apakahLulusKehadiran, hitungKehadiran, sesiKegiatan } from "@/lib/presensi";
import {
  LABEL_QUIZ,
  cariPengaturan,
  quizAktif,
  soalQuiz,
  statusWaktuQuiz,
} from "@/lib/quiz";
import { hitungKelengkapan, hitungStatus } from "@/lib/rekap";
import type {
  HasilQuiz,
  JenisQuiz,
  Kegiatan,
  Opd,
  PengaturanQuiz,
  Presensi,
  SesiPembinaan,
  SoalQuiz,
  StatusDokumen,
} from "@/lib/types";

// OPD yang belum mengerjakan quiz dianggap perlu tindakan bila batas akhir tinggal sekian hari
export const HARI_DEKAT_BATAS = 3;

const MS_HARI = 24 * 60 * 60 * 1000;

// Evaluasi Pendalaman tidak dipakai (keputusan pimpinan), jadi tidak masuk dashboard
const JENIS_DASHBOARD = ["pretest", "posttest"] as const satisfies readonly JenisQuiz[];
type JenisDashboard = (typeof JENIS_DASHBOARD)[number];

// Data dummy dikirim dari page.tsx supaya fungsi di sini murni (mudah diganti data backend nanti)
export interface DataDashboardAdmin {
  opdList: Opd[];
  sesiList: SesiPembinaan[];
  presensiList: Presensi[];
  soalList: SoalQuiz[];
  pengaturanList: PengaturanQuiz[];
  hasilList: HasilQuiz[];
}

export interface BarisRekapOpd {
  opd: Opd;
  kehadiran: { hadir: number; total: number; persen: number; lulus: boolean };
  preTest: number | null; // null = belum mengerjakan atau quiz dimatikan
  postTest: number | null;
  nGain: number | null;
  dokumen: { status: Record<StatusDokumen, number>; total: number; kelengkapan: number };
  // postTest null = Post-Test dimatikan, syarat gugur (sama seperti PanelKelulusan sisi OPD)
  syarat: { kehadiran: boolean; postTest: boolean | null };
  lulus: boolean;
}

// rata = null bila belum ada OPD yang punya nilai; jumlah = OPD yang punya nilai
export interface RataNilai {
  rata: number | null;
  jumlah: number;
  total: number;
}

export interface RingkasanKegiatan {
  totalOpd: number;
  lulus: number;
  rataKehadiran: number; // 0-100, semua OPD dihitung (tidak hadir = 0)
  aktif: Record<JenisDashboard, boolean>;
  nGainTersedia: boolean;
  preTest: RataNilai;
  postTest: RataNilai;
  nGain: RataNilai;
  dokumen: { rataKelengkapan: number; totalDokumen: number };
}

export interface TindakanQuiz {
  jenis: JenisQuiz;
  label: string;
  batasAkhir: string; // yyyy-mm-ddTHH:mm
  sisaHari: number; // dibulatkan ke atas, minimal 1
  opdBelum: Opd[];
}

export interface PerluTindakan {
  hariDekat: number;
  quizMendekatiBatas: TindakanQuiz[];
}

function rataNilai(nilai: (number | null)[], total: number): RataNilai {
  const ada = nilai.filter((n): n is number => n !== null);
  return {
    rata: ada.length === 0 ? null : ada.reduce((s, n) => s + n, 0) / ada.length,
    jumlah: ada.length,
    total,
  };
}

// Satu baris per OPD untuk kegiatan terpilih. Dipakai kartu dan popup tabel.
export function susunRekapOpd(kegiatan: Kegiatan, data: DataDashboardAdmin): BarisRekapOpd[] {
  const sesi = sesiKegiatan(data.sesiList, kegiatan.id);
  const aktif: Record<JenisDashboard, boolean> = {
    pretest: quizAktif(kegiatan, "pretest"),
    posttest: quizAktif(kegiatan, "posttest"),
  };
  const soalPre = soalQuiz(data.soalList, kegiatan.id, "pretest");
  const soalPost = soalQuiz(data.soalList, kegiatan.id, "posttest");
  const hasilKegiatan = data.hasilList.filter((h) => h.kegiatanId === kegiatan.id);
  const tampilNGain = nGainTersedia(kegiatan);

  return data.opdList.map((opd) => {
    const hasilOpd = hasilKegiatan.filter((h) => h.opdId === opd.id);

    const hadir = hitungKehadiran(opd.id, sesi, data.presensiList);
    const lulusHadir = apakahLulusKehadiran(hadir.persen, kegiatan);

    const preTest = aktif.pretest ? ambilNilaiQuiz(hasilOpd, "pretest", soalPre) : null;
    const postTest = aktif.posttest ? ambilNilaiQuiz(hasilOpd, "posttest", soalPost) : null;
    const nGain = tampilNGain ? hitungNGain(preTest, postTest) : null;

    const syarat = {
      kehadiran: lulusHadir,
      postTest: aktif.posttest ? postTest !== null && postTest >= AMBANG_POSTTEST : null,
    };

    const status = hitungStatus(opd.id, kegiatan.id);
    const totalDokumen = Object.values(status).reduce((s, n) => s + n, 0);

    return {
      opd,
      kehadiran: { ...hadir, lulus: lulusHadir },
      preTest,
      postTest,
      nGain,
      dokumen: { status, total: totalDokumen, kelengkapan: hitungKelengkapan(opd.id, kegiatan.id) },
      syarat,
      lulus: lulusHadir && syarat.postTest !== false,
    };
  });
}

// Angka untuk kartu ringkasan. Rata-rata nilai hanya dari OPD yang sudah mengerjakan.
export function susunRingkasan(kegiatan: Kegiatan, baris: BarisRekapOpd[]): RingkasanKegiatan {
  const total = baris.length;
  const aktif: Record<JenisDashboard, boolean> = {
    pretest: quizAktif(kegiatan, "pretest"),
    posttest: quizAktif(kegiatan, "posttest"),
  };
  const bagi = (n: number) => (total === 0 ? 0 : n / total);

  return {
    totalOpd: total,
    lulus: baris.filter((b) => b.lulus).length,
    rataKehadiran: bagi(baris.reduce((s, b) => s + b.kehadiran.persen, 0)),
    aktif,
    nGainTersedia: nGainTersedia(kegiatan),
    preTest: rataNilai(baris.map((b) => b.preTest), total),
    postTest: rataNilai(baris.map((b) => b.postTest), total),
    nGain: rataNilai(baris.map((b) => b.nGain), total),
    dokumen: {
      rataKelengkapan: bagi(baris.reduce((s, b) => s + b.dokumen.kelengkapan, 0)),
      totalDokumen: baris.reduce((s, b) => s + b.dokumen.total, 0),
    },
  };
}

// sekarang berformat yyyy-mm-ddTHH:mm (lihat waktuSekarang di lib/presensi.ts).
// Kegiatan arsip hanya-lihat, jadi tidak ada tindakan.
export function susunPerluTindakan(
  kegiatan: Kegiatan,
  baris: BarisRekapOpd[],
  data: DataDashboardAdmin,
  sekarang: string,
): PerluTindakan {
  if (kegiatan.arsip) {
    return { hariDekat: HARI_DEKAT_BATAS, quizMendekatiBatas: [] };
  }

  const quizMendekatiBatas: TindakanQuiz[] = [];
  for (const jenis of JENIS_DASHBOARD) {
    if (!quizAktif(kegiatan, jenis)) continue;
    const pengaturan = cariPengaturan(data.pengaturanList, kegiatan.id, jenis);
    if (!pengaturan?.batasAkhir) continue;
    if (statusWaktuQuiz(pengaturan, sekarang) !== "dibuka") continue;

    const sisaMs = Date.parse(pengaturan.batasAkhir) - Date.parse(sekarang);
    if (sisaMs < 0 || sisaMs > HARI_DEKAT_BATAS * MS_HARI) continue;

    const sudah = new Set(
      data.hasilList
        .filter((h) => h.kegiatanId === kegiatan.id && h.quizId === jenis)
        .map((h) => h.opdId),
    );
    const opdBelum = baris.map((b) => b.opd).filter((o) => !sudah.has(o.id));
    if (opdBelum.length === 0) continue;

    quizMendekatiBatas.push({
      jenis,
      label: LABEL_QUIZ[jenis],
      batasAkhir: pengaturan.batasAkhir,
      sisaHari: Math.max(1, Math.ceil(sisaMs / MS_HARI)),
      opdBelum,
    });
  }

  return {
    hariDekat: HARI_DEKAT_BATAS,
    quizMendekatiBatas,
  };
}