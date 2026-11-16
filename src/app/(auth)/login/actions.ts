"use server";

import { redirect } from "next/navigation";
import { BERANDA, RUTE_GANTI_SANDI } from "@/lib/akses";
import { buatKlienServer } from "@/lib/supabase/server";

export type StateLogin = { pesan: string | null; email: string };

export async function masuk(_: StateLogin, data: FormData): Promise<StateLogin> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const sandi = String(data.get("sandi") ?? "");

  if (!email || !sandi) {
    return { pesan: "Email dan kata sandi wajib diisi.", email };
  }

  const supabase = await buatKlienServer();
  const { data: hasil, error } = await supabase.auth.signInWithPassword({
    email,
    password: sandi,
  });

  if (error || !hasil.user) {
    if (error?.status === 429) {
      return { pesan: "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.", email };
    }
    return { pesan: "Email atau kata sandi salah.", email };
  }

  const { data: profil } = await supabase
    .from("profil")
    .select("peran, wajib_ganti_sandi")
    .eq("id", hasil.user.id)
    .maybeSingle();

  if (!profil) {
    await supabase.auth.signOut();
    return { pesan: "Akun belum aktif. Hubungi admin BPS.", email };
  }

  const peran = profil.peran as "admin" | "operator";
  const wajibGanti = peran === "operator" && profil.wajib_ganti_sandi === true;
  redirect(wajibGanti ? RUTE_GANTI_SANDI : BERANDA[peran]);
}

export async function keluar() {
  const supabase = await buatKlienServer();
  await supabase.auth.signOut();
  redirect("/login");
}