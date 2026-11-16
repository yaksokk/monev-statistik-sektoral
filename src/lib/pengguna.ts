import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import type { Opd, Pengguna, Peran } from "@/lib/types";

type BarisProfil = {
  id: string;
  nama: string;
  email: string;
  peran: Peran;
  opd_id: string | null;
  link_sertifikat: string | null;
  wajib_ganti_sandi: boolean;
  opd: { id: string; nama: string; singkatan: string } | null;
};

// Pengguna yang sedang login (null bila belum login atau profil belum ada).
// Dipetakan dari snake_case database ke camelCase types.ts.
export const ambilPengguna = cache(
  async (): Promise<{ pengguna: Pengguna; opd: Opd | null } | null> => {
    const supabase = await buatKlienServer();
    const { data: claims } = await supabase.auth.getClaims();
    const id = claims?.claims?.sub;
    if (!id) return null;

    const { data } = await supabase
      .from("profil")
      .select("id, nama, email, peran, opd_id, link_sertifikat, wajib_ganti_sandi, opd(id, nama, singkatan)")
      .eq("id", id)
      .maybeSingle();

    const baris = data as BarisProfil | null;
    if (!baris) return null;

    return {
      pengguna: {
        id: baris.id,
        nama: baris.nama,
        email: baris.email,
        peran: baris.peran,
        opdId: baris.opd_id ?? undefined,
        linkSertifikat: baris.link_sertifikat ?? undefined,
        wajibGantiSandi: baris.wajib_ganti_sandi,
      },
      opd: baris.opd,
    };
  },
);

export async function ambilAdmin() {
  const data = await ambilPengguna();
  if (!data || data.pengguna.peran !== "admin") redirect("/login");
  return data.pengguna;
}