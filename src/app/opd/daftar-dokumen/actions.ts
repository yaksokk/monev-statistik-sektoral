"use server";

import { revalidatePath } from "next/cache";
import { BUCKET_DOKUMEN, MAKS_BYTE, polaPathDokumen } from "@/lib/dokumen-berkas";
import { ambilPengguna } from "@/lib/pengguna";
import { buatKlienServer } from "@/lib/supabase/server";

const HALAMAN = "/opd/daftar-dokumen";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Klien = Awaited<ReturnType<typeof buatKlienServer>>;

function galat(pesan: string) {
  return { ok: false as const, pesan };
}

// P0001 = pesan dari raise exception di SQL (sudah berbahasa Indonesia)
function galatDb(konteks: string, error: { code?: string; message: string }, cadangan: string) {
  if (error.code === "P0001") return galat(error.message);
  console.error(`${konteks}:`, error.code, error.message);
  return galat(cadangan);
}

// Semua action memakai sesi pegawai (RLS dan kebijakan Storage tetap berlaku)
async function idPegawai(): Promise<string | null> {
  const data = await ambilPengguna();
  return data && data.pengguna.peran === "operator" ? data.pengguna.id : null;
}

async function hapusBerkas(supabase: Klien, paths: string[]) {
  const { error } = await supabase.storage.from(BUCKET_DOKUMEN).remove(paths);
  if (error) console.error("Hapus berkas Storage gagal:", paths, error.message);
}

// Dipanggil browser setelah file terunggah ke Storage. File baru baru dipakai bila baris berhasil
// diperbarui; file lama dihapus sesudahnya. Bila gagal, file baru dibersihkan di sini.
export async function catatUnggahan(itemId: string, path: string, namaAsli: string) {
  const uid = await idPegawai();
  if (!uid) return galat("Sesi berakhir. Silakan masuk lagi.");
  if (typeof itemId !== "string" || !UUID.test(itemId)) return galat("Dokumen tidak valid.");
  if (typeof path !== "string" || !polaPathDokumen(uid, itemId).test(path)) {
    return galat("Berkas tidak valid.");
  }
  const nama = (typeof namaAsli === "string" ? namaAsli.trim() : "").split(/[\\/]/).pop() ?? "";
  if (!nama || nama.length > 200) return galat("Nama file tidak valid.");

  const supabase = await buatKlienServer();

  // File harus benar-benar ada di Storage dan tidak melebihi batas
  const folder = `${uid}/${itemId}`;
  const berkas = path.slice(folder.length + 1);
  const { data: daftar, error: galatList } = await supabase.storage
    .from(BUCKET_DOKUMEN)
    .list(folder, { search: berkas, limit: 5 });
  const ada = daftar?.find((f) => f.name === berkas);
  if (galatList || !ada) return galat("File belum terunggah. Coba lagi.");
  const ukuran = ada.metadata?.size;
  if (typeof ukuran === "number" && ukuran > MAKS_BYTE) {
    await hapusBerkas(supabase, [path]);
    return galat("Ukuran file terlalu besar.");
  }

  const { data: baris, error: galatBaca } = await supabase
    .from("dokumen")
    .select("id, path_file")
    .eq("pengguna_id", uid)
    .eq("item_id", itemId)
    .maybeSingle();
  if (galatBaca || !baris) {
    await hapusBerkas(supabase, [path]);
    return galat("Dokumen tidak ditemukan.");
  }

  const { data, error } = await supabase
    .from("dokumen")
    .update({ status: "disetujui", nama_file: nama, path_file: path })
    .eq("id", baris.id)
    .eq("pengguna_id", uid)
    .select("id");
  if (error || !data?.length) {
    await hapusBerkas(supabase, [path]);
    if (error) return galatDb("catatUnggahan", error, "Gagal menyimpan dokumen.");
    return galat("Dokumen tidak bisa diperbarui. Pastikan kegiatan masih aktif.");
  }

  if (baris.path_file && baris.path_file !== path) await hapusBerkas(supabase, [baris.path_file]);

  revalidatePath(HALAMAN);
  return { ok: true as const };
}

// Baris kembali ke 'belum' lebih dulu, baru file dihapus (sisa terburuk: file yatim, bukan baris rusak)
export async function hapusDokumen(itemId: string) {
  const uid = await idPegawai();
  if (!uid) return galat("Sesi berakhir. Silakan masuk lagi.");
  if (typeof itemId !== "string" || !UUID.test(itemId)) return galat("Dokumen tidak valid.");

  const supabase = await buatKlienServer();
  const { data: baris, error: galatBaca } = await supabase
    .from("dokumen")
    .select("id, path_file")
    .eq("pengguna_id", uid)
    .eq("item_id", itemId)
    .maybeSingle();
  if (galatBaca || !baris) return galat("Dokumen tidak ditemukan.");
  if (!baris.path_file) return { ok: true as const };

  const { data, error } = await supabase
    .from("dokumen")
    .update({ status: "belum", nama_file: null, path_file: null })
    .eq("id", baris.id)
    .eq("pengguna_id", uid)
    .select("id");
  if (error) return galatDb("hapusDokumen", error, "Gagal menghapus dokumen.");
  if (!data?.length) return galat("Dokumen tidak bisa dihapus. Pastikan kegiatan masih aktif.");

  await hapusBerkas(supabase, [baris.path_file]);

  revalidatePath(HALAMAN);
  return { ok: true as const };
}

// Signed URL berlaku 60 detik
export async function buatLinkDokumen(itemId: string) {
  const uid = await idPegawai();
  if (!uid) return galat("Sesi berakhir. Silakan masuk lagi.");
  if (typeof itemId !== "string" || !UUID.test(itemId)) return galat("Dokumen tidak valid.");

  const supabase = await buatKlienServer();
  const { data: baris } = await supabase
    .from("dokumen")
    .select("path_file")
    .eq("pengguna_id", uid)
    .eq("item_id", itemId)
    .maybeSingle();
  if (!baris?.path_file) return galat("Belum ada file.");

  const { data, error } = await supabase.storage
    .from(BUCKET_DOKUMEN)
    .createSignedUrl(baris.path_file, 60);
  if (error || !data) {
    console.error("buatLinkDokumen:", error?.message);
    return galat("Gagal membuka file.");
  }
  return { ok: true as const, url: data.signedUrl };
}