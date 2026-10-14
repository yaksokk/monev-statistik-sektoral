import "server-only";
import { cookies } from "next/headers";
import { NAMA_COOKIE } from "@/lib/akses";
const DURASI_DETIK = 60 * 60 * 8;

export async function buatSesi(penggunaId: string) {
  const jar = await cookies();
  jar.set(NAMA_COOKIE, penggunaId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURASI_DETIK,
  });
}

export async function ambilSesi() {
  const jar = await cookies();
  return jar.get(NAMA_COOKIE)?.value ?? null;
}

export async function hapusSesi() {
  const jar = await cookies();
  jar.delete(NAMA_COOKIE);
}