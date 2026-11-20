"use server";

import { revalidatePath } from "next/cache";
import { ambilOperator } from "@/lib/operator";
import { buatKlienServer } from "@/lib/supabase/server";
import type { JenisQuiz } from "@/lib/types";

type Hasil = { ok: true } | { ok: false; pesan: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAKS_OPSI = 6;
const MAKS_SOAL = 200;

// Halaman yang tampilannya berubah setelah quiz dimulai atau dikirim
const HALAMAN_QUIZ: Record<JenisQuiz, string> = {
  pretest: "/opd/pembinaan-1/pre-test",
  posttest: "/opd/pembinaan-2/post-test",
};
const HALAMAN_SETELAH_KIRIM = [
  "/opd/pembinaan-1/pre-test",
  "/opd/pembinaan-1",
  "/opd/pembinaan-2/post-test",
  "/opd/pembinaan-2",
];

const jenisValid = (j: unknown): j is JenisQuiz => j === "pretest" || j === "posttest";
const pilihanValid = (n: unknown): n is number =>
  typeof n === "number" && Number.isInteger(n) && n >= 0 && n < MAKS_OPSI;

// Pesan dari raise exception SQL (P0001) diteruskan ke pegawai; galat lain diganti pesan umum
function pesanGalat(error: { code?: string; message: string }): string {
  return error.code === "P0001" ? error.message : "Terjadi kesalahan. Coba lagi.";
}

// Memulai atau melanjutkan pengerjaan. Waktu mulai ditentukan server
export async function mulaiQuiz(kegiatanId: string, jenis: JenisQuiz): Promise<Hasil> {
  if (!UUID.test(kegiatanId) || !jenisValid(jenis)) return { ok: false, pesan: "Permintaan tidak valid." };
  await ambilOperator();

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("mulai_quiz", { p_kegiatan_id: kegiatanId, p_quiz: jenis });
  if (error) return { ok: false, pesan: pesanGalat(error) };

  revalidatePath(HALAMAN_QUIZ[jenis]);
  return { ok: true };
}

// Menyimpan satu pilihan. Sengaja tanpa revalidatePath supaya halaman tidak dimuat ulang tiap klik
export async function simpanJawaban(
  kegiatanId: string,
  jenis: JenisQuiz,
  soalId: string,
  pilihan: number,
): Promise<Hasil> {
  if (!UUID.test(kegiatanId) || !UUID.test(soalId) || !jenisValid(jenis) || !pilihanValid(pilihan)) {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }
  await ambilOperator();

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("simpan_jawaban_quiz", {
    p_kegiatan_id: kegiatanId,
    p_quiz: jenis,
    p_soal_id: soalId,
    p_pilihan: pilihan,
  });
  if (error) return { ok: false, pesan: pesanGalat(error) };
  return { ok: true };
}

// Mengirim semua jawaban. Server yang menentukan waktu selesai dan menilai kiriman yang terlambat
export async function kirimQuiz(
  kegiatanId: string,
  jenis: JenisQuiz,
  jawaban: Record<string, number>,
  otomatis: boolean,
): Promise<Hasil> {
  if (!UUID.test(kegiatanId) || !jenisValid(jenis) || typeof otomatis !== "boolean") {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }
  if (!jawaban || typeof jawaban !== "object" || Array.isArray(jawaban)) {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }
  const pasangan = Object.entries(jawaban);
  if (pasangan.length > MAKS_SOAL || pasangan.some(([id, n]) => !UUID.test(id) || !pilihanValid(n))) {
    return { ok: false, pesan: "Permintaan tidak valid." };
  }
  await ambilOperator();

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("kirim_quiz", {
    p_kegiatan_id: kegiatanId,
    p_quiz: jenis,
    p_jawaban: Object.fromEntries(pasangan),
    p_otomatis: otomatis,
  });
  if (error) return { ok: false, pesan: pesanGalat(error) };

  for (const halaman of HALAMAN_SETELAH_KIRIM) revalidatePath(halaman);
  return { ok: true };
}