import { AppShell } from "@/components/layout/AppShell";
import { ambilAdmin } from "@/lib/pengguna";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await ambilAdmin();

  return (
    <AppShell peran="admin" namaPengguna={admin.nama}>
      {children}
    </AppShell>
  );
}