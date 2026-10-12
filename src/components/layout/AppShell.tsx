"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { Peran } from "@/lib/types";

const LABEL_PERAN: Record<Peran, string> = {
  admin: "Admin",
  operator: "Operator OPD",
  pimpinan: "Pimpinan",
};

interface AppShellProps {
  peran: Peran;
  namaPengguna: string;
  children: React.ReactNode;
}

export function AppShell({ peran, namaPengguna, children }: AppShellProps) {
  const [menuTerbuka, setMenuTerbuka] = useState(false);

  useEffect(() => {
    if (!menuTerbuka) return;
    const tutupDenganEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuTerbuka(false);
    };
    window.addEventListener("keydown", tutupDenganEsc);
    return () => window.removeEventListener("keydown", tutupDenganEsc);
  }, [menuTerbuka]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar peran={peran} />
      </aside>

      {menuTerbuka && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMenuTerbuka(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <aside className="absolute inset-y-0 left-0 w-64">
            <Sidebar peran={peran} onNavigate={() => setMenuTerbuka(false)} />
          </aside>
        </div>
      )}

      <Topbar
        nama={namaPengguna}
        peranLabel={LABEL_PERAN[peran]}
        onBukaMenu={() => setMenuTerbuka(true)}
      />

      <main id="konten" className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
