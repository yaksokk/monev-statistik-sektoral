"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { masuk, type StateLogin } from "./actions";

const AWAL: StateLogin = { pesan: null, email: "" };

const inputClass =
  "h-11 w-full rounded-lg border border-line bg-white px-3 text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function LoginForm() {
  const [state, aksi, sedangProses] = useActionState(masuk, AWAL);
  const [lihat, setLihat] = useState(false);

  return (
    <form action={aksi} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.email}
          placeholder="nama@instansi.go.id"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="sandi" className="mb-1.5 block text-sm font-medium text-ink">
          Kata sandi
        </label>
        <div className="relative">
          <input
            id="sandi"
            name="sandi"
            type={lihat ? "text" : "password"}
            autoComplete="current-password"
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted hover:text-ink"
          >
            {lihat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state.pesan && (
        <p
          role="alert"
          className="rounded-lg bg-status-revisi-bg px-3 py-2 text-sm text-status-revisi-fg"
        >
          {state.pesan}
        </p>
      )}

      <button
        type="submit"
        disabled={sedangProses}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-70"
      >
        {sedangProses && <Loader2 className="size-4 animate-spin" />}
        {sedangProses ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}