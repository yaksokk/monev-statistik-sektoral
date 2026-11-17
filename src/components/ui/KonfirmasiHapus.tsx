"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Galat } from "./Galat";

const tombolSekunder =
  "inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const nonaktif = "disabled:cursor-not-allowed disabled:opacity-50";

// onYa mengembalikan pesan galat dari server, atau null bila berhasil
export function KonfirmasiHapus({
  teks,
  onYa,
  onBatal,
}: {
  teks: string;
  onYa: () => Promise<string | null>;
  onBatal: () => void;
}) {
  const [galat, setGalat] = useState("");
  const [proses, setProses] = useState(false);

  async function ya() {
    setGalat("");
    setProses(true);
    const g = await onYa();
    setProses(false);
    if (g) setGalat(g);
  }

  return (
    <>
      <p className="text-sm text-ink-muted">{teks}</p>
      <Galat pesan={galat} />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onBatal} disabled={proses} className={`${tombolSekunder} ${nonaktif}`}>
          Batal
        </button>
        <button onClick={ya} disabled={proses} className={`${tombolSekunder} text-status-revisi-fg ${nonaktif}`}>
          <Trash2 className="size-4" aria-hidden />
          {proses ? "Menghapus..." : "Hapus"}
        </button>
      </div>
    </>
  );
}