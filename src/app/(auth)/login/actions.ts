"use server";

import { redirect } from "next/navigation";
import { AKUN_DUMMY } from "@/data/akun-dummy";
import { buatSesi } from "@/lib/sesi";
import type { Peran } from "@/lib/types";

export type StateLogin = { pesan: string | null; email: string };

const TUJUAN: Record<Peran, string> = {
  admin: "/admin/dashboard",
  operator: "/opd/dashboard",
  pimpinan: "/pimpinan",
};

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
  redirect(TUJUAN[akun.peran]);
}