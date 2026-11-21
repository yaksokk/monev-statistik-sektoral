"use server";

import { revalidatePath } from "next/cache";
import { ambilAdmin } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";
import type { JenisQuiz } from "@/lib/types";
import { lokalKeIso, waktuValid } from "@/lib/waktu";

type Hasil = { ok: true } | { ok: false; pesan: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIDAK_VALID: Hasil = { ok: false, pesan: "Permintaan tidak valid." };
const HALAMAN = "/admin/quiz";

const MIN_OPSI = 2;
const MAKS_OPSI = 6;
const MAKS_TEKS = 2000;
const MAKS_OPSI_TEKS = 500;
const MAKS_PEMBAHASAN = 4000;
const MAKS_DURASI = 1440;
const MAKS_TARGET = 500;

const jenisValid = (j: unknown): j is JenisQuiz => j === "pretest" || j === "posttest";

// Pesan dari raise exception SQL (P0001) diteruskan ke admin; galat lain diganti pesan umum
function pesanGalat(error: { code?: string; message: string }): string {
  return error.code === "P0001" ? error.message : "Terjadi kesalahan. Coba lagi.";
}

export type MasukanPengaturanAksi = {
  waktuBuka: string | null; // yyyy-mm-ddTHH:mm (WITA)
  batasAkhir: string | null;
  durasiMenit: number;
  acakSoal: boolean;
};

export async function simpanPengaturanQuiz(
  kegiatanId: string,
  jenis: JenisQuiz,
  m: MasukanPengaturanAksi,
): Promise<Hasil> {
  if (!UUID.test(kegiatanId) || !jenisValid(jenis) || !m || typeof m !== "object") return TIDAK_VALID;
  if (m.waktuBuka !== null && (typeof m.waktuBuka !== "string" || !waktuValid(m.waktuBuka))) return TIDAK_VALID;
  if (m.batasAkhir !== null && (typeof m.batasAkhir !== "string" || !waktuValid(m.batasAkhir))) return TIDAK_VALID;
  if (!Number.isInteger(m.durasiMenit) || m.durasiMenit < 1 || m.durasiMenit > MAKS_DURASI) {
    return { ok: false, pesan: "Durasi minimal 1 menit." };
  }
  if (typeof m.acakSoal !== "boolean") return TIDAK_VALID;
  await ambilAdmin();

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("simpan_pengaturan_quiz", {
    p_kegiatan_id: kegiatanId,
    p_quiz: jenis,
    p_waktu_buka: m.waktuBuka ? lokalKeIso(m.waktuBuka) : null,
    p_batas_akhir: m.batasAkhir ? lokalKeIso(m.batasAkhir) : null,
    p_durasi_menit: m.durasiMenit,
    p_acak_soal: m.acakSoal,
  });
  if (error) return { ok: false, pesan: pesanGalat(error) };

  revalidatePath(HALAMAN);
  return { ok: true };
}

export type MasukanSoalAksi = { pertanyaan: string; opsi: string[]; kunci: number; pembahasan: string };

// id kosong = soal baru. Setelah quiz dibuka, server hanya menerima perubahan teks soal, kunci, dan
// pembahasan (opsi harus sama) dan mencatatnya di log.
export async function simpanSoalQuiz(
  kegiatanId: string,
  jenis: JenisQuiz,
  id: string | null,
  d: MasukanSoalAksi,
): Promise<Hasil> {
  if (!UUID.test(kegiatanId) || !jenisValid(jenis) || (id !== null && !UUID.test(id)) || !d) return TIDAK_VALID;
  if (typeof d.pertanyaan !== "string" || typeof d.pembahasan !== "string") return TIDAK_VALID;
  if (!Array.isArray(d.opsi) || d.opsi.length < MIN_OPSI || d.opsi.length > MAKS_OPSI) {
    return { ok: false, pesan: `Jumlah opsi harus ${MIN_OPSI} sampai ${MAKS_OPSI}.` };
  }
  if (d.opsi.some((o) => typeof o !== "string" || o.trim() === "" || o.length > MAKS_OPSI_TEKS)) {
    return { ok: false, pesan: "Semua opsi wajib diisi dan tidak boleh terlalu panjang." };
  }
  if (d.pertanyaan.trim() === "" || d.pertanyaan.length > MAKS_TEKS) {
    return { ok: false, pesan: "Teks soal wajib diisi dan tidak boleh terlalu panjang." };
  }
  if (d.pembahasan.length > MAKS_PEMBAHASAN) return { ok: false, pesan: "Pembahasan terlalu panjang." };
  if (!Number.isInteger(d.kunci) || d.kunci < 0 || d.kunci >= d.opsi.length) {
    return { ok: false, pesan: "Pilih satu opsi sebagai kunci jawaban." };
  }
  await ambilAdmin();

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("simpan_soal", {
    p_id: id,
    p_kegiatan_id: kegiatanId,
    p_quiz: jenis,
    p_pertanyaan: d.pertanyaan,
    p_opsi: d.opsi,
    p_kunci: d.kunci,
    p_pembahasan: d.pembahasan,
  });
  if (error) return { ok: false, pesan: pesanGalat(error) };

  revalidatePath(HALAMAN);
  return { ok: true };
}

export async function ubahAktifSoalQuiz(soalId: string, aktif: boolean): Promise<Hasil> {
  if (!UUID.test(soalId) || typeof aktif !== "boolean") return TIDAK_VALID;
  await ambilAdmin();

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("ubah_aktif_soal", { p_soal_id: soalId, p_aktif: aktif });
  if (error) return { ok: false, pesan: pesanGalat(error) };

  revalidatePath(HALAMAN);
  return { ok: true };
}

// waktuBukaDikosongkan = true bila soal aktif habis sehingga waktu buka ikut dikosongkan
export async function hapusSoalQuiz(
  soalId: string,
): Promise<{ ok: true; waktuBukaDikosongkan: boolean } | { ok: false; pesan: string }> {
  if (!UUID.test(soalId)) return { ok: false, pesan: "Permintaan tidak valid." };
  await ambilAdmin();

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("hapus_soal", { p_soal_id: soalId });
  if (error) return { ok: false, pesan: pesanGalat(error) };

  revalidatePath(HALAMAN);
  return { ok: true, waktuBukaDikosongkan: data === true };
}

export async function geserSoalQuiz(soalId: string, arah: -1 | 1): Promise<Hasil> {
  if (!UUID.test(soalId) || (arah !== -1 && arah !== 1)) return TIDAK_VALID;
  await ambilAdmin();

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("geser_soal", { p_soal_id: soalId, p_arah: arah });
  if (error) return { ok: false, pesan: pesanGalat(error) };

  revalidatePath(HALAMAN);
  return { ok: true };
}

export type TargetIzinAksi = { penggunaId: string; jenis: JenisQuiz };

// Hasil lama dihapus, izin dan log dicatat, semuanya dalam satu transaksi di database
export async function beriIzinKerjaUlang(kegiatanId: string, target: TargetIzinAksi[]): Promise<Hasil> {
  if (!UUID.test(kegiatanId) || !Array.isArray(target)) return TIDAK_VALID;
  if (target.length === 0) return { ok: false, pesan: "Pilih minimal satu pegawai." };
  if (target.length > MAKS_TARGET || target.some((t) => !t || !UUID.test(t.penggunaId) || !jenisValid(t.jenis))) {
    return TIDAK_VALID;
  }
  await ambilAdmin();

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("beri_izin_kerja_ulang_banyak", {
    p_kegiatan_id: kegiatanId,
    p_target: target.map((t) => ({ pengguna_id: t.penggunaId, quiz: t.jenis })),
  });
  if (error) return { ok: false, pesan: pesanGalat(error) };

  revalidatePath(HALAMAN);
  return { ok: true };
}