import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/pengguna";

// ambil operator yang sedang login beserta OPD-nya
export async function ambilOperator() {
  const data = await ambilPengguna();

  if (!data || data.pengguna.peran !== "operator" || !data.opd) {
    redirect("/login");
  }

  return { pengguna: data.pengguna, opd: data.opd };
}