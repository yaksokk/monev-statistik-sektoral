import type {
  IzinKerjaUlang,
  JenisQuiz,
  Kegiatan,
  PengaturanQuiz,
  SoalQuiz,
} from "@/lib/types";

// Status dari sisi satu OPD
export type StatusQuiz = "selesai" | "belum_dibuka" | "terkunci" | "terbuka";

// Status menurut waktu saja, dipakai admin
export type StatusWaktuQuiz = "belum_dibuka" | "dibuka" | "ditutup";

export const JENIS_QUIZ: JenisQuiz[] = ["pretest", "posttest", "evaluasi"];

export const LABEL_QUIZ: Record<JenisQuiz, string> = {
  pretest: "Pre-Test",
  posttest: "Post-Test",
  evaluasi: "Evaluasi Pendalaman",
};

const KUNCI_SAKLAR = {
  pretest: "preTestAktif",
  posttest: "postTestAktif",
  evaluasi: "evaluasiAktif",
} as const satisfies Record<JenisQuiz, keyof Kegiatan>;

// Saklar kosong dianggap aktif
export function quizAktif(kegiatan: Kegiatan, jenis: JenisQuiz) {
  return kegiatan[KUNCI_SAKLAR[jenis]] !== false;
}

// Pengacak dengan seed tetap, supaya urutan soal satu OPD selalu sama
function buatAcak(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hanya urutan soal yang diacak, urutan opsi tetap
export function acakSoal(soal: SoalQuiz[], seed: string): SoalQuiz[] {
  const acak = buatAcak(seed);
  const hasil = [...soal];
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

// Soal satu quiz pada satu kegiatan, urut sesuai urutan di admin
export function soalQuiz(daftar: SoalQuiz[], kegiatanId: string, quizId: JenisQuiz) {
  return daftar
    .filter((s) => s.kegiatanId === kegiatanId && s.quizId === quizId)
    .sort((a, b) => a.urutan - b.urutan);
}

export function soalAktif(soal: SoalQuiz[]) {
  return soal.filter((s) => s.aktif);
}

export function cariPengaturan(
  daftar: PengaturanQuiz[],
  kegiatanId: string,
  quizId: JenisQuiz,
) {
  return daftar.find((p) => p.kegiatanId === kegiatanId && p.id === quizId);
}

// Dihitung dari waktu, tidak disimpan. sekarang berformat yyyy-mm-ddTHH:mm (lihat waktuSekarang di lib/presensi.ts).
// Waktu buka kosong berarti belum dibuka (beda dengan sesi daftar hadir)
export function statusWaktuQuiz(
  pengaturan: PengaturanQuiz | undefined,
  sekarang: string,
): StatusWaktuQuiz {
  if (!pengaturan?.waktuBuka || sekarang < pengaturan.waktuBuka) return "belum_dibuka";
  if (pengaturan.batasAkhir && sekarang > pengaturan.batasAkhir) return "ditutup";
  return "dibuka";
}

// diizinkan = OPD ini punya izin kerjakan ulang; hanya berpengaruh bila pengaturan.hanyaBerizin
export function statusQuiz(
  pengaturan: PengaturanQuiz,
  sudahSelesai: boolean,
  sekarang: string,
  diizinkan = true,
): StatusQuiz {
  if (sudahSelesai) return "selesai";
  const status = statusWaktuQuiz(pengaturan, sekarang);
  if (status === "belum_dibuka") return "belum_dibuka";
  if (status === "ditutup") return "terkunci";
  return pengaturan.hanyaBerizin && !diizinkan ? "terkunci" : "terbuka";
}

export function punyaIzin(
  izin: IzinKerjaUlang[],
  kegiatanId: string,
  quizId: JenisQuiz,
  opdId: string,
) {
  return izin.some(
    (i) => i.kegiatanId === kegiatanId && i.quizId === quizId && i.opdId === opdId,
  );
}

// Sisa waktu pengerjaan: durasi penuh, tapi dipotong batas akhir. Panggil dari useEffect atau event handler.
// Status membuka sampai akhir menit batas akhir (sekarang > batasAkhir), jadi batasnya dihitung sampai menit itu habis
export function sisaDetik(pengaturan: PengaturanQuiz, mulaiMs: number, sekarangMs: number) {
  let akhir = mulaiMs + pengaturan.durasiMenit * 60_000;
  if (pengaturan.batasAkhir) {
    akhir = Math.min(akhir, new Date(pengaturan.batasAkhir).getTime() + 60_000);
  }
  return Math.max(0, Math.ceil((akhir - sekarangMs) / 1000));
}

// Soal hanya bisa ditambah, diedit, dihapus, atau diurutkan saat quiz belum dibuka dan belum ada hasil OPD
export function soalBisaDiubah(
  pengaturan: PengaturanQuiz | undefined,
  jumlahHasil: number,
  sekarang: string,
) {
  return jumlahHasil === 0 && statusWaktuQuiz(pengaturan, sekarang) === "belum_dibuka";
}

// Nilai = jumlah benar / jumlah soal aktif x 100. Soal tanpa jawaban dihitung salah, soal nonaktif tidak dihitung
export function hitungHasil(soal: SoalQuiz[], jawaban: Record<string, number>) {
  const aktif = soalAktif(soal);
  const total = aktif.length;
  const benar = aktif.filter((s) => jawaban[s.id] === s.kunci).length;
  return {
    benar,
    salah: total - benar,
    total,
    nilai: total === 0 ? 0 : (benar / total) * 100,
  };
}

export interface MasukanPengaturan {
  waktuBuka: string | null;
  batasAkhir: string | null;
  durasiMenit: number;
}

export interface HasilValidasi {
  galat: Partial<Record<keyof MasukanPengaturan, string>>;
  peringatan: string[];
}

// galat menolak simpan, peringatan hanya ditampilkan
export function validasiPengaturan(
  masukan: MasukanPengaturan,
  jumlahSoalAktif: number,
  sekarang: string,
): HasilValidasi {
  const { waktuBuka, batasAkhir, durasiMenit } = masukan;
  const galat: HasilValidasi["galat"] = {};
  const peringatan: string[] = [];

  if (!Number.isInteger(durasiMenit) || durasiMenit < 1) {
    galat.durasiMenit = "Durasi minimal 1 menit";
  }
  if (waktuBuka && jumlahSoalAktif === 0) {
    galat.waktuBuka = "Tambahkan minimal satu soal dulu";
  }
  if (waktuBuka && batasAkhir && batasAkhir <= waktuBuka) {
    galat.batasAkhir = "Batas akhir harus setelah waktu buka";
  }

  if (!galat.waktuBuka && !galat.batasAkhir && waktuBuka && waktuBuka < sekarang) {
    peringatan.push("Waktu buka sudah lewat, quiz langsung terbuka setelah disimpan");
  }
  if (!galat.batasAkhir && !galat.durasiMenit && waktuBuka && batasAkhir) {
    const rentang = (new Date(batasAkhir).getTime() - new Date(waktuBuka).getTime()) / 60_000;
    if (rentang < durasiMenit) {
      peringatan.push("Rentang waktu buka sampai batas akhir lebih pendek dari durasi pengerjaan");
    }
  }

  return { galat, peringatan };
}

export function formatNilai(nilai: number) {
  return String(Math.round(nilai * 10) / 10).replace(".", ",");
}

export function formatSisa(detik: number) {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  return `${String(menit).padStart(2, "0")}:${String(sisa).padStart(2, "0")}`;
}

export function hurufOpsi(indeks: number) {
  return String.fromCharCode(65 + indeks);
}