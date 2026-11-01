"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LENCANA, Lencana, kartu, teksWaktu } from "@/app/admin/quiz/ui";
import { pantauBab } from "@/lib/modul-admin";
import type { BabModul, BabSelesai, ModulPembelajaran, Opd, Pengguna } from "@/lib/types";

type Props = {
  modul: ModulPembelajaran | undefined;
  babList: BabModul[]; // bab modul ini, sudah urut
  opdList: Opd[];
  pegawaiList: Pengguna[];
  selesaiList: BabSelesai[];
};

export default function TabPantauan({ modul, babList, opdList, pegawaiList, selesaiList }: Props) {
  const [bukaId, setBukaId] = useState<string | null>(null);

  if (!modul || babList.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-muted">Belum ada bab untuk dipantau.</p>;
  }

  const singkatan = (p: Pengguna) => opdList.find((o) => o.id === p.opdId)?.singkatan ?? "";

  return (
    <ul className="space-y-3">
      {babList.map((b) => {
        const { sudah, belum } = pantauBab(b.id, selesaiList, pegawaiList);
        const terbuka = bukaId === b.id;
        return (
          <li key={b.id} className={kartu}>
            <button
              type="button"
              aria-expanded={terbuka}
              aria-controls={`pantau-${b.id}`}
              onClick={() => setBukaId(terbuka ? null : b.id)}
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink">
                  Bab {b.urutan}: {b.judul}
                </span>
                <Lencana kelas={LENCANA.netral}>Pembinaan {b.pembinaan}</Lencana>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-sm text-ink-muted">
                <span className="tabular">
                  {sudah.length} dari {pegawaiList.length} pegawai
                </span>
                <ChevronDown className={`size-4 transition-transform ${terbuka ? "rotate-180" : ""}`} aria-hidden />
              </span>
            </button>

            {terbuka && (
              <div id={`pantau-${b.id}`} className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-status-disetujui-fg">Sudah selesai ({sudah.length})</h3>
                  {sudah.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">Belum ada.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {sudah.map(({ pegawai, selesaiPada }) => (
                        <li key={pegawai.id} className="text-ink">
                          {pegawai.nama}
                          <span className="tabular block text-xs text-ink-muted">
                            {singkatan(pegawai)} · {teksWaktu(selesaiPada, "–")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink-muted">Belum selesai ({belum.length})</h3>
                  {belum.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-muted">Semua pegawai sudah selesai.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 text-sm text-ink">
                      {belum.map((p) => (
                        <li key={p.id}>
                          {p.nama}
                          <span className="block text-xs text-ink-muted">{singkatan(p)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}