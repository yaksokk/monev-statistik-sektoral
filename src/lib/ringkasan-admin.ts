import { ambilNilaiQuiz, hitungNGain, nGainTersedia, tentukanKelulusan } from "@/lib/dashboard";
import { hitungKehadiranPegawai, sesiKegiatan } from "@/lib/presensi";
import { quizAktif, soalQuiz } from "@/lib/quiz";
import type {
  Dokumen,
  HasilQuiz,
  ItemDokumen,
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

// Evaluasi Pendalaman tidak dipakai (keputusan pimpinan), jadi tidak masuk dashboard
const JENIS_DASHBOARD = ["pretest", "posttest"] as const satisfies readonly JenisQuiz[];
type JenisDashboard = (typeof JENIS_DASHBOARD)[number];

// Semua data dibaca server di page.tsx dan dikirim ke sini, supaya fungsi di bawah murni
export interface DataDashboardAdmin {
  opdList: Opd[];
  penggunaList: Pengguna[]; // semua pengguna; hanya operator yang dipakai
  sesiList: SesiPembinaan[];
  presensiList: Presensi[];
  soalList: SoalQuiz[];
  pengaturanList: PengaturanQuiz[];
  hasilList: HasilQuiz[];
  itemList: ItemDokumen[];
  dokumenList: Dokumen[]; // dokumen semua pegawai pada kegiatan terpilih
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
  // preTest/postTest null = quiz dimatikan, syarat gugur (sama seperti PanelKelulusan sisi OPD)
  syarat: { kehadiran: boolean; preTest: boolean | null; postTest: boolean | null };
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

  // dokumen dikelompokkan per pegawai sekali saja
  const totalItem = data.itemList.filter((i) => i.kegiatanId === kegiatan.id).length;
  const dokumenPerPegawai = new Map<string, Dokumen[]>();
  for (const d of data.dokumenList) {
    if (d.kegiatanId !== kegiatan.id || !d.penggunaId) continue;
    const daftar = dokumenPerPegawai.get(d.penggunaId) ?? [];
    daftar.push(d);
    dokumenPerPegawai.set(d.penggunaId, daftar);
  }

  return data.penggunaList
    .filter((p) => p.peran === "operator" && p.opdId && opdPerId.has(p.opdId))
    .map((pegawai) => {
      const opd = opdPerId.get(pegawai.opdId!)!;
      const hasilPegawai = hasilKegiatan.filter((h) => h.penggunaId === pegawai.id);

      const hadir = hitungKehadiranPegawai(pegawai.id, sesi, data.presensiList);

      const preTest = aktif.pretest ? ambilNilaiQuiz(hasilPegawai, "pretest", soalPre) : null;
      const postTest = aktif.posttest ? ambilNilaiQuiz(hasilPegawai, "posttest", soalPost) : null;
      const nGain = tampilNGain ? hitungNGain(preTest, postTest) : null;

      // aturan yang sama dengan Dashboard OPD
      const { syarat: s, lulus } = tentukanKelulusan({
        persenKehadiran: hadir.persen,
        ambangKehadiran: kegiatan.ambangKehadiran,
        preAktif: aktif.pretest,
        postAktif: aktif.posttest,
        nilaiPre: preTest,
        nilaiPost: postTest,
      });

      const status: Record<StatusDokumen, number> = { belum: 0, disetujui: 0 };
      for (const d of dokumenPerPegawai.get(pegawai.id) ?? []) status[d.status] += 1;
      const totalDokumen = status.belum + status.disetujui;

      return {
        pegawai,
        opd,
        kehadiran: { ...hadir, lulus: s.presensi },
        preTest,
        postTest,
        nGain,
        dokumen: {
          status,
          total: totalDokumen,
          kelengkapan: totalItem === 0 ? 0 : Math.round((status.disetujui / totalItem) * 100),
        },
        syarat: { kehadiran: s.presensi, preTest: s.preTest, postTest: s.postTest },
        lulus,
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