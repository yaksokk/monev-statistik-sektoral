import "server-only";
import { buatKlienServer } from "@/lib/supabase/server";
import { isoKeLokal } from "@/lib/waktu";
import type { SesiPembinaan } from "@/lib/types";

type BarisSesi = {
  id: string;
  kegiatan_id: string;
  urutan: number;
  judul: string;
  waktu_buka: string | null;
  batas_pengisian: string | null;
};

// snake_case database -> camelCase types.ts; timestamptz -> teks WITA
export function petakanSesi(b: BarisSesi): SesiPembinaan {
  return {
    id: b.id,
    kegiatanId: b.kegiatan_id,
    urutan: b.urutan,
    judul: b.judul,
    waktuBuka: b.waktu_buka ? isoKeLokal(b.waktu_buka) : null,
    batasPengisian: b.batas_pengisian ? isoKeLokal(b.batas_pengisian) : null,
  };
}

// Pegawai hanya bisa membaca sesi kegiatan aktif (RLS); admin membaca semua
export async function ambilSesiKegiatan(kegiatanId: string): Promise<SesiPembinaan[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("sesi_pembinaan")
    .select("id, kegiatan_id, urutan, judul, waktu_buka, batas_pengisian")
    .eq("kegiatan_id", kegiatanId)
    .order("urutan");
  if (error) throw new Error(`Gagal membaca sesi: ${error.message}`);
  return (data as BarisSesi[]).map(petakanSesi);
}