"use client";

import { useState } from "react";
import { jumlahSelesaiBab } from "@/lib/modul-admin";
import type { BabModul, BabSelesai, ModulPembelajaran, Opd, Pengguna } from "@/lib/types";
import { geserBab, hapusBab, simpanModul, tambahBab, ubahBab } from "./actions";
import TabKelola, { type AksiTabKelola } from "./TabKelola";
import TabPantauan from "./TabPantauan";

type NamaTab = "kelola" | "pantauan";

const DAFTAR_TAB: { id: NamaTab; label: string }[] = [
  { id: "kelola", label: "Kelola Modul" },
  { id: "pantauan", label: "Pantauan" },
];

type Hasil = { ok: true } | { ok: false; pesan: string };

type Props = {
  opdList: Opd[];
  pegawaiList: Pengguna[];
  modul: ModulPembelajaran | undefined;
  babList: BabModul[]; // bab modul ini, sudah urut, dari server
  selesaiList: BabSelesai[];
};

export default function ModulAdminClient({ opdList, pegawaiList, modul, babList, selesaiList }: Props) {
  const [tab, setTab] = useState<NamaTab>("kelola");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);

  // Mengembalikan pesan galat, atau null bila berhasil. Data baru datang lewat props setelah revalidatePath.
  async function jalankan(aksi: () => Promise<Hasil>, pesanSukses: string): Promise<string | null> {
    setPesan("");
    setSibuk(true);
    try {
      const hasil = await aksi();
      if (!hasil.ok) return hasil.pesan;
      setPesan(pesanSukses);
      return null;
    } catch {
      return "Terjadi kesalahan. Coba lagi.";
    } finally {
      setSibuk(false);
    }
  }

  const aksi: AksiTabKelola = {
    simpanModul: (d) => jalankan(() => simpanModul(d), modul ? "Modul diperbarui." : "Modul dibuat."),
    tambahBab: async (d) => {
      if (!modul) return "Buat modul dulu sebelum menambah bab.";
      return jalankan(() => tambahBab(modul.id, d), "Bab ditambahkan.");
    },
    ubahBab: (id, d) => jalankan(() => ubahBab(id, d), "Bab diperbarui."),
    hapusBab: (id) => jalankan(() => hapusBab(id), "Bab dihapus."),
    geser: async (id, arah) => {
      const galat = await jalankan(() => geserBab(id, arah), "");
      if (galat) setPesan(galat);
      return galat;
    },
  };

  const jumlahSelesai = Object.fromEntries(babList.map((b) => [b.id, jumlahSelesaiBab(selesaiList, b.id)]));

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
          <TabKelola modul={modul} babList={babList} jumlahSelesai={jumlahSelesai} aksi={aksi} sibuk={sibuk} />
        ) : (
          <TabPantauan
            modul={modul}
            babList={babList}
            opdList={opdList}
            pegawaiList={pegawaiList}
            selesaiList={selesaiList}
          />
        )}
      </div>
    </div>
  );
}