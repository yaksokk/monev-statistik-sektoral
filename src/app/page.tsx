export default function Home() {
  return (
    <main id="konten" className="p-8">
      <h1 className="text-2xl font-semibold text-primary">Monev Statistik Sektoral</h1>
      <p className="mt-2 text-ink-muted">Pengujian token desain.</p>
      <button className="mt-4 rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover">
        Simpan Perubahan
      </button>
      <span className="ml-3 rounded-full bg-status-menunggu-bg px-3 py-1 text-sm text-status-menunggu-fg">
        Menunggu pemeriksaan
      </span>
    </main>
  );
}