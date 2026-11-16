"use server";

import { revalidatePath } from "next/cache";
import { linkHttps } from "@/lib/dashboard";
import { ambilAdmin } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";
import type { Opd } from "@/lib/types";

const HALAMAN = "/admin/opd";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function galat(pesan: string) {
  return { ok: false as const, pesan };
}

function teks(x: unknown): string {
  return typeof x === "string" ? x.trim() : "";
}

// Semua action memakai sesi admin (RLS tetap berlaku); non-admin dialihkan ke /login oleh ambilAdmin

export async function tambahOpd(masuk: { nama: string; singkatan: string }) {
  await ambilAdmin();
  const nama = teks(masuk?.nama);
  const singkatan = teks(masuk?.singkatan);
  if (!nama || !singkatan) return galat("Semua kolom wajib diisi.");
  if (nama.length > 200 || singkatan.length > 50) return galat("Nama atau singkatan terlalu panjang.");

  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("opd")
    .insert({ nama, singkatan })
    .select("id, nama, singkatan")
    .single();
  if (error) {
    if (error.code === "23505") return galat("Nama OPD ini sudah ada.");
    console.error("tambahOpd:", error.code, error.message);
    return galat("Gagal menyimpan OPD.");
  }

  revalidatePath(HALAMAN);
  return { ok: true as const, opd: data as Opd };
}

export async function ubahOpd(id: string, masuk: { nama: string; singkatan: string }) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("OPD tidak valid.");
  const nama = teks(masuk?.nama);
  const singkatan = teks(masuk?.singkatan);
  if (!nama || !singkatan) return galat("Semua kolom wajib diisi.");
  if (nama.length > 200 || singkatan.length > 50) return galat("Nama atau singkatan terlalu panjang.");

  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("opd")
    .update({ nama, singkatan })
    .eq("id", id)
    .select("id");
  if (error) {
    if (error.code === "23505") return galat("Nama OPD ini sudah ada.");
    console.error("ubahOpd:", error.code, error.message);
    return galat("Gagal menyimpan perubahan.");
  }
  if (!data?.length) return galat("OPD tidak ditemukan.");

  revalidatePath(HALAMAN);
  return { ok: true as const };
}

// Hanya bila OPD tanpa pegawai. Cek di server; FK profil.opd_id (restrict) jadi pengaman terakhir
export async function hapusOpd(id: string) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("OPD tidak valid.");

  const supabase = await buatKlienServer();
  const { count, error: galatHitung } = await supabase
    .from("profil")
    .select("id", { count: "exact", head: true })
    .eq("opd_id", id);
  if (galatHitung) {
    console.error("hapusOpd (hitung):", galatHitung.code, galatHitung.message);
    return galat("Gagal memeriksa pegawai OPD.");
  }
  if ((count ?? 0) > 0) return galat("OPD masih punya pegawai. Hapus dulu semua pegawainya.");

  const { data, error } = await supabase.from("opd").delete().eq("id", id).select("id");
  if (error) {
    if (error.code === "23503") return galat("OPD masih punya pegawai. Hapus dulu semua pegawainya.");
    console.error("hapusOpd:", error.code, error.message);
    return galat("Gagal menghapus OPD.");
  }
  if (!data?.length) return galat("OPD tidak ditemukan.");

  revalidatePath(HALAMAN);
  return { ok: true as const };
}

// link kosong = hapus link
export async function simpanLinkSertifikat(penggunaId: string, link: string) {
  await ambilAdmin();
  if (!UUID.test(penggunaId)) return galat("Pegawai tidak valid.");
  const teksLink = teks(link);
  if (teksLink.length > 2000) return galat("Link terlalu panjang.");
  if (teksLink && !linkHttps(teksLink)) return galat("Link harus diawali https://");

  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("profil")
    .update({ link_sertifikat: teksLink || null })
    .eq("id", penggunaId)
    .eq("peran", "operator")
    .select("id");
  if (error) {
    console.error("simpanLinkSertifikat:", error.code, error.message);
    return galat("Gagal menyimpan link.");
  }
  if (!data?.length) return galat("Pegawai tidak ditemukan.");

  revalidatePath(HALAMAN);
  return { ok: true as const };
}