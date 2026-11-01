import { AppShell } from "@/components/layout/AppShell";
import { ambilOperator } from "@/lib/operator";

export default async function OpdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pengguna, opd } = await ambilOperator();

  return (
    <AppShell peran="operator" namaPengguna={pengguna.nama} namaOpd={opd.nama}>
      {children}
    </AppShell>
  );
}