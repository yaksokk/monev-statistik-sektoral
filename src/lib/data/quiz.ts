import "server-only";
import { hitungHasil, quizAktif } from "@/lib/quiz";
import { buatKlienServer } from "@/lib/supabase/server";
import type {
  DataQuizPegawai,
  HasilQuiz,
  IzinKerjaUlang,
  JenisLogQuiz,
  JenisQuiz,
  Kegiatan,
  LogPerubahanQuiz,
  Opd,
  PengaturanQuiz,
  Pengguna,
  ReviewSoal,
  SesiPegawai,
  SoalQuiz,
} from "@/lib/types";
import { isoKeLokal } from "@/lib/waktu";

type BarisPengaturan = {
  kegiatan_id: string;
  quiz: JenisQuiz;
  judul: string;
  durasi_menit: number;
  waktu_buka: string | null;
  batas_akhir: string | null;
  hanya_berizin: boolean;
  acak_soal: boolean;
};

type Kunci = { kunci: number; pembahasan: string };

type BarisSoalLengkap = {
  id: string;
  kegiatan_id: string;
  quiz: JenisQuiz;
  urutan: number;
  pertanyaan: string;
  opsi: string[];
  aktif: boolean;
  kunci_soal: Kunci | Kunci[] | null;
};

const KOLOM_PENGATURAN =
  "kegiatan_id, quiz, judul, durasi_menit, waktu_buka, batas_akhir, hanya_berizin, acak_soal";

// snake_case database -> camelCase types.ts; timestamptz -> WITA lokal
export function petakanPengaturan(b: BarisPengaturan): PengaturanQuiz {
  return {
    id: b.quiz,
    kegiatanId: b.kegiatan_id,
    judul: b.judul,
    durasiMenit: b.durasi_menit,
    waktuBuka: b.waktu_buka ? isoKeLokal(b.waktu_buka) : null,
    batasAkhir: b.batas_akhir ? isoKeLokal(b.batas_akhir) : null,
    hanyaBerizin: b.hanya_berizin || undefined,
    acakSoal: b.acak_soal,
  };
}

// null bila baris kunci tidak terbaca (RLS: kunci baru terbuka setelah hasil pegawai tersimpan)
export function petakanSoalLengkap(b: BarisSoalLengkap): SoalQuiz | null {
  const k = Array.isArray(b.kunci_soal) ? b.kunci_soal[0] : b.kunci_soal;
  if (!k) return null;
  return {
    id: b.id,
    kegiatanId: b.kegiatan_id,
    quizId: b.quiz,
    urutan: b.urutan,
    pertanyaan: b.pertanyaan,
    opsi: b.opsi,
    kunci: k.kunci,
    pembahasan: k.pembahasan ?? "",
    aktif: b.aktif,
  };
}

// jsonb {"<id soal>": <indeks>} -> hanya pasangan yang berupa angka bulat
function bersihkanJawaban(mentah: unknown): Record<string, number> {
  const hasil: Record<string, number> = {};
  if (mentah && typeof mentah === "object" && !Array.isArray(mentah)) {
    for (const [id, nilai] of Object.entries(mentah)) {
      if (typeof nilai === "number" && Number.isInteger(nilai)) hasil[id] = nilai;
    }
  }
  return hasil;
}

// Sesi pegawai yang waktunya sudah lewat (browser ditutup) dijadikan hasil dari jawaban yang tersimpan.
// Panggil sekali di awal halaman, sebelum membaca data quiz.
export async function finalkanSesiSaya(): Promise<void> {
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("finalkan_sesi_kedaluwarsa");
  if (error) throw new Error(`Gagal memeriksa sesi quiz: ${error.message}`);
}

// Data satu quiz untuk satu pegawai. rincian = true menambah review hasil dan sesi yang sedang berjalan
// (dipakai halaman Pre-Test dan Post-Test); tanpa rincian cukup ringkasan untuk kartu quiz.
// Kunci hanya dibaca setelah hasil pegawai ada, jadi tidak pernah dikirim ke browser sebelum waktunya.
export async function ambilQuizPegawai(
  kegiatan: Kegiatan | null,
  jenis: JenisQuiz,
  penggunaId: string,
  { rincian = false }: { rincian?: boolean } = {},
): Promise<DataQuizPegawai> {
  const kosong: DataQuizPegawai = {
    aktif: true,
    pengaturan: undefined,
    jumlahSoal: 0,
    diizinkan: true,
    hasil: null,
    review: null,
    sesi: null,
  };
  if (!kegiatan) return kosong;
  if (!quizAktif(kegiatan, jenis)) return { ...kosong, aktif: false };

  const supabase = await buatKlienServer();
  const [pengaturanRes, jumlahRes, hasilRes, izinRes] = await Promise.all([
    supabase
      .from("pengaturan_quiz")
      .select(KOLOM_PENGATURAN)
      .eq("kegiatan_id", kegiatan.id)
      .eq("quiz", jenis)
      .maybeSingle(),
    supabase.rpc("jumlah_soal_aktif", { p_kegiatan_id: kegiatan.id, p_quiz: jenis }),
    supabase
      .from("hasil_quiz")
      .select("id, urutan_soal, selesai, otomatis")
      .eq("pengguna_id", penggunaId)
      .eq("kegiatan_id", kegiatan.id)
      .eq("quiz", jenis)
      .maybeSingle(),
    supabase
      .from("izin_kerja_ulang")
      .select("pengguna_id")
      .eq("pengguna_id", penggunaId)
      .eq("kegiatan_id", kegiatan.id)
      .eq("quiz", jenis)
      .maybeSingle(),
  ]);
  if (pengaturanRes.error) throw new Error(`Gagal membaca pengaturan quiz: ${pengaturanRes.error.message}`);
  if (jumlahRes.error) throw new Error(`Gagal membaca jumlah soal: ${jumlahRes.error.message}`);
  if (hasilRes.error) throw new Error(`Gagal membaca hasil quiz: ${hasilRes.error.message}`);
  if (izinRes.error) throw new Error(`Gagal membaca izin quiz: ${izinRes.error.message}`);

  const data: DataQuizPegawai = {
    aktif: true,
    pengaturan: pengaturanRes.data ? petakanPengaturan(pengaturanRes.data as BarisPengaturan) : undefined,
    jumlahSoal: Number(jumlahRes.data ?? 0),
    diizinkan: izinRes.data !== null,
    hasil: null,
    review: null,
    sesi: null,
  };

  const baris = hasilRes.data as
    | { id: string; urutan_soal: string[]; selesai: string; otomatis: boolean }
    | null;

  if (baris) {
    const [soalRes, jawabanRes] = await Promise.all([
      supabase
        .from("soal_quiz")
        .select("id, kegiatan_id, quiz, urutan, pertanyaan, opsi, aktif, kunci_soal(kunci, pembahasan)")
        .eq("kegiatan_id", kegiatan.id)
        .eq("quiz", jenis)
        .order("urutan"),
      supabase.from("jawaban_quiz").select("soal_id, pilihan").eq("hasil_id", baris.id),
    ]);
    if (soalRes.error) throw new Error(`Gagal membaca soal quiz: ${soalRes.error.message}`);
    if (jawabanRes.error) throw new Error(`Gagal membaca jawaban quiz: ${jawabanRes.error.message}`);

    const soalList = (soalRes.data as BarisSoalLengkap[])
      .map(petakanSoalLengkap)
      .filter((s): s is SoalQuiz => s !== null);
    const jawaban: Record<string, number> = {};
    for (const j of jawabanRes.data as { soal_id: string; pilihan: number }[]) {
      jawaban[j.soal_id] = j.pilihan;
    }

    const r = hitungHasil(soalList, jawaban);
    data.hasil = {
      nilai: r.nilai,
      benar: r.benar,
      salah: r.salah,
      total: r.total,
      selesai: isoKeLokal(baris.selesai),
      otomatis: baris.otomatis,
    };

    if (rincian) {
      // soal dalam urutan yang dilihat pegawai; soal yang kini nonaktif tidak ditampilkan
      data.review = baris.urutan_soal
        .map((id) => soalList.find((s) => s.id === id))
        .filter((s): s is SoalQuiz => s !== undefined && s.aktif)
        .map<ReviewSoal>((s) => ({
          id: s.id,
          pertanyaan: s.pertanyaan,
          opsi: s.opsi,
          kunci: s.kunci,
          pembahasan: s.pembahasan,
          pilihan: jawaban[s.id] ?? null,
        }));
    }
    return data;
  }

  if (rincian) data.sesi = await ambilSesiSaya(kegiatan.id, jenis, penggunaId);
  return data;
}

// Pengerjaan yang sedang berjalan: soal (tanpa kunci) dalam urutan acak sesi ini dan jawaban yang sudah tersimpan
async function ambilSesiSaya(
  kegiatanId: string,
  jenis: JenisQuiz,
  penggunaId: string,
): Promise<SesiPegawai | null> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("sesi_kerja_quiz")
    .select("mulai, berakhir_pada, urutan_soal, jawaban")
    .eq("pengguna_id", penggunaId)
    .eq("kegiatan_id", kegiatanId)
    .eq("quiz", jenis)
    .maybeSingle();
  if (error) throw new Error(`Gagal membaca sesi quiz: ${error.message}`);
  if (!data) return null;

  const sesi = data as { mulai: string; berakhir_pada: string; urutan_soal: string[]; jawaban: unknown };

  const { data: soalRows, error: soalError } = await supabase
    .from("soal_quiz")
    .select("id, pertanyaan, opsi")
    .in("id", sesi.urutan_soal);
  if (soalError) throw new Error(`Gagal membaca soal quiz: ${soalError.message}`);

  const peta = new Map((soalRows as { id: string; pertanyaan: string; opsi: string[] }[]).map((s) => [s.id, s]));
  const soal = sesi.urutan_soal
    .map((id) => peta.get(id))
    .filter((s): s is { id: string; pertanyaan: string; opsi: string[] } => s !== undefined);

  const sisaDetik = Math.max(0, Math.ceil((new Date(sesi.berakhir_pada).getTime() - Date.now()) / 1000));

  return {
    mulai: isoKeLokal(sesi.mulai),
    sisaDetik,
    jawaban: bersihkanJawaban(sesi.jawaban),
    soal,
  };
}

/* ------------------------------------------------------------------ */
/* Sisi admin (halaman Kelola Quiz)                                    */
/* ------------------------------------------------------------------ */

export type DataQuizAdmin = {
  opdList: Opd[];
  penggunaList: Pengguna[]; // pegawai OPD (operator)
  soalList: SoalQuiz[]; // dengan kunci dan pembahasan
  pengaturanList: PengaturanQuiz[];
  hasilList: HasilQuiz[];
  izinList: IzinKerjaUlang[];
  logList: LogPerubahanQuiz[];
};

type BarisHasilAdmin = {
  pengguna_id: string;
  quiz: JenisQuiz;
  urutan_soal: string[];
  jawaban: unknown;
  mulai: string;
  selesai: string;
  otomatis: boolean;
};

type BarisIzin = {
  kegiatan_id: string;
  quiz: JenisQuiz;
  pengguna_id: string;
  diberikan_pada: string;
  admin_nama: string;
};

type BarisLog = {
  id: string;
  kegiatan_id: string;
  quiz: JenisQuiz;
  jenis: JenisLogQuiz;
  soal_id: string | null;
  kunci_lama: number | null;
  kunci_baru: number | null;
  pengguna_id: string | null;
  admin_nama: string;
  waktu: string;
};

// Sesi admin (RLS mengizinkan admin membaca semuanya). Sesi pegawai yang waktunya sudah lewat
// dijadikan hasil dulu supaya rekap tidak ketinggalan.
export async function ambilDataQuizAdmin(kegiatanId: string): Promise<DataQuizAdmin> {
  const supabase = await buatKlienServer();

  const { error: errFinal } = await supabase.rpc("finalkan_sesi_kedaluwarsa", { p_kegiatan_id: kegiatanId });
  if (errFinal) throw new Error(`Gagal memeriksa sesi quiz: ${errFinal.message}`);

  const [opdRes, pegawaiRes, soalRes, pengaturanRes, hasilRes, izinRes, logRes] = await Promise.all([
    supabase.from("opd").select("id, nama, singkatan").order("nama"),
    supabase.from("profil").select("id, nama, email, opd_id").eq("peran", "operator").order("nama"),
    supabase
      .from("soal_quiz")
      .select("id, kegiatan_id, quiz, urutan, pertanyaan, opsi, aktif, kunci_soal(kunci, pembahasan)")
      .eq("kegiatan_id", kegiatanId)
      .order("quiz")
      .order("urutan"),
    supabase.from("pengaturan_quiz").select(KOLOM_PENGATURAN).eq("kegiatan_id", kegiatanId),
    supabase.rpc("hasil_quiz_admin", { p_kegiatan_id: kegiatanId }),
    supabase
      .from("izin_kerja_ulang")
      .select("kegiatan_id, quiz, pengguna_id, diberikan_pada, admin_nama")
      .eq("kegiatan_id", kegiatanId),
    supabase
      .from("log_perubahan_quiz")
      .select("id, kegiatan_id, quiz, jenis, soal_id, kunci_lama, kunci_baru, pengguna_id, admin_nama, waktu")
      .eq("kegiatan_id", kegiatanId)
      .order("waktu"),
  ]);
  if (opdRes.error) throw new Error(`Gagal membaca OPD: ${opdRes.error.message}`);
  if (pegawaiRes.error) throw new Error(`Gagal membaca pegawai: ${pegawaiRes.error.message}`);
  if (soalRes.error) throw new Error(`Gagal membaca soal quiz: ${soalRes.error.message}`);
  if (pengaturanRes.error) throw new Error(`Gagal membaca pengaturan quiz: ${pengaturanRes.error.message}`);
  if (hasilRes.error) throw new Error(`Gagal membaca hasil quiz: ${hasilRes.error.message}`);
  if (izinRes.error) throw new Error(`Gagal membaca izin quiz: ${izinRes.error.message}`);
  if (logRes.error) throw new Error(`Gagal membaca log quiz: ${logRes.error.message}`);

  const penggunaList: Pengguna[] = (
    pegawaiRes.data as { id: string; nama: string; email: string; opd_id: string | null }[]
  ).map((p) => ({
    id: p.id,
    nama: p.nama,
    email: p.email,
    peran: "operator",
    opdId: p.opd_id ?? undefined,
  }));
  const opdPegawai = new Map(penggunaList.map((p) => [p.id, p.opdId ?? ""]));

  return {
    opdList: opdRes.data as Opd[],
    penggunaList,
    soalList: (soalRes.data as BarisSoalLengkap[])
      .map(petakanSoalLengkap)
      .filter((s): s is SoalQuiz => s !== null),
    pengaturanList: (pengaturanRes.data as BarisPengaturan[]).map(petakanPengaturan),
    hasilList: (hasilRes.data as BarisHasilAdmin[]).map((h) => ({
      penggunaId: h.pengguna_id,
      opdId: opdPegawai.get(h.pengguna_id) ?? "",
      kegiatanId,
      quizId: h.quiz,
      urutanSoal: h.urutan_soal,
      jawaban: bersihkanJawaban(h.jawaban),
      mulai: isoKeLokal(h.mulai),
      selesai: isoKeLokal(h.selesai),
      otomatis: h.otomatis,
    })),
    izinList: (izinRes.data as BarisIzin[]).map((i) => ({
      kegiatanId: i.kegiatan_id,
      quizId: i.quiz,
      penggunaId: i.pengguna_id,
      diberikanPada: isoKeLokal(i.diberikan_pada),
      admin: i.admin_nama,
    })),
    logList: (logRes.data as BarisLog[]).map((l) => ({
      id: l.id,
      kegiatanId: l.kegiatan_id,
      quizId: l.quiz,
      jenis: l.jenis,
      soalId: l.soal_id ?? undefined,
      kunciLama: l.kunci_lama ?? undefined,
      kunciBaru: l.kunci_baru ?? undefined,
      penggunaId: l.pengguna_id ?? undefined,
      admin: l.admin_nama,
      waktu: isoKeLokal(l.waktu),
    })),
  };
}