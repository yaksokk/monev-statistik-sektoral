import "server-only";
import { buatKlienServer } from "@/lib/supabase/server";
import { isoKeLokal } from "@/lib/waktu";
import type { Presensi, StatusKehadiran } from "@/lib/types";

type BarisPresensi = {
  id: string;
  pengguna_id: string;
  sesi_id: string;
  status: StatusKehadiran;
  waktu_isi: string;
  catatan: string | null;
  profil?: { opd_id: string | null } | { opd_id: string | null }[] | null;
};

const KOLOM = "id, pengguna_id, sesi_id, status, waktu_isi, catatan";

export function petakanPresensi(b: BarisPresensi, opdId: string): Presensi {
  return {
    id: b.id,
    penggunaId: b.pengguna_id,
    opdId,
    sesiId: b.sesi_id,
    status: b.status,
    waktuIsi: isoKeLokal(b.waktu_isi),
    catatan: b.catatan,
  };
}

// Sesi pegawai: RLS hanya mengizinkan baris sendiri
export async function ambilPresensiSaya(
  penggunaId: string,
  opdId: string,
  sesiIds: string[],
): Promise<Presensi[]> {
  if (sesiIds.length === 0) return [];
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("presensi")
    .select(KOLOM)
    .eq("pengguna_id", penggunaId)
    .in("sesi_id", sesiIds);
  if (error) throw new Error(`Gagal membaca presensi: ${error.message}`);
  return (data as BarisPresensi[]).map((b) => petakanPresensi(b, opdId));
}

// Sesi admin: semua pegawai pada sesi-sesi satu kegiatan, dibaca per 1000 baris
export async function ambilPresensiKegiatan(sesiIds: string[]): Promise<Presensi[]> {
  if (sesiIds.length === 0) return [];
  const supabase = await buatKlienServer();
  const hasil: Presensi[] = [];
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await supabase
      .from("presensi")
      .select(`${KOLOM}, profil(opd_id)`)
      .in("sesi_id", sesiIds)
      .order("id")
      .range(dari, dari + 999);
    if (error) throw new Error(`Gagal membaca presensi: ${error.message}`);
    const baris = data as unknown as BarisPresensi[];
    for (const b of baris) {
      const p = Array.isArray(b.profil) ? b.profil[0] : b.profil;
      hasil.push(petakanPresensi(b, p?.opd_id ?? ""));
    }
    if (baris.length < 1000) break;
  }
  return hasil;
}