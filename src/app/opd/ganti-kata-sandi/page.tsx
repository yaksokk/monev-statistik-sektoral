import { GantiKataSandiClient } from "./GantiKataSandiClient";

export default function GantiKataSandiPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Ganti kata sandi</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Masukkan kata sandi lama, lalu kata sandi baru untuk akun Anda.
        </p>
      </div>
      <GantiKataSandiClient />
    </div>
  );
}