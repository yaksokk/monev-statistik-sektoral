"use server";

import { revalidatePath } from "next/cache";
import { ambilAdmin } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HALAMAN = ["/admin/modul", "/opd/pembinaan-1", "/opd/pembinaan-2"];

function galat(pesan: string) {
  return { ok: false as const, pesan };
}

function segarkan() {
  for (const h of HALAMAN) revalidatePath(h);
}

function linkHttps(teks: string) {
  try {
    const u = new URL(teks);
    return u.protocol === "https:" && u.hostname.length > 0;
  } catch {
    return false;
  }
}

type GalatDb = { code?: string; message: string };

function pesanDb(error: GalatDb, konteks: string, umum: string) {
  if (error.code === "P0001") return galat(error.message);
  if (error.code === "23514") return galat("Data tidak memenuhi aturan (judul wajib diisi, link harus https).");
  console.error(`${konteks}:`, error.code, error.message);
  return galat(umum);
}

function periksaBab(d: unknown): { judul: string; linkMateri: string; pembinaan: 1 | 2 } | string {
  if (typeof d !== "object" || d === null) return "Data bab tidak valid.";
  const { judul, linkMateri, pembinaan } = d as Record<string, unknown>;
  const j = typeof judul === "string" ? judul.trim() : "";
  const l = typeof linkMateri === "string" ? linkMateri.trim() : "";
  if (!j) return "Judul bab wajib diisi.";
  if (j.length > 200) return "Judul bab terlalu panjang (maksimal 200 karakter).";
  if (!l) return "Link materi wajib diisi.";
  if (l.length > 2000) return "Link materi terlalu panjang.";
  if (!linkHttps(l)) return "Link materi harus berupa alamat https yang valid.";
  if (pembinaan !== 1 && pembinaan !== 2) return "Pembinaan tidak valid.";
  return { judul: j, linkMateri: l, pembinaan };
}

async function pastikanAdmin() {
  const admin = await ambilAdmin();
  return admin ? null : galat("Sesi berakhir atau Anda bukan admin. Silakan masuk lagi.");
}

export async function simpanModul(d: { judul: string; subjudul: string }) {
  const tolak = await pastikanAdmin();
  if (tolak) return tolak;

  const judul = typeof d?.judul === "string" ? d.judul.trim() : "";
  const subjudul = typeof d?.subjudul === "string" ? d.subjudul.trim() : "";
  if (!judul) return galat("Judul modul wajib diisi.");
  if (judul.length > 200) return galat("Judul modul terlalu panjang (maksimal 200 karakter).");
  if (subjudul.length > 300) return galat("Subjudul terlalu panjang (maksimal 300 karakter).");

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("simpan_modul", { p_judul: judul, p_subjudul: subjudul });
  if (error) return pesanDb(error, "simpanModul", "Gagal menyimpan modul.");

  segarkan();
  return { ok: true as const };
}

export async function tambahBab(modulId: string, d: { judul: string; linkMateri: string; pembinaan: number }) {
  const tolak = await pastikanAdmin();
  if (tolak) return tolak;
  if (typeof modulId !== "string" || !UUID.test(modulId)) return galat("Modul tidak valid.");
  const bab = periksaBab(d);
  if (typeof bab === "string") return galat(bab);

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("tambah_bab", {
    p_modul_id: modulId,
    p_judul: bab.judul,
    p_link: bab.linkMateri,
    p_pembinaan: bab.pembinaan,
  });
  if (error) return pesanDb(error, "tambahBab", "Gagal menambah bab.");

  segarkan();
  return { ok: true as const };
}

export async function ubahBab(id: string, d: { judul: string; linkMateri: string; pembinaan: number }) {
  const tolak = await pastikanAdmin();
  if (tolak) return tolak;
  if (typeof id !== "string" || !UUID.test(id)) return galat("Bab tidak valid.");
  const bab = periksaBab(d);
  if (typeof bab === "string") return galat(bab);

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("ubah_bab", {
    p_id: id,
    p_judul: bab.judul,
    p_link: bab.linkMateri,
    p_pembinaan: bab.pembinaan,
  });
  if (error) return pesanDb(error, "ubahBab", "Gagal memperbarui bab.");

  segarkan();
  return { ok: true as const };
}

// Catatan bab_selesai ikut terhapus lewat cascade
export async function hapusBab(id: string) {
  const tolak = await pastikanAdmin();
  if (tolak) return tolak;
  if (typeof id !== "string" || !UUID.test(id)) return galat("Bab tidak valid.");

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("hapus_bab", { p_id: id });
  if (error) return pesanDb(error, "hapusBab", "Gagal menghapus bab.");

  segarkan();
  return { ok: true as const };
}

export async function geserBab(id: string, arah: number) {
  const tolak = await pastikanAdmin();
  if (tolak) return tolak;
  if (typeof id !== "string" || !UUID.test(id)) return galat("Bab tidak valid.");
  if (arah !== -1 && arah !== 1) return galat("Arah tidak valid.");

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("geser_bab", { p_id: id, p_arah: arah });
  if (error) return pesanDb(error, "geserBab", "Gagal menggeser bab.");

  segarkan();
  return { ok: true as const };
}