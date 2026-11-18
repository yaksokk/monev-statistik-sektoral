type Balasan = { ok: true; url: string } | { ok: false; pesan: string };

// Tab dibuka lebih dulu (saat klik) agar tidak diblokir pop-up, lalu diarahkan ke signed URL.
// Mengembalikan pesan galat, atau null bila berhasil.
export async function bukaDiTabBaru(ambil: () => Promise<Balasan>): Promise<string | null> {
  const tab = window.open("about:blank", "_blank");
  if (!tab) return "Pop-up diblokir. Izinkan pop-up untuk situs ini.";
  try {
    const r = await ambil();
    if (!r.ok) {
      tab.close();
      return r.pesan;
    }
    tab.opener = null;
    tab.location.href = r.url;
    return null;
  } catch {
    tab.close();
    return "Tidak bisa terhubung ke server.";
  }
}