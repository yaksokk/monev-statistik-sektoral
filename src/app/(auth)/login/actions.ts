"use server";

import { redirect } from "next/navigation";
import { AKUN_DUMMY } from "@/data/akun-dummy";
import { BERANDA } from "@/lib/akses";
import { buatSesi, hapusSesi } from "@/lib/sesi";

export type StateLogin = { pesan: string | null; email: string };

export async function masuk(_: StateLogin, data: FormData): Promise<StateLogin> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const sandi = String(data.get("sandi") ?? "");

  if (!email || !sandi) {
    return { pesan: "Email dan kata sandi wajib diisi.", email };
  }

  const akun = AKUN_DUMMY.find((a) => a.email === email && a.sandi === sandi);
  if (!akun) {
    return { pesan: "Email atau kata sandi salah.", email };
  }

  await buatSesi(akun.penggunaId);
  redirect(BERANDA[akun.peran]);
}

export async function keluar() {
  await hapusSesi();
  redirect("/login");
}