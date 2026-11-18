"use server";

import { revalidatePath } from "next/cache";
import { ambilPengguna } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HALAMAN = ["/opd/pembinaan-1", "/opd/pembinaan-2", "/admin/modul"];

function galat(pesan: string) {
  return { ok: false as const, pesan };
}

function segarkan() {
  for (const h of HALAMAN) revalidatePath(h);
}

// pengguna_id selalu dari sesi; selesai_pada diisi default now() di database
export async function tandaiSelesai(babId: string) {
  const data = await ambilPengguna();
  if (!data || data.pengguna.peran !== "operator") return galat("Sesi berakhir. Silakan masuk lagi.");
  if (typeof babId !== "string" || !UUID.test(babId)) return galat("Bab tidak valid.");

  const supabase = await buatKlienServer();

  const { data: bab, error: errBab } = await supabase
    .from("bab_modul")
    .select("id, link_materi")
    .eq("id", babId)
    .maybeSingle();
  if (errBab) {
    console.error("tandaiSelesai (baca bab):", errBab.code, errBab.message);
    return galat("Gagal menyimpan penanda.");
  }
  if (!bab) {
    segarkan();
    return galat("Bab ini sudah tidak ada.");
  }
  if (!bab.link_materi) return galat("Materi bab ini belum tersedia.");

  const { error } = await supabase
    .from("bab_selesai")
    .insert({ pengguna_id: data.pengguna.id, bab_id: babId });

  // 23505: sudah ditandai (klik ganda atau dua tab) dianggap berhasil
  if (error && error.code !== "23505") {
    if (error.code === "23503") {
      segarkan();
      return galat("Bab ini sudah tidak ada.");
    }
    if (error.code === "P0001") return galat(error.message);
    console.error("tandaiSelesai:", error.code, error.message);
    return galat("Gagal menyimpan penanda.");
  }

  segarkan();
  return { ok: true as const };
}

// Menghapus baris yang sudah tidak ada dianggap berhasil
export async function batalkanSelesai(babId: string) {
  const data = await ambilPengguna();
  if (!data || data.pengguna.peran !== "operator") return galat("Sesi berakhir. Silakan masuk lagi.");
  if (typeof babId !== "string" || !UUID.test(babId)) return galat("Bab tidak valid.");

  const supabase = await buatKlienServer();
  const { error } = await supabase
    .from("bab_selesai")
    .delete()
    .eq("pengguna_id", data.pengguna.id)
    .eq("bab_id", babId);
  if (error) {
    console.error("batalkanSelesai:", error.code, error.message);
    return galat("Gagal membatalkan penanda.");
  }

  segarkan();
  return { ok: true as const };
}