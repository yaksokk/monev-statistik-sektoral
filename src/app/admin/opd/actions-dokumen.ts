"use server";

import { BUCKET_DOKUMEN } from "@/lib/dokumen-berkas";
import { ambilAdmin } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function galat(pesan: string) {
  return { ok: false as const, pesan };
}

// Sesi admin: RLS dan kebijakan Storage mengizinkan admin membaca semua; signed URL berlaku 60 detik
export async function buatLinkDokumenAdmin(dokumenId: string) {
  await ambilAdmin();
  if (typeof dokumenId !== "string" || !UUID.test(dokumenId)) return galat("Dokumen tidak valid.");

  const supabase = await buatKlienServer();
  const { data: baris } = await supabase
    .from("dokumen")
    .select("path_file")
    .eq("id", dokumenId)
    .maybeSingle();
  if (!baris?.path_file) return galat("Belum ada file.");

  const { data, error } = await supabase.storage
    .from(BUCKET_DOKUMEN)
    .createSignedUrl(baris.path_file, 60);
  if (error || !data) {
    console.error("buatLinkDokumenAdmin:", error?.message);
    return galat("Gagal membuka file.");
  }
  return { ok: true as const, url: data.signedUrl };
}