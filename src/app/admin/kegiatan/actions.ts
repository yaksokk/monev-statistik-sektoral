"use server";

import { revalidatePath } from "next/cache";
import { FITUR_TAMBAH_KEGIATAN } from "@/lib/fitur";
import { ambilAdmin } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

const HALAMAN = "/admin/kegiatan";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

type StatusKegiatan = "draf" | "aktif" | "arsip";
type GalatDb = { code?: string; message: string };

type IsianKegiatan = {
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  tenggat: string;
  bobot: number;
};

function galat(pesan: string) {
  return { ok: false as const, pesan };
}

function berhasil() {
  revalidatePath(HALAMAN);
  return { ok: true as const };
}

function teks(x: unknown): string {
  return typeof x === "string" ? x.trim() : "";
}

function tanggalValid(x: string): boolean {
  if (!TANGGAL.test(x)) return false;
  const d = new Date(`${x}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === x;
}

// P0001 = pesan dari raise exception di fungsi SQL (sudah berbahasa Indonesia)
function galatDb(konteks: string, error: GalatDb, cadangan: string) {
  if (error.code === "P0001") return galat(error.message);
  console.error(`${konteks}:`, error.code, error.message);
  return galat(cadangan);
}

type NilaiKegiatan = {
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tenggat: string;
  bobot: number;
};

function periksaKegiatan(masuk: IsianKegiatan): { pesan: string } | { nilai: NilaiKegiatan } {
  const nama = teks(masuk?.nama);
  const mulai = teks(masuk?.tanggalMulai);
  const selesai = teks(masuk?.tanggalSelesai);
  const tenggat = teks(masuk?.tenggat);
  const bobot = masuk?.bobot;

  if (!nama) return { pesan: "Nama kegiatan wajib diisi." };
  if (nama.length > 200) return { pesan: "Nama kegiatan terlalu panjang." };
  if (![mulai, selesai, tenggat].every(tanggalValid)) return { pesan: "Tanggal tidak valid." };
  if (selesai < mulai) return { pesan: "Tanggal selesai tidak boleh sebelum tanggal mulai." };
  if (typeof bobot !== "number" || !Number.isInteger(bobot) || bobot < 0 || bobot > 100) {
    return { pesan: "Bobot harus bilangan bulat 0 sampai 100." };
  }
  return { nilai: { nama, tanggal_mulai: mulai, tanggal_selesai: selesai, tenggat, bobot } };
}

// Semua action memakai sesi admin (RLS tetap berlaku); non-admin dialihkan ke /login oleh ambilAdmin

export async function tambahKegiatan(masuk: IsianKegiatan) {
  await ambilAdmin();
  if (!FITUR_TAMBAH_KEGIATAN) return galat("Fitur tambah kegiatan belum diaktifkan.");
  const h = periksaKegiatan(masuk);
  if ("pesan" in h) return galat(h.pesan);

  const supabase = await buatKlienServer();
  const { error } = await supabase.from("kegiatan").insert(h.nilai);
  if (error) return galatDb("tambahKegiatan", error, "Gagal menyimpan kegiatan.");
  return berhasil();
}

export async function ubahKegiatan(id: string, masuk: IsianKegiatan) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("Kegiatan tidak valid.");
  const h = periksaKegiatan(masuk);
  if ("pesan" in h) return galat(h.pesan);

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("kegiatan").update(h.nilai).eq("id", id).select("id");
  if (error) return galatDb("ubahKegiatan", error, "Gagal menyimpan perubahan.");
  if (!data?.length) return galat("Kegiatan tidak ditemukan.");
  return berhasil();
}

// Saklar Pre-Test / Post-Test; terkunci bila kegiatan diarsipkan
export async function ubahSaklarQuiz(id: string, jenis: "pretest" | "posttest", aktif: boolean) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("Kegiatan tidak valid.");
  if ((jenis !== "pretest" && jenis !== "posttest") || typeof aktif !== "boolean") {
    return galat("Data tidak valid.");
  }
  const kolom = jenis === "pretest" ? "pretest_aktif" : "posttest_aktif";

  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("kegiatan")
    .update({ [kolom]: aktif })
    .eq("id", id)
    .neq("status", "arsip")
    .select("id");
  if (error) return galatDb("ubahSaklarQuiz", error, "Gagal mengubah pengaturan quiz.");
  if (!data?.length) return galat("Kegiatan tidak ditemukan atau sudah diarsipkan.");
  return berhasil();
}

// Memindahkan kegiatan aktif: kegiatan aktif sebelumnya kembali ke draf (diatur fungsi SQL)
export async function aktifkanKegiatan(id: string) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("Kegiatan tidak valid.");

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("aktifkan_kegiatan", { p_id: id });
  if (error) return galatDb("aktifkanKegiatan", error, "Gagal mengaktifkan kegiatan.");
  return berhasil();
}

async function pindahStatus(
  id: string,
  dari: StatusKegiatan,
  ke: StatusKegiatan,
  konteks: string,
  tidakCocok: string,
) {
  if (!UUID.test(id)) return galat("Kegiatan tidak valid.");
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("kegiatan")
    .update({ status: ke })
    .eq("id", id)
    .eq("status", dari)
    .select("id");
  if (error) return galatDb(konteks, error, "Gagal mengubah status kegiatan.");
  if (!data?.length) return galat(tidakCocok);
  return berhasil();
}

export async function nonaktifkanKegiatan(id: string) {
  await ambilAdmin();
  return pindahStatus(id, "aktif", "draf", "nonaktifkanKegiatan", "Kegiatan ini tidak sedang aktif.");
}

export async function arsipkanKegiatan(id: string) {
  await ambilAdmin();
  return pindahStatus(
    id,
    "draf",
    "arsip",
    "arsipkanKegiatan",
    "Hanya kegiatan nonaktif yang bisa diarsipkan.",
  );
}

export async function keluarkanDariArsip(id: string) {
  await ambilAdmin();
  return pindahStatus(id, "arsip", "draf", "keluarkanDariArsip", "Kegiatan ini tidak sedang diarsipkan.");
}

// Cek "tanpa data" dan penghapusan dilakukan satu transaksi di fungsi SQL hapus_kegiatan
export async function hapusKegiatan(id: string) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("Kegiatan tidak valid.");

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("hapus_kegiatan", { p_id: id });
  if (error) return galatDb("hapusKegiatan", error, "Gagal menghapus kegiatan.");
  return berhasil();
}

function namaItem(x: unknown): string | null {
  const nama = teks(x);
  if (!nama || nama.length > 200) return null;
  return nama;
}

export async function tambahItem(kegiatanId: string, nama: string) {
  await ambilAdmin();
  if (!UUID.test(kegiatanId)) return galat("Kegiatan tidak valid.");
  const n = namaItem(nama);
  if (!n) return galat("Nama item wajib diisi dan maksimal 200 karakter.");

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("tambah_item_dokumen", { p_kegiatan_id: kegiatanId, p_nama: n });
  if (error) return galatDb("tambahItem", error, "Gagal menambah item.");
  return berhasil();
}

export async function ubahItem(id: string, nama: string) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("Item tidak valid.");
  const n = namaItem(nama);
  if (!n) return galat("Nama item wajib diisi dan maksimal 200 karakter.");

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("item_dokumen").update({ nama: n }).eq("id", id).select("id");
  if (error) return galatDb("ubahItem", error, "Gagal menyimpan perubahan.");
  if (!data?.length) return galat("Item tidak ditemukan.");
  return berhasil();
}

// Hanya bila belum ada dokumen disetujui; dicek dan dihapus satu transaksi di fungsi SQL
export async function hapusItem(id: string) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("Item tidak valid.");

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("hapus_item_dokumen", { p_id: id });
  if (error) return galatDb("hapusItem", error, "Gagal menghapus item.");
  return berhasil();
}