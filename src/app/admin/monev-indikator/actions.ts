"use server";

import { revalidatePath } from "next/cache";
import { ambilAdmin } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

type Hasil = { ok: true } | { ok: false; pesan: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HTTPS = /^https:\/\//i;
const TIDAK_VALID: Hasil = { ok: false, pesan: "Permintaan tidak valid." };
const HALAMAN = "/admin/monev-indikator";
const MAKS_LINK = 2000;

async function ubahLink(id: string, link: string | null, konteks: string): Promise<Hasil> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("indikator_keberhasilan")
    .update({ link_dokumen: link })
    .eq("id", id)
    .select("id");
  if (error) {
    console.error(`${konteks}:`, error.code, error.message);
    return { ok: false, pesan: "Terjadi kesalahan. Coba lagi." };
  }
  if (!data?.length) return { ok: false, pesan: "Indikator tidak ditemukan." };

  revalidatePath(HALAMAN);
  return { ok: true };
}

export async function simpanLinkIndikator(id: string, link: string): Promise<Hasil> {
  if (typeof id !== "string" || !UUID.test(id) || typeof link !== "string") return TIDAK_VALID;
  const bersih = link.trim();
  if (!bersih) return { ok: false, pesan: "Link wajib diisi." };
  if (!HTTPS.test(bersih)) return { ok: false, pesan: "Link harus diawali https://" };
  if (bersih.length > MAKS_LINK) return { ok: false, pesan: "Link terlalu panjang." };
  await ambilAdmin();
  return ubahLink(id, bersih, "simpanLinkIndikator");
}

export async function hapusLinkIndikator(id: string): Promise<Hasil> {
  if (typeof id !== "string" || !UUID.test(id)) return TIDAK_VALID;
  await ambilAdmin();
  return ubahLink(id, null, "hapusLinkIndikator");
}