import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PENGGUNA_LIST } from "@/data/dummy";
import { ambilSesi } from "@/lib/sesi";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const id = await ambilSesi();
  const pengguna = PENGGUNA_LIST.find((p) => p.id === id && p.peran === "admin");
  if (!pengguna) redirect("/login");

  return (
    <AppShell peran="admin" namaPengguna={pengguna.nama}>
      {children}
    </AppShell>
  );
}