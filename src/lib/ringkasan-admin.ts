import { AMBANG_POSTTEST, ambilNilaiQuiz, hitungNGain, nGainTersedia } from "@/lib/dashboard";
import { apakahLulusKehadiran, hitungKehadiranPegawai, sesiKegiatan } from "@/lib/presensi";
import {
  LABEL_QUIZ,
  cariPengaturan,
  quizAktif,
  soalQuiz,
  statusWaktuQuiz,
} from "@/lib/quiz";
import { hitungKelengkapanPegawai, hitungStatusPegawai } from "@/lib/rekap";
import type {
  HasilQuiz,
  JenisQuiz,
  Kegiatan,
  Opd,
  PengaturanQuiz,
  Pengguna,
  Presensi,
  SesiPembinaan,
  SoalQuiz,
  StatusDokumen,
} from "@/lib/types";

// Pegawai yang belum mengerjakan quiz dianggap perlu tindakan bila batas akhir tinggal sekian hari
export const HARI_DEKAT_BATAS = 3;

const MS_HARI = 24 * 60 * 60 * 1000;

// Evaluasi Pendalaman tidak dipakai (keputusan pimpinan), jadi tidak masuk dashboard
const JENIS_DASHBOARD = ["pretest", "posttest"] as const satisfies readonly JenisQuiz[];
type JenisDashboard = (typeof JENIS_DASHBOARD)[number];

// Data dummy dikirim dari page.tsx supaya fungsi di sini murni (mudah diganti data backend nanti)
export interface DataDashboardAdmin {
  opdList: Opd[];
  penggunaList: Pengguna[]; // semua pengguna; hanya operator yang dipakai
  sesiList: SesiPembinaan[];
  presensiList: Presensi[];
  soalList: SoalQuiz[];
  pengaturanList: PengaturanQuiz[];
  hasilList: HasilQuiz[];
}

// Satu baris per pegawai
export interface BarisPegawai {
  pegawai: Pengguna;
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

// Satu baris per OPD (hanya OPD yang punya pegawai). Nilai = rata-rata pegawai,
// pegawai yang belum mengerjakan dihitung 0 dan tetap ikut dirata-ratakan.
export interface BarisRekapOpd {
  opd: Opd;
  pegawai: BarisPegawai[];
  lulus: number; // jumlah pegawai yang lulus
  preTest: number | null; // null = Pre-Test dimatikan
  postTest: number | null;
  nGain: number | null; // null = N-Gain tidak tersedia
}

// rata = null bila tidak ada pegawai; jumlah = pegawai yang punya nilai
export interface RataNilai {
  rata: number | null;
  jumlah: number;
  total: number;
}

export interface RingkasanKegiatan {
  totalOpd: number; // OPD yang punya pegawai
  totalPegawai: number;
  lulus: number; // pegawai lulus
  rataKehadiran: number; // 0-100, semua pegawai dihitung (tidak hadir = 0)
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
  pegawaiBelum: { nama: string; opd: string }[]; // opd = singkatan
}

export interface PerluTindakan {
  hariDekat: number;
  quizMendekatiBatas: TindakanQuiz[];
}

// Nilai kosong (belum mengerjakan) dihitung 0
function rataDenganNol(nilai: (number | null)[]) {
  return nilai.length === 0 ? 0 : nilai.reduce<number>((s, n) => s + (n ?? 0), 0) / nilai.length;
}

function rataNilai(nilai: (number | null)[]): RataNilai {
  return {
    rata: nilai.length === 0 ? null : rataDenganNol(nilai),
    jumlah: nilai.filter((n) => n !== null).length,
    total: nilai.length,
  };
}

// Satu baris per pegawai untuk kegiatan terpilih. OPD tanpa pegawai tidak muncul.
export function susunRekapPegawai(kegiatan: Kegiatan, data: DataDashboardAdmin): BarisPegawai[] {
  const sesi = sesiKegiatan(data.sesiList, kegiatan.id);
  const aktif: Record<JenisDashboard, boolean> = {
    pretest: quizAktif(kegiatan, "pretest"),
    posttest: quizAktif(kegiatan, "posttest"),
  };
  const soalPre = soalQuiz(data.soalList, kegiatan.id, "pretest");
  const soalPost = soalQuiz(data.soalList, kegiatan.id, "posttest");
  const hasilKegiatan = data.hasilList.filter((h) => h.kegiatanId === kegiatan.id);
  const tampilNGain = nGainTersedia(kegiatan);
  const opdPerId = new Map(data.opdList.map((o) => [o.id, o]));

  return data.penggunaList
    .filter((p) => p.peran === "operator" && p.opdId && opdPerId.has(p.opdId))
    .map((pegawai) => {
      const opd = opdPerId.get(pegawai.opdId!)!;
      const hasilPegawai = hasilKegiatan.filter((h) => h.penggunaId === pegawai.id);

      const hadir = hitungKehadiranPegawai(pegawai.id, sesi, data.presensiList);
      const lulusHadir = apakahLulusKehadiran(hadir.persen, kegiatan);

      const preTest = aktif.pretest ? ambilNilaiQuiz(hasilPegawai, "pretest", soalPre) : null;
      const postTest = aktif.posttest ? ambilNilaiQuiz(hasilPegawai, "posttest", soalPost) : null;
      const nGain = tampilNGain ? hitungNGain(preTest, postTest) : null;

      const syarat = {
        kehadiran: lulusHadir,
        postTest: aktif.posttest ? postTest !== null && postTest >= AMBANG_POSTTEST : null,
      };

      const status = hitungStatusPegawai(pegawai.id, kegiatan.id);
      const totalDokumen = Object.values(status).reduce((s, n) => s + n, 0);

      return {
        pegawai,
        opd,
        kehadiran: { ...hadir, lulus: lulusHadir },
        preTest,
        postTest,
        nGain,
        dokumen: {
          status,
          total: totalDokumen,
          kelengkapan: hitungKelengkapanPegawai(pegawai.id, kegiatan.id),
        },
        syarat,
        lulus: lulusHadir && syarat.postTest !== false,
      };
    });
}

// Satu baris per OPD: nilai rata-rata pegawainya. Pegawai yang belum mengerjakan dihitung 0.
export function susunRekapOpd(
  kegiatan: Kegiatan,
  pegawai: BarisPegawai[],
  opdList: Opd[],
): BarisRekapOpd[] {
  const aktifPre = quizAktif(kegiatan, "pretest");
  const aktifPost = quizAktif(kegiatan, "posttest");
  const tampilNGain = nGainTersedia(kegiatan);

  return opdList.flatMap<BarisRekapOpd>((opd) => {
    const milik = pegawai.filter((b) => b.opd.id === opd.id);
    if (milik.length === 0) return [];
    return [
      {
        opd,
        pegawai: milik,
        lulus: milik.filter((b) => b.lulus).length,
        preTest: aktifPre ? rataDenganNol(milik.map((b) => b.preTest)) : null,
        postTest: aktifPost ? rataDenganNol(milik.map((b) => b.postTest)) : null,
        nGain: tampilNGain ? rataDenganNol(milik.map((b) => b.nGain)) : null,
      },
    ];
  });
}

// Angka untuk kartu ringkasan, dihitung dari semua pegawai. Belum mengerjakan dihitung 0.
export function susunRingkasan(kegiatan: Kegiatan, baris: BarisPegawai[]): RingkasanKegiatan {
  const total = baris.length;
  const aktif: Record<JenisDashboard, boolean> = {
    pretest: quizAktif(kegiatan, "pretest"),
    posttest: quizAktif(kegiatan, "posttest"),
  };
  const bagi = (n: number) => (total === 0 ? 0 : n / total);

  return {
    totalOpd: new Set(baris.map((b) => b.opd.id)).size,
    totalPegawai: total,
    lulus: baris.filter((b) => b.lulus).length,
    rataKehadiran: bagi(baris.reduce((s, b) => s + b.kehadiran.persen, 0)),
    aktif,
    nGainTersedia: nGainTersedia(kegiatan),
    preTest: rataNilai(baris.map((b) => b.preTest)),
    postTest: rataNilai(baris.map((b) => b.postTest)),
    nGain: rataNilai(baris.map((b) => b.nGain)),
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
  baris: BarisPegawai[],
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
        .map((h) => h.penggunaId),
    );
    const pegawaiBelum = baris
      .filter((b) => !sudah.has(b.pegawai.id))
      .map((b) => ({ nama: b.pegawai.nama, opd: b.opd.singkatan }));
    if (pegawaiBelum.length === 0) continue;

    quizMendekatiBatas.push({
      jenis,
      label: LABEL_QUIZ[jenis],
      batasAkhir: pengaturan.batasAkhir,
      sisaHari: Math.max(1, Math.ceil(sisaMs / MS_HARI)),
      pegawaiBelum,
    });
  }

  return {
    hariDekat: HARI_DEKAT_BATAS,
    quizMendekatiBatas,
  };
}