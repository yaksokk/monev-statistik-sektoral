import "server-only";
import { buatKlienServer } from "@/lib/supabase/server";
import type { Dokumen, StatusDokumen } from "@/lib/types";

type BarisDokumen = {
  id: string;
  pengguna_id: string;
  kegiatan_id: string;
  item_id: string;
  status: StatusDokumen;
  nama_file: string | null;
  diunggah_pada: string | null;
  profil?: { opd_id: string | null } | { opd_id: string | null }[] | null;
};

const KOLOM = "id, pengguna_id, kegiatan_id, item_id, status, nama_file, diunggah_pada";

// snake_case database -> camelCase types.ts. path_file sengaja tidak dikirim ke klien.
export function petakanDokumen(b: BarisDokumen, opdId: string): Dokumen {
  return {
    id: b.id,
    penggunaId: b.pengguna_id,
    opdId,
    kegiatanId: b.kegiatan_id,
    itemId: b.item_id,
    status: b.status,
    namaFile: b.nama_file,
    diunggahPada: b.diunggah_pada,
  };
}

// Sesi pegawai: RLS hanya mengizinkan baris sendiri
export async function ambilDokumenSaya(
  penggunaId: string,
  opdId: string,
  kegiatanId: string,
): Promise<Dokumen[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("dokumen")
    .select(KOLOM)
    .eq("pengguna_id", penggunaId)
    .eq("kegiatan_id", kegiatanId);
  if (error) throw new Error(`Gagal membaca dokumen: ${error.message}`);
  return (data as BarisDokumen[]).map((b) => petakanDokumen(b, opdId));
}

// Sesi admin: semua pegawai pada satu kegiatan, dibaca per 1000 baris (batas bawaan PostgREST)
export async function ambilDokumenKegiatan(kegiatanId: string): Promise<Dokumen[]> {
  const supabase = await buatKlienServer();
  const hasil: Dokumen[] = [];
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await supabase
      .from("dokumen")
      .select(`${KOLOM}, profil(opd_id)`)
      .eq("kegiatan_id", kegiatanId)
      .order("id")
      .range(dari, dari + 999);
    if (error) throw new Error(`Gagal membaca dokumen: ${error.message}`);
    const baris = data as unknown as BarisDokumen[];
    for (const b of baris) {
      const p = Array.isArray(b.profil) ? b.profil[0] : b.profil;
      hasil.push(petakanDokumen(b, p?.opd_id ?? ""));
    }
    if (baris.length < 1000) break;
  }
  return hasil;
}