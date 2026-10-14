import { AppShell } from "@/components/layout/AppShell";
import { ambilPimpinan } from "@/lib/pimpinan";

export default async function PimpinanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pengguna } = await ambilPimpinan();

  return (
    <AppShell peran="pimpinan" namaPengguna={pengguna.nama}>
      {children}
    </AppShell>
  );
}