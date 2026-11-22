import "server-only";
import { buatKlienServer } from "@/lib/supabase/server";
import { isoKeLokal } from "@/lib/waktu";
import type { Undangan } from "@/lib/types";

type BarisUndangan = {
  id: string;
  judul: string;
  link: string;
  dikirim_pada: string;
  undangan_opd: { opd_id: string }[] | null;
};

// snake_case database -> camelCase types.ts; timestamptz -> waktu lokal WITA
export function petakanUndangan(b: BarisUndangan): Undangan {
  return {
    id: b.id,
    judul: b.judul,
    link: b.link,
    dikirimPada: isoKeLokal(b.dikirim_pada),
    opdIds: (b.undangan_opd ?? []).map((o) => o.opd_id),
  };
}

// RLS yang menentukan isinya: admin membaca semua undangan, pegawai hanya undangan untuk OPD-nya.
// Urutan: terbaru dulu.
async function bacaUndangan(): Promise<Undangan[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("undangan")
    .select("id, judul, link, dikirim_pada, undangan_opd(opd_id)")
    .order("dikirim_pada", { ascending: false })
    .order("id");
  if (error) throw new Error(`Gagal membaca undangan: ${error.message}`);
  return (data as unknown as BarisUndangan[]).map(petakanUndangan);
}

// Sesi admin: semua undangan beserta seluruh OPD penerimanya
export async function ambilUndanganAdmin(): Promise<Undangan[]> {
  return bacaUndangan();
}

// Sesi pegawai OPD: hanya undangan yang ditujukan ke OPD-nya (opdIds hanya berisi OPD-nya sendiri).
// Belum dipakai halaman mana pun; dipakai di langkah 8 (Dashboard OPD).
export async function ambilUndanganSaya(): Promise<Undangan[]> {
  return bacaUndangan();
}