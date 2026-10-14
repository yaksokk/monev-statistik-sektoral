import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NAMA_COOKIE } from "@/lib/akses";
import { PENGGUNA_LIST } from "@/data/dummy";

// ambil pimpinan yang sedang login
export async function ambilPimpinan() {
  const jar = await cookies();
  const id = jar.get(NAMA_COOKIE)?.value;
  const pengguna = PENGGUNA_LIST.find((p) => p.id === id);

  if (!pengguna || pengguna.peran !== "pimpinan") redirect("/login");

  return { pengguna };
}