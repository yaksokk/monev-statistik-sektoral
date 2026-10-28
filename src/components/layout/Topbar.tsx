"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, KeyRound, LogOut, Menu } from "lucide-react";
import { keluar } from "@/app/(auth)/login/actions";

interface TopbarProps {
  nama: string;
  peranLabel: string;
  onBukaMenu: () => void;
  /** Bila diisi, popup profil menampilkan tautan Ganti Kata Sandi. */
  hrefGantiSandi?: string;
}

export function Topbar({ nama, peranLabel, onBukaMenu, hrefGantiSandi }: TopbarProps) {
  const [terbuka, setTerbuka] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terbuka) return;
    const tutupBilaKlikLuar = (e: MouseEvent) => {
      if (wadah.current && !wadah.current.contains(e.target as Node)) setTerbuka(false);
    };
    const tutupDenganEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTerbuka(false);
    };
    document.addEventListener("mousedown", tutupBilaKlikLuar);
    window.addEventListener("keydown", tutupDenganEsc);
    return () => {
      document.removeEventListener("mousedown", tutupBilaKlikLuar);
      window.removeEventListener("keydown", tutupDenganEsc);
    };
  }, [terbuka]);

  const inisial = nama.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
      <button
        type="button"
        onClick={onBukaMenu}
        aria-label="Buka menu"
        className="-ml-2 rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-muted lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div ref={wadah} className="relative ml-auto">
        <button
          type="button"
          onClick={() => setTerbuka((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={terbuka}
          className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-muted"
        >
          <span className="text-right leading-tight">
            <span className="block text-sm font-medium text-ink">{nama}</span>
            <span className="block text-xs text-ink-muted">{peranLabel}</span>
          </span>
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-sm font-semibold text-white"
          >
            {inisial}
          </span>
          <ChevronDown
            className={`size-4 text-ink-muted transition-transform ${terbuka ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {terbuka && (
          <div
            role="menu"
            aria-label="Menu akun"
            className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-medium text-ink">{nama}</p>
              <p className="text-xs text-ink-muted">{peranLabel}</p>
            </div>

            <div className="p-1.5">
              {hrefGantiSandi && (
                <Link
                  href={hrefGantiSandi}
                  role="menuitem"
                  onClick={() => setTerbuka(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-muted"
                >
                  <KeyRound className="size-4 text-ink-muted" aria-hidden="true" />
                  Ganti kata sandi
                </Link>
              )}
              <form action={keluar}>
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-50"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Keluar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}