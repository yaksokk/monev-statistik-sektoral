"use server";

import { revalidatePath } from "next/cache";
import { ambilPengguna } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

const HALAMAN = "/opd/daftar-hadir";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS = ["tepat_waktu", "terlambat", "izin"] as const;

function galat(pesan: string) {
  return { ok: false as const, pesan };
}

// Aturan sesi (aktif, sudah dibuka, belum lewat batas, atas nama sendiri) dijaga trigger tg_presensi_jaga.
// waktu_isi sengaja tidak dikirim: selalu diisi server.
export async function isiPresensi(sesiId: string, status: string, catatan: string) {
  const data = await ambilPengguna();
  if (!data || data.pengguna.peran !== "operator") return galat("Sesi berakhir. Silakan masuk lagi.");
  if (typeof sesiId !== "string" || !UUID.test(sesiId)) return galat("Sesi tidak valid.");
  if (!STATUS.includes(status as (typeof STATUS)[number])) return galat("Status kehadiran tidak valid.");

  const teks = (typeof catatan === "string" ? catatan : "").trim();
  if (teks.length > 500) return galat("Catatan terlalu panjang (maksimal 500 karakter).");
  if (status !== "tepat_waktu" && !teks) return galat("Catatan wajib diisi untuk status ini.");

  const supabase = await buatKlienServer();
  const { error } = await supabase.from("presensi").insert({
    pengguna_id: data.pengguna.id,
    sesi_id: sesiId,
    status,
    catatan: teks || null,
  });

  if (error) {
    if (error.code === "P0001") return galat(error.message);
    if (error.code === "23505") {
      revalidatePath(HALAMAN);
      return galat("Presensi sesi ini sudah terisi.");
    }
    console.error("isiPresensi:", error.code, error.message);
    return galat("Gagal menyimpan presensi.");
  }

  revalidatePath(HALAMAN);
  return { ok: true as const };
}