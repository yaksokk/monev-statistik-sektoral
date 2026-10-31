"use client";

import { useRouter } from "next/navigation";

interface Props {
  daftar: { id: string; label: string }[];
  terpilihId: string | null; // null = belum ada kegiatan aktif dan belum memilih
}

export default function PilihKegiatan({ daftar, terpilihId }: Props) {
  const router = useRouter();

  return (
    <select
      aria-label="Pilih kegiatan"
      value={terpilihId ?? ""}
      onChange={(e) => {
        if (e.target.value) router.push(`/admin/dashboard?kegiatan=${e.target.value}`);
      }}
      className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-primary"
    >
      {terpilihId === null && (
        <option value="" disabled>
          Pilih kegiatan
        </option>
      )}
      {daftar.map((k) => (
        <option key={k.id} value={k.id}>
          {k.label}
        </option>
      ))}
    </select>
  );
}