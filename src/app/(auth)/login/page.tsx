import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Masuk | Monev Statistik Sektoral" };

export default function HalamanLogin() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-navy-800 p-12 text-white lg:flex">
        <p className="text-sm font-medium tracking-wide text-white/70">
          BPS Kabupaten Minahasa Tenggara
        </p>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">
            Monitoring dan Evaluasi
            <br />
            Statistik Sektoral
          </h1>
          <p className="mt-4 max-w-sm text-white/70">
            Pantau kelengkapan dokumen dan nilai ujian setiap OPD dalam satu tempat.
          </p>
        </div>
        <p className="text-xs text-white/50">Versi demo, data bersifat contoh.</p>
      </section>

      <section className="flex items-center justify-center bg-surface-muted p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-ink">Masuk</h2>
          <p className="mt-1 mb-6 text-sm text-ink-muted">
            Gunakan akun yang diberikan oleh admin BPS.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}