"use client";

import { useState } from "react";
import {
  URUTAN_TERAKHIR,
  babModul,
  geserBab,
  idBabBaru,
  jumlahSelesaiBab,
  rapikanBab,
} from "@/lib/modul-admin";
import type { BabModul, BabSelesai, ModulPembelajaran, Opd, Pengguna } from "@/lib/types";
import TabKelola, { type AksiTabKelola } from "./TabKelola";
import TabPantauan from "./TabPantauan";

type NamaTab = "kelola" | "pantauan";

const DAFTAR_TAB: { id: NamaTab; label: string }[] = [
  { id: "kelola", label: "Kelola Modul" },
  { id: "pantauan", label: "Pantauan" },
];

type Props = {
  opdList: Opd[];
  pegawaiList: Pengguna[];
  modulAwal: ModulPembelajaran[];
  babAwal: BabModul[];
  selesaiAwal: BabSelesai[];
};

export default function ModulAdminClient({ opdList, pegawaiList, modulAwal, babAwal, selesaiAwal }: Props) {
  // Simulasi: hanya di state browser. Nanti disimpan ke server
  const [modulList, setModulList] = useState(modulAwal);
  const [babList, setBabList] = useState(babAwal);
  const [selesaiList, setSelesaiList] = useState(selesaiAwal);
  const [tab, setTab] = useState<NamaTab>("kelola");
  const [pesan, setPesan] = useState("");

  // untuk saat ini hanya ada satu modul
  const modul = modulList[0];
  const babModulIni = modul ? babModul(babList, modul.id) : [];

  const aksi: AksiTabKelola = {
    simpanModul(d) {
      if (modul) {
        setModulList((prev) => prev.map((m) => (m.id === modul.id ? { ...m, ...d } : m)));
        setPesan("Modul diperbarui.");
        return;
      }
      const no = modulList.reduce((m, x) => Math.max(m, Number(x.id.replace(/\D/g, ""))), 0) + 1;
      setModulList((prev) => [...prev, { ...d, id: `modul-${no}`, urutan: 1 }]);
      setPesan("Modul dibuat.");
    },
    tambahBab(d) {
      if (!modul) return;
      const baru: BabModul = {
        ...d,
        id: idBabBaru(babList, modul.id),
        modulId: modul.id,
        urutan: URUTAN_TERAKHIR,
      };
      setBabList((prev) => rapikanBab([...prev, baru], modul.id));
      setPesan("Bab ditambahkan.");
    },
    ubahBab(id, d) {
      if (!modul) return;
      setBabList((prev) =>
        rapikanBab(
          prev.map((b) =>
            b.id === id
              ? { ...b, ...d, urutan: b.pembinaan === d.pembinaan ? b.urutan : URUTAN_TERAKHIR }
              : b,
          ),
          modul.id,
        ),
      );
      setPesan("Bab diperbarui.");
    },
    hapusBab(id) {
      if (!modul) return;
      setBabList((prev) =>
        rapikanBab(
          prev.filter((b) => b.id !== id),
          modul.id,
        ),
      );
      setSelesaiList((prev) => prev.filter((s) => s.babId !== id));
      setPesan("Bab dihapus.");
    },
    geser(id, arah) {
      setBabList((prev) => geserBab(prev, id, arah));
    },
  };

  const jumlahSelesai = Object.fromEntries(
    babModulIni.map((b) => [b.id, jumlahSelesaiBab(selesaiList, b.id)]),
  );

  return (
    <div className="space-y-6">
      <p role="status" className="min-h-5 text-sm text-ink-muted">
        {pesan}
      </p>

      <div role="tablist" aria-label="Bagian Kelola Modul" className="flex flex-wrap gap-1 border-b border-line">
        {DAFTAR_TAB.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "kelola" ? (
          <TabKelola modul={modul} babList={babModulIni} jumlahSelesai={jumlahSelesai} aksi={aksi} />
        ) : (
          <TabPantauan
            modul={modul}
            babList={babModulIni}
            opdList={opdList}
            pegawaiList={pegawaiList}
            selesaiList={selesaiList}
          />
        )}
      </div>
    </div>
  );
}