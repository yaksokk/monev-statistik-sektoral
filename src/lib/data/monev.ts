import "server-only";
import { buatKlienServer } from "@/lib/supabase/server";
import type { AspekMonev, Milestone } from "@/lib/types";

type BarisButir = { id: string; urutan: number; teks: string; link_dokumen: string | null };

type BarisAspek = {
  id: string;
  urutan: number;
  nama: string;
  kondisi_aktual: string;
  kondisi_diharapkan: string;
  indikator_keberhasilan: BarisButir[] | null;
};

type BarisMilestone = {
  id: string;
  urutan: number;
  tujuan: string;
  jadwal: string;
  output_milestone: BarisButir[] | null;
};

// urutan lalu id, supaya hasil selalu sama
function urut<T extends { id: string; urutan: number }>(a: T, b: T) {
  return a.urutan - b.urutan || a.id.localeCompare(b.id);
}

function petakanButir(b: BarisButir) {
  return { id: b.id, teks: b.teks, linkDokumen: b.link_dokumen ?? null };
}

export function petakanAspek(b: BarisAspek): AspekMonev {
  return {
    id: b.id,
    nama: b.nama,
    kondisiAktual: b.kondisi_aktual ?? "",
    kondisiDiharapkan: b.kondisi_diharapkan ?? "",
    indikator: [...(b.indikator_keberhasilan ?? [])].sort(urut).map(petakanButir),
  };
}

export function petakanMilestone(b: BarisMilestone): Milestone {
  return {
    id: b.id,
    tujuan: b.tujuan,
    jadwal: b.jadwal ?? "",
    output: [...(b.output_milestone ?? [])].sort(urut).map(petakanButir),
  };
}

// Sesi admin: monev hanya bisa dibaca admin (RLS)
export async function ambilAspekMonev(): Promise<AspekMonev[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("aspek_monev")
    .select(
      "id, urutan, nama, kondisi_aktual, kondisi_diharapkan, indikator_keberhasilan(id, urutan, teks, link_dokumen)",
    )
    .order("urutan")
    .order("id");
  if (error) throw new Error(`Gagal membaca aspek monev: ${error.message}`);
  return (data as unknown as BarisAspek[]).map(petakanAspek);
}

export async function ambilMilestone(): Promise<Milestone[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("milestone")
    .select("id, urutan, tujuan, jadwal, output_milestone(id, urutan, teks, link_dokumen)")
    .order("urutan")
    .order("id");
  if (error) throw new Error(`Gagal membaca milestone: ${error.message}`);
  return (data as unknown as BarisMilestone[]).map(petakanMilestone);
}