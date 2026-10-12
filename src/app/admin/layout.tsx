import { AppShell } from "@/components/layout/AppShell";
import { PENGGUNA_LIST } from "@/data/dummy";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = PENGGUNA_LIST.find((p) => p.peran === "admin")!;

  return (
    <AppShell peran="admin" namaPengguna={admin.nama}>
      {children}
    </AppShell>
  );
}
