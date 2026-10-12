"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { MENU } from "./menu";
import type { Peran } from "@/lib/types";

const TAUTAN =
  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-white";

export function Sidebar({ peran, onNavigate }: { peran: Peran; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-navy-800 text-navy-100">
      <div className="border-b border-navy-700 px-5 py-5">
        <p className="text-base font-semibold text-white">Monev Statistik Sektoral</p>
        <p className="mt-0.5 text-sm text-navy-300">BPS Kab. Minahasa Tenggara</p>
      </div>

      <nav aria-label="Menu utama" className="flex-1 space-y-1 overflow-y-auto p-3">
        {MENU[peran].map(({ label, href, ikon: Ikon }) => {
          const aktif = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={aktif ? "page" : undefined}
              className={`${TAUTAN} ${aktif ? "bg-navy-700 text-white" : "hover:bg-navy-700/60 hover:text-white"}`}
            >
              <Ikon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-navy-700 p-3">
        <Link href="/login" className={`${TAUTAN} hover:bg-navy-700/60 hover:text-white`}>
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          Keluar
        </Link>
      </div>
    </div>
  );
}
