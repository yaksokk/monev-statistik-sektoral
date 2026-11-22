"use server";

import { revalidatePath } from "next/cache";
import { ambilAdmin } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

type Hasil = { ok: true } | { ok: false; pesan: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HTTPS = /^https:\/\//i;
const TIDAK_VALID: Hasil = { ok: false, pesan: "Permintaan tidak valid." };
const HALAMAN = "/admin/undangan";

const MAKS_JUDUL = 200;
const MAKS_LINK = 2000;
const MAKS_OPD = 200;

// Pesan dari raise exception SQL (P0001) diteruskan ke admin; galat lain diganti pesan umum
function pesanGalat(konteks: string, error: { code?: string; message: string }): string {
  if (error.code === "P0001") return error.message;
  console.error(`${konteks}:`, error.code, error.message);
  return "Terjadi kesalahan. Coba lagi.";
}

export type MasukanUndangan = { judul: string; link: string; opdIds: string[] };

// id kosong = undangan baru (wajib minimal satu OPD). Penerima lama diganti sekaligus di database.
export async function simpanUndangan(id: string | null, v: MasukanUndangan): Promise<Hasil> {
  if (id !== null && (typeof id !== "string" || !UUID.test(id))) return TIDAK_VALID;
  if (!v || typeof v.judul !== "string" || typeof v.link !== "string" || !Array.isArray(v.opdIds)) {
    return TIDAK_VALID;
  }
  const judul = v.judul.trim();
  const link = v.link.trim();
  if (!judul || !link) return { ok: false, pesan: "Judul dan link wajib diisi." };
  if (judul.length > MAKS_JUDUL) return { ok: false, pesan: "Judul terlalu panjang." };
  if (!HTTPS.test(link)) return { ok: false, pesan: "Link harus diawali https://" };
  if (link.length > MAKS_LINK) return { ok: false, pesan: "Link terlalu panjang." };
  if (v.opdIds.length > MAKS_OPD || v.opdIds.some((o) => typeof o !== "string" || !UUID.test(o))) {
    return TIDAK_VALID;
  }
  if (id === null && v.opdIds.length === 0) return { ok: false, pesan: "Pilih minimal satu OPD penerima." };
  await ambilAdmin();

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("simpan_undangan", {
    p_id: id,
    p_judul: judul,
    p_link: link,
    p_opd_ids: v.opdIds,
  });
  if (error) return { ok: false, pesan: pesanGalat("simpanUndangan", error) };

  revalidatePath(HALAMAN);
  return { ok: true };
}

// Undangan tetap ada, hanya daftar penerimanya dikosongkan
export async function tarikUndanganDariSemua(id: string): Promise<Hasil> {
  if (typeof id !== "string" || !UUID.test(id)) return TIDAK_VALID;
  await ambilAdmin();

  const supabase = await buatKlienServer();
  const { error } = await supabase.from("undangan_opd").delete().eq("undangan_id", id);
  if (error) return { ok: false, pesan: pesanGalat("tarikUndanganDariSemua", error) };

  revalidatePath(HALAMAN);
  return { ok: true };
}

// Penerima ikut terhapus lewat cascade
export async function hapusUndangan(id: string): Promise<Hasil> {
  if (typeof id !== "string" || !UUID.test(id)) return TIDAK_VALID;
  await ambilAdmin();

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from("undangan").delete().eq("id", id).select("id");
  if (error) return { ok: false, pesan: pesanGalat("hapusUndangan", error) };
  if (!data?.length) return { ok: false, pesan: "Undangan tidak ditemukan." };

  revalidatePath(HALAMAN);
  return { ok: true };
}