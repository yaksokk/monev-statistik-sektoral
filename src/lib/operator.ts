import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NAMA_COOKIE } from "@/lib/akses";
import { OPD_LIST, PENGGUNA_LIST } from "@/data/dummy";

// ambil operator yang sedang login beserta OPD-nya
export async function ambilOperator() {
  const jar = await cookies();
  const id = jar.get(NAMA_COOKIE)?.value;
  const pengguna = PENGGUNA_LIST.find((p) => p.id === id);

  if (!pengguna || pengguna.peran !== "operator" || !pengguna.opdId) {
    redirect("/login");
  }

  const opd = OPD_LIST.find((o) => o.id === pengguna.opdId);
  if (!opd) redirect("/login");

  return { pengguna, opd };
}