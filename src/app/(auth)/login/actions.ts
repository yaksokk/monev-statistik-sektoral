"use server";

import { redirect } from "next/navigation";
import { BERANDA } from "@/lib/akses";
import { buatKlienServer } from "@/lib/supabase/server";

import { usernameKeEmail } from "@/lib/username";

export type StateLogin = { pesan: string | null; username: string };

export async function masuk(_: StateLogin, data: FormData): Promise<StateLogin> {
  const username = String(data.get("username") ?? "").trim().toLowerCase();
  const sandi = String(data.get("sandi") ?? "");

  if (!username || !sandi) {
    return { pesan: "Username dan kata sandi wajib diisi.", username };
  }

  // Memuat "@" = email lengkap (misalnya admin); selain itu username pegawai
  const email = username.includes("@") ? username : usernameKeEmail(username);

  const supabase = await buatKlienServer();
  const { data: hasil, error } = await supabase.auth.signInWithPassword({
    email,
    password: sandi,
  });

  if (error || !hasil.user) {
    if (error?.status === 429) {
      return { pesan: "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.", username };
    }
    return { pesan: "Username atau kata sandi salah.", username };
  }
  const { data: profil } = await supabase
    .from("profil")
    .select("peran, wajib_ganti_sandi")
    .eq("id", hasil.user.id)
    .maybeSingle();

  if (!profil) {
    await supabase.auth.signOut();
    return { pesan: "Akun belum aktif. Hubungi admin BPS.", username };
  }

  const peran = profil.peran as "admin" | "operator";
  const wajibGanti = peran === "operator" && profil.wajib_ganti_sandi === true;
  redirect(BERANDA[peran]);
}

export async function keluar() {
  const supabase = await buatKlienServer();
  await supabase.auth.signOut();
  redirect("/login");
}