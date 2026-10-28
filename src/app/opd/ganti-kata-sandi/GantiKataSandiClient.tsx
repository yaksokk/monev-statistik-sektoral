"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { gantiKataSandi, type StateGantiSandi } from "./actions";

const AWAL: StateGantiSandi = { status: "diam", pesan: null };

function KolomSandi({ id, label, bantuan }: { id: string; label: string; bantuan?: string }) {
  const [tampil, setTampil] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={tampil ? "text" : "password"}
          autoComplete={id === "sandiLama" ? "current-password" : "new-password"}
          required
          className="w-full rounded-md border border-line bg-surface px-3 py-2 pr-10 text-sm text-ink focus-visible:outline-2 focus-visible:outline-navy-700"
        />
        <button
          type="button"
          onClick={() => setTampil((v) => !v)}
          aria-label={tampil ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-muted hover:text-ink"
        >
          {tampil ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
      {bantuan && <p className="mt-1 text-xs text-ink-muted">{bantuan}</p>}
    </div>
  );
}

export function GantiKataSandiClient() {
  const [state, aksi, sedangKirim] = useActionState(gantiKataSandi, AWAL);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "berhasil") form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={aksi} className="space-y-4 rounded-lg border border-line bg-surface p-5 sm:p-6">
      <KolomSandi id="sandiLama" label="Kata sandi lama" />
      <KolomSandi id="sandiBaru" label="Kata sandi baru" bantuan="Minimal 8 karakter." />
      <KolomSandi id="konfirmasi" label="Ulangi kata sandi baru" />

      {state.pesan && (
        <p
          role={state.status === "gagal" ? "alert" : "status"}
          className={`rounded-md px-3 py-2 text-sm ${
            state.status === "gagal" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {state.pesan}
        </p>
      )}

      <button
        type="submit"
        disabled={sedangKirim}
        className="rounded-md bg-navy-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
      >
        {sedangKirim ? "Menyimpan..." : "Simpan kata sandi"}
      </button>
    </form>
  );
}