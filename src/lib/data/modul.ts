import "server-only";
import { buatKlienServer } from "@/lib/supabase/server";
import { isoKeLokal } from "@/lib/waktu";
import type { BabModul, BabSelesai, ModulPembelajaran } from "@/lib/types";

type BarisModul = { id: string; urutan: number; judul: string; subjudul: string };
type BarisBab = {
  id: string;
  modul_id: string;
  urutan: number;
  judul: string;
  link_materi: string;
  pembinaan: number;
};
type BarisSelesai = { pengguna_id: string; bab_id: string; selesai_pada: string };

export function petakanModul(b: BarisModul): ModulPembelajaran {
  return { id: b.id, urutan: b.urutan, judul: b.judul, subjudul: b.subjudul ?? "" };
}

export function petakanBab(b: BarisBab): BabModul {
  return {
    id: b.id,
    modulId: b.modul_id,
    urutan: b.urutan,
    judul: b.judul,
    linkMateri: b.link_materi ?? "",
    pembinaan: b.pembinaan === 2 ? 2 : 1,
  };
}

export function petakanSelesai(b: BarisSelesai, opdId: string): BabSelesai {
  return {
    penggunaId: b.pengguna_id,
    opdId,
    babId: b.bab_id,
    selesaiPada: isoKeLokal(b.selesai_pada),
  };
}

// Semua pengguna login boleh membaca modul. Untuk saat ini hanya ada satu modul.
export async function ambilModul(): Promise<ModulPembelajaran | null> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("modul_pembelajaran")
    .select("id, urutan, judul, subjudul")
    .order("urutan")
    .order("id")
    .limit(1);
  if (error) throw new Error(`Gagal membaca modul: ${error.message}`);
  const baris = data as BarisModul[];
  return baris.length > 0 ? petakanModul(baris[0]) : null;
}

// Bab satu modul, sudah urut (Pembinaan 1 di depan Pembinaan 2)
export async function ambilBabModul(modulId: string): Promise<BabModul[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("bab_modul")
    .select("id, modul_id, urutan, judul, link_materi, pembinaan")
    .eq("modul_id", modulId)
    .order("urutan")
    .order("id");
  if (error) throw new Error(`Gagal membaca bab modul: ${error.message}`);
  return (data as BarisBab[]).map(petakanBab);
}

// Sesi pegawai: id bab yang sudah ia tandai selesai (RLS juga hanya mengizinkan baris sendiri)
export async function ambilIdBabSelesaiSaya(penggunaId: string): Promise<string[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("bab_selesai")
    .select("bab_id")
    .eq("pengguna_id", penggunaId);
  if (error) throw new Error(`Gagal membaca bab selesai: ${error.message}`);
  return (data as { bab_id: string }[]).map((b) => b.bab_id);
}

// Sesi admin: catatan semua pegawai, dibaca per 1000 baris.
// opdIdPegawai: id pegawai -> id OPD; baris tanpa pegawai di peta dilewati.
export async function ambilBabSelesaiSemua(opdIdPegawai: Map<string, string>): Promise<BabSelesai[]> {
  const supabase = await buatKlienServer();
  const hasil: BabSelesai[] = [];
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await supabase
      .from("bab_selesai")
      .select("pengguna_id, bab_id, selesai_pada")
      .order("pengguna_id")
      .order("bab_id")
      .range(dari, dari + 999);
    if (error) throw new Error(`Gagal membaca bab selesai: ${error.message}`);
    const baris = data as BarisSelesai[];
    for (const b of baris) {
      const opdId = opdIdPegawai.get(b.pengguna_id);
      if (opdId === undefined) continue;
      hasil.push(petakanSelesai(b, opdId));
    }
    if (baris.length < 1000) break;
  }
  return hasil;
}