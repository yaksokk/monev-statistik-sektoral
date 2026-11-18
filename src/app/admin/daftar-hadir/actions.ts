"use server";

import { revalidatePath } from "next/cache";
import { ambilAdmin } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";
import { isoKeLokal, lokalKeIso, sekarangWita, waktuValid } from "@/lib/waktu";

const HALAMAN = "/admin/daftar-hadir";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Isian = { judul: string; buka: string; batas: string };
type Klien = Awaited<ReturnType<typeof buatKlienServer>>;

function galat(pesan: string) {
  return { ok: false as const, pesan };
}

function berhasil() {
  revalidatePath(HALAMAN);
  return { ok: true as const };
}

// P0001 = pesan dari raise exception di SQL (sudah berbahasa Indonesia)
function galatDb(konteks: string, error: { code?: string; message: string }, cadangan: string) {
  if (error.code === "P0001") return galat(error.message);
  console.error(`${konteks}:`, error.code, error.message);
  return galat(cadangan);
}

function satu<T>(x: T | T[] | null | undefined): T | null {
  return Array.isArray(x) ? (x[0] ?? null) : (x ?? null);
}

const PESAN_ARSIP = "Kegiatan ini diarsipkan, jadi hanya bisa dilihat.";

async function statusKegiatan(supabase: Klien, kegiatanId: string): Promise<string | null> {
  const { data } = await supabase.from("kegiatan").select("status").eq("id", kegiatanId).maybeSingle();
  return (data as { status: string } | null)?.status ?? null;
}

type HasilSesi = { pesan: string } | { judul: string; buka: string; batas: string };

function periksaSesi(masuk: Isian): HasilSesi {
  const judul = (typeof masuk?.judul === "string" ? masuk.judul : "").trim();
  const buka = typeof masuk?.buka === "string" ? masuk.buka.trim() : "";
  const batas = typeof masuk?.batas === "string" ? masuk.batas.trim() : "";

  if (!judul) return { pesan: "Judul sesi wajib diisi." };
  if (judul.length > 200) return { pesan: "Judul sesi terlalu panjang." };
  if ((buka && !waktuValid(buka)) || (batas && !waktuValid(batas))) return { pesan: "Waktu tidak valid." };
  if (buka && batas && batas <= buka) return { pesan: "Batas pengisian harus setelah waktu buka." };
  return { judul, buka, batas };
}

// Semua action memakai sesi admin (RLS tetap berlaku); non-admin dialihkan ke /login oleh ambilAdmin

export async function ubahAmbang(kegiatanId: string, nilai: number) {
  await ambilAdmin();
  if (!UUID.test(kegiatanId)) return galat("Kegiatan tidak valid.");
  if (typeof nilai !== "number" || !Number.isInteger(nilai) || nilai < 1 || nilai > 100) {
    return galat("Ambang harus bilangan bulat 1 sampai 100.");
  }
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("kegiatan")
    .update({ ambang_kehadiran: nilai })
    .eq("id", kegiatanId)
    .neq("status", "arsip")
    .select("id");
  if (error) return galatDb("ubahAmbang", error, "Gagal menyimpan ambang.");
  if (!data?.length) return galat("Kegiatan tidak ditemukan atau sudah diarsipkan.");
  return berhasil();
}

export async function tambahSesi(kegiatanId: string, masuk: Isian) {
  await ambilAdmin();
  if (!UUID.test(kegiatanId)) return galat("Kegiatan tidak valid.");
  const h = periksaSesi(masuk);
  if ("pesan" in h) return galat(h.pesan);
  if (h.batas && h.batas <= sekarangWita()) return galat("Batas pengisian harus di masa depan.");

  const supabase = await buatKlienServer();
  const status = await statusKegiatan(supabase, kegiatanId);
  if (!status) return galat("Kegiatan tidak ditemukan.");
  if (status === "arsip") return galat(PESAN_ARSIP);

  // urutan diisi trigger
  const { error } = await supabase.from("sesi_pembinaan").insert({
    kegiatan_id: kegiatanId,
    judul: h.judul,
    waktu_buka: h.buka ? lokalKeIso(h.buka) : null,
    batas_pengisian: h.batas ? lokalKeIso(h.batas) : null,
  });
  if (error) return galatDb("tambahSesi", error, "Gagal menyimpan sesi.");
  return berhasil();
}

export async function ubahSesi(id: string, masuk: Isian) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("Sesi tidak valid.");
  const h = periksaSesi(masuk);
  if ("pesan" in h) return galat(h.pesan);

  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("sesi_pembinaan")
    .select("id, batas_pengisian, kegiatan(status)")
    .eq("id", id)
    .maybeSingle();
  const lama = data as unknown as {
    batas_pengisian: string | null;
    kegiatan: { status: string } | { status: string }[] | null;
  } | null;
  if (!lama) return galat("Sesi tidak ditemukan.");
  if (satu(lama.kegiatan)?.status === "arsip") return galat(PESAN_ARSIP);

  // batas yang diubah harus di masa depan, supaya sesi tidak langsung terkunci lagi
  const batasLama = lama.batas_pengisian ? isoKeLokal(lama.batas_pengisian) : "";
  if (h.batas && h.batas !== batasLama && h.batas <= sekarangWita()) {
    return galat("Batas pengisian harus di masa depan.");
  }

  const { data: baris, error } = await supabase
    .from("sesi_pembinaan")
    .update({
      judul: h.judul,
      waktu_buka: h.buka ? lokalKeIso(h.buka) : null,
      batas_pengisian: h.batas ? lokalKeIso(h.batas) : null,
    })
    .eq("id", id)
    .select("id");
  if (error) return galatDb("ubahSesi", error, "Gagal menyimpan perubahan.");
  if (!baris?.length) return galat("Sesi tidak ditemukan.");
  return berhasil();
}

// Ditolak bila sudah ada kehadiran; trigger tg_sesi_jaga_hapus jadi pengaman kedua
export async function hapusSesi(id: string) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("Sesi tidak valid.");

  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("sesi_pembinaan")
    .select("id, kegiatan(status)")
    .eq("id", id)
    .maybeSingle();
  const sesi = data as unknown as { kegiatan: { status: string } | { status: string }[] | null } | null;
  if (!sesi) return galat("Sesi tidak ditemukan.");
  if (satu(sesi.kegiatan)?.status === "arsip") return galat(PESAN_ARSIP);

  const { count, error: galatHitung } = await supabase
    .from("presensi")
    .select("id", { count: "exact", head: true })
    .eq("sesi_id", id);
  if (galatHitung) return galatDb("hapusSesi", galatHitung, "Gagal menghapus sesi.");
  if ((count ?? 0) > 0) return galat("Sesi sudah ada kehadiran terisi, tidak bisa dihapus.");

  const { data: baris, error } = await supabase.from("sesi_pembinaan").delete().eq("id", id).select("id");
  if (error) return galatDb("hapusSesi", error, "Gagal menghapus sesi.");
  if (!baris?.length) return galat("Sesi tidak ditemukan.");
  return berhasil();
}

export async function hapusKehadiran(id: string) {
  await ambilAdmin();
  if (!UUID.test(id)) return galat("Kehadiran tidak valid.");

  const supabase = await buatKlienServer();
  const { data } = await supabase
    .from("presensi")
    .select("id, sesi_pembinaan(kegiatan(status))")
    .eq("id", id)
    .maybeSingle();
  const baris = data as unknown as {
    sesi_pembinaan:
      | { kegiatan: { status: string } | { status: string }[] | null }
      | { kegiatan: { status: string } | { status: string }[] | null }[]
      | null;
  } | null;
  if (!baris) return galat("Kehadiran tidak ditemukan.");
  if (satu(satu(baris.sesi_pembinaan)?.kegiatan)?.status === "arsip") return galat(PESAN_ARSIP);

  const { data: dihapus, error } = await supabase.from("presensi").delete().eq("id", id).select("id");
  if (error) return galatDb("hapusKehadiran", error, "Gagal menghapus kehadiran.");
  if (!dihapus?.length) return galat("Kehadiran tidak ditemukan.");
  return berhasil();
}