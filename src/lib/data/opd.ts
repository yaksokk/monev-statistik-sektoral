import "server-only";
import { buatKlienServer } from "@/lib/supabase/server";
import type { Opd, Pengguna, Peran } from "@/lib/types";

type BarisOpd = { id: string; nama: string; singkatan: string };

type BarisPegawai = {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
  opd_id: string | null;
  link_sertifikat: string | null;
  wajib_ganti_sandi: boolean;
};

// snake_case database -> camelCase types.ts
export function petakanOpd(b: BarisOpd): Opd {
  return { id: b.id, nama: b.nama, singkatan: b.singkatan };
}

export function petakanPegawai(b: BarisPegawai): Pengguna {
  return {
    id: b.id,
    nama: b.nama,
    email: b.email,
    peran: b.peran,
    opdId: b.opd_id ?? undefined,
    linkSertifikat: b.link_sertifikat ?? undefined,
    wajibGantiSandi: b.wajib_ganti_sandi,
  };
}

// Sesi admin: RLS mengizinkan admin membaca semua baris
export async function ambilDaftarOpd(): Promise<Opd[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("opd")
    .select("id, nama, singkatan")
    .order("nama");
  if (error) throw new Error(`Gagal membaca OPD: ${error.message}`);
  return (data as BarisOpd[]).map(petakanOpd);
}

export async function ambilPegawaiOpd(): Promise<Pengguna[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("profil")
    .select("id, nama, email, peran, opd_id, link_sertifikat, wajib_ganti_sandi")
    .eq("peran", "operator")
    .not("opd_id", "is", null)
    .order("nama");
  if (error) throw new Error(`Gagal membaca pegawai: ${error.message}`);
  return (data as BarisPegawai[]).map(petakanPegawai);
}